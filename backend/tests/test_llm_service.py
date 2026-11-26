from __future__ import annotations

import asyncio
import logging
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.schemas.query import Citation, GraphEvidence
from app.services.llm_service import LLMService


@pytest.fixture
def sample_citations():
    return [
        Citation(
            document_id="DOC-01",
            title="Valve Manual",
            chunk_id="CHK-1",
            excerpt="EpsilonValves seals degrade at high temperature.",
            page="12",
        )
    ]


@pytest.fixture
def sample_graph_evidence():
    return [
        GraphEvidence(
            supplier="EpsilonValves Ltd",
            rating=2.9,
            affected_equipment=["EQ-001", "EQ-002"],
            components=["Inlet Valve"],
            failure_modes=[{"name": "Pressure Loss", "severity": "critical"}],
            relationship_path="EQ -> Valve -> EpsilonValves",
        )
    ]


@pytest.mark.asyncio
async def test_llm_service_deterministic_when_no_keys(sample_citations, sample_graph_evidence):
    """Verify deterministic evidence summary mode when no API keys are provided."""
    service = LLMService(gemini_api_key="", groq_api_key="")

    assert not service.has_gemini()
    assert not service.has_groq()

    result = await service.generate_response(
        question="Which supplier components fail?",
        citations=sample_citations,
        graph_evidence=sample_graph_evidence,
    )

    assert result.source_mode == "deterministic"
    assert "Deterministic Evidence Summary" in result.answer
    assert "EpsilonValves Ltd" in result.answer
    assert "Pressure Loss" in result.answer
    assert "Deterministic evidence summary" in result.disclaimer
    assert len(result.validated_citations) == 1
    assert len(result.recommendations) > 0


@pytest.mark.asyncio
async def test_llm_service_gemini_primary_success(sample_citations, sample_graph_evidence):
    """Verify configured Gemini provider executes when key is present."""
    service = LLMService(gemini_api_key="valid-test-gemini-key", groq_api_key="")

    mock_response = MagicMock()
    mock_response.text = (
        "Analysis indicates EpsilonValves Ltd components carry elevated risk of Pressure Loss "
        "as noted in [Chunk ID: CHK-1].\n\n"
        "RECOMMENDATIONS:\n"
        "- Conduct ultrasonic thickness scan on valve casing.\n"
        "- Verify operating pressure stays below 12 bar."
    )

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_client_cls.return_value = mock_client

        result = await service.generate_response(
            question="Which supplier components fail?",
            citations=sample_citations,
            graph_evidence=sample_graph_evidence,
        )

        assert result.source_mode == "gemini"
        assert "EpsilonValves Ltd" in result.answer
        assert len(result.validated_citations) == 1
        assert result.validated_citations[0].chunk_id == "CHK-1"
        assert len(result.recommendations) == 2
        assert "ultrasonic thickness scan" in result.recommendations[0]


@pytest.mark.asyncio
async def test_provider_answer_and_recommendations_drop_unverified_chunk_markers(
    sample_citations, sample_graph_evidence
):
    service = LLMService(gemini_api_key="valid-test-gemini-key", groq_api_key="")
    mock_response = MagicMock()
    mock_response.text = (
        "Risk is supported by [Chunk ID: CHK-1], with extra detail [Chunk ID: FAKE-999].\n\n"
        "RECOMMENDATIONS:\n- Review the record [Chunk ID: MISSING-42]."
    )

    with patch("google.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_client_cls.return_value = mock_client

        result = await service.generate_response(
            question="Which supplier components fail?",
            citations=sample_citations,
            graph_evidence=sample_graph_evidence,
        )

    assert "[Chunk ID: CHK-1]" in result.answer
    assert "FAKE-999" not in result.answer
    assert all("MISSING-42" not in recommendation for recommendation in result.recommendations)
    assert [citation.chunk_id for citation in result.validated_citations] == ["CHK-1"]


@pytest.mark.asyncio
async def test_llm_service_groq_fallback_when_gemini_fails(sample_citations, sample_graph_evidence):
    """Verify Groq fallback occurs seamlessly when Gemini raises an exception."""
    service = LLMService(gemini_api_key="gemini-key", groq_api_key="groq-key")

    mock_groq_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = (
        "Groq analysis confirms supplier risk for EpsilonValves Ltd.\n\n"
        "RECOMMENDATIONS:\n"
        "- Replace valve seal under warranty."
    )
    mock_groq_resp.choices = [mock_choice]

    with patch("google.genai.Client") as mock_gemini_cls, patch("groq.AsyncGroq") as mock_groq_cls:
        # Gemini fails
        mock_gemini = MagicMock()
        mock_gemini.models.generate_content.side_effect = RuntimeError("Gemini quota exceeded")
        mock_gemini_cls.return_value = mock_gemini

        # Groq succeeds
        mock_groq = AsyncMock()
        mock_groq.chat.completions.create.return_value = mock_groq_resp
        mock_groq_cls.return_value = mock_groq

        result = await service.generate_response(
            question="Which supplier components fail?",
            citations=sample_citations,
            graph_evidence=sample_graph_evidence,
        )

        assert result.source_mode == "groq"
        assert "Groq analysis confirms" in result.answer
        assert "Replace valve seal" in result.recommendations[0]
        assert "fallback" in result.disclaimer.lower()


@pytest.mark.asyncio
async def test_llm_service_deterministic_fallback_when_all_fail(sample_citations, sample_graph_evidence):
    """Verify deterministic mode handles total provider failure gracefully."""
    service = LLMService(gemini_api_key="gemini-key", groq_api_key="groq-key")

    with patch("google.genai.Client") as mock_gemini_cls, patch("groq.AsyncGroq") as mock_groq_cls:
        mock_gemini = MagicMock()
        mock_gemini.models.generate_content.side_effect = TimeoutError("Gemini timed out")
        mock_gemini_cls.return_value = mock_gemini

        mock_groq = AsyncMock()
        mock_groq.chat.completions.create.side_effect = ConnectionError("Groq endpoint unreachable")
        mock_groq_cls.return_value = mock_groq

        result = await service.generate_response(
            question="Supplier risk inquiry",
            citations=sample_citations,
            graph_evidence=sample_graph_evidence,
        )

        assert result.source_mode == "deterministic"
        assert "Deterministic Evidence Summary" in result.answer
        assert "EpsilonValves Ltd" in result.answer


@pytest.mark.asyncio
async def test_llm_service_bounded_timeout_enforcement(sample_citations, sample_graph_evidence):
    """Verify timeout bounds execute cleanly without hanging."""
    service = LLMService(gemini_api_key="gemini-key", groq_api_key="", timeout_seconds=0.1)

    with patch("google.genai.Client") as mock_gemini_cls:
        mock_gemini = MagicMock()

        def _slow_generate(*args, **kwargs):
            import time
            time.sleep(0.3)
            return MagicMock(text="Delayed output")

        mock_gemini.models.generate_content.side_effect = _slow_generate
        mock_gemini_cls.return_value = mock_gemini

        start = asyncio.get_event_loop().time()
        result = await service.generate_response(
            question="Timeout test query",
            citations=sample_citations,
            graph_evidence=sample_graph_evidence,
        )
        duration = asyncio.get_event_loop().time() - start

        # Must fall back to deterministic mode and complete quickly
        assert result.source_mode == "deterministic"
        assert duration < 1.0


@pytest.mark.asyncio
async def test_llm_service_never_exposes_api_keys_in_logs_or_responses(
    sample_citations, sample_graph_evidence, caplog
):
    """Security check: ensure API secrets are strictly kept out of outputs and logs."""
    secret_gemini_key = "fake-test-gemini-secret-token-987654321"
    secret_groq_key = "fake-test-groq-secret-token-123456789"

    service = LLMService(gemini_api_key=secret_gemini_key, groq_api_key=secret_groq_key)

    with caplog.at_level(logging.DEBUG), patch("google.genai.Client") as mock_gemini_cls:
        mock_gemini = MagicMock()
        mock_gemini.models.generate_content.side_effect = Exception("Network connect failure")
        mock_gemini_cls.return_value = mock_gemini

        result = await service.generate_response(
            question="Security check query",
            citations=sample_citations,
            graph_evidence=sample_graph_evidence,
        )

        # 1. Output string check
        full_output = f"{result.answer} {result.disclaimer} {' '.join(result.retrieved_facts)} {' '.join(result.recommendations)}"
        assert secret_gemini_key not in full_output
        assert secret_groq_key not in full_output

        # 2. Log records check
        for record in caplog.records:
            assert secret_gemini_key not in record.message
            assert secret_groq_key not in record.message
