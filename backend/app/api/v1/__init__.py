from fastapi import APIRouter

from app.api.v1.compliance import router as compliance_router
from app.api.v1.maintenance import router as maintenance_router
from app.api.v1.query import router as query_router

api_router = APIRouter()


@api_router.get("/ping")
async def ping():
    return {"ping": "pong"}


api_router.include_router(query_router, tags=["Decision Support - Query"])
api_router.include_router(maintenance_router, tags=["Decision Support - Maintenance"])
api_router.include_router(compliance_router, tags=["Decision Support - Compliance"])
