import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import enum

def get_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TECHNICIAN = "technician"
    MANAGER = "manager"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class Equipment(Base):
    __tablename__ = "equipment"
    
    id: Mapped[str] = mapped_column(String, primary_key=True) # E.g., 'P-101'
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    location: Mapped[str] = mapped_column(String, nullable=False)
    manufacturer: Mapped[str] = mapped_column(String, nullable=True)
    install_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    criticality: Mapped[str] = mapped_column(String, nullable=False, default="Medium")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    metrics: Mapped[List["EquipmentMetric"]] = relationship(back_populates="equipment", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship(back_populates="equipment", cascade="all, delete-orphan")
    failures: Mapped[List["Failure"]] = relationship(back_populates="equipment", cascade="all, delete-orphan")
    maintenance_records: Mapped[List["MaintenanceRecord"]] = relationship(back_populates="equipment", cascade="all, delete-orphan")
    compliance_checklists: Mapped[List["ComplianceChecklist"]] = relationship(back_populates="equipment", cascade="all, delete-orphan")

class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    title: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)

    user: Mapped[Optional["User"]] = relationship()

class EquipmentMetric(Base):
    __tablename__ = "equipment_metrics"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    equipment_id: Mapped[str] = mapped_column(String, ForeignKey("equipment.id", ondelete="CASCADE"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now, index=True)
    sensor_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    anomaly_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    equipment: Mapped["Equipment"] = relationship(back_populates="metrics")

class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    equipment_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity), default=AlertSeverity.INFO, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    equipment: Mapped[Optional["Equipment"]] = relationship(back_populates="alerts")

class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    contact: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    quality_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lead_time_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    failures: Mapped[List["Failure"]] = relationship(back_populates="supplier")

class Failure(Base):
    __tablename__ = "failures"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    equipment_id: Mapped[str] = mapped_column(String, ForeignKey("equipment.id", ondelete="CASCADE"), index=True)
    component: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    failure_mode: Mapped[str] = mapped_column(String, nullable=False)
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    downtime_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    supplier_of_failed_part: Mapped[Optional[str]] = mapped_column(String, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)

    equipment: Mapped["Equipment"] = relationship(back_populates="failures")
    supplier: Mapped[Optional["Supplier"]] = relationship(back_populates="failures")

class Technician(Base):
    __tablename__ = "technicians"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    specialization: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    maintenance_records: Mapped[List["MaintenanceRecord"]] = relationship(back_populates="technician")

class MaintenanceStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    equipment_id: Mapped[str] = mapped_column(String, ForeignKey("equipment.id", ondelete="CASCADE"), index=True)
    technician_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("technicians.id", ondelete="SET NULL"), nullable=True)
    type: Mapped[str] = mapped_column(String, nullable=False) # e.g., 'preventive', 'corrective'
    description: Mapped[Text] = mapped_column(Text, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_utc_now)
    status: Mapped[MaintenanceStatus] = mapped_column(Enum(MaintenanceStatus), default=MaintenanceStatus.PENDING, nullable=False)
    parts_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    equipment: Mapped["Equipment"] = relationship(back_populates="maintenance_records")
    technician: Mapped[Optional["Technician"]] = relationship(back_populates="maintenance_records")

class ComplianceStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING_AUDIT = "pending_audit"

class ComplianceChecklist(Base):
    __tablename__ = "compliance_checklists"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=get_uuid)
    equipment_id: Mapped[str] = mapped_column(String, ForeignKey("equipment.id", ondelete="CASCADE"), index=True)
    regulation_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[ComplianceStatus] = mapped_column(Enum(ComplianceStatus), default=ComplianceStatus.PENDING_AUDIT, nullable=False)
    last_audit_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gaps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    equipment: Mapped["Equipment"] = relationship(back_populates="compliance_checklists")
