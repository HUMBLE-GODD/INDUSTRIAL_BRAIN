from __future__ import annotations

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.maintenance import MaintenancePredictionResponse
from app.services.maintenance_service import EquipmentNotFoundError, MaintenanceService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_maintenance_service() -> MaintenanceService:
    """Dependency provider for MaintenanceService, allowing test overrides."""
    return MaintenanceService()


@router.get(
    "/maintenance/predictions",
    response_model=MaintenancePredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predictive maintenance risk analysis",
    description=(
        "Returns explainable heuristic risk evaluations based on operating age, criticality, and historical maintenance/failure records. "
        "Explicitly labeled as heuristic rules, not machine-learned predictions. "
        "Note: Implemented without auth dependency for this independent PR pending Tatvik's platform auth merge."
    ),
)
async def get_maintenance_predictions(
    equipment_id: Optional[str] = Query(default=None, description="Optional equipment identifier filter (e.g. EQ-001)"),
    db: AsyncSession = Depends(get_db),
    service: MaintenanceService = Depends(get_maintenance_service),
) -> MaintenancePredictionResponse:
    try:
        return await service.get_predictions(db=db, equipment_id=equipment_id)
    except EquipmentNotFoundError as e:
        logger.warning("Equipment not found for maintenance prediction: %s", equipment_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.exception("Database error while computing maintenance predictions: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Maintenance evaluation service could not access the database repository.",
        ) from e
