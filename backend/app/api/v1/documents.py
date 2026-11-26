"""
Document intake API — routes owned by Kavyansh.

Endpoints
---------
POST   /api/v1/documents/upload          – upload and index a document
GET    /api/v1/documents                 – list all documents
GET    /api/v1/documents/{document_id}   – fetch one document
DELETE /api/v1/documents/{document_id}   – delete document + vectors
GET    /api/v1/documents/search          – semantic chunk search
"""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.documents_schemas import (
    ChunkSearchResult,
    DocumentDetail,
    DocumentListItem,
    DocumentUploadResponse,
    SearchResponse,
)
from app.api.v1.dependencies import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.database import DocumentStatus
from app.services.document_index_service import delete_document_vectors, index_chunks
from app.services.document_repository import DocumentRepository
from app.services.document_service import (
    extract_and_chunk,
    sanitize_filename,
    validate_file,
)
from app.services.vector_service import get_vector_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _doc_to_upload_response(doc) -> DocumentUploadResponse:
    return DocumentUploadResponse(
        document_id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        status=doc.status.value if hasattr(doc.status, "value") else doc.status,
        created_at=doc.created_at,
    )


def _doc_to_detail(doc) -> DocumentDetail:
    return DocumentDetail(
        document_id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        file_path=doc.file_path,
        status=doc.status.value if hasattr(doc.status, "value") else doc.status,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def _doc_to_list_item(doc) -> DocumentListItem:
    return DocumentListItem(
        document_id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        status=doc.status.value if hasattr(doc.status, "value") else doc.status,
        created_at=doc.created_at,
    )


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF, TXT, or CSV document and index it in Qdrant.",
)
async def upload_document(
    file: UploadFile = File(..., description="PDF, TXT, or CSV file (max 50 MB)"),
    title: Optional[str] = Form(None, description="Human-readable title (defaults to filename)"),
    chunk_size: int = Form(512, ge=64, le=4096, description="Characters per chunk"),
    chunk_overlap: int = Form(64, ge=0, le=512, description="Overlap between adjacent chunks"),
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    """
    Accept a document, extract text, chunk it, embed, and upsert into Qdrant.

    - Supported types: PDF, plain text (.txt), CSV
    - Max size: 50 MB
    - Re-uploading identical content with the same title reuses its document and chunk IDs
    """
    settings = get_settings()

    # --- Read file ---
    data = await file.read()
    filename = file.filename or "upload"
    content_type = file.content_type or ""
    file_size = len(data)

    # --- Validate ---
    try:
        file_type = validate_file(filename, content_type, file_size)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    safe_name = sanitize_filename(filename)
    doc_title = title or Path(safe_name).stem
    fingerprint = hashlib.sha256(
        file_type.encode("ascii") + b"\0" + doc_title.encode("utf-8") + b"\0" + data
    ).hexdigest()
    document_id = fingerprint
    repo = DocumentRepository(db)

    # Content and title identity make repeated uploads address the same SQL
    # record and deterministic Qdrant points. Processed content needs no reindex.
    doc = await repo.get_by_id(document_id)
    is_retry = doc is not None
    if doc is not None:
        existing_status = doc.status.value if hasattr(doc.status, "value") else doc.status
        if existing_status == DocumentStatus.PROCESSED.value:
            return _doc_to_upload_response(doc)
        if existing_status == DocumentStatus.PROCESSING.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This document is already being processed.",
            )
    else:
        # --- Persist file and create the DB record ---
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        dest = upload_dir / f"{document_id}_{safe_name}"
        dest.write_bytes(data)
        doc = await repo.create(
            document_id=document_id,
            title=doc_title,
            file_type=file_type,
            file_path=str(dest),
            status=DocumentStatus.UPLOADED,
        )

    # --- Extract, chunk, embed, index (async pipeline) ---
    await repo.update_status(document_id, DocumentStatus.PROCESSING)
    try:
        # A failed prior upsert may have left some points behind. Clear this
        # document's points before retrying; deterministic IDs make the retry
        # safe even if the subsequent upsert fails again.
        if is_retry:
            await delete_document_vectors(document_id)
        chunks = extract_and_chunk(
            file_type=file_type,
            data=data,
            document_id=document_id,
            title=doc_title,
            chunk_size=chunk_size,
            overlap=chunk_overlap,
        )
        if not chunks:
            raise ValueError("No chunks extracted — the document may be empty.")

        await index_chunks(chunks)
        doc = await repo.update_status(document_id, DocumentStatus.PROCESSED)
    except Exception as exc:
        logger.exception("Failed to process document '%s': %s", document_id, exc)
        await repo.update_status(document_id, DocumentStatus.FAILED)
        # Re-fetch to return latest state
        doc = await repo.get_by_id(document_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document uploaded but processing failed: {exc}",
        )

    return _doc_to_upload_response(doc)


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=list[DocumentListItem],
    summary="List all indexed documents.",
)
async def list_documents(
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    repo = DocumentRepository(db)
    docs = await repo.list_all()
    return [_doc_to_list_item(d) for d in docs]


# ---------------------------------------------------------------------------
# Search (consumed by Prathmesh's retrieval layer)
# ---------------------------------------------------------------------------


@router.get(
    "/search",
    response_model=SearchResponse,
    summary="Semantic chunk search. Returns ranked chunks with citation metadata.",
)
async def search_documents(
    q: str = Query(..., min_length=1, description="Natural-language query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return"),
    _user=Depends(get_current_user),
):
    """
    Embed the query and retrieve the top-*limit* matching chunks from Qdrant.

    Each result includes ``document_id``, ``title``, ``page`` / row number,
    ``chunk_id``, and ``score`` so the caller can cite the source.
    """
    from app.services.embedding_service import get_embedding_service

    embedder = get_embedding_service()
    try:
        query_vector = embedder.embed_query(q)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    vector_service = get_vector_service()
    hits = await vector_service.search(query_vector=query_vector, limit=limit)

    results = []
    for hit in hits:
        payload = hit.payload or {}
        results.append(
            ChunkSearchResult(
                chunk_id=str(hit.id),
                document_id=payload.get("document_id", ""),
                title=payload.get("title", ""),
                page=payload.get("page", 0),
                chunk_index=payload.get("chunk_index", 0),
                text=payload.get("text", ""),
                score=hit.score,
            )
        )

    return SearchResponse(results=results, total=len(results))


# ---------------------------------------------------------------------------
# Get one
# ---------------------------------------------------------------------------


@router.get(
    "/{document_id}",
    response_model=DocumentDetail,
    summary="Fetch metadata for a single document.",
)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return _doc_to_detail(doc)


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document and its Qdrant vectors.",
)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    _user=Depends(get_current_user),
):
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Remove Qdrant vectors before deleting metadata so a failure is retryable.
    try:
        await delete_document_vectors(document_id)
    except Exception as exc:
        logger.warning("Vector deletion failed for '%s': %s", document_id, type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vector storage is unavailable; the document was not deleted. Retry later.",
        ) from exc

    deleted = await repo.delete(document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document record.",
        )
    # 204 — no body
