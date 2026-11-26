from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.equipment import router as equipment_router
from app.api.v1.graph import router as graph_router, rca_router
from app.api.v1.observations import router as observations_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(documents_router)
api_router.include_router(equipment_router)
api_router.include_router(graph_router)
api_router.include_router(rca_router)
api_router.include_router(observations_router)

@api_router.get("/ping")
async def ping():
    return {"ping": "pong"}
