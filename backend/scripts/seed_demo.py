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
    print(
        "Seeded canonical demo data: 8 equipment, 13 maintenance records, "
        "8 failures, 9 compliance checks, 90 daily metrics, and 6 field observations."
    )


if __name__ == "__main__":
    asyncio.run(main())
