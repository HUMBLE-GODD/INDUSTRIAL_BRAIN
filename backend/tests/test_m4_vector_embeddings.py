import uuid

import pytest

from app.core.config import get_settings
from app.db.qdrant import get_distance_metric, get_qdrant_client
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService


@pytest.mark.asyncio
async def test_m4_embed_store_search_ranked_results(test_collection_name: str):
    """
    M4 acceptance flow: embed -> store -> search -> return ranked results.
    Uses an isolated test collection to avoid corrupting developer data.
    """
    settings = get_settings()
    embedder = EmbeddingService()
    vector_service = VectorService(collection_name=test_collection_name)

    assert embedder.dimension == settings.EMBEDDING_DIMENSION
    assert get_distance_metric().name == "COSINE"

    documents = [
        "Pump P-101 requires bearing lubrication every 90 days.",
        "Compressor C-205 maintenance schedule includes seal inspection.",
        "The weather forecast predicts sunny skies and warm temperatures.",
    ]
    labels = ["pump", "compressor", "weather"]

    document_vectors = embedder.embed_documents(documents)
    assert len(document_vectors) == len(documents)
    assert all(len(vector) == embedder.dimension for vector in document_vectors)

    await vector_service.ensure_collection(vector_size=embedder.dimension)
    
    doc_ids = [str(uuid.uuid4()) for _ in documents]
    await vector_service.upsert_texts(
        texts=documents,
        vectors=document_vectors,
        payloads=[{"label": label} for label in labels],
        ids=doc_ids,
    )

    query = "When should Pump P-101 bearings be lubricated?"
    query_vector = embedder.embed_query(query)
    assert len(query_vector) == embedder.dimension

    results = await vector_service.search(query_vector=query_vector, limit=3)
    assert len(results) == 3

    ranked_labels = [result.payload["label"] for result in results]
    ranked_scores = [result.score for result in results]

    assert ranked_labels[0] == "pump"
    assert ranked_labels.index("weather") > ranked_labels.index("pump")
    assert ranked_scores == sorted(ranked_scores, reverse=True)

    client = get_qdrant_client()
    await client.delete_collection(collection_name=test_collection_name)


@pytest.mark.asyncio
async def test_m4_empty_text_rejected():
    embedder = EmbeddingService()

    with pytest.raises(ValueError, match="non-empty"):
        embedder.embed_text("   ")

    with pytest.raises(ValueError, match="non-empty"):
        embedder.embed_query("")


@pytest.mark.asyncio
async def test_m4_collection_creation_is_idempotent(test_collection_name: str):
    settings = get_settings()
    vector_service = VectorService(collection_name=test_collection_name)

    await vector_service.ensure_collection(vector_size=settings.EMBEDDING_DIMENSION)
    await vector_service.ensure_collection(vector_size=settings.EMBEDDING_DIMENSION)

    client = get_qdrant_client()
    info = await client.get_collection(test_collection_name)
    assert info.config.params.vectors.size == settings.EMBEDDING_DIMENSION

    await client.delete_collection(collection_name=test_collection_name)
