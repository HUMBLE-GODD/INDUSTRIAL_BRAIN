from __future__ import annotations

import inspect
import logging
from typing import Any, Optional, Protocol
from app.schemas.query import Citation

logger = logging.getLogger(__name__)


class VectorServiceUnavailableError(Exception):
    """Raised when the underlying vector database or embedding service is unreachable."""
    pass


class VectorSearchPort(Protocol):
    async def search(self, query: str, top_k: int = 5) -> list[Citation]:
        ...


class QdrantVectorSearchAdapter:
    """Production vector search adapter using EmbeddingService and VectorService with Qdrant."""

    def __init__(
        self,
        vector_service: Optional[Any] = None,
        embedding_service: Optional[Any] = None,
    ) -> None:
        if vector_service is None:
            from app.services.vector_service import get_vector_service
            self.vector_service = get_vector_service()
        else:
            self.vector_service = vector_service

        if embedding_service is None:
            from app.services.embedding_service import get_embedding_service
            self.embedding_service = get_embedding_service()
        else:
            self.embedding_service = embedding_service

    async def search(self, query: str, top_k: int = 5) -> list[Citation]:
        if not query or not query.strip():
            return []

        try:
            query_vector = self.embedding_service.embed_query(query)
            ensure_fn = getattr(self.vector_service, "ensure_collection", None)
            if callable(ensure_fn):
                res = ensure_fn(vector_size=len(query_vector))
                if inspect.isawaitable(res):
                    await res
            scored_points = await self.vector_service.search(query_vector=query_vector, limit=top_k)
        except Exception as e:
            logger.error("Vector search failed due to service unavailability: %s", type(e).__name__)
            raise VectorServiceUnavailableError(f"Vector search service is unavailable: {type(e).__name__}") from e

        citations: list[Citation] = []
        for point in scored_points:
            payload = point.payload or {}

            # Text can be stored under 'text' or 'excerpt'
            excerpt = payload.get("text") or payload.get("excerpt")
            doc_id = payload.get("document_id")
            title = payload.get("title")
            chunk_id = payload.get("chunk_id") or (str(point.id) if point.id is not None else None)
            page = payload.get("page")
            if page is not None:
                page = str(page)

            # Enforce provenance integrity: do not fabricate "unknown" for missing required fields
            missing_fields = []
            if not doc_id:
                missing_fields.append("document_id")
            if not title:
                missing_fields.append("title")
            if not chunk_id:
                missing_fields.append("chunk_id")
            if not excerpt:
                missing_fields.append("excerpt/text")

            if missing_fields:
                logger.warning(
                    "Skipping chunk point_id=%s because required citation fields are missing: %s",
                    point.id,
                    missing_fields,
                )
                continue

            citations.append(
                Citation(
                    document_id=str(doc_id),
                    title=str(title),
                    chunk_id=str(chunk_id),
                    excerpt=str(excerpt).strip(),
                    page=page,
                    relevance_score=float(point.score) if point.score is not None else None,
                )
            )

        return citations
