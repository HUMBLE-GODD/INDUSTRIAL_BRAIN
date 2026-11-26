from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import MagicMock

from app.main import app
from app.api.v1.dependencies import get_current_user
from app.api.v1.query import get_query_service
from app.schemas.query import Citation, GraphEvidence, QueryRequest
from app.services.llm_service import LLMService
from app.services.query_service import QueryService
from app.services.vector_search_adapter import (
    QdrantVectorSearchAdapter,
    VectorServiceUnavailableError,
)
from app.services.graph_evidence_adapter import GraphServiceUnavailableError
from tests.fakes.fake_graph import FakeGraphEvidence
from tests.fakes.fake_llm import FakeLLMService
from tests.fakes.fake_vector import FakeVectorSearch


@pytest.fixture(autouse=True)
def authenticated_api_requests():
    """Exercise query behavior behind the API's required auth dependency."""
    app.dependency_overrides[get_current_user] = lambda: {"id": "test-user"}
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_query_service_seeded_demo_question():
    """Verify the supervisor demo question returns citations, graph evidence, and risk-framed answer."""
    fake_vector = FakeVectorSearch()
    fake_graph = FakeGraphEvidence()
    fake_llm = FakeLLMService()

    service = QueryService(
        vector_adapter=fake_vector,
        graph_adapter=fake_graph,
        llm_service=fake_llm,
    )

    request = QueryRequest(
        question="Which supplier provides components linked to high or critical failure risks across several assets, and what evidence supports that?",
        top_k=3,
        include_graph_evidence=True,
    )

    response = await service.execute_query(request)

    assert response.question == request.question
    assert response.source_mode == "gemini"
    assert response.processing_time_ms >= 0

    # 1. Citations check
    assert len(response.citations) > 0
    first_cit = response.citations[0]
    assert first_cit.document_id == "DOC-DEMO-001"
    assert "EpsilonValves" in first_cit.excerpt
    assert first_cit.chunk_id == "CHUNK-DEMO-P101-01"
    assert first_cit.page == "14"

    # 2. Graph evidence check
    assert len(response.graph_evidence) > 0
    ge = response.graph_evidence[0]
    assert ge.supplier == "EpsilonValves Ltd"
    assert ge.rating == 2.9
    assert len(ge.affected_equipment) >= 3
    assert "Heat Exchanger HX-202" in ge.affected_equipment
    assert "Compressor C-305" in ge.affected_equipment

    # Assert failure modes distinguish critical and high
    severities = {fm["severity"] for fm in ge.failure_modes}
    assert "critical" in severities
    assert "high" in severities

    # 3. Recommendations separation
    assert len(response.recommendations) > 0
    assert isinstance(response.recommendations, list)

    # 4. Retrieved facts check
    assert len(response.retrieved_facts) > 0


@pytest.mark.asyncio
async def test_query_endpoint_http_happy_path():
    """Test POST /api/v1/query HTTP endpoint via AsyncClient."""
    fake_vector = FakeVectorSearch()
    fake_graph = FakeGraphEvidence()
    fake_llm = FakeLLMService()

    service = QueryService(
        vector_adapter=fake_vector,
        graph_adapter=fake_graph,
        llm_service=fake_llm,
    )

    app.dependency_overrides[get_query_service] = lambda: service

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/api/v1/query",
                json={
                    "question": "Which supplier parts present critical failure risks?",
                    "top_k": 2,
                    "include_graph_evidence": True,
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "answer" in data
            assert len(data["citations"]) == 2
            assert len(data["graph_evidence"]) == 1
            assert data["graph_evidence"][0]["supplier"] == "EpsilonValves Ltd"
            assert data["source_mode"] == "gemini"
    finally:
        app.dependency_overrides.pop(get_query_service, None)


@pytest.mark.asyncio
async def test_query_endpoint_invalid_input():
    """Verify HTTP 422 Unprocessable Entity when question is too short or empty."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Empty string
        resp1 = await client.post("/api/v1/query", json={"question": ""})
        assert resp1.status_code == 422

        # Only whitespace
        resp2 = await client.post("/api/v1/query", json={"question": "   "})
        assert resp2.status_code == 422

        # Invalid top_k
        resp3 = await client.post("/api/v1/query", json={"question": "Valid query", "top_k": 0})
        assert resp3.status_code == 422


@pytest.mark.asyncio
async def test_query_endpoint_vector_unavailable_503():
    """Correction 1: Distinguish infrastructure unavailability from empty results by returning 503."""
    failing_vector = FakeVectorSearch(raise_error=VectorServiceUnavailableError("Qdrant host connection refused"))
    service = QueryService(vector_adapter=failing_vector, graph_adapter=FakeGraphEvidence(), llm_service=FakeLLMService())

    app.dependency_overrides[get_query_service] = lambda: service
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post("/api/v1/query", json={"question": "Checking pump cavitation limits"})
            assert resp.status_code == 503
            assert "Vector retrieval service is unavailable" in resp.json()["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_query_service, None)


@pytest.mark.asyncio
async def test_query_endpoint_graph_unavailable_503():
    """Correction 1: Neo4j connection failure returns 503."""
    failing_graph = FakeGraphEvidence(raise_error=GraphServiceUnavailableError("Neo4j Bolt driver timeout"))
    service = QueryService(vector_adapter=FakeVectorSearch(), graph_adapter=failing_graph, llm_service=FakeLLMService())

    app.dependency_overrides[get_query_service] = lambda: service
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post(
                "/api/v1/query",
                json={"question": "Which supplier components are high risk?", "include_graph_evidence": True},
            )
            assert resp.status_code == 503
            assert "Knowledge graph service is unavailable" in resp.json()["error"]["message"]
    finally:
        app.dependency_overrides.pop(get_query_service, None)


@pytest.mark.asyncio
async def test_query_empty_retrieval_returns_200():
    """Verify empty retrieval returns 200 with empty citation array and clear message, not a failure."""
    empty_vector = FakeVectorSearch(citations=[])
    empty_graph = FakeGraphEvidence(evidence=[])
    service = QueryService(vector_adapter=empty_vector, graph_adapter=empty_graph, llm_service=LLMService(gemini_api_key="", groq_api_key=""))

    app.dependency_overrides[get_query_service] = lambda: service
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            resp = await client.post("/api/v1/query", json={"question": "Unrelated non-industrial inquiry?"})
            assert resp.status_code == 200
            data = resp.json()
            assert data["citations"] == []
            assert data["graph_evidence"] == []
            assert "No relevant document citations" in data["answer"]
    finally:
        app.dependency_overrides.pop(get_query_service, None)


@pytest.mark.asyncio
async def test_citation_provenance_preserves_metadata_and_rejects_missing_fields():
    """Correction 2: Incomplete citation fields are not masked by synthetic 'unknown' strings."""
    mock_vector_svc = MagicMock()
    mock_embed_svc = MagicMock()
    mock_embed_svc.embed_query.return_value = [0.1] * 768

    # Create 3 points: 1 complete, 1 missing document_id, 1 missing text
    point_complete = MagicMock()
    point_complete.id = "p-1"
    point_complete.score = 0.95
    point_complete.payload = {
        "document_id": "DOC-99",
        "title": "Safety Valves Spec",
        "chunk_id": "CHK-01",
        "text": "Valve test procedure text",
        "page": "5",
    }

    point_missing_doc = MagicMock()
    point_missing_doc.id = "p-2"
    point_missing_doc.score = 0.88
    point_missing_doc.payload = {
        "title": "Incomplete Doc",
        "chunk_id": "CHK-02",
        "text": "Some text",
    }

    point_missing_text = MagicMock()
    point_missing_text.id = "p-3"
    point_missing_text.score = 0.70
    point_missing_text.payload = {
        "document_id": "DOC-100",
        "title": "No Text Doc",
        "chunk_id": "CHK-03",
    }

    async def _mock_search(query_vector, limit):
        return [point_complete, point_missing_doc, point_missing_text]

    mock_vector_svc.search = _mock_search

    adapter = QdrantVectorSearchAdapter(
        vector_service=mock_vector_svc,
        embedding_service=mock_embed_svc,
    )

    citations = await adapter.search("valve specifications", top_k=5)

    # Exactly 1 valid citation returned; incomplete ones dropped without synthetic "unknown"
    assert len(citations) == 1
    c = citations[0]
    assert c.document_id == "DOC-99"
    assert c.title == "Safety Valves Spec"
    assert c.chunk_id == "CHK-01"
    assert c.excerpt == "Valve test procedure text"
    assert c.page == "5"


@pytest.mark.asyncio
async def test_llm_hallucinated_citation_references_filtered():
    """Correction 3: Validates generated citation references against retrieved chunk IDs."""
    service = LLMService(gemini_api_key="", groq_api_key="")

    valid_citations = [
        Citation(
            document_id="DOC-1",
            title="Manual A",
            chunk_id="VALID-CHUNK-1",
            excerpt="Proper operating range is 10 to 20 bar.",
            page="3",
        )
    ]
    valid_map = {"VALID-CHUNK-1": valid_citations[0]}

    # LLM text refers to both valid chunk and a fabricated chunk
    llm_output = (
        "Operating limits confirmed in [Chunk ID: VALID-CHUNK-1]. "
        "Also see fabricated data in [Chunk ID: HALLUCINATED-CHUNK-99]."
    )

    validated = service._validate_citations(llm_output, valid_map, valid_citations)

    # Only VALID-CHUNK-1 is retained
    assert len(validated) == 1
    assert validated[0].chunk_id == "VALID-CHUNK-1"
