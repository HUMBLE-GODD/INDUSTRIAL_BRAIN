from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass, field
from typing import Optional, Protocol

from app.core.config import get_settings
from app.schemas.query import Citation, GraphEvidence

logger = logging.getLogger(__name__)

# Bounded timeouts as required by assignment
LLM_TIMEOUT_SECONDS: float = 15.0
GEMINI_DEFAULT_MODEL: str = "gemini-2.0-flash"
GROQ_DEFAULT_MODEL: str = "llama-3.1-8b-instant"
CHUNK_CITATION_PATTERN = re.compile(
    r"\[(?:Chunk|Chunk ID):\s*([^\]]+)\]", re.IGNORECASE
)

PLACEHOLDER_KEYS = {
    "",
    "your-gemini-api-key",
    "your-groq-api-key",
    "placeholder",
    "none",
}


@dataclass
class LLMGenerationResult:
    answer: str
    source_mode: str  # "gemini" | "groq" | "deterministic"
    retrieved_facts: list[str]
    validated_citations: list[Citation]
    recommendations: list[str]
    confidence: Optional[float] = None
    disclaimer: Optional[str] = None


class LLMProviderPort(Protocol):
    async def generate_response(
        self,
        question: str,
        citations: list[Citation],
        graph_evidence: list[GraphEvidence],
    ) -> LLMGenerationResult:
        ...


def extract_retrieved_facts(
    citations: list[Citation],
    graph_evidence: list[GraphEvidence],
) -> list[str]:
    """Extract strictly verified factual assertions directly from retrieved data."""
    facts: list[str] = []

    for c in citations:
        location = f" (Page/Row: {c.page})" if c.page else ""
        facts.append(f"Document '{c.title}'{location}: {c.excerpt}")

    for ge in graph_evidence:
        fm_names = [fm.get("name", "Unknown Failure") for fm in ge.failure_modes]
        fm_str = ", ".join(fm_names) if fm_names else "unspecified failure modes"
        rating_str = f"rating {ge.rating}" if ge.rating is not None else "unrated"
        facts.append(
            f"Knowledge Graph: Supplier '{ge.supplier}' ({rating_str}) supplies parts "
            f"({', '.join(ge.components) or 'components'}) to assets ({', '.join(ge.affected_equipment) or 'equipment'}), "
            f"with potential risk links to: {fm_str}."
        )

    return facts


def sanitize_and_separate_sections(raw_text: str) -> tuple[str, list[str]]:
    """Separates narrative summary from recommendations."""
    recommendations: list[str] = []

    # Check for Recommendations header
    rec_split = re.split(r"(?i)\n*(?:###?\s*)?Recommendations?:\s*\n*", raw_text, maxsplit=1)
    if len(rec_split) == 2:
        narrative = rec_split[0].strip()
        rec_block = rec_split[1].strip()
        for line in rec_block.splitlines():
            cleaned = re.sub(r"^\s*[-*•\d\.]+\s*", "", line).strip()
            if cleaned:
                recommendations.append(cleaned)
    else:
        narrative = raw_text.strip()

    return narrative, recommendations


class LLMService:
    """Orchestrates Gemini (primary), Groq (fallback), and Deterministic evidence summary mode."""

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        groq_api_key: Optional[str] = None,
        timeout_seconds: float = LLM_TIMEOUT_SECONDS,
    ) -> None:
        settings = get_settings()
        self._gemini_api_key = (
            gemini_api_key if gemini_api_key is not None else settings.GEMINI_API_KEY
        ).strip()
        self._groq_api_key = (
            groq_api_key if groq_api_key is not None else settings.GROQ_API_KEY
        ).strip()
        self.timeout_seconds = timeout_seconds

    def has_gemini(self) -> bool:
        return bool(self._gemini_api_key and self._gemini_api_key.lower() not in PLACEHOLDER_KEYS)

    def has_groq(self) -> bool:
        return bool(self._groq_api_key and self._groq_api_key.lower() not in PLACEHOLDER_KEYS)

    async def generate_response(
        self,
        question: str,
        citations: list[Citation],
        graph_evidence: list[GraphEvidence],
    ) -> LLMGenerationResult:
        retrieved_facts = extract_retrieved_facts(citations, graph_evidence)
        valid_chunk_map = {c.chunk_id: c for c in citations}

        # Handle zero-evidence retrieval explicitly
        if not citations and not graph_evidence:
            return LLMGenerationResult(
                answer=(
                    f"No relevant document citations or knowledge graph relationships were found matching "
                    f"the question: '{question}'. Please refine your search terms or verify indexed assets."
                ),
                source_mode="deterministic",
                retrieved_facts=[],
                validated_citations=[],
                recommendations=[
                    "Check if the targeted equipment ID or technical manual is indexed in the document store.",
                    "Verify spelling of asset names and component types.",
                ],
                confidence=0.0,
                disclaimer="Empty retrieval result: no records matched the query.",
            )

        # 1. Try Gemini if configured
        if self.has_gemini():
            try:
                logger.info("Attempting response generation with configured Gemini provider.")
                return await self._call_gemini(
                    question, citations, graph_evidence, retrieved_facts, valid_chunk_map
                )
            except Exception as e:
                logger.warning(
                    "Gemini provider call failed or timed out: %s. Checking fallback.",
                    type(e).__name__,
                )

        # 2. Try Groq fallback if configured
        if self.has_groq():
            try:
                logger.info("Attempting response generation with Groq fallback provider.")
                return await self._call_groq(
                    question, citations, graph_evidence, retrieved_facts, valid_chunk_map
                )
            except Exception as e:
                logger.warning(
                    "Groq fallback provider call failed or timed out: %s. Falling back to deterministic mode.",
                    type(e).__name__,
                )

        # 3. Deterministic evidence summary mode
        logger.info("Utilizing deterministic evidence-summary mode.")
        return self._generate_deterministic(
            question, citations, graph_evidence, retrieved_facts
        )

    def _build_prompt(
        self,
        question: str,
        citations: list[Citation],
        graph_evidence: list[GraphEvidence],
    ) -> str:
        prompt_parts = [
            "You are an Industrial Brain Decision Support AI.",
            "Analyze the following verified evidence to answer the supervisor's question.",
            "",
            "CRITICAL CONSTRAINTS:",
            "1. Base your answer EXCLUSIVELY on the provided Document Citations and Graph Evidence.",
            "2. NEVER invent citations, metadata, or chunk IDs. Only cite verified chunk IDs provided below.",
            "3. State relationship findings strictly as RISK relationships or component vulnerabilities; "
            "do NOT declare an unproven supplier causality or assert historical failure events not in evidence.",
            "4. Separate practical next steps under a section titled 'RECOMMENDATIONS:'.",
            "",
            "--- DOCUMENT CITATIONS ---",
        ]

        if citations:
            for c in citations:
                loc = f" [Page/Row: {c.page}]" if c.page else ""
                prompt_parts.append(
                    f"- [Chunk ID: {c.chunk_id}] Document: '{c.title}'{loc}\n  Excerpt: {c.excerpt}"
                )
        else:
            prompt_parts.append("(No direct document text matched)")

        prompt_parts.append("\n--- KNOWLEDGE GRAPH EVIDENCE ---")
        if graph_evidence:
            for ge in graph_evidence:
                fms = [f"{fm.get('name')} (severity: {fm.get('severity')})" for fm in ge.failure_modes]
                prompt_parts.append(
                    f"- Supplier: '{ge.supplier}' (Rating: {ge.rating})\n"
                    f"  Supplies to Equipment: {', '.join(ge.affected_equipment)}\n"
                    f"  Components: {', '.join(ge.components)}\n"
                    f"  Linked Failure Mode Risks: {', '.join(fms)}\n"
                    f"  Relationship Path: {ge.relationship_path}"
                )
        else:
            prompt_parts.append("(No graph relationship paths returned)")

        prompt_parts.append(f"\nQUESTION: {question}")
        prompt_parts.append("\nANSWER FORMAT:")
        prompt_parts.append("Provide a clear synthesis of the evidence, citing [Chunk ID: <id>] where relevant.")
        prompt_parts.append("Then provide:")
        prompt_parts.append("RECOMMENDATIONS:")
        prompt_parts.append("- Bullet point recommendations for inspection or mitigation.")

        return "\n".join(prompt_parts)

    def _validate_citations(
        self,
        generated_text: str,
        valid_chunk_map: dict[str, Citation],
        all_citations: list[Citation],
    ) -> list[Citation]:
        """Ensures that only valid, retrieved citations are retained."""
        referenced_chunk_ids = {
            match.group(1).strip()
            for match in CHUNK_CITATION_PATTERN.finditer(generated_text)
        }

        matched: list[Citation] = []
        for cid in referenced_chunk_ids:
            cid_clean = cid.strip()
            if cid_clean in valid_chunk_map:
                matched.append(valid_chunk_map[cid_clean])
            else:
                logger.warning("Filtered out uncited or fabricated chunk reference: %s", cid_clean)

        # If LLM summarized without explicit inline tags, retain all retrieved citations that formed the context
        return matched if matched else all_citations

    def _strip_unverified_citation_markers(
        self, generated_text: str, valid_chunk_map: dict[str, Citation]
    ) -> str:
        """Remove inline chunk references that were not returned by retrieval."""

        def keep_verified(match: re.Match[str]) -> str:
            chunk_id = match.group(1).strip()
            return match.group(0) if chunk_id in valid_chunk_map else ""

        return CHUNK_CITATION_PATTERN.sub(keep_verified, generated_text)

    async def _call_gemini(
        self,
        question: str,
        citations: list[Citation],
        graph_evidence: list[GraphEvidence],
        retrieved_facts: list[str],
        valid_chunk_map: dict[str, Citation],
    ) -> LLMGenerationResult:
        from google import genai

        prompt = self._build_prompt(question, citations, graph_evidence)
        client = genai.Client(api_key=self._gemini_api_key)

        async def _invoke():
            return await asyncio.to_thread(
                client.models.generate_content,
                model=GEMINI_DEFAULT_MODEL,
                contents=prompt,
            )

        response = await asyncio.wait_for(_invoke(), timeout=self.timeout_seconds)
        raw_text = self._strip_unverified_citation_markers(
            response.text or "", valid_chunk_map
        )
        narrative, recs = sanitize_and_separate_sections(raw_text)
        validated = self._validate_citations(raw_text, valid_chunk_map, citations)

        return LLMGenerationResult(
            answer=narrative,
            source_mode="gemini",
            retrieved_facts=retrieved_facts,
            validated_citations=validated,
            recommendations=recs or ["Initiate diagnostic inspection of flagged component assemblies."],
            confidence=0.88,
            disclaimer=None,
        )

    async def _call_groq(
        self,
        question: str,
        citations: list[Citation],
        graph_evidence: list[GraphEvidence],
        retrieved_facts: list[str],
        valid_chunk_map: dict[str, Citation],
    ) -> LLMGenerationResult:
        from groq import AsyncGroq

        prompt = self._build_prompt(question, citations, graph_evidence)
        client = AsyncGroq(api_key=self._groq_api_key)

        async def _invoke():
            return await client.chat.completions.create(
                model=GROQ_DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": "You are an industrial decision support assistant."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )

        response = await asyncio.wait_for(_invoke(), timeout=self.timeout_seconds)
        raw_text = self._strip_unverified_citation_markers(
            response.choices[0].message.content or "", valid_chunk_map
        )
        narrative, recs = sanitize_and_separate_sections(raw_text)
        validated = self._validate_citations(raw_text, valid_chunk_map, citations)

        return LLMGenerationResult(
            answer=narrative,
            source_mode="groq",
            retrieved_facts=retrieved_facts,
            validated_citations=validated,
            recommendations=recs or ["Schedule engineering review of supplier components."],
            confidence=0.82,
            disclaimer="Generated using secondary fallback provider (Groq).",
        )

    def _generate_deterministic(
        self,
        question: str,
        citations: list[Citation],
        graph_evidence: list[GraphEvidence],
        retrieved_facts: list[str],
    ) -> LLMGenerationResult:
        """Deterministic evidence-summary mode when no LLM key is configured or services fail."""
        summary_lines = [
            "### Deterministic Evidence Summary",
            f"Analysis for query: \"{question}\"\n",
        ]

        recommendations: list[str] = []

        if graph_evidence:
            summary_lines.append("#### Knowledge Graph Findings:")
            for ge in graph_evidence:
                high_crit_fms = [
                    fm.get("name", "Unknown")
                    for fm in ge.failure_modes
                    if str(fm.get("severity", "")).lower() in ["high", "critical"]
                ]
                summary_lines.append(
                    f"- **Supplier:** {ge.supplier} (Quality Rating: {ge.rating if ge.rating is not None else 'N/A'})\n"
                    f"  - **Supplied Components:** {', '.join(ge.components)}\n"
                    f"  - **Affected Equipment:** {', '.join(ge.affected_equipment)}\n"
                    f"  - **High/Critical Failure Mode Risks:** {', '.join(high_crit_fms) if high_crit_fms else 'None identified at high/critical'}\n"
                    f"  - **Traversal Path:** `{ge.relationship_path}`"
                )
                if high_crit_fms:
                    recommendations.append(
                        f"Audit quality records and schedule vibration/thermal testing for {ge.supplier} components "
                        f"({', '.join(ge.components)}) across {', '.join(ge.affected_equipment)}."
                    )
        else:
            summary_lines.append("No supplier risk relationships were retrieved from the knowledge graph.")

        if citations:
            summary_lines.append("\n#### Supporting Document Citations:")
            for c in citations:
                loc = f" (Page/Row {c.page})" if c.page else ""
                summary_lines.append(
                    f"- **[{c.chunk_id}]** *{c.title}*{loc}:\n  > \"{c.excerpt}\""
                )
        else:
            summary_lines.append("\nNo relevant text excerpts were retrieved from indexed manuals.")

        if not recommendations:
            recommendations.append("Conduct routine asset inspection per standard operating procedure.")

        summary_text = "\n".join(summary_lines)

        return LLMGenerationResult(
            answer=summary_text,
            source_mode="deterministic",
            retrieved_facts=retrieved_facts,
            validated_citations=citations,
            recommendations=recommendations,
            confidence=None,
            disclaimer=(
                "Deterministic evidence summary: generated without external LLM API calls. "
                "Evidence reflects raw retrieval from vector indices and knowledge graph."
            ),
        )
