"""
backend/app/api/v1/graph.py
----------------------------
Knowledge-graph API routes (Hardik's ownership area).

Endpoints
---------
GET /api/v1/graph/summary
    Overall node/relationship counts for the graph.

GET /api/v1/graph/supplier-risks
    Suppliers with components prone to failure modes, with affected equipment,
    severity breakdown, and rating.

GET /api/v1/rca/{equipment_id}
    Explainable risk path for one equipment ID, following
    Equipment → Component → Supplier + FailureMode links.

GET /api/v1/graph/equipment/{equipment_id}/context
    Lightweight context bundle intended for Prathmesh's answer-generation
    service (equipment metadata + high/critical supplier risks).
"""
from __future__ import annotations

import logging
import re

from fastapi import APIRouter, HTTPException, Path, status
from fastapi.responses import JSONResponse
from neo4j.exceptions import AuthError, ServiceUnavailable

from app.graph.service import GraphQueryService

logger = logging.getLogger(__name__)
router = APIRouter()
_service = GraphQueryService()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Simple allowlist: only canonical IDs like EQ-001, CMP-012, SUP-005 etc.
_EQUIPMENT_ID_RE = re.compile(r"^EQ-\d{3}$")


def _validate_equipment_id(equipment_id: str) -> None:
    if not _EQUIPMENT_ID_RE.match(equipment_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Invalid equipment ID format '{equipment_id}'. "
                "Expected pattern: EQ-NNN (e.g. EQ-001)."
            ),
        )


def _neo4j_degraded(detail: str = "Graph database is currently unavailable.") -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "degraded", "detail": detail},
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get(
    "/graph/summary",
    summary="Graph summary",
    tags=["Knowledge Graph"],
    responses={503: {"description": "Neo4j unavailable"}},
)
async def get_graph_summary():
    """Return total node/relationship counts, broken down by label."""
    try:
        summary = await _service.get_graph_summary()
    except (ServiceUnavailable, AuthError):
        return _neo4j_degraded()

    if summary is None:
        return _neo4j_degraded()

    return summary


@router.get(
    "/graph/supplier-risks",
    summary="Supplier risk findings",
    tags=["Knowledge Graph"],
    responses={503: {"description": "Neo4j unavailable"}},
)
async def get_supplier_risks():
    """
    Return every supplier whose components are linked to at least one failure
    mode, together with:
    - supplier name, rating, country
    - affected equipment IDs and names
    - affected component IDs and names
    - failure-mode names and **severity breakdown** (medium vs high/critical)
    - failure-link count

    The EpsilonValves pattern (low-rated supplier appearing across multiple
    equipment) will be surfaced here with its full severity breakdown.
    """
    try:
        risks = await _service.get_supplier_risks()
    except (ServiceUnavailable, AuthError):
        return _neo4j_degraded()

    # Enrich each row with a severity breakdown dict
    enriched = []
    for row in risks:
        severity_counts: dict[str, int] = {}
        for sev in row.get("severities", []):
            if sev:
                severity_counts[sev] = severity_counts.get(sev, 0) + 1

        enriched.append(
            {
                "supplier_id": row["supplier_id"],
                "supplier_name": row["supplier_name"],
                "supplier_rating": row["supplier_rating"],
                "supplier_country": row["supplier_country"],
                "affected_equipment_count": len(row.get("affected_equipment_ids", [])),
                "affected_equipment_ids": row.get("affected_equipment_ids", []),
                "affected_equipment_names": row.get("affected_equipment_names", []),
                "affected_component_ids": row.get("affected_component_ids", []),
                "affected_component_names": row.get("affected_component_names", []),
                "failure_mode_ids": row.get("failure_mode_ids", []),
                "failure_mode_names": row.get("failure_mode_names", []),
                "severity_breakdown": severity_counts,
                "failure_link_count": row["failure_link_count"],
            }
        )

    return {"supplier_risks": enriched, "count": len(enriched)}


@router.get(
    "/graph/equipment/{equipment_id}/context",
    summary="Equipment context for answer generation",
    tags=["Knowledge Graph"],
    responses={
        404: {"description": "Equipment not found"},
        503: {"description": "Neo4j unavailable"},
    },
)
async def get_equipment_context(
    equipment_id: str = Path(..., description="Canonical equipment ID, e.g. EQ-001"),
):
    """
    Lightweight equipment context bundle for Prathmesh's answer-generation
    service.  Returns equipment metadata, location, and high/critical
    supplier-risk findings that can be cited in generated answers.
    """
    _validate_equipment_id(equipment_id)

    try:
        context = await _service.get_equipment_context(equipment_id)
    except (ServiceUnavailable, AuthError):
        return _neo4j_degraded()

    if context is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{equipment_id}' not found in the knowledge graph.",
        )

    return context


# ---------------------------------------------------------------------------
# RCA route lives at /rca/{equipment_id} (outside /graph prefix)
# ---------------------------------------------------------------------------


rca_router = APIRouter()


@rca_router.get(
    "/rca/{equipment_id}",
    summary="Root-cause analysis – explainable graph path",
    tags=["RCA"],
    responses={
        404: {"description": "Equipment not found"},
        503: {"description": "Neo4j unavailable"},
    },
)
async def get_rca(
    equipment_id: str = Path(..., description="Canonical equipment ID, e.g. EQ-001"),
):
    """
    Return an explainable risk path for *equipment_id*.

    The response follows the graph relationships:

        Equipment → HAS_COMPONENT → Component → SUPPLIED_BY → Supplier
                                   Component → PRONE_TO    → FailureMode

    **Important:** The seed data contains *risk relationships* (structural
    links showing which components are prone to which failure modes), not dated
    failure incidents.  The response explicitly notes this so consumers do not
    misread it as an event timeline.

    Returns a 404 with a helpful message for unknown equipment IDs.
    Returns a 503 (degraded) when Neo4j is unavailable, without leaking
    credentials.
    """
    _validate_equipment_id(equipment_id)

    try:
        rca = await _service.get_rca(equipment_id)
    except (ServiceUnavailable, AuthError):
        return _neo4j_degraded()

    if rca is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Equipment '{equipment_id}' not found in the knowledge graph. "
                "Seeded IDs are EQ-001 through EQ-005."
            ),
        )

    return rca
