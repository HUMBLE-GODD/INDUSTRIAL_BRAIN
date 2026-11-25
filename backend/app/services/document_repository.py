"""
Document repository — thin async SQLAlchemy CRUD layer.

Wraps the shared ``Document`` model (defined by Tatvik in database.py) so
document routes never touch SQL directly.  Schema changes should be requested
from Tatvik; do not add migrations here.
"""

from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Document, DocumentStatus


class DocumentRepository:
    """CRUD helpers for the ``documents`` table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create(
        self,
        *,
        document_id: str,
        title: str,
        file_type: str,
        file_path: str,
        status: DocumentStatus = DocumentStatus.UPLOADED,
    ) -> Document:
        doc = Document(
            id=document_id,
            title=title,
            file_type=file_type,
            file_path=file_path,
            status=status,
        )
        self._session.add(doc)
        await self._session.commit()
        await self._session.refresh(doc)
        return doc

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_by_id(self, document_id: str) -> Optional[Document]:
        result = await self._session.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> Sequence[Document]:
        result = await self._session.execute(
            select(Document).order_by(Document.created_at.desc())
        )
        return result.scalars().all()

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    async def update_status(self, document_id: str, status: DocumentStatus) -> Optional[Document]:
        doc = await self.get_by_id(document_id)
        if doc is None:
            return None
        doc.status = status
        await self._session.commit()
        await self._session.refresh(doc)
        return doc

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------

    async def delete(self, document_id: str) -> bool:
        doc = await self.get_by_id(document_id)
        if doc is None:
            return False
        await self._session.delete(doc)
        await self._session.commit()
        return True
