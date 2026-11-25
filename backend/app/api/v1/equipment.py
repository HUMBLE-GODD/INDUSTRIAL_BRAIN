"""Equipment inventory and unified history timeline endpoints."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.api.v1.schemas import (
    EquipmentHistoryEvent,
    EquipmentHistoryPage,
    EquipmentPage,
    EquipmentResponse,
    APIErrorResponse,
)
from app.core.errors import APIError
from app.models.database import Alert, Equipment, EquipmentMetric, Failure, FieldObservation, MaintenanceRecord

router = APIRouter(prefix="/equipment", tags=["equipment"])


def _lower(value: Any) -> str:
    if hasattr(value, "value"):
        value = value.value
    return str(value).lower()


def _equipment_response(equipment: Equipment) -> EquipmentResponse:
    return EquipmentResponse(
        id=equipment.id,
        name=equipment.name,
        type=equipment.type,
        model=equipment.model,
        manufacturer=equipment.manufacturer,
        status=_lower(equipment.status),
        criticality=_lower(equipment.criticality),
        location=equipment.location,
        install_date=equipment.install_date,
        created_at=equipment.created_at,
        updated_at=equipment.updated_at,
    )


async def _find_equipment(db: DatabaseSession, equipment_id: str) -> Equipment:
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equipment = result.scalar_one_or_none()
    if equipment is None:
        raise APIError(404, "equipment_not_found", f"Equipment '{equipment_id}' was not found")
    return equipment


@router.get(
    "",
    response_model=EquipmentPage,
    summary="List equipment",
    description="Returns a stable, paginated equipment inventory.",
    responses={
        401: {"model": APIErrorResponse, "description": "Bearer token required"},
        422: {"model": APIErrorResponse, "description": "Invalid pagination parameters"},
    },
)
async def list_equipment(
    _current_user: CurrentUser,
    db: DatabaseSession,
    page: int = Query(1, ge=1, description="Page number, starting at 1", examples=[1]),
    page_size: int = Query(20, ge=1, le=100, description="Number of equipment records per page", examples=[20]),
) -> EquipmentPage:
    count_result = await db.execute(select(func.count()).select_from(Equipment))
    total = int(count_result.scalar_one())
    result = await db.execute(
        select(Equipment).order_by(Equipment.id.asc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = [_equipment_response(row) for row in result.scalars().all()]
    return EquipmentPage.make(items, page, page_size, total)


@router.get(
    "/{equipment_id}",
    response_model=EquipmentResponse,
    summary="Get equipment details",
    responses={
        401: {"model": APIErrorResponse, "description": "Bearer token required"},
        404: {"model": APIErrorResponse, "description": "Equipment was not found"},
    },
)
async def get_equipment(equipment_id: str, _current_user: CurrentUser, db: DatabaseSession) -> EquipmentResponse:
    equipment = await _find_equipment(db, equipment_id)
    return _equipment_response(equipment)


async def _count_for_equipment(db: DatabaseSession, model: Any, equipment_id: str) -> int:
    result = await db.execute(
        select(func.count()).select_from(model).where(model.equipment_id == equipment_id)
    )
    return int(result.scalar_one())


async def _latest_rows(
    db: DatabaseSession, model: Any, timestamp_column: Any, equipment_id: str, limit: int
) -> list[Any]:
    result = await db.execute(
        select(model)
        .where(model.equipment_id == equipment_id)
        .order_by(timestamp_column.desc(), model.id.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


def _event(
    row: Any,
    event_type: str,
    timestamp: datetime,
    title: str,
    summary: str,
    metadata: dict[str, Any],
    severity: str | None = None,
    status: str | None = None,
) -> EquipmentHistoryEvent:
    return EquipmentHistoryEvent(
        id=row.id,
        event_type=event_type,
        occurred_at=timestamp,
        title=title,
        description=summary,
        severity=severity,
        status=status,
        metadata=metadata,
    )


def _history_events(
    metrics: list[EquipmentMetric],
    alerts: list[Alert],
    failures: list[Failure],
    maintenance: list[MaintenanceRecord],
    observations: list[FieldObservation],
) -> list[EquipmentHistoryEvent]:
    events: list[EquipmentHistoryEvent] = []
    for row in metrics:
        events.append(
            _event(
                row,
                "metric",
                row.timestamp,
                "Telemetry recorded",
                "Equipment telemetry data was recorded.",
                {"sensor_data": row.sensor_data, "anomaly_score": row.anomaly_score},
            )
        )
    for row in alerts:
        severity = _lower(row.severity)
        events.append(
            _event(
                row,
                "alert",
                row.created_at,
                str(row.type),
                row.message,
                {"alert_type": row.type, "resolved_at": row.resolved_at.isoformat() if row.resolved_at else None},
                severity=severity,
                status="resolved" if row.is_resolved else "open",
            )
        )
    for row in failures:
        events.append(
            _event(
                row,
                "failure",
                row.timestamp,
                row.failure_mode,
                row.root_cause or row.failure_mode,
                {
                    "component": row.component,
                    "root_cause": row.root_cause,
                    "downtime_hours": row.downtime_hours,
                    "supplier_of_failed_part": row.supplier_of_failed_part,
                },
            )
        )
    for row in maintenance:
        status = _lower(row.status)
        events.append(
            _event(
                row,
                "maintenance",
                row.date,
                str(row.type),
                row.description,
                {
                    "maintenance_type": row.type,
                    "parts_used": row.parts_used,
                    "duration_hours": row.duration_hours,
                    "cost": row.cost,
                    "technician_id": row.technician_id,
                },
                status=status,
            )
        )
    for row in observations:
        severity = _lower(row.severity)
        events.append(
            _event(
                row,
                "field_observation",
                row.created_at,
                row.category,
                row.note,
                {"reporter_id": row.reported_by, "category": row.category, "severity": severity, "note": row.note},
                severity=severity,
                status=_lower(row.status),
            )
        )

    def sort_key(event: EquipmentHistoryEvent) -> tuple[float, str]:
        timestamp = event.occurred_at
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        return timestamp.timestamp(), event.id

    return sorted(events, key=sort_key, reverse=True)


@router.get(
    "/{equipment_id}/history",
    response_model=EquipmentHistoryPage,
    summary="Get equipment history",
    description="Returns a paginated timeline across telemetry, alerts, failures, maintenance, and field observations.",
    responses={
        401: {"model": APIErrorResponse, "description": "Bearer token required"},
        404: {"model": APIErrorResponse, "description": "Equipment was not found"},
        422: {"model": APIErrorResponse, "description": "Invalid pagination parameters"},
    },
)
async def get_equipment_history(
    equipment_id: str,
    _current_user: CurrentUser,
    db: DatabaseSession,
    page: int = Query(1, ge=1, description="Page number, starting at 1", examples=[1]),
    page_size: int = Query(20, ge=1, le=100, description="Number of timeline events per page", examples=[20]),
) -> EquipmentHistoryPage:
    await _find_equipment(db, equipment_id)
    offset = (page - 1) * page_size
    fetch_count = offset + page_size

    model_columns = [
        (EquipmentMetric, EquipmentMetric.timestamp),
        (Alert, Alert.created_at),
        (Failure, Failure.timestamp),
        (MaintenanceRecord, MaintenanceRecord.date),
        (FieldObservation, FieldObservation.created_at),
    ]
    counts = []
    row_groups = []
    # An AsyncSession is not safe for concurrent statements. Keep these queries
    # sequential while still limiting each source to the newest possible page.
    for model, timestamp_column in model_columns:
        counts.append(await _count_for_equipment(db, model, equipment_id))
    for model, timestamp_column in model_columns:
        row_groups.append(await _latest_rows(db, model, timestamp_column, equipment_id, fetch_count))

    all_events = _history_events(*row_groups)
    return EquipmentHistoryPage.make(all_events[offset : offset + page_size], page, page_size, sum(counts))
