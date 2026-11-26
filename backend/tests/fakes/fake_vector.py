from __future__ import annotations

from typing import Optional
from app.schemas.query import Citation
from app.services.vector_search_adapter import VectorSearchPort, VectorServiceUnavailableError


class FakeVectorSearch(VectorSearchPort):
    """Test fake for vector search operations, supporting injected citations and simulated failures."""

    def __init__(
        self,
        citations: Optional[list[Citation]] = None,
        raise_error: Optional[Exception] = None,
    ) -> None:
        self._citations = citations
        self._raise_error = raise_error
        self.queries_received: list[tuple[str, int]] = []

    async def search(self, query: str, top_k: int = 5) -> list[Citation]:
        self.queries_received.append((query, top_k))
        if self._raise_error is not None:
            raise self._raise_error

        if self._citations is not None:
            return self._citations[:top_k]

        # Standard seeded fixture citations matching the supervisor demo scenario
        return [
            Citation(
                document_id="DOC-DEMO-001",
                title="Centrifugal Pump P-101 Technical Operations & Failure Prevention Manual",
                page="14",
                chunk_id="CHUNK-DEMO-P101-01",
                excerpt=(
                    "Mechanical seals and inlet valve gaskets sourced from EpsilonValves Ltd exhibit "
                    "accelerated thermal degradation under sustained pressure exceeding 15 bar, "
                    "resulting in fluid containment loss and severe cavitation risk."
                ),
                relevance_score=0.92,
            ),
            Citation(
                document_id="DOC-DEMO-002",
                title="Quarterly Asset Maintenance Incident Review Q3",
                page="8",
                chunk_id="CHUNK-DEMO-INC-02",
                excerpt=(
                    "Compressor C-305 experienced unexpected pressure drop warnings traced to premature "
                    "inlet valve sealing ring wear. The component was supplied under batch SUP-005."
                ),
                relevance_score=0.87,
            ),
        ][:top_k]
