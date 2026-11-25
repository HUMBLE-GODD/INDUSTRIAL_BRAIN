import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy import text

from app.core.config import get_settings
from app.core.errors import install_error_handlers
from app.api.v1.schemas import DocumentStatus
from app.db.session import get_engine
from app.db.neo4j import get_neo4j_driver, close_neo4j_driver
from app.db.qdrant import get_qdrant_client, init_qdrant
from app.api.v1 import api_router

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Industrial Brain API...")
    
    # Test DB
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("PostgreSQL connected successfully.")
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {e}")
        
    # Test Neo4j
    try:
        neo4j_driver = get_neo4j_driver()
        await neo4j_driver.verify_connectivity()
        logger.info("Neo4j connected successfully.")
    except Exception as e:
        logger.error(f"Neo4j connection failed: {e}")
        
    # Test Qdrant and ensure vector collection
    try:
        qdrant_client = get_qdrant_client()
        await qdrant_client.get_collections()
        await init_qdrant(vector_size=settings.EMBEDDING_DIMENSION)
        logger.info("Qdrant connected successfully.")
    except Exception as e:
        logger.error(f"Qdrant connection failed: {e}")
        
    yield
    
    logger.info("Shutting down Industrial Brain API...")
    await close_neo4j_driver()
    try:
        engine = get_engine()
        await engine.dispose()
    except Exception as e:
        logger.error(f"Error disposing DB engine: {e}")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
)
install_error_handlers(app)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        routes=app.routes,
    )
    component_schemas = schema.setdefault("components", {}).setdefault("schemas", {})
    component_schemas.setdefault(
        "DocumentStatus",
        {
            "title": "DocumentStatus",
            "type": "string",
            "enum": [status.value for status in DocumentStatus],
            "description": "Document processing lifecycle status.",
        },
    )
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["health"], summary="Check service dependencies")
async def health_check(response: Response):
    services = {
        "database": "disconnected",
        "neo4j": "disconnected",
        "qdrant": "disconnected",
    }
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        services["database"] = "connected"
    except Exception as exc:
        logger.warning("Database health check failed: %s", exc)

    try:
        neo4j_driver = get_neo4j_driver()
        await neo4j_driver.verify_connectivity()
        services["neo4j"] = "connected"
    except Exception as exc:
        logger.warning("Neo4j health check failed: %s", exc)

    try:
        qdrant_client = get_qdrant_client()
        await qdrant_client.get_collections()
        services["qdrant"] = "connected"
    except Exception as exc:
        logger.warning("Qdrant health check failed: %s", exc)

    healthy = all(service_status == "connected" for service_status in services.values())
    response.status_code = 200 if healthy else 503

    return {
        "status": "ok" if healthy else "degraded",
        "version": settings.VERSION,
        "services": services,
    }

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        pass
