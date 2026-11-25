from fastapi import APIRouter

from app.api.v1.graph import router as graph_router, rca_router

api_router = APIRouter()

api_router.include_router(graph_router)
api_router.include_router(rca_router)


@api_router.get("/ping")
async def ping():
    return {"ping": "pong"}
