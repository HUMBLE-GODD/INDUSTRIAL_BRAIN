from __future__ import annotations

from sentence_transformers import SentenceTransformer

from app.core.config import get_settings

_service: EmbeddingService | None = None


class EmbeddingService:
    """Convert text into normalized embedding vectors using BGE-base-en-v1.5."""

    def __init__(
        self,
        model_name: str | None = None,
        document_prefix: str | None = None,
        query_prefix: str | None = None,
    ) -> None:
        settings = get_settings()
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME
        self.document_prefix = document_prefix or settings.EMBEDDING_DOCUMENT_PREFIX
        self.query_prefix = query_prefix or settings.EMBEDDING_QUERY_PREFIX
        self._model: SentenceTransformer | None = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
        return self._model

    @property
    def dimension(self) -> int:
        return self.model.get_sentence_embedding_dimension()

    @staticmethod
    def _validate_text(text: str, field_name: str = "text") -> str:
        if text is None:
            raise ValueError(f"{field_name} must be a non-empty string.")
        normalized = text.strip()
        if not normalized:
            raise ValueError(f"{field_name} must be a non-empty string.")
        return normalized

    def embed_text(self, text: str) -> list[float]:
        """Embed a single text using the document prefix."""
        return self.embed_documents([text])[0]

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed document texts with the retrieval-oriented prefix."""
        if not texts:
            raise ValueError("texts must contain at least one item.")
        normalized = [self._validate_text(text, "text") for text in texts]
        prefixed = [f"{self.document_prefix}{text}" for text in normalized]
        embeddings = self.model.encode(
            prefixed,
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=False,
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> list[float]:
        """Embed a search query with the query-specific prefix."""
        normalized = self._validate_text(query, "query")
        embedding = self.model.encode(
            f"{self.query_prefix}{normalized}",
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding.tolist()


def get_embedding_service() -> EmbeddingService:
    global _service
    if _service is None:
        _service = EmbeddingService()
    return _service
