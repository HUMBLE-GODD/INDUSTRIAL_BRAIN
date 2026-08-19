import logging

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_client = None

_DISTANCE_MAP = {
    "cosine": Distance.COSINE,
    "euclid": Distance.EUCLID,
    "dot": Distance.DOT,
}


def get_distance_metric(metric_name: str | None = None) -> Distance:
    settings = get_settings()
    name = (metric_name or settings.QDRANT_DISTANCE_METRIC).lower()
    if name not in _DISTANCE_MAP:
        raise ValueError(
            f"Unsupported Qdrant distance metric: {name}. "
            f"Expected one of: {', '.join(_DISTANCE_MAP)}"
        )
    return _DISTANCE_MAP[name]


def get_qdrant_client() -> AsyncQdrantClient:
    global _client
    settings = get_settings()
    if _client is None:
        _client = AsyncQdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
    return _client


async def ensure_qdrant_collection(
    collection_name: str | None = None,
    vector_size: int | None = None,
    distance: Distance | None = None,
) -> None:
    """Create the vector collection if it does not already exist."""
    settings = get_settings()
    client = get_qdrant_client()
    name = collection_name or settings.QDRANT_COLLECTION_NAME
    size = vector_size or settings.EMBEDDING_DIMENSION
    metric = distance or get_distance_metric()

    existing = await client.get_collections()
    if any(collection.name == name for collection in existing.collections):
        info = await client.get_collection(name)
        current_size = info.config.params.vectors.size
        current_distance = info.config.params.vectors.distance
        if current_size != size:
            raise ValueError(
                f"Qdrant collection '{name}' exists with vector size {current_size}, "
                f"but expected {size}. Use a different collection name or migrate data."
            )
        if current_distance != metric:
            raise ValueError(
                f"Qdrant collection '{name}' uses distance {current_distance}, "
                f"but expected {metric}."
            )
        logger.info("Qdrant collection '%s' already exists.", name)
        return

    await client.create_collection(
        collection_name=name,
        vectors_config=VectorParams(size=size, distance=metric),
    )
    logger.info(
        "Created Qdrant collection '%s' (size=%s, distance=%s).",
        name,
        size,
        metric,
    )


async def init_qdrant(
    collection_name: str | None = None,
    vector_size: int | None = None,
    distance: Distance | None = None,
) -> None:
    """Verify Qdrant connectivity and ensure the configured collection exists."""
    client = get_qdrant_client()
    await client.get_collections()
    await ensure_qdrant_collection(
        collection_name=collection_name,
        vector_size=vector_size,
        distance=distance,
    )
