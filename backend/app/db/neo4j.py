"""
backend/app/db/neo4j.py
-----------------------
Async Neo4j driver lifecycle management.

The driver is created once at application startup (via the FastAPI lifespan)
and shared across all request handlers through the `neo4j_session` context
manager.  No synchronous driver calls are made here; all sessions are async.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from neo4j import AsyncDriver, AsyncGraphDatabase
from neo4j.exceptions import AuthError, ServiceUnavailable

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

_driver: AsyncDriver | None = None


def get_neo4j_driver() -> AsyncDriver:
    """Return (and lazily initialise) the shared async Neo4j driver.

    The driver is *not* yet connected here; connectivity is verified at
    application startup inside the FastAPI lifespan.
    """
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        )
    return _driver


async def close_neo4j_driver() -> None:
    """Close the shared driver (called during application shutdown)."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None
        logger.info("Neo4j driver closed.")


@asynccontextmanager
async def neo4j_session() -> AsyncGenerator:
    """Async context manager that yields an open AsyncSession.

    Usage inside a FastAPI route::

        async with neo4j_session() as session:
            result = await session.run("MATCH (n) RETURN count(n) AS c")

    On Neo4j unavailability the exception propagates so the caller can return
    a degraded response without leaking credentials.
    """
    driver = get_neo4j_driver()
    try:
        async with driver.session(database=settings.NEO4J_DATABASE) as session:
            yield session
    except (ServiceUnavailable, AuthError):
        # Re-raise so route handlers can catch and return a 503 / degraded body.
        raise


async def verify_neo4j_connectivity() -> bool:
    """Return True if Neo4j is reachable; False otherwise (never raises)."""
    try:
        driver = get_neo4j_driver()
        await driver.verify_connectivity()
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Neo4j connectivity check failed: %s", exc)
        return False
