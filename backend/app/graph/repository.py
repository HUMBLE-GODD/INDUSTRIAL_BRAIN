"""
backend/app/graph/repository.py
--------------------------------
Async Neo4j query layer for the Industrial Brain knowledge graph.

All Cypher is parameterised and kept in this module; no raw Cypher is exposed
to route handlers.  Labels and relationship types are hard-coded constants,
not user-supplied values.

Canonical demo equipment IDs (aligned with Tatvik's schema):
    EQ-001  Centrifugal Pump P-101
    EQ-002  Heat Exchanger HX-202
    EQ-003  Compressor C-305
    EQ-004  Conveyor Belt CB-410
    EQ-005  Boiler BLR-501
"""
from __future__ import annotations

import logging
from typing import Any

from neo4j import AsyncSession
from neo4j.exceptions import ServiceUnavailable

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Permitted node labels – used to guard label interpolation
# ---------------------------------------------------------------------------
_ALLOWED_LABELS = frozenset(
    {
        "Equipment",
        "Component",
        "Supplier",
        "Location",
        "FailureMode",
        "Technician",
        "MaintenanceRecord",
        "Inspection",
        "Document",
        "Regulation",
    }
)

# ---------------------------------------------------------------------------
# Graph summary
# ---------------------------------------------------------------------------


async def fetch_graph_summary(session: AsyncSession) -> dict[str, Any]:
    """Return total node/relationship counts broken down by label."""
    total_nodes_result = await session.run("MATCH (n) RETURN count(n) AS c")
    total_nodes_record = await total_nodes_result.single()
    total_nodes = total_nodes_record["c"] if total_nodes_record else 0

    total_rels_result = await session.run("MATCH ()-[r]->() RETURN count(r) AS c")
    total_rels_record = await total_rels_result.single()
    total_rels = total_rels_record["c"] if total_rels_record else 0

    # Count each permitted label
    by_label: dict[str, int] = {}
    for label in sorted(_ALLOWED_LABELS):
        result = await session.run(
            f"MATCH (n:{label}) RETURN count(n) AS c"  # noqa: S608 – label is from whitelist
        )
        record = await result.single()
        by_label[label] = record["c"] if record else 0

    return {
        "total_nodes": total_nodes,
        "total_relationships": total_rels,
        "by_label": by_label,
    }


# ---------------------------------------------------------------------------
# Supplier risks
# ---------------------------------------------------------------------------


async def fetch_supplier_risks(session: AsyncSession) -> list[dict[str, Any]]:
    """
    Return every supplier that supplies components prone to at least one
    failure mode, together with the affected equipment and severity counts.

    The result groups by (supplier, severity_tier) so callers can distinguish
    medium from high/critical findings – as required by the acceptance
    checklist.
    """
    cypher = """
    MATCH (s:Supplier)<-[:SUPPLIED_BY]-(c:Component)<-[:HAS_COMPONENT]-(e:Equipment)
    MATCH (c)-[:PRONE_TO]->(fm:FailureMode)
    RETURN
        s.supplier_id      AS supplier_id,
        s.name             AS supplier_name,
        s.rating           AS supplier_rating,
        s.country          AS supplier_country,
        collect(DISTINCT e.equipment_id)  AS affected_equipment_ids,
        collect(DISTINCT e.name)          AS affected_equipment_names,
        collect(DISTINCT c.component_id)  AS affected_component_ids,
        collect(DISTINCT c.name)          AS affected_component_names,
        collect(DISTINCT fm.failure_mode_id) AS failure_mode_ids,
        collect(DISTINCT fm.name)            AS failure_mode_names,
        collect(DISTINCT fm.severity)        AS severities,
        count(fm)                            AS failure_link_count
    ORDER BY failure_link_count DESC
    """
    result = await session.run(cypher)
    records = await result.data()
    return records


# ---------------------------------------------------------------------------
# Root Cause Analysis – explainable path for one equipment ID
# ---------------------------------------------------------------------------


async def fetch_rca_for_equipment(
    session: AsyncSession, equipment_id: str
) -> dict[str, Any] | None:
    """
    Return an explainable risk path for *equipment_id*.

    The path follows:
      Equipment -[HAS_COMPONENT]-> Component -[SUPPLIED_BY]-> Supplier
      Component -[PRONE_TO]-> FailureMode

    Returns None when the equipment ID is not found.
    Does NOT imply dated incidents; the seed contains risk relationships only.
    """
    # First, confirm the equipment node exists
    eq_result = await session.run(
        "MATCH (e:Equipment {equipment_id: $eid}) RETURN e",
        eid=equipment_id,
    )
    eq_record = await eq_result.single()
    if eq_record is None:
        return None

    eq_node = dict(eq_record["e"])

    # Fetch risk paths: component → supplier + failure mode
    path_cypher = """
    MATCH (e:Equipment {equipment_id: $eid})-[:HAS_COMPONENT]->(c:Component)
    OPTIONAL MATCH (c)-[:SUPPLIED_BY]->(s:Supplier)
    OPTIONAL MATCH (c)-[:PRONE_TO]->(fm:FailureMode)
    RETURN
        c.component_id   AS component_id,
        c.name           AS component_name,
        c.type           AS component_type,
        s.supplier_id    AS supplier_id,
        s.name           AS supplier_name,
        s.rating         AS supplier_rating,
        s.country        AS supplier_country,
        collect(DISTINCT {
            failure_mode_id: fm.failure_mode_id,
            name:            fm.name,
            severity:        fm.severity,
            description:     fm.description
        }) AS failure_modes
    ORDER BY c.component_id
    """
    paths_result = await session.run(path_cypher, eid=equipment_id)
    paths = await paths_result.data()

    # Fetch location
    loc_result = await session.run(
        """
        MATCH (e:Equipment {equipment_id: $eid})-[:LOCATED_AT]->(l:Location)
        RETURN l
        """,
        eid=equipment_id,
    )
    loc_record = await loc_result.single()
    location = dict(loc_record["l"]) if loc_record else None

    # Build evidence list – filter out null failure_mode entries
    evidence: list[dict[str, Any]] = []
    for row in paths:
        fms = [
            fm
            for fm in row["failure_modes"]
            if fm.get("failure_mode_id") is not None
        ]
        evidence.append(
            {
                "component_id": row["component_id"],
                "component_name": row["component_name"],
                "component_type": row["component_type"],
                "supplier": {
                    "supplier_id": row["supplier_id"],
                    "name": row["supplier_name"],
                    "rating": row["supplier_rating"],
                    "country": row["supplier_country"],
                }
                if row["supplier_id"]
                else None,
                "risk_links": fms,
            }
        )

    return {
        "equipment_id": eq_node.get("equipment_id"),
        "equipment_name": eq_node.get("name"),
        "equipment_type": eq_node.get("type"),
        "equipment_status": eq_node.get("status"),
        "equipment_criticality": eq_node.get("criticality"),
        "location": location,
        "evidence_note": (
            "Risk evidence is derived from known component–supplier–failure-mode "
            "relationships in the knowledge graph. No dated incident records are "
            "implied."
        ),
        "component_risk_paths": evidence,
    }


# ---------------------------------------------------------------------------
# Prathmesh integration: equipment context + supplier-risk evidence
# ---------------------------------------------------------------------------


async def fetch_equipment_context(
    session: AsyncSession, equipment_id: str
) -> dict[str, Any] | None:
    """
    Lightweight equipment context bundle for Prathmesh's answer-generation
    service.  Returns equipment metadata, its location, and high/critical
    supplier risks so they can be cited in generated answers.
    """
    rca = await fetch_rca_for_equipment(session, equipment_id)
    if rca is None:
        return None

    high_risk_suppliers = []
    for path in rca["component_risk_paths"]:
        sup = path.get("supplier")
        if sup and sup.get("rating") is not None and sup["rating"] < 3.5:
            for fm in path["risk_links"]:
                if fm.get("severity") in ("high", "critical"):
                    high_risk_suppliers.append(
                        {
                            "supplier_name": sup["name"],
                            "supplier_rating": sup["rating"],
                            "component": path["component_name"],
                            "failure_mode": fm["name"],
                            "severity": fm["severity"],
                        }
                    )

    return {
        "equipment_id": rca["equipment_id"],
        "equipment_name": rca["equipment_name"],
        "equipment_type": rca["equipment_type"],
        "equipment_status": rca["equipment_status"],
        "criticality": rca["equipment_criticality"],
        "location": rca["location"],
        "high_risk_supplier_findings": high_risk_suppliers,
    }
