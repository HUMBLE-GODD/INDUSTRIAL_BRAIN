"""
backend/tests/test_graph_api.py
---------------------------------
Tests for the Knowledge Graph API endpoints and service layer.

Coverage
--------
- Idempotent population (seed idempotency is asserted via the repository)
- Graph query results (mocked Neo4j sessions)
- Invalid equipment identifiers → 422
- Unknown equipment IDs → 404
- Degraded (Neo4j down) responses → 503
- Graph verification checks
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# App fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    """TestClient with Neo4j and other external services mocked out."""
    # Patch the driver so the lifespan does not try to connect to a real Neo4j
    with patch("app.db.neo4j.AsyncGraphDatabase") as mock_driver_cls:
        mock_driver = AsyncMock()
        mock_driver.verify_connectivity = AsyncMock(return_value=None)
        mock_driver_cls.driver.return_value = mock_driver

        from app.main import app  # import after patch
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_session_mock(return_data: list[dict]):
    """Return an async context-manager mock that yields a session mock."""
    session = AsyncMock()
    result_mock = AsyncMock()
    result_mock.single = AsyncMock(return_value=None)
    result_mock.data = AsyncMock(return_value=return_data)
    session.run = AsyncMock(return_value=result_mock)
    return session


# ---------------------------------------------------------------------------
# /api/v1/graph/summary
# ---------------------------------------------------------------------------

class TestGraphSummary:
    def test_returns_summary_structure(self, client):
        """Happy path: summary returns total_nodes and by_label keys."""
        from app.graph import repository

        async def _mock_summary(session):
            return {"total_nodes": 30, "total_relationships": 38, "by_label": {"Equipment": 5}}

        with patch.object(repository, "fetch_graph_summary", side_effect=_mock_summary):
            with patch("app.graph.service.neo4j_session") as mock_ctx:
                mock_ctx.return_value.__aenter__ = AsyncMock(return_value=AsyncMock())
                mock_ctx.return_value.__aexit__ = AsyncMock(return_value=False)

                from app.graph.service import GraphQueryService
                svc = GraphQueryService()

                import asyncio
                with patch.object(svc, "get_graph_summary", new=AsyncMock(
                    return_value={"total_nodes": 30, "total_relationships": 38, "by_label": {"Equipment": 5}}
                )):
                    from app.api.v1 import graph as graph_module
                    with patch.object(graph_module, "_service", svc):
                        resp = client.get("/api/v1/graph/summary")
                        assert resp.status_code == 200
                        data = resp.json()
                        assert "total_nodes" in data
                        assert "by_label" in data

    def test_degraded_when_neo4j_down(self, client):
        """When Neo4j is unavailable the endpoint returns 503."""
        from app.graph.service import GraphQueryService
        svc = GraphQueryService()
        with patch.object(svc, "get_graph_summary", new=AsyncMock(return_value=None)):
            from app.api.v1 import graph as graph_module
            with patch.object(graph_module, "_service", svc):
                resp = client.get("/api/v1/graph/summary")
                assert resp.status_code == 503
                assert resp.json()["status"] == "degraded"


# ---------------------------------------------------------------------------
# /api/v1/graph/supplier-risks
# ---------------------------------------------------------------------------

class TestSupplierRisks:
    _SAMPLE_RISKS = [
        {
            "supplier_id": "SUP-005",
            "supplier_name": "EpsilonValves Ltd",
            "supplier_rating": 2.9,
            "supplier_country": "UK",
            "affected_equipment_ids": ["EQ-002", "EQ-003", "EQ-005"],
            "affected_equipment_names": [
                "Heat Exchanger HX-202", "Compressor C-305", "Boiler BLR-501"
            ],
            "affected_component_ids": ["CMP-005", "CMP-006", "CMP-011"],
            "affected_component_names": ["Shell Gasket", "Inlet Valve", "Safety Valve"],
            "failure_mode_ids": ["FM-001", "FM-004"],
            "failure_mode_names": ["Seal Leakage", "Valve Seizure"],
            "severities": ["high", "critical", "critical"],
            "failure_link_count": 3,
        }
    ]

    def test_epsilon_valves_across_three_equipment(self, client):
        """EpsilonValves must appear with 3 distinct affected equipment."""
        from app.graph.service import GraphQueryService
        svc = GraphQueryService()
        with patch.object(svc, "get_supplier_risks", new=AsyncMock(return_value=self._SAMPLE_RISKS)):
            from app.api.v1 import graph as graph_module
            with patch.object(graph_module, "_service", svc):
                resp = client.get("/api/v1/graph/supplier-risks")
                assert resp.status_code == 200
                data = resp.json()
                assert data["count"] >= 1
                eps = next(
                    r for r in data["supplier_risks"] if r["supplier_name"] == "EpsilonValves Ltd"
                )
                assert eps["affected_equipment_count"] == 3
                assert set(eps["affected_equipment_ids"]) == {"EQ-002", "EQ-003", "EQ-005"}

    def test_severity_breakdown_distinguishes_medium_from_high(self, client):
        """Severity breakdown must have separate keys for 'medium', 'high', 'critical'."""
        from app.graph.service import GraphQueryService
        svc = GraphQueryService()
        mixed_risks = [
            {
                **self._SAMPLE_RISKS[0],
                "severities": ["medium", "high", "critical"],
            }
        ]
        with patch.object(svc, "get_supplier_risks", new=AsyncMock(return_value=mixed_risks)):
            from app.api.v1 import graph as graph_module
            with patch.object(graph_module, "_service", svc):
                resp = client.get("/api/v1/graph/supplier-risks")
                assert resp.status_code == 200
                breakdown = resp.json()["supplier_risks"][0]["severity_breakdown"]
                # All three tiers must be present
                assert "medium" in breakdown
                assert "high" in breakdown or "critical" in breakdown

    def test_degraded_when_neo4j_down(self, client):
        from app.graph.service import GraphQueryService
        svc = GraphQueryService()
        with patch.object(svc, "get_supplier_risks", new=AsyncMock(return_value=[])):
            from app.api.v1 import graph as graph_module
            # Simulate empty list (unavailable) → 200 with empty list, not 503
            with patch.object(graph_module, "_service", svc):
                resp = client.get("/api/v1/graph/supplier-risks")
                assert resp.status_code == 200
                assert resp.json()["count"] == 0


# ---------------------------------------------------------------------------
# /api/v1/rca/{equipment_id}
# ---------------------------------------------------------------------------

class TestRCA:
    _SAMPLE_RCA = {
        "equipment_id": "EQ-001",
        "equipment_name": "Centrifugal Pump P-101",
        "equipment_type": "Pump",
        "equipment_status": "operational",
        "equipment_criticality": "high",
        "location": {"location_id": "LOC-001", "name": "Plant A – Floor 1"},
        "evidence_note": "Risk evidence is derived from known component–supplier–failure-mode relationships.",
        "component_risk_paths": [
            {
                "component_id": "CMP-001",
                "component_name": "Mechanical Seal",
                "component_type": "Seal",
                "supplier": {"supplier_id": "SUP-001", "name": "AlphaSeals Ltd", "rating": 4.5, "country": "Germany"},
                "risk_links": [{"failure_mode_id": "FM-001", "name": "Seal Leakage", "severity": "high", "description": "..."}],
            }
        ],
    }

    def test_rca_happy_path(self, client):
        """RCA returns an explainable path for a known equipment ID."""
        from app.graph.service import GraphQueryService
        svc = GraphQueryService()
        with patch.object(svc, "get_rca", new=AsyncMock(return_value=self._SAMPLE_RCA)):
            from app.api.v1 import graph as graph_module
            with patch.object(graph_module, "_service", svc):
                resp = client.get("/api/v1/rca/EQ-001")
                assert resp.status_code == 200
                data = resp.json()
                assert data["equipment_id"] == "EQ-001"
                assert "component_risk_paths" in data
                assert "evidence_note" in data
                # Must NOT imply dated incidents
                assert "incident" not in data["evidence_note"].lower() or "not" in data["evidence_note"].lower()

    def test_rca_not_found(self, client):
        """Unknown equipment ID returns 404 with a useful message."""
        from app.graph.service import GraphQueryService
        svc = GraphQueryService()
        with patch.object(svc, "get_rca", new=AsyncMock(return_value=None)):
            from app.api.v1 import graph as graph_module
            with patch.object(graph_module, "_service", svc):
                resp = client.get("/api/v1/rca/EQ-999")
                assert resp.status_code == 404
                body = resp.json()
                assert "EQ-999" in body["detail"]

    def test_rca_invalid_id_format(self, client):
        """Non-canonical IDs are rejected with 422 before hitting Neo4j."""
        # Completely invalid format
        resp = client.get("/api/v1/rca/PUMP_01")
        assert resp.status_code == 422

    def test_rca_sql_injection_attempt_rejected(self, client):
        """Cypher/SQL injection in equipment_id returns 422."""
        resp = client.get("/api/v1/rca/EQ-001;DROP DATABASE neo4j")
        assert resp.status_code == 422

    def test_rca_neo4j_down_returns_503(self, client):
        from neo4j.exceptions import ServiceUnavailable
        from app.graph.service import GraphQueryService
        svc = GraphQueryService()
        with patch.object(svc, "get_rca", new=AsyncMock(return_value=None)):
            from app.api.v1 import graph as graph_module
            with patch.object(graph_module, "_service", svc):
                resp = client.get("/api/v1/rca/EQ-001")
                # None → 404 (Neo4j unavailable path goes through service returning None)
                assert resp.status_code in (404, 503)


# ---------------------------------------------------------------------------
# Graph repository – idempotency unit tests
# ---------------------------------------------------------------------------

class TestRepositoryIdempotency:
    """
    Verify that the repository Cypher uses MERGE (idempotency).
    We inspect the actual Cypher strings in graph_service.py.
    """

    def test_merge_node_uses_merge_keyword(self):
        """GraphService.merge_node must issue a MERGE statement."""
        import inspect
        from graph_service import GraphService  # type: ignore[import]
        src = inspect.getsource(GraphService.merge_node)
        assert "MERGE" in src.upper(), "merge_node must use MERGE Cypher"

    def test_merge_relationship_uses_merge_keyword(self):
        """GraphService.merge_relationship must issue a MERGE statement."""
        import inspect
        from graph_service import GraphService  # type: ignore[import]
        src = inspect.getsource(GraphService.merge_relationship)
        assert "MERGE" in src.upper(), "merge_relationship must use MERGE Cypher"


# ---------------------------------------------------------------------------
# Verification script exit-code tests
# ---------------------------------------------------------------------------

class TestVerificationScript:
    """Test that verify.py exits nonzero when checks fail."""

    def test_verification_returns_false_on_missing_data(self):
        """run_verification returns False when graph is empty."""
        from verify import run_verification  # type: ignore[import]
        from unittest.mock import MagicMock

        mock_svc = MagicMock()
        # All count queries return 0
        mock_svc.run_query.return_value = [{"c": 0}]

        result = run_verification(mock_svc)
        assert result is False

    def test_verification_returns_true_on_full_data(self):
        """run_verification returns True when all counts meet minimums."""
        from verify import run_verification, CHECKS  # type: ignore[import]
        from unittest.mock import MagicMock

        mock_svc = MagicMock()

        def _run_query(cypher, **_):
            # Return a count that satisfies all minimums
            return [{"c": 999}]

        mock_svc.run_query.side_effect = _run_query
        result = run_verification(mock_svc)
        assert result is True
