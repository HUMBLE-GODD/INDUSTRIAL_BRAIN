"""Seed the local PostgreSQL database with repeatable canonical demo rows.

Run from the backend container with ``python -m scripts.seed_demo``.
This script is deliberately not called by application startup.
"""

import asyncio

from app.db.session import AsyncSessionLocal, get_engine
from app.services.demo_seed import seed_demo_data


async def main() -> None:
    async with AsyncSessionLocal() as session:
        await seed_demo_data(session)
    await get_engine().dispose()
    print("Seeded canonical PostgreSQL demo data (EQ-001 through EQ-005).")


if __name__ == "__main__":
    asyncio.run(main())
