import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import get_settings
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    except:
        pass

    neo4j_status = "disconnected"
    try:
        neo4j_driver = get_neo4j_driver()
        await neo4j_driver.verify_connectivity()
        neo4j_status = "connected"
    except:
        pass

    qdrant_status = "disconnected"
    try:
        qdrant_client = get_qdrant_client()
        await qdrant_client.get_collections()
        qdrant_status = "connected"
    except:
        pass

    return {
        "status": "ok",
        "version": settings.VERSION,
        "services": {
            "database": db_status,
            "neo4j": neo4j_status,
            "qdrant": qdrant_status
        }
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
