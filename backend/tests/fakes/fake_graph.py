from __future__ import annotations

from typing import Optional
from app.schemas.query import GraphEvidence
from app.services.graph_evidence_adapter import GraphEvidencePort, GraphServiceUnavailableError


class FakeGraphEvidence(GraphEvidencePort):
    """Test fake for knowledge graph traversal operations, returning configurable or demo supplier-risk relationships."""

    def __init__(
        self,
        evidence: Optional[list[GraphEvidence]] = None,
        raise_error: Optional[Exception] = None,
    ) -> None:
        self._evidence = evidence
        self._raise_error = raise_error
        self.queries_received: list[str] = []

    async def get_supplier_risks(self, query: str) -> list[GraphEvidence]:
        self.queries_received.append(query)
        if self._raise_error is not None:
            raise self._raise_error

        if self._evidence is not None:
            return self._evidence

        # Standard seeded demo fixture evidence reflecting EpsilonValves Ltd hidden pattern
        return [
            GraphEvidence(
                supplier="EpsilonValves Ltd",
                rating=2.9,
                affected_equipment=["Heat Exchanger HX-202", "Compressor C-305", "Boiler BLR-501"],
                components=["Shell Gasket", "Inlet Valve", "Safety Relief Valve"],
                failure_modes=[
                    {
                        "name": "Pressure Loss",
                        "severity": "critical",
                        "description": "Seal failure leading to rapid system depressurization",
                    },
                    {
                        "name": "Corrosion",
                        "severity": "high",
                        "description": "Acidic condensate pitting along sealing surfaces",
                    },
                    {
                        "name": "Overheating",
                        "severity": "medium",
                        "description": "Friction-induced localized heating",
                    },
                ],
                relationship_path=(
                    "Equipment [Heat Exchanger HX-202, Compressor C-305, Boiler BLR-501] -> HAS_COMPONENT -> "
                    "Component [Shell Gasket, Inlet Valve, Safety Relief Valve] -> SUPPLIED_BY -> "
                    "Supplier 'EpsilonValves Ltd' (Rating: 2.9) & Component -> PRONE_TO -> FailureModes"
                ),
            )
        ]
