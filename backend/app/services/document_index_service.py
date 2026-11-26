"""
Document indexing service: embeds chunks and upserts them into Qdrant.

Re-indexing the same document is idempotent because chunk IDs are
deterministic (derived from document_id + chunk position) and Qdrant upsert
overwrites existing points with the same ID.
"""

from __future__ import annotations

import logging
from typing import Any

from app.db.qdrant import get_qdrant_client
from app.services.embedding_service import get_embedding_service
from app.services.vector_service import get_vector_service

logger = logging.getLogger(__name__)


async def index_chunks(chunks: list[dict[str, Any]]) -> list[str]:
    """
    Embed and upsert chunks into Qdrant.

    Parameters
    ----------
    chunks:
        Output of ``document_service.extract_and_chunk``.  Each dict must have
        ``chunk_id``, ``text``, ``document_id``, ``title``, ``page``, and
        ``chunk_index``.

    Returns
    -------
    list[str]
        The list of Qdrant point IDs (== chunk_ids) that were upserted.
    """
    if not chunks:
        return []

    embedder = get_embedding_service()
    vector_service = get_vector_service()

    texts = [c["text"] for c in chunks]
    chunk_ids = [c["chunk_id"] for c in chunks]

    # Build payloads (everything except text, which VectorService already stores)
    payloads = [
        {
            "document_id": c["document_id"],
            "title": c["title"],
            "page": c["page"],
            "chunk_index": c["chunk_index"],
        }
        for c in chunks
    ]

    vectors = embedder.embed_documents(texts)
    upserted = await vector_service.upsert_texts(
        texts=texts,
        vectors=vectors,
        payloads=payloads,
        ids=chunk_ids,
    )
    logger.info("Indexed %d chunks for document '%s'.", len(upserted), chunks[0]["document_id"])
    return upserted


async def delete_document_vectors(document_id: str) -> None:
    """
    Delete all Qdrant points that belong to *document_id*.

    Uses Qdrant's payload filter so only the target document's chunks are
    removed without touching other documents.
    """
    from qdrant_client.models import Filter, FieldCondition, MatchValue

    client = get_qdrant_client()
    from app.core.config import get_settings

    settings = get_settings()
    collection_name = settings.QDRANT_COLLECTION_NAME

    await client.delete(
        collection_name=collection_name,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id),
                )
            ]
        ),
    )
    logger.info("Deleted Qdrant vectors for document '%s'.", document_id)
