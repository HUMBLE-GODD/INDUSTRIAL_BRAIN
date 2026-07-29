from qdrant_client import AsyncQdrantClient
from app.core.config import get_settings

settings = get_settings()

_client = None

def get_qdrant_client() -> AsyncQdrantClient:
    global _client
    if _client is None:
        _client = AsyncQdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
    return _client
