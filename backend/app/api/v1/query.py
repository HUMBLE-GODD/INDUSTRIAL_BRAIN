from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.v1.dependencies import get_current_user
from app.schemas.query import QueryRequest, QueryResponse
from app.services.graph_evidence_adapter import GraphServiceUnavailableError
from app.services.query_service import QueryService
from app.services.vector_search_adapter import VectorServiceUnavailableError

logger = logging.getLogger(__name__)

router = APIRouter()


def get_query_service() -> QueryService:
    """Dependency provider for QueryService, allowing test overrides."""
    return QueryService()


@router.post(
    "/query",
    response_model=QueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Query industrial documents and knowledge graph",
    description=(
        "Combines vector search over indexed documentation and graph traversal over equipment-supplier risks. "
        "Provides grounded answer, verified citations, and actionable recommendations. "
        "Requires a valid bearer token and returns only the evidence retrieved for this request."
    ),
)
async def query_endpoint(
    request: QueryRequest,
    _current_user=Depends(get_current_user),
    service: QueryService = Depends(get_query_service),
) -> QueryResponse:
    try:
        return await service.execute_query(request)
    except VectorServiceUnavailableError as e:
        logger.error("Vector service unavailable during query: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vector retrieval service is unavailable: {e}",
        ) from e
    except GraphServiceUnavailableError as e:
        logger.error("Graph service unavailable during query: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Knowledge graph service is unavailable: {e}",
        ) from e
    except Exception as e:
        logger.exception("Unexpected error processing query request: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing the industrial query.",
        ) from e
