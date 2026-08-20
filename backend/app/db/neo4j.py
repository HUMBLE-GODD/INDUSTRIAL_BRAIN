from neo4j import AsyncGraphDatabase
from app.core.config import get_settings
from contextlib import asynccontextmanager

settings = get_settings()

_driver = None

def get_neo4j_driver():
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
    return _driver

async def close_neo4j_driver():
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None

@asynccontextmanager
async def neo4j_session():
    driver = get_neo4j_driver()
    async with driver.session() as session:
        yield session
