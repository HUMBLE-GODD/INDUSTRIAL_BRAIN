from __future__ import annotations

from typing import Optional
from app.schemas.query import Citation, GraphEvidence
from app.services.llm_service import LLMGenerationResult, LLMProviderPort, extract_retrieved_facts


class FakeLLMService(LLMProviderPort):
    """Test fake for LLM answer generation with configurable modes, answers, or simulated failures."""

    def __init__(
        self,
        source_mode: str = "gemini",
        answer: Optional[str] = None,
        recommendations: Optional[list[str]] = None,
        confidence: Optional[float] = 0.9,
        raise_error: Optional[Exception] = None,
        disclaimer: Optional[str] = None,
    ) -> None:
        self.source_mode = source_mode
        self._answer = answer
        self._recommendations = recommendations
        self._confidence = confidence
        self._raise_error = raise_error
        self._disclaimer = disclaimer
        self.invocations: list[dict] = []

    async def generate_response(
        self,
        question: str,
        citations: list[Citation],
        graph_evidence: list[GraphEvidence],
    ) -> LLMGenerationResult:
        self.invocations.append({
            "question": question,
            "citations": citations,
            "graph_evidence": graph_evidence,
        })

        if self._raise_error is not None:
            raise self._raise_error

        retrieved_facts = extract_retrieved_facts(citations, graph_evidence)

        if self._answer is not None:
            ans = self._answer
        else:
            suppliers = [ge.supplier for ge in graph_evidence] or ["None"]
            ans = (
                f"Based on retrieved documentation and knowledge graph analysis, supplier '{', '.join(suppliers)}' "
                f"is associated with component vulnerability risks across monitored production assets. "
                f"Refer to verified citations [Chunk ID: {citations[0].chunk_id}] for technical specifications."
                if citations else
                f"Knowledge graph indicates supplier risk links for '{', '.join(suppliers)}'."
            )

        recs = self._recommendations or [
            "Perform non-destructive valve seal integrity testing.",
            "Review batch procurement quality certificates.",
        ]

        return LLMGenerationResult(
            answer=ans,
            source_mode=self.source_mode,
            retrieved_facts=retrieved_facts,
            validated_citations=citations,
            recommendations=recs,
            confidence=self._confidence,
            disclaimer=self._disclaimer,
        )
