from __future__ import annotations

import logging
import time
from typing import Optional

from app.schemas.query import QueryRequest, QueryResponse
from app.services.graph_evidence_adapter import GraphEvidencePort, Neo4jGraphEvidenceAdapter
from app.services.llm_service import LLMProviderPort, LLMService
from app.services.vector_search_adapter import QdrantVectorSearchAdapter, VectorSearchPort

logger = logging.getLogger(__name__)


class QueryService:
    """Coordinates vector search, graph evidence traversal, and LLM/deterministic generation."""

    def __init__(
        self,
        vector_adapter: Optional[VectorSearchPort] = None,
        graph_adapter: Optional[GraphEvidencePort] = None,
        llm_service: Optional[LLMProviderPort] = None,
    ) -> None:
        self.vector_adapter = vector_adapter or QdrantVectorSearchAdapter()
        self.graph_adapter = graph_adapter or Neo4jGraphEvidenceAdapter()
        self.llm_service = llm_service or LLMService()

    async def execute_query(self, request: QueryRequest) -> QueryResponse:
        start_time = time.perf_counter()
        logger.info("Executing decision query: '%s' (top_k=%d)", request.question, request.top_k)

        # 1. Retrieve vector search citations
        citations = await self.vector_adapter.search(query=request.question, top_k=request.top_k)

        # 2. Retrieve graph evidence if requested
        graph_evidence = []
        if request.include_graph_evidence:
            graph_evidence = await self.graph_adapter.get_supplier_risks(query=request.question)

        # 3. Formulate evidence-grounded answer
        llm_res = await self.llm_service.generate_response(
            question=request.question,
            citations=citations,
            graph_evidence=graph_evidence,
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return QueryResponse(
            question=request.question,
            answer=llm_res.answer,
            source_mode=llm_res.source_mode,
            retrieved_facts=llm_res.retrieved_facts,
            citations=llm_res.validated_citations,
            graph_evidence=graph_evidence,
            recommendations=llm_res.recommendations,
            confidence=llm_res.confidence,
            processing_time_ms=elapsed_ms,
            disclaimer=llm_res.disclaimer,
        )
