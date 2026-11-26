"""Canonical PostgreSQL demo data shared with the Neo4j graph seed."""

from datetime import datetime, timedelta, timezone
import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    ComplianceChecklist,
    ComplianceStatus,
    Equipment,
    EquipmentMetric,
    Failure,
    FieldObservation,
    MaintenanceRecord,
    MaintenanceStatus,
    Supplier,
    Technician,
    User,
    UserRole,
)
from app.core.security import hash_password


DEMO_EQUIPMENT = (
    {
        "id": "EQ-001",
        "name": "Centrifugal Pump P-101",
        "type": "Pump",
        "model": "CP-3500X",
        "manufacturer": "FlowTech",
        "status": "operational",
        "install_date": datetime(2020, 3, 15, tzinfo=timezone.utc),
        "criticality": "high",
        "location": "Plant A — Floor 1",
    },
    {
        "id": "EQ-002",
        "name": "Heat Exchanger HX-202",
        "type": "Heat Exchanger",
        "model": "HX-2000",
        "manufacturer": "ThermoCore",
        "status": "operational",
        "install_date": datetime(2019, 7, 22, tzinfo=timezone.utc),
        "criticality": "medium",
        "location": "Plant A — Floor 1",
    },
    {
        "id": "EQ-003",
        "name": "Compressor C-305",
        "type": "Compressor",
        "model": "RC-750",
        "manufacturer": "AirForce Industrial",
        "status": "maintenance",
        "install_date": datetime(2021, 1, 10, tzinfo=timezone.utc),
        "criticality": "high",
        "location": "Plant A — Floor 2",
    },
    {
        "id": "EQ-004",
        "name": "Conveyor Belt CB-410",
        "type": "Conveyor",
        "model": "CB-MAX",
        "manufacturer": "BeltMaster",
        "status": "operational",
        "install_date": datetime(2018, 11, 3, tzinfo=timezone.utc),
        "criticality": "low",
        "location": "Plant B — Outdoor",
    },
    {
        "id": "EQ-005",
        "name": "Boiler BLR-501",
        "type": "Boiler",
        "model": "SB-1200",
        "manufacturer": "SteamPro",
        "status": "operational",
        "install_date": datetime(2017, 6, 18, tzinfo=timezone.utc),
        "criticality": "critical",
        "location": "Plant A — Floor 2",
    },
)

DEMO_MAINTENANCE = (
    {
        "id": "DEMO-MAINT-001",
        "equipment_id": "EQ-001",
        "type": "preventive",
        "description": "Quarterly pump inspection and seal condition check.",
        "date": datetime(2025, 9, 12, 9, 0, tzinfo=timezone.utc),
        "status": MaintenanceStatus.COMPLETED,
        "duration_hours": 2.0,
        "cost": 240.0,
    },
    {
        "id": "DEMO-MAINT-002",
        "equipment_id": "EQ-002",
        "type": "preventive",
        "description": "Tube bundle inspection and heat-transfer performance review.",
        "date": datetime(2025, 10, 2, 10, 30, tzinfo=timezone.utc),
        "status": MaintenanceStatus.COMPLETED,
        "duration_hours": 3.5,
        "cost": 510.0,
    },
    {
        "id": "DEMO-MAINT-003",
        "equipment_id": "EQ-003",
        "type": "corrective",
        "description": "Investigate compressor inlet valve vibration.",
        "date": datetime(2025, 11, 5, 8, 0, tzinfo=timezone.utc),
        "status": MaintenanceStatus.IN_PROGRESS,
        "duration_hours": 1.0,
        "cost": 0.0,
    },
    {
        "id": "DEMO-MAINT-004",
        "equipment_id": "EQ-005",
        "type": "preventive",
        "description": "Boiler safety relief valve functional inspection.",
        "date": datetime(2025, 11, 10, 13, 0, tzinfo=timezone.utc),
        "status": MaintenanceStatus.PENDING,
        "duration_hours": 1.5,
        "cost": 180.0,
    },
)

DEMO_FAILURES = (
    {
        "id": "DEMO-FAIL-001",
        "equipment_id": "EQ-001",
        "component": "Mechanical seal assembly",
        "failure_mode": "Seal leakage",
        "root_cause": "Wear near the end of the expected service interval.",
        "timestamp": datetime(2025, 7, 20, 8, 0, tzinfo=timezone.utc),
        "downtime_hours": 5.0,
    },
    {
        "id": "DEMO-FAIL-002",
        "equipment_id": "EQ-003",
        "component": "Compressor inlet valve",
        "failure_mode": "Valve sticking",
        "root_cause": "Debris buildup during operation.",
        "timestamp": datetime(2025, 10, 18, 11, 30, tzinfo=timezone.utc),
        "downtime_hours": 3.0,
    },
)

DEMO_COMPLIANCE = (
    {
        "id": "DEMO-COMP-001",
        "equipment_id": "EQ-001",
        "regulation_name": "ISO 45001",
        "status": ComplianceStatus.PENDING_AUDIT,
        "last_audit_date": datetime(2024, 11, 1, tzinfo=timezone.utc),
        "due_date": datetime(2026, 6, 1, tzinfo=timezone.utc),
        "gaps": "Pump seal inspection record is missing from the audit packet.",
    },
    {
        "id": "DEMO-COMP-002",
        "equipment_id": "EQ-003",
        "regulation_name": "OSHA 1910",
        "status": ComplianceStatus.NON_COMPLIANT,
        "last_audit_date": datetime(2025, 10, 31, tzinfo=timezone.utc),
        "due_date": datetime(2026, 10, 31, tzinfo=timezone.utc),
        "gaps": "Compressor emergency-stop inspection was not recorded.",
    },
    {
        "id": "DEMO-COMP-003",
        "equipment_id": "EQ-005",
        "regulation_name": "Boiler Safety Inspection",
        "status": ComplianceStatus.COMPLIANT,
        "last_audit_date": datetime(2026, 2, 15, tzinfo=timezone.utc),
        "due_date": datetime(2027, 2, 15, tzinfo=timezone.utc),
        "gaps": None,
    },
)

# Factory scenario uses its own ID range so repeat seeding never touches the
# original Plant A / Plant B records above.
DEMO_EQUIPMENT += (
    {
        "id": "EQ-101",
        "name": "Demo Factory Centrifugal Pump P-102",
        "type": "Pump",
        "model": "RDX-420",
        "manufacturer": "RotorSafe Systems",
        "status": "operational",
        "install_date": datetime(2022, 5, 12, tzinfo=timezone.utc),
        "criticality": "high",
        "location": "Demo Factory — Utilities Bay",
    },
    {
        "id": "EQ-102",
        "name": "Process Mixer MX-220",
        "type": "Mixer",
        "model": "MX-2200",
        "manufacturer": "ThermalCore Industries",
        "status": "operational",
        "install_date": datetime(2023, 2, 8, tzinfo=timezone.utc),
        "criticality": "medium",
        "location": "Demo Factory — Process Hall",
    },
    {
        "id": "EQ-103",
        "name": "Packaging Conveyor CV-330",
        "type": "Conveyor",
        "model": "FlexLine 330",
        "manufacturer": "MotionGuard Industrial",
        "status": "maintenance",
        "install_date": datetime(2021, 9, 20, tzinfo=timezone.utc),
        "criticality": "high",
        "location": "Demo Factory — Packaging Line",
    },
)

DEMO_FACTORY_SUPPLIERS = (
    {
        "id": "SUP-006",
        "name": "RotorSafe Drives",
        "contact": "service@rotorsafe.example.invalid",
        "quality_rating": 3.4,
        "lead_time_days": 14,
    },
    {
        "id": "SUP-007",
        "name": "SealWorks Midlands",
        "contact": "support@sealworks.example.invalid",
        "quality_rating": 4.3,
        "lead_time_days": 8,
    },
    {
        "id": "SUP-008",
        "name": "MotionGuard Components",
        "contact": "field@motionguard.example.invalid",
        "quality_rating": 3.8,
        "lead_time_days": 18,
    },
)

DEMO_FACTORY_TECHNICIANS = (
    {"id": "DEMO-TECH-101", "name": "Priya Nair", "specialization": "Rotating equipment", "years_experience": 9},
    {"id": "DEMO-TECH-102", "name": "Arjun Mehta", "specialization": "Process machinery", "years_experience": 12},
    {"id": "DEMO-TECH-103", "name": "Kavya Rao", "specialization": "Conveyors and machine guarding", "years_experience": 7},
)

DEMO_MAINTENANCE += (
    {
        "id": "DEMO-MAINT-101", "equipment_id": "EQ-101", "technician_id": "DEMO-TECH-101",
        "type": "preventive", "description": "Factory commissioning follow-up: check coupling alignment and lubrication condition.",
        "date": datetime(2026, 2, 10, 8, 0, tzinfo=timezone.utc), "status": MaintenanceStatus.COMPLETED,
        "parts_used": "ISO VG 46 lubricant", "duration_hours": 2.5, "cost": 325.0,
    },
    {
        "id": "DEMO-MAINT-102", "equipment_id": "EQ-101", "technician_id": "DEMO-TECH-101",
        "type": "corrective", "description": "Re-align pump and motor coupling after elevated vibration trend.",
        "date": datetime(2026, 3, 15, 10, 30, tzinfo=timezone.utc), "status": MaintenanceStatus.COMPLETED,
        "parts_used": "Flexible coupling insert", "duration_hours": 4.0, "cost": 875.0,
    },
    {
        "id": "DEMO-MAINT-103", "equipment_id": "EQ-101", "technician_id": "DEMO-TECH-101",
        "type": "corrective", "description": "Replace process-side mechanical seal and verify pressure hold.",
        "date": datetime(2026, 10, 5, 7, 0, tzinfo=timezone.utc), "status": MaintenanceStatus.COMPLETED,
        "parts_used": "Seal kit RS-42", "duration_hours": 5.5, "cost": 1420.0,
    },
    {
        "id": "DEMO-MAINT-104", "equipment_id": "EQ-102", "technician_id": "DEMO-TECH-102",
        "type": "preventive", "description": "Quarterly mixer inspection; sample gearbox oil and confirm agitator clearance.",
        "date": datetime(2026, 2, 25, 9, 0, tzinfo=timezone.utc), "status": MaintenanceStatus.COMPLETED,
        "parts_used": "Oil sample kit", "duration_hours": 2.0, "cost": 290.0,
    },
    {
        "id": "DEMO-MAINT-105", "equipment_id": "EQ-102", "technician_id": "DEMO-TECH-102",
        "type": "corrective", "description": "Flush gearbox oil circuit and replace the inlet filter after temperature excursion.",
        "date": datetime(2026, 4, 16, 8, 30, tzinfo=timezone.utc), "status": MaintenanceStatus.COMPLETED,
        "parts_used": "Gearbox filter GF-18; synthetic gear oil", "duration_hours": 6.0, "cost": 1180.0,
    },
    {
        "id": "DEMO-MAINT-106", "equipment_id": "EQ-102", "technician_id": "DEMO-TECH-102",
        "type": "preventive", "description": "Inspect agitator seal and verify mixer current under a standard batch load.",
        "date": datetime(2026, 9, 15, 11, 0, tzinfo=timezone.utc), "status": MaintenanceStatus.COMPLETED,
        "parts_used": "Seal inspection kit", "duration_hours": 2.5, "cost": 410.0,
    },
    {
        "id": "DEMO-MAINT-107", "equipment_id": "EQ-103", "technician_id": "DEMO-TECH-103",
        "type": "preventive", "description": "Inspect belt tracking, drive guards, and emergency-stop circuit.",
        "date": datetime(2026, 1, 12, 7, 30, tzinfo=timezone.utc), "status": MaintenanceStatus.COMPLETED,
        "parts_used": "None", "duration_hours": 1.5, "cost": 185.0,
    },
    {
        "id": "DEMO-MAINT-108", "equipment_id": "EQ-103", "technician_id": "DEMO-TECH-103",
        "type": "corrective", "description": "Replace conveyor motor terminal lug and re-test insulation resistance.",
        "date": datetime(2026, 5, 22, 9, 30, tzinfo=timezone.utc), "status": MaintenanceStatus.COMPLETED,
        "parts_used": "Terminal lug kit TG-8", "duration_hours": 3.0, "cost": 540.0,
    },
    {
        "id": "DEMO-MAINT-109", "equipment_id": "EQ-103", "technician_id": "DEMO-TECH-103",
        "type": "corrective", "description": "Restore guard-switch interlock and complete a witnessed functional test before restart.",
        "date": datetime(2026, 11, 18, 8, 0, tzinfo=timezone.utc), "status": MaintenanceStatus.IN_PROGRESS,
        "parts_used": "Guard switch MG-12", "duration_hours": 1.0, "cost": 0.0,
    },
)

DEMO_FAILURES += (
    {"id": "DEMO-FAIL-101", "equipment_id": "EQ-101", "component": "Drive coupling", "failure_mode": "Coupling vibration above baseline", "root_cause": "A minor soft-foot condition shifted alignment during the first production run.", "timestamp": datetime(2026, 3, 14, 6, 20, tzinfo=timezone.utc), "downtime_hours": 4.5, "supplier_of_failed_part": "SUP-006"},
    {"id": "DEMO-FAIL-102", "equipment_id": "EQ-101", "component": "Mechanical seal", "failure_mode": "Seal leakage", "root_cause": "Abrasive process carryover accelerated seal-face wear.", "timestamp": datetime(2026, 10, 3, 13, 10, tzinfo=timezone.utc), "downtime_hours": 6.0, "supplier_of_failed_part": "SUP-007"},
    {"id": "DEMO-FAIL-103", "equipment_id": "EQ-102", "component": "Mixer gearbox", "failure_mode": "Gearbox oil temperature high", "root_cause": "Restricted return filter reduced oil flow under a high-viscosity batch load.", "timestamp": datetime(2026, 4, 15, 14, 0, tzinfo=timezone.utc), "downtime_hours": 7.0, "supplier_of_failed_part": "SUP-006"},
    {"id": "DEMO-FAIL-104", "equipment_id": "EQ-102", "component": "Agitator shaft seal", "failure_mode": "Process-side seal seepage", "root_cause": "Seal elastomer hardened after repeated hot-cleaning cycles.", "timestamp": datetime(2026, 9, 10, 5, 45, tzinfo=timezone.utc), "downtime_hours": 3.5, "supplier_of_failed_part": "SUP-007"},
    {"id": "DEMO-FAIL-105", "equipment_id": "EQ-103", "component": "Conveyor drive motor", "failure_mode": "Motor insulation resistance low", "root_cause": "Moisture entered the terminal enclosure after a washdown.", "timestamp": datetime(2026, 5, 21, 16, 25, tzinfo=timezone.utc), "downtime_hours": 2.0, "supplier_of_failed_part": "SUP-008"},
    {"id": "DEMO-FAIL-106", "equipment_id": "EQ-103", "component": "Guard interlock switch", "failure_mode": "Guard interlock failed functional test", "root_cause": "Switch actuator drifted out of alignment after repeated guard-door cycles.", "timestamp": datetime(2026, 11, 17, 9, 5, tzinfo=timezone.utc), "downtime_hours": 1.5, "supplier_of_failed_part": "SUP-008"},
)

DEMO_COMPLIANCE += (
    {"id": "DEMO-COMP-101", "equipment_id": "EQ-101", "regulation_name": "ISO 45001 — Rotating Equipment", "status": ComplianceStatus.PENDING_AUDIT, "last_audit_date": datetime(2026, 3, 1, tzinfo=timezone.utc), "due_date": datetime(2026, 12, 1, tzinfo=timezone.utc), "gaps": "QA sign-off for the post-alignment vibration baseline is pending."},
    {"id": "DEMO-COMP-102", "equipment_id": "EQ-101", "regulation_name": "OSHA 1910.147 — Lockout/Tagout", "status": ComplianceStatus.COMPLIANT, "last_audit_date": datetime(2026, 1, 15, tzinfo=timezone.utc), "due_date": datetime(2027, 1, 15, tzinfo=timezone.utc), "gaps": None},
    {"id": "DEMO-COMP-103", "equipment_id": "EQ-102", "regulation_name": "ISO 9001 — Batch Equipment Calibration", "status": ComplianceStatus.COMPLIANT, "last_audit_date": datetime(2026, 2, 2, tzinfo=timezone.utc), "due_date": datetime(2027, 2, 2, tzinfo=timezone.utc), "gaps": None},
    {"id": "DEMO-COMP-104", "equipment_id": "EQ-102", "regulation_name": "Factory Process Safety Review", "status": ComplianceStatus.PENDING_AUDIT, "last_audit_date": datetime(2026, 8, 15, tzinfo=timezone.utc), "due_date": datetime(2027, 2, 15, tzinfo=timezone.utc), "gaps": "Attach the mixer gearbox oil-analysis report to the next review packet."},
    {"id": "DEMO-COMP-105", "equipment_id": "EQ-103", "regulation_name": "Machine Guarding Standard", "status": ComplianceStatus.NON_COMPLIANT, "last_audit_date": datetime(2026, 11, 17, tzinfo=timezone.utc), "due_date": datetime(2026, 11, 17, tzinfo=timezone.utc), "gaps": "Guard-switch functional test failed; keep the conveyor isolated until the repair is witnessed."},
    {"id": "DEMO-COMP-106", "equipment_id": "EQ-103", "regulation_name": "OSHA 1910.147 — Lockout/Tagout", "status": ComplianceStatus.PENDING_AUDIT, "last_audit_date": datetime(2026, 1, 12, tzinfo=timezone.utc), "due_date": datetime(2026, 12, 15, tzinfo=timezone.utc), "gaps": "Attach the signed isolation verification sheet for the current guard-switch work order."},
)

def _build_factory_metric_history() -> tuple[dict, ...]:
    """Create three fixed 30-day daily series around seeded maintenance events."""
    rows: list[dict] = []
    for day in range(30):
        # EQ-101's October seal event peaks on 10/2 and is stable after 10/5.
        timestamp = datetime(2026, 10, 1, 6, 0, tzinfo=timezone.utc) + timedelta(days=day)
        if day == 1:
            vibration, bearing_temp, pressure, anomaly = 5.7, 78.0, 4.9, 0.64
        elif day == 2:
            vibration, bearing_temp, pressure, anomaly = 7.4, 82.0, 4.7, 0.91
        elif day < 4:
            vibration, bearing_temp, pressure, anomaly = 3.1 + 0.12 * day, 69.0 + day, 4.8, 0.34 + 0.04 * day
        else:
            vibration, bearing_temp, pressure, anomaly = 2.2 + (day % 4) * 0.1, 61.0 + (day % 3), 5.0 + (day % 3) * 0.05, 0.07 + (day % 5) * 0.02
        rows.append({
            "id": f"DEMO-METRIC-101-{day + 1:02}",
            "equipment_id": "EQ-101",
            "timestamp": timestamp,
            "sensor_data": {"vibration_mm_s": round(vibration, 2), "bearing_temp_c": round(bearing_temp, 1), "discharge_pressure_bar": round(pressure, 2)},
            "anomaly_score": round(anomaly, 2),
        })

        # EQ-102 peaks on 4/14, fails on 4/15, then returns to baseline after service.
        timestamp = datetime(2026, 4, 1, 6, 0, tzinfo=timezone.utc) + timedelta(days=day)
        if day == 13:
            gearbox_temp, motor_current, vibration, anomaly = 93.0, 15.4, 3.6, 0.88
        elif day == 14:
            gearbox_temp, motor_current, vibration, anomaly = 89.0, 14.9, 3.3, 0.82
        elif day == 15:
            gearbox_temp, motor_current, vibration, anomaly = 77.0, 13.2, 2.8, 0.55
        elif day < 13:
            gearbox_temp = 58.0 + (day % 4) * 1.3 + max(0, day - 8) * 1.1
            motor_current, vibration, anomaly = 11.1 + (day % 3) * 0.2, 1.8 + (day % 4) * 0.1, 0.08 + (day % 5) * 0.03
        else:
            gearbox_temp, motor_current, vibration, anomaly = 59.0 + (day % 4), 11.2 + (day % 3) * 0.2, 1.8 + (day % 3) * 0.1, 0.08 + (day % 5) * 0.02
        rows.append({
            "id": f"DEMO-METRIC-102-{day + 1:02}",
            "equipment_id": "EQ-102",
            "timestamp": timestamp,
            "sensor_data": {"gearbox_temp_c": round(gearbox_temp, 1), "motor_current_a": round(motor_current, 2), "vibration_mm_s": round(vibration, 2)},
            "anomaly_score": round(anomaly, 2),
        })

        # EQ-103 is online through 11/16; a failed guard interlock stops it on 11/17.
        timestamp = datetime(2026, 10, 28, 5, 0, tzinfo=timezone.utc) + timedelta(days=day)
        interlock_ok = day < 20
        if day == 19:
            belt_speed, motor_temp, anomaly = 1.19, 78.0, 0.67
        elif day == 20:
            belt_speed, motor_temp, anomaly = 0.0, 49.0, 0.93
        elif day > 20:
            belt_speed, motor_temp, anomaly = 0.0, 48.0 + (day % 3), 0.78 + (day % 4) * 0.04
        else:
            belt_speed, motor_temp, anomaly = 1.25 + ((day % 3) - 1) * 0.01, 54.0 + (day % 4), 0.07 + (day % 5) * 0.02
        rows.append({
            "id": f"DEMO-METRIC-103-{day + 1:02}",
            "equipment_id": "EQ-103",
            "timestamp": timestamp,
            "sensor_data": {"belt_speed_m_s": round(belt_speed, 2), "motor_temp_c": round(motor_temp, 1), "interlock_ok": interlock_ok},
            "anomaly_score": round(anomaly, 2),
        })
    return tuple(rows)


DEMO_EQUIPMENT_METRICS = _build_factory_metric_history()

DEMO_FACTORY_REPORTER_ID = "DEMO-FACTORY-REPORTER"
DEMO_FACTORY_REPORTER_EMAIL = "factory.demo.reporter@industrialbrain.local"
DEMO_FIELD_OBSERVATIONS = (
    {"id": "DEMO-OBS-101", "equipment_id": "EQ-101", "category": "vibration", "severity": "medium", "note": "Coupling-end vibration was above the normal route baseline; maintenance re-alignment followed on the next shift.", "status": "reviewed", "created_at": datetime(2026, 3, 13, 6, 10, tzinfo=timezone.utc)},
    {"id": "DEMO-OBS-102", "equipment_id": "EQ-101", "category": "leakage", "severity": "high", "note": "Seal drain showed process staining during the pre-start walkdown; pump was isolated for seal replacement.", "status": "reviewed", "created_at": datetime(2026, 10, 2, 6, 15, tzinfo=timezone.utc)},
    {"id": "DEMO-OBS-103", "equipment_id": "EQ-102", "category": "temperature", "severity": "high", "note": "Gearbox casing was unusually hot near the return filter during the high-viscosity batch.", "status": "reviewed", "created_at": datetime(2026, 4, 14, 12, 10, tzinfo=timezone.utc)},
    {"id": "DEMO-OBS-104", "equipment_id": "EQ-102", "category": "noise", "severity": "medium", "note": "Intermittent seal-side chirp noted during startup; repeat inspection requested at the next wash cycle.", "status": "reviewed", "created_at": datetime(2026, 9, 9, 6, 20, tzinfo=timezone.utc)},
    {"id": "DEMO-OBS-105", "equipment_id": "EQ-103", "category": "electrical", "severity": "medium", "note": "Drive motor terminal enclosure showed condensation after line washdown; insulation check requested.", "status": "reviewed", "created_at": datetime(2026, 5, 20, 5, 10, tzinfo=timezone.utc)},
    {"id": "DEMO-OBS-106", "equipment_id": "EQ-103", "category": "machine_guarding", "severity": "critical", "note": "Guard switch did not change state on the functional check. Conveyor remains isolated pending witnessed repair and retest.", "status": "submitted", "created_at": datetime(2026, 11, 17, 9, 0, tzinfo=timezone.utc)},
)


async def seed_demo_data(session: AsyncSession) -> None:
    """Insert or refresh the fixed demo rows without duplicating them."""
    for values in DEMO_EQUIPMENT:
        equipment_id = values["id"]
        equipment = await session.get(Equipment, equipment_id)
        if equipment is None:
            equipment = Equipment(id=equipment_id, **{key: value for key, value in values.items() if key != "id"})
            session.add(equipment)
        else:
            for key, value in values.items():
                if key != "id":
                    setattr(equipment, key, value)

    await session.flush()

    for values in DEMO_FACTORY_SUPPLIERS:
        supplier = await session.get(Supplier, values["id"])
        if supplier is None:
            supplier = Supplier(id=values["id"], **{key: value for key, value in values.items() if key != "id"})
            session.add(supplier)
        else:
            for key, value in values.items():
                if key != "id":
                    setattr(supplier, key, value)

    for values in DEMO_FACTORY_TECHNICIANS:
        technician = await session.get(Technician, values["id"])
        if technician is None:
            technician = Technician(id=values["id"], **{key: value for key, value in values.items() if key != "id"})
            session.add(technician)
        else:
            for key, value in values.items():
                if key != "id":
                    setattr(technician, key, value)

    # FieldObservation requires a user FK. This synthetic reporter has a fixed
    # identity and a randomly generated, undisclosed password so it cannot be
    # used as a demo login account.
    reporter = await session.get(User, DEMO_FACTORY_REPORTER_ID)
    if reporter is None:
        reporter = await session.scalar(
            select(User).where(User.email == DEMO_FACTORY_REPORTER_EMAIL)
        )
    if reporter is None:
        reporter = User(
            id=DEMO_FACTORY_REPORTER_ID,
            email=DEMO_FACTORY_REPORTER_EMAIL,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            role=UserRole.TECHNICIAN,
            created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            updated_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )
        session.add(reporter)

    await session.flush()

    for values in DEMO_MAINTENANCE:
        record_id = values["id"]
        record = await session.get(MaintenanceRecord, record_id)
        if record is None:
            record = MaintenanceRecord(
                id=record_id,
                **{key: value for key, value in values.items() if key != "id"},
            )
            session.add(record)
        else:
            for key, value in values.items():
                if key != "id":
                    setattr(record, key, value)

    for values in DEMO_FAILURES:
        record_id = values["id"]
        failure = await session.get(Failure, record_id)
        if failure is None:
            failure = Failure(id=record_id, **{key: value for key, value in values.items() if key != "id"})
            session.add(failure)
        else:
            for key, value in values.items():
                if key != "id":
                    setattr(failure, key, value)

    for values in DEMO_COMPLIANCE:
        record_id = values["id"]
        checklist = await session.get(ComplianceChecklist, record_id)
        if checklist is None:
            checklist = ComplianceChecklist(
                id=record_id,
                **{key: value for key, value in values.items() if key != "id"},
            )
            session.add(checklist)
        else:
            for key, value in values.items():
                if key != "id":
                    setattr(checklist, key, value)

    for values in DEMO_EQUIPMENT_METRICS:
        metric = await session.get(EquipmentMetric, values["id"])
        if metric is None:
            metric = EquipmentMetric(id=values["id"], **{key: value for key, value in values.items() if key != "id"})
            session.add(metric)
        else:
            for key, value in values.items():
                if key != "id":
                    setattr(metric, key, value)

    for values in DEMO_FIELD_OBSERVATIONS:
        observation = await session.get(FieldObservation, values["id"])
        observation_values = {**values, "reported_by": reporter.id}
        if observation is None:
            observation = FieldObservation(
                id=values["id"],
                **{key: value for key, value in observation_values.items() if key != "id"},
            )
            session.add(observation)
        else:
            for key, value in observation_values.items():
                if key != "id":
                    setattr(observation, key, value)

    await session.commit()
