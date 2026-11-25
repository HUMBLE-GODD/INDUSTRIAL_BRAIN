"""Typed API request and response schemas."""

from datetime import datetime
from enum import Enum
from math import ceil
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class APIErrorBody(APIModel):
    code: str
    message: str
    details: list[dict[str, Any]] = Field(default_factory=list)


class APIErrorResponse(APIModel):
    error: APIErrorBody

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Request validation failed",
                        "details": [
                            {"loc": ["body", "email"], "msg": "Field required", "type": "missing"}
                        ],
                    }
                }
            ]
        }
    )


class UserRole(str, Enum):
    ADMIN = "admin"
    TECHNICIAN = "technician"
    MANAGER = "manager"
    VIEWER = "viewer"


class DocumentStatus(str, Enum):
    """Shared document lifecycle values used by document API clients."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class ObservationSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RegisterRequest(APIModel):
    email: str = Field(examples=["tech@example.com"])
    password: str = Field(min_length=8, max_length=128, examples=["replace-with-a-strong-password"])

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("A valid email address is required")
        email = value.strip().lower()
        if len(email) > 254 or email.count("@") != 1:
            raise ValueError("A valid email address is required")
        local, domain = email.split("@", 1)
        if not local or not domain or "." not in domain or any(char.isspace() for char in email):
            raise ValueError("A valid email address is required")
        return email


class LoginRequest(RegisterRequest):
    password: str = Field(min_length=1, max_length=128, examples=["replace-with-a-strong-password"])


class UserResponse(APIModel):
    id: str
    email: str
    role: UserRole
    created_at: datetime


class TokenResponse(APIModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(description="Token lifetime in seconds")
    user: UserResponse


class EquipmentResponse(APIModel):
    id: str
    name: str
    type: str
    model: str | None = None
    manufacturer: str | None = None
    status: str
    criticality: str
    location: str
    install_date: datetime | None = None
    created_at: datetime
    updated_at: datetime


class EquipmentPage(APIModel):
    items: list[EquipmentResponse]
    page: int
    page_size: int
    total: int
    pages: int

    @classmethod
    def make(cls, items: list[EquipmentResponse], page: int, page_size: int, total: int) -> "EquipmentPage":
        return cls(items=items, page=page, page_size=page_size, total=total, pages=ceil(total / page_size) if total else 0)


HistoryEventType = Literal["maintenance", "failure", "alert", "metric", "field_observation"]


class EquipmentHistoryEvent(APIModel):
    id: str
    event_type: HistoryEventType
    occurred_at: datetime
    title: str
    description: str
    severity: str | None
    status: str | None = None
    metadata: dict[str, Any]

    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
        json_schema_extra={
            "examples": [
                {
                    "id": "obs-001",
                    "event_type": "field_observation",
                    "occurred_at": "2026-11-26T10:30:00Z",
                    "title": "inspection",
                    "description": "Slight vibration observed near the pump coupling.",
                    "severity": "medium",
                    "status": "submitted",
                    "metadata": {
                        "reporter_id": "user-001",
                        "category": "inspection",
                        "severity": "medium",
                        "note": "Slight vibration observed near the pump coupling.",
                    },
                }
            ]
        },
    )


class EquipmentHistoryPage(APIModel):
    items: list[EquipmentHistoryEvent]
    page: int
    page_size: int
    total: int
    pages: int

    @classmethod
    def make(cls, items: list[EquipmentHistoryEvent], page: int, page_size: int, total: int) -> "EquipmentHistoryPage":
        return cls(items=items, page=page, page_size=page_size, total=total, pages=ceil(total / page_size) if total else 0)


class ObservationCreate(APIModel):
    equipment_id: str = Field(min_length=1, max_length=128, examples=["EQ-001"])
    category: str = Field(min_length=1, max_length=80, examples=["inspection"])
    severity: ObservationSeverity = Field(examples=["medium"])
    note: str = Field(min_length=1, max_length=5000, examples=["Slight vibration observed near the pump coupling."])

    @field_validator("equipment_id", "category", "note", mode="before")
    @classmethod
    def trim_required_text(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
        if value == "":
            raise ValueError("This field cannot be blank")
        return value


class ObservationResponse(APIModel):
    id: str
    equipment_id: str
    reported_by: str
    category: str
    severity: ObservationSeverity
    note: str
    status: str
    created_at: datetime
