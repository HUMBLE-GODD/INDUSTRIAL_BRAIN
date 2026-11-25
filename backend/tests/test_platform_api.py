"""Focused contract tests for the first authenticated platform API."""

from collections.abc import AsyncIterator
import os
from pathlib import Path
import sqlite3
import subprocess
import sys

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.core.config import Settings
from app.main import app
from app.models.database import Document, DocumentStatus, Equipment, FieldObservation, MaintenanceRecord, User
from app.services.demo_seed import DEMO_EQUIPMENT, seed_demo_data


API_PREFIX = "/api/v1"
TEST_EMAIL = "platform-api@example.com"
TEST_PASSWORD = "Strong-test-password-17"


@pytest_asyncio.fixture
async def test_session_factory() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    """Give each test an isolated SQLite database with canonical demo rows."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        await seed_demo_data(session)

    yield session_factory
    await engine.dispose()


@pytest_asyncio.fixture
async def api_client(
    test_session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[httpx.AsyncClient]:
    """Override only the database dependency; exercise the app over ASGI."""
    original_overrides = app.dependency_overrides.copy()

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with test_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            yield client
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides)


def _assert_error_envelope(response: httpx.Response, status_code: int) -> dict:
    assert response.status_code == status_code, response.text
    payload = response.json()
    assert set(payload) == {"error"}
    error = payload["error"]
    assert {"code", "message", "details"} <= set(error)
    assert isinstance(error["code"], str) and error["code"]
    assert isinstance(error["message"], str) and error["message"]
    return error


def _resolve_openapi_schema(schema: dict, components: dict) -> dict:
    while "$ref" in schema:
        reference = schema["$ref"]
        prefix = "#/components/schemas/"
        assert reference.startswith(prefix), reference
        schema = components[reference.removeprefix(prefix)]
    return schema


def test_document_status_storage_uses_shared_lowercase_values():
    expected = ["uploaded", "processing", "processed", "failed"]
    assert [status.value for status in DocumentStatus] == expected
    assert Document.__table__.c.status.type.enums == expected


def test_production_rejects_missing_or_development_jwt_secret():
    with pytest.raises(ValueError):
        Settings(APP_ENV="production", JWT_SECRET="")
    with pytest.raises(ValueError):
        Settings(APP_ENV="production", JWT_SECRET="dev-only-not-for-production")
    assert Settings(APP_ENV="production", JWT_SECRET="unique-test-secret").APP_ENV == "production"


async def _register(client: httpx.AsyncClient, email: str = TEST_EMAIL) -> dict:
    response = await client.post(
        f"{API_PREFIX}/auth/register",
        json={"email": email, "password": TEST_PASSWORD},
    )
    assert response.status_code in (200, 201), response.text
    body = response.json()
    assert isinstance(body.get("access_token"), str) and body["access_token"]
    assert body.get("token_type", "bearer").lower() == "bearer"
    user = body.get("user", body)
    assert isinstance(user, dict)
    assert user.get("email") == email
    assert user.get("id")
    body["_test_user"] = user
    return body


def _bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_register_login_and_reject_wrong_password(api_client: httpx.AsyncClient):
    registered = await _register(api_client)

    login = await api_client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    assert login.status_code == 200, login.text
    login_body = login.json()
    assert isinstance(login_body.get("access_token"), str) and login_body["access_token"]
    assert login_body.get("token_type", "bearer").lower() == "bearer"

    wrong_password = await api_client.post(
        f"{API_PREFIX}/auth/login",
        json={"email": TEST_EMAIL, "password": "incorrect-password"},
    )
    _assert_error_envelope(wrong_password, 401)


@pytest.mark.asyncio
async def test_protected_endpoints_reject_missing_bearer(api_client: httpx.AsyncClient):
    requests = (
        ("GET", f"{API_PREFIX}/equipment?page=1&page_size=20", None),
        ("GET", f"{API_PREFIX}/equipment/EQ-001", None),
        ("GET", f"{API_PREFIX}/equipment/EQ-001/history", None),
        (
            "POST",
            f"{API_PREFIX}/observations",
            {
                "equipment_id": "EQ-001",
                "category": "inspection",
                "severity": "medium",
                "note": "No authorization header supplied.",
            },
        ),
    )
    for method, path, body in requests:
        response = await api_client.request(method, path, json=body)
        _assert_error_envelope(response, 401)

    invalid_token = await api_client.get(
        f"{API_PREFIX}/equipment", headers=_bearer("not-a-valid-token")
    )
    _assert_error_envelope(invalid_token, 401)


@pytest.mark.asyncio
async def test_equipment_list_detail_history_and_missing_equipment(
    api_client: httpx.AsyncClient,
):
    registered = await _register(api_client)
    headers = _bearer(registered["access_token"])

    listing = await api_client.get(
        f"{API_PREFIX}/equipment", params={"page": 1, "page_size": 20}, headers=headers
    )
    assert listing.status_code == 200, listing.text
    page = listing.json()
    assert {"items", "page", "page_size", "total", "pages"} <= set(page)
    assert (page["page"], page["page_size"], page["total"], page["pages"]) == (1, 20, 5, 1)
    assert [item["id"] for item in page["items"]] == [
        item["id"] for item in DEMO_EQUIPMENT
    ]

    detail = await api_client.get(f"{API_PREFIX}/equipment/EQ-001", headers=headers)
    assert detail.status_code == 200, detail.text
    asset = detail.json()
    assert asset["id"] == "EQ-001"
    assert asset["name"] == "Centrifugal Pump P-101"

    history_response = await api_client.get(
        f"{API_PREFIX}/equipment/EQ-001/history", headers=headers
    )
    assert history_response.status_code == 200, history_response.text
    history = history_response.json()
    assert {"items", "page", "page_size", "total", "pages"} <= set(history)
    assert (history["page"], history["page_size"]) == (1, 20)
    assert history["items"]
    event = history["items"][0]
    assert {
        "id",
        "event_type",
        "occurred_at",
        "title",
        "description",
        "severity",
        "metadata",
    } <= set(event)

    missing_detail = await api_client.get(
        f"{API_PREFIX}/equipment/EQ-999", headers=headers
    )
    _assert_error_envelope(missing_detail, 404)
    missing_history = await api_client.get(
        f"{API_PREFIX}/equipment/EQ-999/history", headers=headers
    )
    _assert_error_envelope(missing_history, 404)


@pytest.mark.asyncio
async def test_validation_failures_use_structured_envelope(api_client: httpx.AsyncClient):
    registered = await _register(api_client)
    headers = _bearer(registered["access_token"])

    invalid_page = await api_client.get(
        f"{API_PREFIX}/equipment", params={"page": 0}, headers=headers
    )
    _assert_error_envelope(invalid_page, 422)

    invalid_observation = await api_client.post(
        f"{API_PREFIX}/observations",
        headers=headers,
        json={
            "equipment_id": "EQ-001",
            "category": "inspection",
            "severity": "catastrophic",
            "note": "This value is outside the supported severity set.",
        },
    )
    _assert_error_envelope(invalid_observation, 422)


@pytest.mark.asyncio
async def test_docs_publish_openapi_contract(api_client: httpx.AsyncClient):
    docs = await api_client.get("/docs")
    assert docs.status_code == 200
    assert f"{API_PREFIX}/openapi.json" in docs.text

    openapi_response = await api_client.get(f"{API_PREFIX}/openapi.json")
    assert openapi_response.status_code == 200, openapi_response.text
    document = openapi_response.json()
    schemas = document["components"]["schemas"]
    paths = document["paths"]

    document_status = schemas["DocumentStatus"]
    assert set(document_status["enum"]) == {
        "uploaded",
        "processing",
        "processed",
        "failed",
    }

    observation_operation = paths[f"{API_PREFIX}/observations"]["post"]
    observation_request_schema = _resolve_openapi_schema(
        observation_operation["requestBody"]["content"]["application/json"]["schema"],
        schemas,
    )
    assert {
        "equipment_id",
        "category",
        "severity",
        "note",
    } <= set(observation_request_schema["properties"])
    assert {
        "equipment_id",
        "category",
        "severity",
        "note",
    } <= set(observation_request_schema["required"])

    observation_response_schema = _resolve_openapi_schema(
        observation_operation["responses"]["201"]["content"]["application/json"]["schema"],
        schemas,
    )
    assert {
        "id",
        "equipment_id",
        "category",
        "severity",
        "note",
        "status",
        "created_at",
    } <= set(observation_response_schema["properties"])

    history_operation = paths[
        f"{API_PREFIX}/equipment/{{equipment_id}}/history"
    ]["get"]
    history_page_schema = _resolve_openapi_schema(
        history_operation["responses"]["200"]["content"]["application/json"]["schema"],
        schemas,
    )
    event_array_schema = history_page_schema["properties"]["items"]
    event_schema = _resolve_openapi_schema(event_array_schema["items"], schemas)
    history_fields = {
        "id",
        "event_type",
        "occurred_at",
        "title",
        "description",
        "severity",
        "metadata",
    }
    assert history_fields <= set(event_schema["properties"])
    assert history_fields <= set(event_schema["required"])

    bearer_scheme = document["components"]["securitySchemes"]["BearerAuth"]
    assert bearer_scheme["type"] == "http"
    assert bearer_scheme["scheme"] == "bearer"
    equipment_list_operation = paths[f"{API_PREFIX}/equipment"]["get"]
    operation_security = equipment_list_operation.get("security", document.get("security", []))
    assert any("BearerAuth" in requirement for requirement in operation_security)

    typed_error_operations = (
        (equipment_list_operation, "401"),
        (paths[f"{API_PREFIX}/equipment/{{equipment_id}}"]["get"], "404"),
        (observation_operation, "422"),
    )
    for operation, status_code in typed_error_operations:
        response = operation["responses"][status_code]
        error_schema = _resolve_openapi_schema(
            response["content"]["application/json"]["schema"], schemas
        )
        assert "error" in error_schema["properties"]
        error_detail_schema = _resolve_openapi_schema(
            error_schema["properties"]["error"], schemas
        )
        assert {"code", "message", "details"} <= set(error_detail_schema["properties"])


@pytest.mark.asyncio
async def test_observation_is_persisted_with_equipment_and_reporter(
    api_client: httpx.AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
):
    registered = await _register(api_client)
    headers = _bearer(registered["access_token"])
    payload = {
        "equipment_id": "EQ-001",
        "category": "inspection",
        "severity": "medium",
        "note": "Slight vibration observed near the coupling.",
    }

    response = await api_client.post(
        f"{API_PREFIX}/observations", headers=headers, json=payload
    )
    assert response.status_code in (200, 201), response.text
    observation = response.json()
    assert {"id", "equipment_id", "category", "severity", "note", "status", "created_at"} <= set(
        observation
    )
    assert observation["id"]
    assert {key: observation[key] for key in payload} == payload
    assert observation["status"] == "submitted"
    assert observation["created_at"]

    async with test_session_factory() as session:
        stored = await session.get(FieldObservation, observation["id"])
        linked_equipment_id = await session.scalar(
            select(Equipment.id)
            .join(FieldObservation, FieldObservation.equipment_id == Equipment.id)
            .where(FieldObservation.id == observation["id"])
        )
        user = await session.scalar(select(User).where(User.email == TEST_EMAIL))

    assert stored is not None
    assert stored.equipment_id == "EQ-001"
    assert linked_equipment_id == "EQ-001"
    assert user is not None and stored.reported_by == user.id == registered["_test_user"]["id"]

    missing_equipment = await api_client.post(
        f"{API_PREFIX}/observations",
        headers=headers,
        json={**payload, "equipment_id": "EQ-999"},
    )
    _assert_error_envelope(missing_equipment, 404)


@pytest.mark.asyncio
async def test_demo_seed_helper_is_repeatable(
    test_session_factory: async_sessionmaker[AsyncSession],
):
    async with test_session_factory() as session:
        await seed_demo_data(session)
        await seed_demo_data(session)

    async with test_session_factory() as session:
        equipment_count = await session.scalar(select(func.count()).select_from(Equipment))
        maintenance_count = await session.scalar(
            select(func.count()).select_from(MaintenanceRecord)
        )
        equipment_ids = list(
            (await session.scalars(select(Equipment.id).order_by(Equipment.id))).all()
        )

    assert equipment_count == len(DEMO_EQUIPMENT) == 5
    assert maintenance_count == 4
    assert equipment_ids == [f"EQ-{number:03}" for number in range(1, 6)]


def test_alembic_upgrade_is_repeatable_on_fresh_sqlite_database(tmp_path: Path):
    backend_root = Path(__file__).resolve().parents[1]
    database_path = tmp_path / "platform_migrations.sqlite3"
    environment = os.environ.copy()
    environment.update(
        {
            "APP_ENV": "test",
            "JWT_SECRET": "test-only-platform-migration-secret",
            "DATABASE_URL": f"sqlite+aiosqlite:///{database_path.as_posix()}",
        }
    )

    for _ in range(2):
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=backend_root,
            env=environment,
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, (
            "Alembic upgrade failed.\n"
            f"stdout:\n{result.stdout}\n"
            f"stderr:\n{result.stderr}"
        )

    with sqlite3.connect(database_path) as connection:
        version = connection.execute("SELECT version_num FROM alembic_version").fetchone()
        table_names = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        equipment_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(equipment)")
        }
        observation_columns = {
            row[1]
            for row in connection.execute("PRAGMA table_info(field_observations)")
        }

    assert version == ("d71f2c8b4a91",)
    assert {"equipment", "field_observations"} <= table_names
    assert {"model", "status"} <= equipment_columns
    assert {
        "id",
        "equipment_id",
        "reported_by",
        "category",
        "severity",
        "note",
        "status",
        "created_at",
    } <= observation_columns
