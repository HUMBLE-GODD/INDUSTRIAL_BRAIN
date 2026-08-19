import os

import pytest

from app.core.config import get_settings


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
def test_collection_name() -> str:
    return TEST_COLLECTION_NAME
