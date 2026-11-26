from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import Equipment, Failure, MaintenanceRecord
from app.schemas.maintenance import MaintenancePrediction, MaintenancePredictionResponse

logger = logging.getLogger(__name__)


class EquipmentNotFoundError(Exception):
    """Raised when a specifically requested equipment_id does not exist."""
    pass


class MaintenanceService:
    """Heuristic rule-based predictive maintenance analysis for demo industrial equipment."""

    async def get_predictions(
        self,
        db: AsyncSession,
        equipment_id: Optional[str] = None,
    ) -> MaintenancePredictionResponse:
        now = datetime.now(timezone.utc)

        # Build query loading relationships
        query = select(Equipment).options(
            selectinload(Equipment.failures),
            selectinload(Equipment.maintenance_records),
        )

        if equipment_id:
            query = query.where(Equipment.id == equipment_id)

        try:
            result = await db.execute(query)
            equipment_list = list(result.scalars().all())
        except Exception as e:
            logger.error("Failed querying database for maintenance records: %s", type(e).__name__)
            raise

        if equipment_id and not equipment_list:
            raise EquipmentNotFoundError(f"Equipment with ID '{equipment_id}' was not found.")

        if not equipment_list:
            return MaintenancePredictionResponse(
                predictions=[],
                total_equipment=0,
                generated_at=now.isoformat(),
                method="transparent_heuristic_rules",
                note="No equipment records found in the database. Evaluation returned empty.",
            )

        predictions: list[MaintenancePrediction] = []

        for eq in equipment_list:
            factors: list[str] = []
            applied_rules: list[str] = []
            risk_score = 0  # 0: Low, 1: Medium, 2: High, >=3: Critical

            # 1. Criticality evaluation
            crit = (eq.criticality or "Medium").lower()
            if crit in ["critical", "high"]:
                risk_score += 1
                factors.append(f"Asset criticality is classified as '{eq.criticality}'")
                applied_rules.append("Rule CRIT-01: Elevated baseline risk for high/critical production assets")

            # 2. Asset Age evaluation
            if eq.install_date:
                install_dt = eq.install_date
                if install_dt.tzinfo is None:
                    install_dt = install_dt.replace(tzinfo=timezone.utc)
                age_days = (now - install_dt).days
                if age_days > 1825:  # > 5 years
                    risk_score += 1
                    years = round(age_days / 365.25, 1)
                    factors.append(f"Operating age exceeds 5 years ({years} years in service)")
                    applied_rules.append("Rule AGE-01: Increased component wear factor for equipment in service > 5 years")

            # 3. Failure record evaluation
            failure_count = len(eq.failures) if eq.failures else 0
            if failure_count >= 2:
                risk_score += 2
                f_modes = [f.failure_mode for f in eq.failures if f.failure_mode]
                factors.append(f"Multiple recorded failure events ({failure_count} total): {', '.join(f_modes)}")
                applied_rules.append("Rule FAIL-01: Repeated failure mode occurrence triggers high-risk threshold")
            elif failure_count == 1:
                risk_score += 1
                factors.append(f"1 past failure event recorded ({eq.failures[0].failure_mode})")
                applied_rules.append("Rule FAIL-02: Single failure event increases monitoring requirement")

            # 4. Maintenance record recency evaluation
            if eq.maintenance_records:
                sorted_records = sorted(
                    eq.maintenance_records,
                    key=lambda r: r.date if r.date is not None else datetime.min.replace(tzinfo=timezone.utc),
                    reverse=True,
                )
                last_maint = sorted_records[0].date
                if last_maint:
                    if last_maint.tzinfo is None:
                        last_maint = last_maint.replace(tzinfo=timezone.utc)
                    days_since_maint = (now - last_maint).days
                    if days_since_maint > 180:
                        risk_score += 1
                        factors.append(f"Overdue for scheduled servicing ({days_since_maint} days since last maintenance)")
                        applied_rules.append("Rule MAINT-01: Exceeded 180-day preventive maintenance window")
            else:
                risk_score += 1
                factors.append("No recorded maintenance history in database")
                applied_rules.append("Rule MAINT-02: Missing maintenance service history logs")

            # Determine risk level
            if risk_score >= 3:
                risk_level = "critical" if crit == "critical" else "high"
                action = "Schedule immediate condition-based vibration and thermal diagnostic inspection."
            elif risk_score == 2:
                risk_level = "medium"
                action = "Schedule preventive servicing and visual alignment check within 14 days."
            else:
                risk_level = "low"
                action = "Continue standard operational monitoring and regular lubrication route."

            predictions.append(
                MaintenancePrediction(
                    equipment_id=eq.id,
                    equipment_name=eq.name or f"Asset {eq.id}",
                    risk_level=risk_level,
                    prediction_type="heuristic_rule_based",
                    rule_applied="; ".join(applied_rules) if applied_rules else "Rule BASE-01: Baseline operating parameters satisfied",
                    factors=factors if factors else ["Operating within standard baseline envelope"],
                    recommended_action=action,
                    next_maintenance_window="Within 7 days" if risk_score >= 3 else "Within 30 days",
                    disclaimer="Heuristic estimate based on transparent operational rules and available records. Not a trained ML model prediction.",
                )
            )

        return MaintenancePredictionResponse(
            predictions=predictions,
            total_equipment=len(predictions),
            generated_at=now.isoformat(),
            method="transparent_heuristic_rules",
            note=None,
        )
