from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import ComplianceChecklist, ComplianceStatus, Equipment
from app.schemas.compliance import ComplianceGap, ComplianceGapResponse, ComplianceSummary
from app.services.maintenance_service import EquipmentNotFoundError

logger = logging.getLogger(__name__)


class ComplianceService:
    """Transparent, explainable regulatory compliance evaluation for industrial assets."""

    async def get_compliance_gaps(
        self,
        db: AsyncSession,
        equipment_id: Optional[str] = None,
    ) -> ComplianceGapResponse:
        now = datetime.now(timezone.utc)

        # If equipment_id is provided, verify equipment exists
        if equipment_id:
            eq_check = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
            if not eq_check.scalar_one_or_none():
                raise EquipmentNotFoundError(f"Equipment with ID '{equipment_id}' was not found.")

        query = select(ComplianceChecklist).options(selectinload(ComplianceChecklist.equipment))
        if equipment_id:
            query = query.where(ComplianceChecklist.equipment_id == equipment_id)

        try:
            result = await db.execute(query)
            checklists = list(result.scalars().all())
        except Exception as e:
            logger.error("Failed querying compliance checklists from database: %s", type(e).__name__)
            raise

        if not checklists:
            return ComplianceGapResponse(
                gaps=[],
                summary=ComplianceSummary(
                    total_checked=0,
                    compliant_count=0,
                    non_compliant_count=0,
                    pending_audit_count=0,
                ),
                generated_at=now.isoformat(),
                method="transparent_rule_based",
                note="No compliance checklist records found in the database.",
            )

        gaps: list[ComplianceGap] = []
        compliant_count = 0
        non_compliant_count = 0
        pending_audit_count = 0

        for item in checklists:
            status_val = item.status.value if hasattr(item.status, "value") else str(item.status)
            status_lower = status_val.lower()

            if status_lower == "compliant":
                compliant_count += 1
                continue
            elif status_lower == "non_compliant":
                non_compliant_count += 1
            else:
                pending_audit_count += 1

            eq_name = item.equipment.name if item.equipment and item.equipment.name else f"Asset {item.equipment_id}"
            crit = (item.equipment.criticality or "Medium").lower() if item.equipment else "medium"

            days_overdue: Optional[int] = None
            if item.due_date:
                due_dt = item.due_date
                if due_dt.tzinfo is None:
                    due_dt = due_dt.replace(tzinfo=timezone.utc)
                if due_dt < now:
                    days_overdue = (now - due_dt).days

            # Apply transparent compliance rules
            if status_lower == "non_compliant":
                risk_level = "critical" if crit in ["critical", "high"] else "high"
                rule = "Rule COMP-01: Asset failed regulatory standard audit criteria"
                action = (
                    f"Immediate remediation required: resolve '{item.gaps or 'unspecified deficiency'}' "
                    f"and submit re-inspection notice."
                )
            elif days_overdue is not None and days_overdue > 0:
                risk_level = "high" if days_overdue > 30 else "medium"
                rule = f"Rule COMP-02: Mandatory regulatory audit is overdue by {days_overdue} days"
                action = "Fast-track external compliance inspection and file temporary deferral form."
            elif item.last_audit_date is None:
                risk_level = "medium"
                rule = "Rule COMP-03: No historical baseline audit date on record"
                action = "Schedule initial commissioning regulatory audit with designated authority."
            else:
                risk_level = "low"
                rule = "Rule COMP-04: Routine audit pending within authorized schedule"
                action = "Assemble equipment logbooks and calibration certificates ahead of scheduled audit."

            gaps.append(
                ComplianceGap(
                    equipment_id=item.equipment_id,
                    equipment_name=eq_name,
                    regulation=item.regulation_name,
                    status=status_val,
                    gap_description=item.gaps or ("Audit overdue" if days_overdue else "Pending scheduled audit"),
                    due_date=item.due_date.isoformat() if item.due_date else None,
                    days_overdue=days_overdue,
                    risk_level=risk_level,
                    recommended_action=action,
                    rule_applied=rule,
                )
            )

        return ComplianceGapResponse(
            gaps=gaps,
            summary=ComplianceSummary(
                total_checked=len(checklists),
                compliant_count=compliant_count,
                non_compliant_count=non_compliant_count,
                pending_audit_count=pending_audit_count,
            ),
            generated_at=now.isoformat(),
            method="transparent_rule_based",
            note=None,
        )
