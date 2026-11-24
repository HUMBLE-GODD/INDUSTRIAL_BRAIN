"""
backend/app/graph/service.py
-----------------------------
Service layer that wraps the graph repository so Prathmesh's answer-generation
code has a stable, typed interface without needing to touch Neo4j sessions.

Usage from another service::

    from app.graph.service import GraphQueryService

    svc = GraphQueryService()
    context = await svc.get_equipment_context("EQ-001")
    risks   = await svc.get_supplier_risks()
"""
from __future__ import annotations

import logging
from typing import Any

from neo4j.exceptions import AuthError, ServiceUnavailable

from app.db.neo4j import neo4j_session
from app.graph import repository

logger = logging.getLogger(__name__)


class GraphQueryService:
    """High-level async graph query service.

    All methods return plain dicts/lists so callers need not import neo4j.
    On Neo4j unavailability each method returns a *degraded* sentinel value
    (None or empty list) and logs a warning; credentials are never surfaced.
    """

    async def get_graph_summary(self) -> dict[str, Any] | None:
        try:
            async with neo4j_session() as session:
                return await repository.fetch_graph_summary(session)
        except (ServiceUnavailable, AuthError) as exc:
            logger.warning("Graph summary unavailable: %s", type(exc).__name__)
            return None

    async def get_supplier_risks(self) -> list[dict[str, Any]]:
        try:
            async with neo4j_session() as session:
                return await repository.fetch_supplier_risks(session)
        except (ServiceUnavailable, AuthError) as exc:
            logger.warning("Supplier risks unavailable: %s", type(exc).__name__)
            return []

    async def get_rca(self, equipment_id: str) -> dict[str, Any] | None:
        """Return explainable RCA for *equipment_id*, or None if not found.

        Raises nothing on Neo4j errors; returns None with a warning log.
        """
        try:
            async with neo4j_session() as session:
                return await repository.fetch_rca_for_equipment(session, equipment_id)
        except (ServiceUnavailable, AuthError) as exc:
            logger.warning("RCA query unavailable: %s", type(exc).__name__)
            return None

    async def get_equipment_context(self, equipment_id: str) -> dict[str, Any] | None:
        """Context bundle for Prathmesh's answer-generation service."""
        try:
            async with neo4j_session() as session:
                return await repository.fetch_equipment_context(session, equipment_id)
        except (ServiceUnavailable, AuthError) as exc:
            logger.warning("Equipment context unavailable: %s", type(exc).__name__)
            return None
