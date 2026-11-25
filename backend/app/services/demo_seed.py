"""Canonical PostgreSQL demo data shared with the Neo4j graph seed."""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Equipment, MaintenanceRecord, MaintenanceStatus


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

    await session.commit()
