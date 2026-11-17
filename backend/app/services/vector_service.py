from __future__ import annotations

import uuid
from typing import Any

from qdrant_client.models import PointStruct, ScoredPoint

from app.core.config import get_settings
from app.db.qdrant import ensure_qdrant_collection, get_distance_metric, get_qdrant_client

_service: VectorService | None = None


class VectorService:
    """Qdrant vector storage and similarity search operations."""

    def __init__(self, collection_name: str | None = None) -> None:
        settings = get_settings()
        self.collection_name = collection_name or settings.QDRANT_COLLECTION_NAME

    async def ensure_collection(self, vector_size: int | None = None) -> None:
        await ensure_qdrant_collection(
            collection_name=self.collection_name,
            vector_size=vector_size,
            distance=get_distance_metric(),
        )

    async def upsert_texts(
        self,
        texts: list[str],
        vectors: list[list[float]],
        payloads: list[dict[str, Any]] | None = None,
        ids: list[str] | None = None,
    ) -> list[str]:
        if not texts:
            raise ValueError("texts must contain at least one item.")
        if len(texts) != len(vectors):
            raise ValueError("texts and vectors must have the same length.")

        point_ids = ids or [str(uuid.uuid4()) for _ in texts]
        if len(point_ids) != len(texts):
            raise ValueError("ids length must match texts length when provided.")

        point_payloads: list[dict[str, Any]] = []
        for index, text in enumerate(texts):
            payload = {"text": text}
            if payloads:
                payload.update(payloads[index])
            point_payloads.append(payload)

        points = [
            PointStruct(id=point_id, vector=vector, payload=payload)
            for point_id, vector, payload in zip(point_ids, vectors, point_payloads)
        ]

        client = get_qdrant_client()
        await client.upsert(collection_name=self.collection_name, points=points)
        return point_ids

    async def search(
        self,
        query_vector: list[float],
        limit: int = 10,
    ) -> list[ScoredPoint]:
        client = get_qdrant_client()
        response = await client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit,
            with_payload=True,
        )
        return response.points


def get_vector_service(collection_name: str | None = None) -> VectorService:
    if collection_name is None:
        global _service
        if _service is None:
            _service = VectorService()
        return _service
    return VectorService(collection_name=collection_name)
