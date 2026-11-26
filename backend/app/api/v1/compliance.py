from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.compliance import ComplianceGapResponse
from app.services.compliance_service import ComplianceService
from app.services.maintenance_service import EquipmentNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter()


def get_compliance_service() -> ComplianceService:
    """Dependency provider for ComplianceService, allowing test overrides."""
    return ComplianceService()


@router.get(
    "/compliance/gaps",
    response_model=ComplianceGapResponse,
    status_code=status.HTTP_200_OK,
    summary="Regulatory compliance gap evaluation",
    description=(
        "Returns explainable compliance assessments and pending audits across equipment checklists. "
        "Applies transparent regulatory rules and distinguishes overdue, non-compliant, and pending statuses. "
        "Note: Implemented without auth dependency for this independent PR pending Tatvik's platform auth merge."
    ),
)
async def get_compliance_gaps(
    equipment_id: Optional[str] = Query(default=None, description="Optional equipment identifier filter (e.g. EQ-001)"),
    db: AsyncSession = Depends(get_db),
    service: ComplianceService = Depends(get_compliance_service),
) -> ComplianceGapResponse:
    try:
        return await service.get_compliance_gaps(db=db, equipment_id=equipment_id)
    except EquipmentNotFoundError as e:
        logger.warning("Equipment not found for compliance evaluation: %s", equipment_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.exception("Database error while computing compliance gaps: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Compliance evaluation service could not access the database repository.",
        ) from e
