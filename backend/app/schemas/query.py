from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=3, description="Natural language question for industrial decision support")
    top_k: int = Field(default=5, gt=0, le=50, description="Maximum number of relevant document chunks to retrieve")
    include_graph_evidence: bool = Field(default=True, description="Whether to include Neo4j graph relationship evidence")

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 3:
            raise ValueError("question must contain at least 3 non-whitespace characters.")
        return stripped


class Citation(BaseModel):
    document_id: str = Field(..., description="Unique identifier of the source document")
    title: str = Field(..., description="Title or filename of the source document")
    chunk_id: str = Field(..., description="Stable chunk identifier")
    excerpt: str = Field(..., description="Relevant text excerpt from the document")
    page: Optional[str] = Field(default=None, description="Page number or table row index if available")
    relevance_score: Optional[float] = Field(default=None, description="Similarity score from vector retrieval")


class GraphEvidence(BaseModel):
    supplier: str = Field(..., description="Name of the supplier identified in the relationship path")
    rating: Optional[float] = Field(default=None, description="Supplier quality or reliability rating")
    affected_equipment: list[str] = Field(default_factory=list, description="Equipment IDs or names linked to this risk")
    components: list[str] = Field(default_factory=list, description="Component names supplied by this supplier")
    failure_modes: list[dict[str, Any]] = Field(default_factory=list, description="Linked failure modes with severity and details")
    relationship_path: str = Field(..., description="Human-readable explanation of the graph traversal path")


class QueryResponse(BaseModel):
    question: str
    answer: str = Field(..., description="Synthesized response or deterministic evidence summary")
    source_mode: str = Field(..., description="Execution mode: 'gemini', 'groq', or 'deterministic'")
    retrieved_facts: list[str] = Field(default_factory=list, description="Explicit list of factual findings from retrieval")
    citations: list[Citation] = Field(default_factory=list, description="Verified document citations backing the answer")
    graph_evidence: list[GraphEvidence] = Field(default_factory=list, description="Knowledge graph evidence backing the answer")
    recommendations: list[str] = Field(default_factory=list, description="Actionable recommendations separated from factual evidence")
    confidence: Optional[float] = Field(default=None, description="Confidence estimate if provided by model, else None")
    processing_time_ms: float = Field(..., ge=0, description="Total server processing duration in milliseconds")
    disclaimer: Optional[str] = Field(default=None, description="Notice regarding answer mode, heuristic nature, or missing credentials")
