from __future__ import annotations

import logging
from typing import Protocol
from app.db.neo4j import neo4j_session
from app.schemas.query import GraphEvidence

logger = logging.getLogger(__name__)


class GraphServiceUnavailableError(Exception):
    """Raised when the knowledge graph (Neo4j) is unreachable."""
    pass


class GraphEvidencePort(Protocol):
    async def get_supplier_risks(self, query: str) -> list[GraphEvidence]:
        ...


class Neo4jGraphEvidenceAdapter:
    """Production knowledge graph adapter querying Neo4j for supplier and failure mode risk relationships."""

    async def get_supplier_risks(self, query: str) -> list[GraphEvidence]:
        cypher = """
        MATCH (s:Supplier)<-[:SUPPLIED_BY]-(c:Component)-[:PRONE_TO]->(fm:FailureMode)
        MATCH (e:Equipment)-[:HAS_COMPONENT]->(c)
        WHERE fm.severity IN ['high', 'critical', 'medium']
        WITH s,
             collect(DISTINCT e.name) AS equipment_names,
             collect(DISTINCT c.name) AS component_names,
             collect(DISTINCT {
                 name: fm.name,
                 severity: fm.severity,
                 description: coalesce(fm.typical_cause, '')
             }) AS failure_modes_data
        RETURN s.name AS supplier,
               s.rating AS rating,
               equipment_names,
               component_names,
               failure_modes_data
        ORDER BY s.rating ASC
        """
        try:
            async with neo4j_session() as session:
                result = await session.run(cypher)
                records = await result.data()
        except Exception as e:
            logger.error("Neo4j graph query failed due to service unavailability: %s", type(e).__name__)
            raise GraphServiceUnavailableError(f"Neo4j graph service is unavailable: {type(e).__name__}") from e

        evidence_list: list[GraphEvidence] = []
        for rec in records:
            supplier = rec.get("supplier")
            if not supplier:
                continue

            eq_list = rec.get("equipment_names") or []
            cmp_list = rec.get("component_names") or []
            fm_data = rec.get("failure_modes_data") or []
            rating = float(rec["rating"]) if rec.get("rating") is not None else None

            # Construct explainable relationship path
            path = (
                f"Equipment [{', '.join(eq_list)}] -> HAS_COMPONENT -> Component [{', '.join(cmp_list)}] "
                f"-> SUPPLIED_BY -> Supplier '{supplier}' (Rating: {rating}) "
                f"& Component -> PRONE_TO -> FailureModes"
            )

            evidence_list.append(
                GraphEvidence(
                    supplier=str(supplier),
                    rating=rating,
                    affected_equipment=[str(x) for x in eq_list],
                    components=[str(x) for x in cmp_list],
                    failure_modes=fm_data,
                    relationship_path=path,
                )
            )

        return evidence_list
