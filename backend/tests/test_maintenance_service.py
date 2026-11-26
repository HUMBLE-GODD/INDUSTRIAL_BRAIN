from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.api.v1.dependencies import get_current_user
from app.api.v1.maintenance import get_maintenance_service
from app.db.session import get_db
from app.models.database import Equipment, Failure, MaintenanceRecord
from app.services.maintenance_service import EquipmentNotFoundError, MaintenanceService


@pytest.fixture(autouse=True)
def authenticated_api_requests():
    """Exercise maintenance behavior behind the API's required auth dependency."""
    app.dependency_overrides[get_current_user] = lambda: {"id": "test-user"}
    yield
    app.dependency_overrides.pop(get_current_user, None)


def _create_mock_equipment_dataset():
    now = datetime.now(timezone.utc)

    # EQ-001: Pump P-101 (high risk due to age > 5 years, multiple failures, overdue maintenance)
    eq1 = Equipment(
        id="EQ-001",
        name="Centrifugal Pump P-101",
        type="Pump",
        location="Plant A",
        manufacturer="FlowTech",
        install_date=now - timedelta(days=2200),
        criticality="High",
    )
    eq1.failures = [
        Failure(id="F-1", equipment_id="EQ-001", failure_mode="Bearing Overheating"),
        Failure(id="F-2", equipment_id="EQ-001", failure_mode="Mechanical Seal Leak"),
    ]
    eq1.maintenance_records = [
        MaintenanceRecord(
            id="M-1",
            equipment_id="EQ-001",
            type="preventive",
            description="Routine oil replacement",
            date=now - timedelta(days=240),
            status="completed",
        )
    ]

    # EQ-002: Heat Exchanger HX-202 (low/medium risk)
    eq2 = Equipment(
        id="EQ-002",
        name="Heat Exchanger HX-202",
        type="Heat Exchanger",
        location="Plant A",
        manufacturer="ThermoCore",
        install_date=now - timedelta(days=400),
        criticality="Medium",
    )
    eq2.failures = []
    eq2.maintenance_records = [
        MaintenanceRecord(
            id="M-2",
            equipment_id="EQ-002",
            type="preventive",
            description="Descaling inspection",
            date=now - timedelta(days=30),
            status="completed",
        )
    ]

    return [eq1, eq2]


@pytest.mark.asyncio
async def test_maintenance_predictions_heuristic_rules_and_disclaimer():
    """Verify maintenance predictions apply transparent rules and mandatory heuristic disclaimers."""
    dataset = _create_mock_equipment_dataset()
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = dataset
    mock_db.execute.return_value = mock_result

    service = MaintenanceService()
    resp = await service.get_predictions(db=mock_db)

    assert resp.total_equipment == 2
    assert resp.method == "transparent_heuristic_rules"
    assert len(resp.predictions) == 2

    # Check EQ-001 evaluation
    p1 = next(p for p in resp.predictions if p.equipment_id == "EQ-001")
    assert p1.prediction_type == "heuristic_rule_based"
    assert p1.risk_level in ["high", "critical"]
    assert "Rule AGE-01" in p1.rule_applied
    assert "Rule FAIL-01" in p1.rule_applied
    assert "Rule MAINT-01" in p1.rule_applied
    assert "Heuristic estimate based on transparent operational rules" in p1.disclaimer

    # Check EQ-002 evaluation
    p2 = next(p for p in resp.predictions if p.equipment_id == "EQ-002")
    assert p2.prediction_type == "heuristic_rule_based"
    assert p2.risk_level == "low"
    assert "Heuristic estimate based on transparent operational rules" in p2.disclaimer


@pytest.mark.asyncio
async def test_maintenance_http_endpoint_and_filtering():
    """Verify HTTP GET /api/v1/maintenance/predictions and equipment_id filtering."""
    dataset = _create_mock_equipment_dataset()
    mock_db = AsyncMock()

    async def _mock_execute(query):
        mock_result = MagicMock()
        # Check if query filters by EQ-001
        sql_str = str(query)
        if "equipment.id = :id_1" in sql_str:
            mock_result.scalars.return_value.all.return_value = [dataset[0]]
        else:
            mock_result.scalars.return_value.all.return_value = dataset
        return mock_result

    mock_db.execute = _mock_execute

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. Fetch all
            resp = await client.get("/api/v1/maintenance/predictions")
            assert resp.status_code == 200
            data = resp.json()
            assert data["total_equipment"] == 2
            assert all(p["prediction_type"] == "heuristic_rule_based" for p in data["predictions"])

            # 2. Filter by EQ-001
            resp_filter = await client.get("/api/v1/maintenance/predictions?equipment_id=EQ-001")
            assert resp_filter.status_code == 200
            filter_data = resp_filter.json()
            assert filter_data["total_equipment"] == 1
            assert filter_data["predictions"][0]["equipment_id"] == "EQ-001"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_maintenance_unknown_equipment_returns_404():
    """Verify filtering by non-existent asset returns 404 Not Found."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/v1/maintenance/predictions?equipment_id=EQ-999")
            assert resp.status_code == 404
            assert "EQ-999" in resp.json()["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_maintenance_empty_db_returns_200():
    """Verify empty database returns 200 with empty prediction list, not an error."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/v1/maintenance/predictions")
            assert resp.status_code == 200
            data = resp.json()
            assert data["total_equipment"] == 0
            assert data["predictions"] == []
            assert "No equipment records found" in data["note"]
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_maintenance_db_error_returns_503():
    """Verify database connection failure returns 503 Service Unavailable."""
    mock_db = AsyncMock()
    mock_db.execute.side_effect = ConnectionError("PostgreSQL connection refused")

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/v1/maintenance/predictions")
            assert resp.status_code == 503
            assert "could not access the database" in resp.json()["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_db, None)
