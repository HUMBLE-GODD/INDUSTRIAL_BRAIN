from collections.abc import AsyncIterator
import os

import pytest

from app.core.config import get_settings
from app.db.qdrant import close_qdrant_client, get_qdrant_client


TEST_COLLECTION_NAME = "industrial_docs_test"


@pytest.fixture(autouse=True)
def m4_test_environment(monkeypatch):
    """Use an isolated Qdrant collection for M4 tests."""
    monkeypatch.setenv("QDRANT_COLLECTION_NAME", TEST_COLLECTION_NAME)
    monkeypatch.setenv("QDRANT_HOST", os.getenv("QDRANT_HOST", "qdrant"))
    monkeypatch.setenv("QDRANT_PORT", os.getenv("QDRANT_PORT", "6333"))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def test_collection_name(m4_test_environment) -> AsyncIterator[str]:
    """Give each Qdrant integration test a clean collection and client lifecycle."""
    client = get_qdrant_client()
    try:
        collections = await client.get_collections()
        if any(collection.name == TEST_COLLECTION_NAME for collection in collections.collections):
            await client.delete_collection(collection_name=TEST_COLLECTION_NAME)

        yield TEST_COLLECTION_NAME
    finally:
        try:
            collections = await client.get_collections()
            if any(collection.name == TEST_COLLECTION_NAME for collection in collections.collections):
                await client.delete_collection(collection_name=TEST_COLLECTION_NAME)
        finally:
            await close_qdrant_client()
