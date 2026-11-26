"""
Seed script: load the demo fixtures into a running Industrial Brain instance.

Usage (from backend/ directory):
    python -m app.fixtures.seed_fixtures

Requires the backend to be running and UPLOAD_DIR writable.
Calls the HTTP API so it exercises the full pipeline.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

try:
    import httpx
except ModuleNotFoundError:
    print("Install 'httpx' to run this seed script.")
    sys.exit(1)

FIXTURE_DIR = Path(__file__).parent
API_BASE = "http://localhost:8000/api/v1"
DEMO_EMAIL = os.getenv("DEMO_EMAIL", "demo@industrialbrain.local")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "industrialbrain-demo")

FIXTURES = [
    {
        "path": FIXTURE_DIR / "pump_maintenance_manual.txt",
        "title": "Pump P-101 Operations and Maintenance Manual",
    },
    {
        "path": FIXTURE_DIR / "maintenance_report_2024.csv",
        "title": "2024 Annual Maintenance Report",
    },
    {
        "path": FIXTURE_DIR / "demo_factory_equipment_manual.txt",
        "title": "Demo Factory Equipment Reference Manual (EQ-101–EQ-103)",
    },
    {
        "path": FIXTURE_DIR / "demo_factory_maintenance_log.csv",
        "title": "Demo Factory Maintenance and Failure Log (2026)",
    },
    {
        "path": FIXTURE_DIR / "demo_factory_compliance_register.csv",
        "title": "Demo Factory Compliance Register (2026)",
    },
]


async def seed() -> None:
    # Cold model downloads and CPU embedding can exceed the ordinary API timeout.
    async with httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=15.0)) as client:
        credentials = {"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
        auth = await client.post(f"{API_BASE}/auth/register", json=credentials)
        if auth.status_code == 409:
            auth = await client.post(f"{API_BASE}/auth/login", json=credentials)
        if auth.status_code not in (200, 201):
            raise RuntimeError(f"Could not authenticate demo fixture loader: {auth.status_code} {auth.text}")

        headers = {"Authorization": f"Bearer {auth.json()['access_token']}"}
        listed = await client.get(f"{API_BASE}/documents", headers=headers)
        if listed.status_code != 200:
            raise RuntimeError(f"Could not list existing documents: {listed.status_code} {listed.text}")
        documents_by_title = {
            item.get("title"): item
            for item in listed.json()
            if item.get("title")
        }

        for fixture in FIXTURES:
            filepath: Path = fixture["path"]
            if not filepath.exists():
                print(f"[SKIP] Fixture not found: {filepath}")
                continue

            existing = documents_by_title.get(fixture["title"])
            if existing:
                existing_status = existing.get("status")
                if existing_status == "processed":
                    print(f"[SKIP] Already indexed: {fixture['title']}")
                    continue
                if existing_status in ("uploaded", "processing"):
                    print(f"[SKIP] Upload already in progress: {fixture['title']}")
                    continue
                if existing_status == "failed":
                    removed = await client.delete(
                        f"{API_BASE}/documents/{existing['document_id']}",
                        headers=headers,
                    )
                    if removed.status_code != 204:
                        raise RuntimeError(
                            f"Could not remove failed fixture {fixture['title']}: "
                            f"{removed.status_code} {removed.text}"
                        )

            print(f"[UPLOADING] {filepath.name} …")
            with filepath.open("rb") as fh:
                resp = await client.post(
                    f"{API_BASE}/documents/upload",
                    files={"file": (filepath.name, fh)},
                    data={"title": fixture["title"]},
                    headers=headers,
                )

            if resp.status_code == 201:
                body = resp.json()
                documents_by_title[fixture["title"]] = {
                    "document_id": body["document_id"],
                    "title": fixture["title"],
                    "status": body["status"],
                }
                print(
                    f"  → document_id={body['document_id']}  status={body['status']}"
                )
            else:
                raise RuntimeError(
                    f"Could not index {filepath.name}: {resp.status_code} {resp.text}"
                )


if __name__ == "__main__":
    asyncio.run(seed())
