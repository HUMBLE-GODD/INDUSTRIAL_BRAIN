"""Field observation submission endpoint."""

from fastapi import APIRouter, Body, status
from sqlalchemy import select

from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.api.v1.schemas import APIErrorResponse, ObservationCreate, ObservationResponse
from app.core.errors import APIError
from app.models.database import Equipment, FieldObservation

router = APIRouter(prefix="/observations", tags=["field observations"])


@router.post(
    "",
    response_model=ObservationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a field observation",
    description="Records an observation against an existing asset. The authenticated user is recorded as the reporter.",
    responses={
        401: {"model": APIErrorResponse, "description": "Bearer token required"},
        404: {"model": APIErrorResponse, "description": "Equipment was not found"},
        422: {"model": APIErrorResponse, "description": "Invalid request"},
    },
)
async def create_observation(
    current_user: CurrentUser,
    db: DatabaseSession,
    payload: ObservationCreate = Body(
        openapi_examples={
            "inspection": {
                "summary": "Record a pump inspection observation",
                "value": {
                    "equipment_id": "EQ-001",
                    "category": "inspection",
                    "severity": "medium",
                    "note": "Slight vibration observed near the pump coupling.",
                },
            }
        }
    ),
) -> ObservationResponse:
    result = await db.execute(select(Equipment.id).where(Equipment.id == payload.equipment_id))
    if result.scalar_one_or_none() is None:
        raise APIError(404, "equipment_not_found", f"Equipment '{payload.equipment_id}' was not found")

    observation = FieldObservation(
        equipment_id=payload.equipment_id,
        reported_by=current_user.id,
        category=payload.category.lower(),
        severity=(payload.severity.value if hasattr(payload.severity, "value") else payload.severity),
        note=payload.note,
        status="submitted",
    )
    db.add(observation)
    await db.commit()
    await db.refresh(observation)
    return ObservationResponse.model_validate(observation)
