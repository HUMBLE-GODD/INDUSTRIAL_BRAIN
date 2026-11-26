import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import get_settings
from app.core.errors import install_error_handlers
from app.api.v1.schemas import DocumentStatus
from app.db.session import get_engine
from app.db.neo4j import get_neo4j_driver, close_neo4j_driver
from app.db.qdrant import close_qdrant_client, get_qdrant_client, init_qdrant
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
        await init_qdrant(vector_size=settings.EMBEDDING_DIMENSION)
        logger.info("Qdrant connected successfully.")
    except Exception as e:
        logger.error(f"Qdrant connection failed: {e}")
        
    try:
        yield
    finally:
        logger.info("Shutting down Industrial Brain API...")
        try:
            await close_qdrant_client()
        except Exception as e:
            logger.error("Error closing Qdrant client: %s", e)
        try:
            await close_neo4j_driver()
        except Exception as e:
            logger.error("Error closing Neo4j driver: %s", e)
        try:
            await get_engine().dispose()
        except Exception as e:
            logger.error("Error disposing DB engine: %s", e)

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
    schemas = schema.setdefault("components", {}).setdefault("schemas", {})
    schemas.setdefault(
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
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
async def health_check():
    db_status = "disconnected"
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception:
        pass

    neo4j_status = "disconnected"
    try:
        neo4j_driver = get_neo4j_driver()
        await neo4j_driver.verify_connectivity()
        neo4j_status = "connected"
    except Exception:
        pass

    qdrant_status = "disconnected"
    try:
        qdrant_client = get_qdrant_client()
        await qdrant_client.get_collections()
        qdrant_status = "connected"
    except Exception:
        pass

    services = {
        "database": db_status,
        "neo4j": neo4j_status,
        "qdrant": qdrant_status,
    }
    healthy = all(status == "connected" for status in services.values())
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={
            "status": "ok" if healthy else "degraded",
            "version": settings.VERSION,
            "services": services,
        },
    )

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        pass
