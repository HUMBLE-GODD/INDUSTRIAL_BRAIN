from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class MaintenancePrediction(BaseModel):
    equipment_id: str = Field(..., description="Unique equipment identifier (e.g., EQ-001)")
    equipment_name: str = Field(..., description="Human-readable name of the equipment")
    risk_level: str = Field(..., description="Assessed risk level: 'low', 'medium', 'high', or 'critical'")
    prediction_type: str = Field(
        default="heuristic_rule_based",
        description="Explicit classification of prediction methodology: always 'heuristic_rule_based'",
    )
    rule_applied: str = Field(..., description="Detailed, transparent rule description justifying this finding")
    factors: list[str] = Field(default_factory=list, description="List of observed operational factors leading to this assessment")
    recommended_action: str = Field(..., description="Recommended maintenance intervention")
    next_maintenance_window: Optional[str] = Field(default=None, description="Suggested maintenance window or deadline")
    disclaimer: str = Field(
        default="Heuristic estimate based on transparent operational rules and available records. Not a trained ML model prediction.",
        description="Mandatory disclaimer distinguishing heuristic analysis from machine-learned models",
    )


class MaintenancePredictionResponse(BaseModel):
    predictions: list[MaintenancePrediction] = Field(default_factory=list, description="List of evaluated equipment predictions")
    total_equipment: int = Field(..., ge=0, description="Total number of evaluated equipment records")
    generated_at: str = Field(..., description="ISO 8601 UTC timestamp of prediction generation")
    method: str = Field(default="transparent_heuristic_rules", description="Methodology identifier")
    note: Optional[str] = Field(default=None, description="Additional context or notification regarding dataset completeness")
