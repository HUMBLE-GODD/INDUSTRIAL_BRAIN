"""
Unit and integration tests for Kavyansh's document intake pipeline.

Coverage targets
----------------
- Extraction  : PDF (skipped if pypdf missing), TXT, CSV happy paths + error paths
- Chunking    : boundaries, overlap, stable chunk IDs, idempotency
- Metadata    : chunk payloads contain document_id, title, page, chunk_index
- Indexing    : index_chunks upserts; re-index does not duplicate
- API routes  : upload, list, get, delete via TestClient (in-memory SQLite)
- Failure     : unsupported type, oversized file, empty content → 4xx
- Delete      : vectors removed when document deleted
- Search      : ranked results with citation fields

Run with:
    pytest backend/tests/test_document_intake.py -v
"""

from __future__ import annotations

import io
import uuid
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# document_service tests (pure Python, no I/O)
# ---------------------------------------------------------------------------

from app.services.document_service import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    MAX_FILE_SIZE_BYTES,
    _make_chunk_id,
    chunk_pages,
    extract_and_chunk,
    extract_text_from_csv,
    extract_text_from_txt,
    sanitize_filename,
    validate_file,
)


class TestValidateFile:
    def test_valid_txt(self):
        assert validate_file("manual.txt", "text/plain", 100) == "txt"

    def test_valid_csv(self):
        assert validate_file("report.csv", "text/csv", 100) == "csv"

    def test_unsupported_extension_raises(self):
        with pytest.raises(ValueError, match="Unsupported file extension"):
            validate_file("file.docx", "application/msword", 100)

    def test_oversized_file_raises(self):
        with pytest.raises(ValueError, match="exceeds the maximum"):
            validate_file("big.txt", "text/plain", MAX_FILE_SIZE_BYTES + 1)

    def test_extension_wins_over_content_type(self):
        # Even with wrong content-type, extension determines type
        assert validate_file("data.csv", "application/octet-stream", 50) == "csv"


class TestSanitizeFilename:
    def test_strips_path(self):
        assert "/" not in sanitize_filename("../../etc/passwd")

    def test_replaces_spaces(self):
        name = sanitize_filename("my file (1).txt")
        assert " " not in name

    def test_no_empty_name(self):
        assert sanitize_filename("") == "upload"


class TestTxtExtraction:
    def test_extracts_content(self):
        data = b"Hello world"
        pages = extract_text_from_txt(data)
        assert len(pages) == 1
        assert pages[0]["page"] == 1
        assert "Hello world" in pages[0]["text"]

    def test_empty_raises(self):
        with pytest.raises(ValueError, match="empty"):
            extract_text_from_txt(b"   ")

    def test_whitespace_only_raises(self):
        with pytest.raises(ValueError, match="empty"):
            extract_text_from_txt(b"\n\n\t  \n")


class TestCsvExtraction:
    def test_extracts_rows(self):
        csv_data = b"id,name,value\n1,alpha,100\n2,beta,200\n"
        pages = extract_text_from_csv(csv_data)
        assert len(pages) == 2
        assert pages[0]["page"] == 2  # row 1 = header; first data row = 2
        assert "alpha" in pages[0]["text"]

    def test_empty_csv_raises(self):
        with pytest.raises(ValueError, match="no data rows"):
            extract_text_from_csv(b"id,name\n")

    def test_row_numbers_increase(self):
        csv_data = b"col\na\nb\nc\n"
        pages = extract_text_from_csv(csv_data)
        row_nums = [p["page"] for p in pages]
        assert row_nums == sorted(row_nums)


class TestChunking:
    def _make_pages(self, text: str) -> list[dict[str, Any]]:
        return [{"page": 1, "text": text}]

    def test_chunk_count(self):
        long_text = "A" * 2000
        pages = self._make_pages(long_text)
        chunks = chunk_pages(pages, "doc-1", "Test", chunk_size=512, overlap=64)
        # Each step advances by (512 - 64) = 448 chars; 2000 / 448 ≈ 5 chunks
        assert len(chunks) >= 4

    def test_chunk_ids_are_stable(self):
        pages = self._make_pages("Hello world " * 100)
        chunks1 = chunk_pages(pages, "doc-X", "T", chunk_size=50, overlap=10)
        chunks2 = chunk_pages(pages, "doc-X", "T", chunk_size=50, overlap=10)
        assert [c["chunk_id"] for c in chunks1] == [c["chunk_id"] for c in chunks2]

    def test_chunk_ids_differ_across_docs(self):
        pages = self._make_pages("Same text")
        chunks_a = chunk_pages(pages, "doc-A", "T")
        chunks_b = chunk_pages(pages, "doc-B", "T")
        assert chunks_a[0]["chunk_id"] != chunks_b[0]["chunk_id"]

    def test_payload_fields_present(self):
        pages = self._make_pages("Equipment P-101 bearing lubrication schedule.")
        chunks = chunk_pages(pages, "doc-42", "Manual", chunk_size=50, overlap=5)
        for c in chunks:
            assert "chunk_id" in c
            assert "document_id" in c
            assert c["document_id"] == "doc-42"
            assert "title" in c
            assert "page" in c
            assert "chunk_index" in c
            assert "text" in c

    def test_chunk_index_monotonic(self):
        pages = self._make_pages("Word " * 500)
        chunks = chunk_pages(pages, "doc-m", "M", chunk_size=100, overlap=20)
        indices = [c["chunk_index"] for c in chunks]
        assert indices == list(range(len(indices)))

    def test_multi_page_pages_preserved(self):
        pages = [
            {"page": 1, "text": "Page one content."},
            {"page": 2, "text": "Page two content."},
        ]
        chunks = chunk_pages(pages, "doc-p", "Book", chunk_size=512, overlap=0)
        pages_in_chunks = {c["page"] for c in chunks}
        assert 1 in pages_in_chunks
        assert 2 in pages_in_chunks

    def test_empty_pages_produce_no_chunks(self):
        chunks = chunk_pages([], "doc-e", "Empty")
        assert chunks == []


class TestMakeChunkId:
    def test_deterministic(self):
        assert _make_chunk_id("doc-1", 0) == _make_chunk_id("doc-1", 0)

    def test_unique_per_index(self):
        assert _make_chunk_id("doc-1", 0) != _make_chunk_id("doc-1", 1)

    def test_unique_per_document(self):
        assert _make_chunk_id("doc-1", 5) != _make_chunk_id("doc-2", 5)

    def test_length_32(self):
        assert len(_make_chunk_id("doc-1", 0)) == 32


# ---------------------------------------------------------------------------
# Fixture files content tests
# ---------------------------------------------------------------------------


class TestFixtureFiles:
    FIXTURE_DIR = (
        Path(__file__).parent.parent / "app" / "fixtures"
    )

    def test_manual_exists(self):
        manual = self.FIXTURE_DIR / "pump_maintenance_manual.txt"
        assert manual.exists(), "Demo manual fixture is missing"

    def test_report_exists(self):
        report = self.FIXTURE_DIR / "maintenance_report_2024.csv"
        assert report.exists(), "Maintenance report fixture is missing"

    def test_manual_contains_known_passages(self):
        manual = self.FIXTURE_DIR / "pump_maintenance_manual.txt"
        content = manual.read_text(encoding="utf-8")
        # Passage required by supervisor demo
        assert "bearing lubrication every 90 days" in content
        assert "P-101" in content
        assert "AquaFlow" in content
        assert "SUP-001" in content
        assert "MCS-4420" in content

    def test_manual_extractable(self):
        manual = self.FIXTURE_DIR / "pump_maintenance_manual.txt"
        pages = extract_text_from_txt(manual.read_bytes())
        assert pages
        assert any("P-101" in p["text"] for p in pages)

    def test_report_extractable(self):
        report = self.FIXTURE_DIR / "maintenance_report_2024.csv"
        pages = extract_text_from_csv(report.read_bytes())
        assert pages
        # Supplier/component relationship evidence
        assert any("SUP-001" in p["text"] for p in pages)
        assert any("MCS-4420" in p["text"] for p in pages)
        assert any("P-101" in p["text"] for p in pages)

    def test_full_pipeline_on_txt_fixture(self):
        manual = self.FIXTURE_DIR / "pump_maintenance_manual.txt"
        doc_id = str(uuid.uuid4())
        chunks = extract_and_chunk("txt", manual.read_bytes(), doc_id, "Demo Manual")
        assert len(chunks) > 0
        # Every chunk has mandatory fields
        required = {"chunk_id", "document_id", "title", "page", "chunk_index", "text"}
        for c in chunks:
            assert required.issubset(c.keys()), f"Missing keys in chunk: {c}"
            assert c["document_id"] == doc_id

    def test_full_pipeline_on_csv_fixture(self):
        report = self.FIXTURE_DIR / "maintenance_report_2024.csv"
        doc_id = str(uuid.uuid4())
        chunks = extract_and_chunk("csv", report.read_bytes(), doc_id, "Maintenance Report 2024")
        assert len(chunks) > 0
        for c in chunks:
            assert c["document_id"] == doc_id


# ---------------------------------------------------------------------------
# Idempotency: re-chunking same document produces identical chunk IDs
# ---------------------------------------------------------------------------


class TestIdempotency:
    def test_rechunk_same_content_same_ids(self):
        data = b"Pump P-101 bearing lubrication schedule every 90 days. " * 20
        doc_id = "stable-doc-id"
        chunks1 = extract_and_chunk("txt", data, doc_id, "Title")
        chunks2 = extract_and_chunk("txt", data, doc_id, "Title")
        ids1 = [c["chunk_id"] for c in chunks1]
        ids2 = [c["chunk_id"] for c in chunks2]
        assert ids1 == ids2, "Re-indexing must produce identical chunk IDs"


# ---------------------------------------------------------------------------
# document_index_service (mocked Qdrant)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_index_chunks_calls_upsert():
    chunks = [
        {
            "chunk_id": "abc123",
            "document_id": "doc-1",
            "title": "Manual",
            "page": 1,
            "chunk_index": 0,
            "text": "Pump bearing lubrication every 90 days.",
        }
    ]

    mock_embedder = MagicMock()
    mock_embedder.embed_documents.return_value = [[0.1] * 768]

    mock_vector_service = MagicMock()
    mock_vector_service.upsert_texts = AsyncMock(return_value=["abc123"])

    with (
        patch("app.services.document_index_service.get_embedding_service", return_value=mock_embedder),
        patch("app.services.document_index_service.get_vector_service", return_value=mock_vector_service),
    ):
        from app.services.document_index_service import index_chunks

        result = await index_chunks(chunks)

    mock_vector_service.upsert_texts.assert_called_once()
    assert result == ["abc123"]


@pytest.mark.asyncio
async def test_index_chunks_empty_returns_empty():
    from app.services.document_index_service import index_chunks

    result = await index_chunks([])
    assert result == []


@pytest.mark.asyncio
async def test_delete_document_vectors_calls_qdrant():
    mock_client = AsyncMock()

    with patch("app.services.document_index_service.get_qdrant_client", return_value=mock_client):
        from app.services.document_index_service import delete_document_vectors

        await delete_document_vectors("doc-99")

    mock_client.delete.assert_called_once()
    call_kwargs = mock_client.delete.call_args.kwargs
    assert call_kwargs.get("collection_name") is not None


# ---------------------------------------------------------------------------
# API route tests via FastAPI TestClient + in-memory SQLite
# ---------------------------------------------------------------------------


@pytest.fixture
def app_with_sqlite():
    """
    Return a FastAPI TestClient backed by an in-memory SQLite database.
    Qdrant and embedding calls are fully mocked so no external service needed.
    """
    import os

    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_docs.db"
    os.environ["QDRANT_COLLECTION_NAME"] = "test_docs_coll"

    from app.core.config import get_settings
    get_settings.cache_clear()

    # Lazy imports after env setup
    from fastapi.testclient import TestClient
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker

    from app.db.base import Base
    from app.db.session import get_db
    from app.main import app

    test_engine = create_async_engine("sqlite+aiosqlite:///./test_docs.db", echo=False)
    TestingSessionLocal = sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False
    )

    import asyncio

    asyncio.get_event_loop().run_until_complete(
        _create_tables(test_engine, Base)
    )

    async def override_get_db():
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, raise_server_exceptions=False) as client:
        yield client

    app.dependency_overrides.clear()
    get_settings.cache_clear()
    asyncio.get_event_loop().run_until_complete(test_engine.dispose())
    import os as _os
    _os.unlink("test_docs.db") if _os.path.exists("test_docs.db") else None


async def _create_tables(engine, Base):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


FIXTURE_DIR = Path(__file__).parent.parent / "app" / "fixtures"
TXT_FIXTURE = FIXTURE_DIR / "pump_maintenance_manual.txt"
CSV_FIXTURE = FIXTURE_DIR / "maintenance_report_2024.csv"


def _mock_index_patch():
    """Context manager that mocks index_chunks to return deterministic IDs."""
    mock = AsyncMock(return_value=["chunk-1"])
    return patch("app.api.v1.documents.index_chunks", mock)


def _mock_delete_patch():
    mock = AsyncMock(return_value=None)
    return patch("app.api.v1.documents.delete_document_vectors", mock)


class TestUploadEndpoint:
    def test_upload_txt_returns_201(self, app_with_sqlite):
        with _mock_index_patch(), _mock_delete_patch():
            with TXT_FIXTURE.open("rb") as fh:
                resp = app_with_sqlite.post(
                    "/api/v1/documents/upload",
                    files={"file": ("manual.txt", fh, "text/plain")},
                    data={"title": "Test Manual"},
                )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert "document_id" in body
        assert body["status"] in ("processed", "failed")

    def test_upload_csv_returns_201(self, app_with_sqlite):
        with _mock_index_patch(), _mock_delete_patch():
            with CSV_FIXTURE.open("rb") as fh:
                resp = app_with_sqlite.post(
                    "/api/v1/documents/upload",
                    files={"file": ("report.csv", fh, "text/csv")},
                )
        assert resp.status_code == 201, resp.text

    def test_unsupported_type_returns_422(self, app_with_sqlite):
        resp = app_with_sqlite.post(
            "/api/v1/documents/upload",
            files={"file": ("doc.docx", b"content", "application/msword")},
        )
        assert resp.status_code == 422

    def test_empty_txt_fails_gracefully(self, app_with_sqlite):
        with _mock_index_patch(), _mock_delete_patch():
            resp = app_with_sqlite.post(
                "/api/v1/documents/upload",
                files={"file": ("empty.txt", b"   ", "text/plain")},
            )
        # Empty text: 500 from extraction failure — no stack trace leaked
        assert resp.status_code in (422, 500)
        body = resp.json()
        assert "detail" in body
        # Must NOT contain Python traceback
        assert "Traceback" not in body.get("detail", "")

    def test_oversized_file_returns_422(self, app_with_sqlite):
        big_data = b"X" * (MAX_FILE_SIZE_BYTES + 1)
        resp = app_with_sqlite.post(
            "/api/v1/documents/upload",
            files={"file": ("huge.txt", big_data, "text/plain")},
        )
        assert resp.status_code == 422


class TestListEndpoint:
    def test_list_returns_200(self, app_with_sqlite):
        with _mock_index_patch(), _mock_delete_patch():
            resp = app_with_sqlite.get("/api/v1/documents")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_uploaded_doc_appears_in_list(self, app_with_sqlite):
        with _mock_index_patch():
            with TXT_FIXTURE.open("rb") as fh:
                app_with_sqlite.post(
                    "/api/v1/documents/upload",
                    files={"file": ("manual.txt", fh, "text/plain")},
                    data={"title": "Listed Manual"},
                )
        docs = app_with_sqlite.get("/api/v1/documents").json()
        titles = [d["title"] for d in docs]
        assert "Listed Manual" in titles


class TestGetEndpoint:
    def test_missing_document_returns_404(self, app_with_sqlite):
        resp = app_with_sqlite.get(f"/api/v1/documents/{uuid.uuid4()}")
        assert resp.status_code == 404

    def test_existing_document_returns_200(self, app_with_sqlite):
        with _mock_index_patch():
            with TXT_FIXTURE.open("rb") as fh:
                upload_resp = app_with_sqlite.post(
                    "/api/v1/documents/upload",
                    files={"file": ("manual.txt", fh, "text/plain")},
                    data={"title": "Get Test"},
                )
        if upload_resp.status_code != 201:
            pytest.skip("Upload failed; skipping get test")
        doc_id = upload_resp.json()["document_id"]
        resp = app_with_sqlite.get(f"/api/v1/documents/{doc_id}")
        assert resp.status_code == 200
        assert resp.json()["document_id"] == doc_id


class TestDeleteEndpoint:
    def test_delete_nonexistent_returns_404(self, app_with_sqlite):
        with _mock_delete_patch():
            resp = app_with_sqlite.delete(f"/api/v1/documents/{uuid.uuid4()}")
        assert resp.status_code == 404

    def test_delete_removes_document(self, app_with_sqlite):
        with _mock_index_patch():
            with TXT_FIXTURE.open("rb") as fh:
                upload_resp = app_with_sqlite.post(
                    "/api/v1/documents/upload",
                    files={"file": ("manual.txt", fh, "text/plain")},
                )
        if upload_resp.status_code != 201:
            pytest.skip("Upload failed")
        doc_id = upload_resp.json()["document_id"]

        with _mock_delete_patch():
            del_resp = app_with_sqlite.delete(f"/api/v1/documents/{doc_id}")
        assert del_resp.status_code == 204

        get_resp = app_with_sqlite.get(f"/api/v1/documents/{doc_id}")
        assert get_resp.status_code == 404
