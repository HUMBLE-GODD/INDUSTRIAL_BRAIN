from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ComplianceGap(BaseModel):
    equipment_id: str = Field(..., description="Unique equipment identifier")
    equipment_name: str = Field(..., description="Human-readable name of the equipment")
    regulation: str = Field(..., description="Name or code of the regulation evaluated")
    status: str = Field(..., description="Compliance status: 'compliant', 'non_compliant', or 'pending_audit'")
    gap_description: Optional[str] = Field(default=None, description="Specific description of the non-compliance or audit gap")
    due_date: Optional[str] = Field(default=None, description="Audit or compliance due date in ISO 8601 string format")
    days_overdue: Optional[int] = Field(default=None, description="Number of days elapsed past due date, if applicable")
    risk_level: str = Field(..., description="Assessed regulatory risk level: 'low', 'medium', 'high', or 'critical'")
    recommended_action: str = Field(..., description="Prescribed action to close or remediate this gap")
    rule_applied: str = Field(..., description="Transparent rule applied to evaluate this compliance finding")


class ComplianceSummary(BaseModel):
    total_checked: int = Field(..., ge=0, description="Total number of compliance checklist records evaluated")
    compliant_count: int = Field(..., ge=0, description="Count of compliant records")
    non_compliant_count: int = Field(..., ge=0, description="Count of non-compliant records")
    pending_audit_count: int = Field(..., ge=0, description="Count of records awaiting audit")


class ComplianceGapResponse(BaseModel):
    gaps: list[ComplianceGap] = Field(default_factory=list, description="List of identified compliance gaps and pending audits")
    summary: ComplianceSummary = Field(..., description="Aggregated summary counts across evaluated checklists")
    generated_at: str = Field(..., description="ISO 8601 UTC timestamp of gap evaluation")
    method: str = Field(default="transparent_rule_based", description="Evaluation methodology identifier")
    note: Optional[str] = Field(default=None, description="Context note regarding evaluated scope")
