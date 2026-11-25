"""
Pydantic schemas for the document API.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentUploadResponse(BaseModel):
    """Returned when a document is accepted for processing."""

    model_config = ConfigDict(from_attributes=True)

    document_id: str
    title: str
    file_type: str
    status: str
    created_at: datetime


class DocumentDetail(BaseModel):
    """Full document record."""

    model_config = ConfigDict(from_attributes=True)

    document_id: str
    title: str
    file_type: str
    file_path: str
    status: str
    created_at: datetime
    updated_at: datetime


class DocumentListItem(BaseModel):
    """Lightweight list item (no file_path exposed)."""

    model_config = ConfigDict(from_attributes=True)

    document_id: str
    title: str
    file_type: str
    status: str
    created_at: datetime


class ChunkSearchResult(BaseModel):
    """A ranked chunk returned by /search."""

    chunk_id: str
    document_id: str
    title: str
    page: int
    chunk_index: int
    text: str
    score: float


class SearchResponse(BaseModel):
    results: list[ChunkSearchResult]
    total: int
