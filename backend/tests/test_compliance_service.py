from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.api.v1.compliance import get_compliance_service
from app.db.session import get_db
from app.models.database import ComplianceChecklist, ComplianceStatus, Equipment
from app.services.compliance_service import ComplianceService


def _create_mock_compliance_dataset():
    now = datetime.now(timezone.utc)

    eq1 = Equipment(id="EQ-001", name="Centrifugal Pump P-101", criticality="High")
    eq2 = Equipment(id="EQ-003", name="Compressor C-305", criticality="Critical")
    eq3 = Equipment(id="EQ-004", name="Conveyor Belt CB-410", criticality="Low")

    # Item 1: Compliant
    c1 = ComplianceChecklist(
        id="CHK-1",
        equipment_id="EQ-001",
        regulation_name="ISO 14001 Environmental Management",
        status=ComplianceStatus.COMPLIANT,
        last_audit_date=now - timedelta(days=60),
        due_date=now + timedelta(days=300),
        gaps=None,
    )
    c1.equipment = eq1

    # Item 2: Non-compliant (high/critical severity)
    c2 = ComplianceChecklist(
        id="CHK-2",
        equipment_id="EQ-003",
        regulation_name="ASME Boiler and Pressure Vessel Code",
        status=ComplianceStatus.NON_COMPLIANT,
        last_audit_date=now - timedelta(days=90),
        due_date=now - timedelta(days=10),
        gaps="Emergency pressure release valve seal certificate expired",
    )
    c2.equipment = eq2

    # Item 3: Pending audit, overdue by 45 days
    c3 = ComplianceChecklist(
        id="CHK-3",
        equipment_id="EQ-001",
        regulation_name="OSHA 1910.119 Process Safety Management",
        status=ComplianceStatus.PENDING_AUDIT,
        last_audit_date=now - timedelta(days=400),
        due_date=now - timedelta(days=45),
        gaps="Audit deferred awaiting replacement gasket delivery",
    )
    c3.equipment = eq1

    return [c1, c2, c3]


@pytest.mark.asyncio
async def test_compliance_gaps_explainable_rules():
    """Verify compliance service evaluates explainable rules, risk levels, and summary totals."""
    dataset = _create_mock_compliance_dataset()
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = dataset
    mock_db.execute.return_value = mock_result

    service = ComplianceService()
    resp = await service.get_compliance_gaps(db=mock_db)

    # 3 total checked: 1 compliant, 1 non-compliant, 1 pending audit
    assert resp.summary.total_checked == 3
    assert resp.summary.compliant_count == 1
    assert resp.summary.non_compliant_count == 1
    assert resp.summary.pending_audit_count == 1

    # Gaps list contains non-compliant and pending items (c2 and c3)
    assert len(resp.gaps) == 2

    # Check non-compliant item
    asme_gap = next(g for g in resp.gaps if "ASME" in g.regulation)
    assert asme_gap.status == "non_compliant"
    assert asme_gap.risk_level == "critical"
    assert "Rule COMP-01" in asme_gap.rule_applied
    assert "Emergency pressure release valve" in asme_gap.gap_description

    # Check overdue audit item
    osha_gap = next(g for g in resp.gaps if "OSHA" in g.regulation)
    assert osha_gap.status == "pending_audit"
    assert osha_gap.days_overdue is not None
    assert osha_gap.days_overdue >= 40
    assert "Rule COMP-02" in osha_gap.rule_applied


@pytest.mark.asyncio
async def test_compliance_http_endpoint():
    """Test HTTP GET /api/v1/compliance/gaps via AsyncClient."""
    dataset = _create_mock_compliance_dataset()
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = dataset
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/v1/compliance/gaps")
            assert resp.status_code == 200
            data = resp.json()
            assert data["summary"]["total_checked"] == 3
            assert len(data["gaps"]) == 2
            assert data["method"] == "transparent_rule_based"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_compliance_unknown_equipment_returns_404():
    """Verify filtering compliance gaps by unknown equipment returns 404."""
    mock_db = AsyncMock()
    mock_eq_result = MagicMock()
    mock_eq_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_eq_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/v1/compliance/gaps?equipment_id=UNKNOWN-999")
            assert resp.status_code == 404
            assert "UNKNOWN-999" in resp.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_compliance_empty_db_returns_200():
    """Verify empty compliance repository returns 200 with zero counts."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/v1/compliance/gaps")
            assert resp.status_code == 200
            data = resp.json()
            assert data["gaps"] == []
            assert data["summary"]["total_checked"] == 0
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_compliance_db_error_returns_503():
    """Verify database connection failure returns 503."""
    mock_db = AsyncMock()
    mock_db.execute.side_effect = ConnectionError("PostgreSQL pool exhausted")

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.get("/api/v1/compliance/gaps")
            assert resp.status_code == 503
            assert "could not access the database" in resp.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)
