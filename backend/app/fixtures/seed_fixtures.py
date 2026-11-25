"""
Seed script: load the demo fixtures into a running Industrial Brain instance.

Usage (from backend/ directory):
    python -m app.fixtures.seed_fixtures

Requires the backend to be running and UPLOAD_DIR writable.
Calls the HTTP API so it exercises the full pipeline.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

try:
    import httpx
except ModuleNotFoundError:
    print("Install 'httpx' to run this seed script.")
    sys.exit(1)

FIXTURE_DIR = Path(__file__).parent
API_BASE = "http://localhost:8000/api/v1"

FIXTURES = [
    {
        "path": FIXTURE_DIR / "pump_maintenance_manual.txt",
        "title": "Pump P-101 Operations and Maintenance Manual",
    },
    {
        "path": FIXTURE_DIR / "maintenance_report_2024.csv",
        "title": "2024 Annual Maintenance Report",
    },
]


async def seed() -> None:
    async with httpx.AsyncClient(timeout=120.0) as client:
        for fixture in FIXTURES:
            filepath: Path = fixture["path"]
            if not filepath.exists():
                print(f"[SKIP] Fixture not found: {filepath}")
                continue

            print(f"[UPLOADING] {filepath.name} …")
            with filepath.open("rb") as fh:
                resp = await client.post(
                    f"{API_BASE}/documents/upload",
                    files={"file": (filepath.name, fh)},
                    data={"title": fixture["title"]},
                )

            if resp.status_code == 201:
                body = resp.json()
                print(
                    f"  → document_id={body['document_id']}  status={body['status']}"
                )
            else:
                print(f"  [ERROR] {resp.status_code}: {resp.text}")


if __name__ == "__main__":
    asyncio.run(seed())
