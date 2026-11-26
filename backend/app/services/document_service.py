"""
Document extraction, chunking, and Qdrant indexing service.

Supports PDF, plain text (.txt), and CSV files.
Chunks are assigned stable IDs derived from document_id + chunk position so
re-indexing (upsert) is idempotent.
"""

from __future__ import annotations

import csv
import hashlib
import io
import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional PDF dependency
# ---------------------------------------------------------------------------
try:
    import pypdf  # type: ignore

    _PYPDF_AVAILABLE = True
except ModuleNotFoundError:  # pragma: no cover
    _PYPDF_AVAILABLE = False

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_MIME_TYPES: dict[str, str] = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/csv": "csv",
    "application/vnd.ms-excel": "csv",
}

ALLOWED_EXTENSIONS: set[str] = {".pdf", ".txt", ".csv"}

MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB

DEFAULT_CHUNK_SIZE: int = 512  # characters
DEFAULT_CHUNK_OVERLAP: int = 64  # characters


# ---------------------------------------------------------------------------
# Data classes (plain dicts are used to avoid adding dataclasses dependency)
# ---------------------------------------------------------------------------


def _make_chunk_id(document_id: str, chunk_index: int) -> str:
    """Stable, deterministic chunk ID from document_id and position."""
    raw = f"{document_id}::{chunk_index}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


# ---------------------------------------------------------------------------
# File-type validation
# ---------------------------------------------------------------------------


def validate_file(
    filename: str,
    content_type: str | None,
    file_size: int,
) -> str:
    """
    Validate upload metadata.

    Returns the canonical file type ('pdf', 'txt', 'csv').
    Raises ValueError with a user-friendly message on failure.
    """
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"File size {file_size:,} bytes exceeds the maximum allowed "
            f"{MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file extension '{suffix}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )

    # Map extension to canonical type (content-type may be unreliable)
    ext_map = {".pdf": "pdf", ".txt": "txt", ".csv": "csv"}
    return ext_map[suffix]


def sanitize_filename(filename: str) -> str:
    """Remove path separators and control characters from a filename."""
    name = Path(filename).name  # strip directory components
    name = re.sub(r"[^\w.\-]", "_", name)  # replace unsafe chars
    return name or "upload"


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------


def extract_text_from_pdf(data: bytes) -> list[dict[str, Any]]:
    """
    Extract text page-by-page from a PDF.

    Returns a list of ``{"page": int, "text": str}`` dicts (1-indexed).
    Raises RuntimeError if pypdf is not installed.
    Raises ValueError if no extractable text is found.
    """
    if not _PYPDF_AVAILABLE:
        raise RuntimeError(
            "PDF extraction requires 'pypdf'. Install it with: pip install pypdf"
        )

    reader = pypdf.PdfReader(io.BytesIO(data))
    pages: list[dict[str, Any]] = []
    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            pages.append({"page": page_num, "text": text})

    if not pages:
        raise ValueError(
            "No extractable text found in PDF. "
            "If this is a scanned document, OCR support is a planned stretch feature."
        )
    return pages


def extract_text_from_txt(data: bytes) -> list[dict[str, Any]]:
    """
    Read plain text. The whole file is treated as page 1.

    Raises ValueError if the file is empty after stripping.
    """
    text = data.decode("utf-8", errors="replace").strip()
    if not text:
        raise ValueError("Text file is empty.")
    return [{"page": 1, "text": text}]


def extract_text_from_csv(data: bytes) -> list[dict[str, Any]]:
    """
    Extract rows from a CSV; each row becomes a plain-text representation.
    Row number (1-indexed, counting the header as row 1) is preserved as the
    page/row reference.

    Raises ValueError if the CSV has no data rows.
    """
    text_io = io.StringIO(data.decode("utf-8", errors="replace"))
    reader = csv.DictReader(text_io)
    rows: list[dict[str, Any]] = []
    for row_num, row in enumerate(reader, start=2):  # 1 = header
        parts = [f"{k}: {v}" for k, v in row.items() if v and str(v).strip()]
        if parts:
            rows.append({"page": row_num, "text": " | ".join(parts)})

    if not rows:
        raise ValueError("CSV file contains no data rows with extractable text.")
    return rows


def extract_text(file_type: str, data: bytes) -> list[dict[str, Any]]:
    """Dispatch to the appropriate extractor."""
    if file_type == "pdf":
        return extract_text_from_pdf(data)
    if file_type == "txt":
        return extract_text_from_txt(data)
    if file_type == "csv":
        return extract_text_from_csv(data)
    raise ValueError(f"Unsupported file type for extraction: {file_type}")


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------


def chunk_pages(
    pages: list[dict[str, Any]],
    document_id: str,
    title: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[dict[str, Any]]:
    """
    Split page texts into overlapping chunks.

    Each returned chunk dict contains:
        chunk_id      – stable deterministic ID
        document_id   – parent document
        title         – document title
        page          – source page/row number
        chunk_index   – 0-based position within the document
        text          – chunk content
    """
    chunks: list[dict[str, Any]] = []
    chunk_index = 0

    for page_info in pages:
        page_num: int = page_info["page"]
        text: str = page_info["text"]

        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunk_id = _make_chunk_id(document_id, chunk_index)
                chunks.append(
                    {
                        "chunk_id": chunk_id,
                        "document_id": document_id,
                        "title": title,
                        "page": page_num,
                        "chunk_index": chunk_index,
                        "text": chunk_text,
                    }
                )
                chunk_index += 1
            # advance with overlap so adjacent chunks share context
            step = max(1, chunk_size - overlap)
            start += step

    return chunks


# ---------------------------------------------------------------------------
# High-level pipeline helper
# ---------------------------------------------------------------------------


def extract_and_chunk(
    file_type: str,
    data: bytes,
    document_id: str,
    title: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[dict[str, Any]]:
    """
    Full pipeline: extract pages then chunk.

    Raises ValueError / RuntimeError with user-readable messages on failure.
    """
    pages = extract_text(file_type, data)
    return chunk_pages(pages, document_id, title, chunk_size, overlap)
