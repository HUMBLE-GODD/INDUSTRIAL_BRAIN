# Platform API contract

The backend exposes the first shared REST contract under `/api/v1`. FastAPI
serves its interactive documentation at `http://localhost:8000/docs` and its
OpenAPI JSON at `http://localhost:8000/api/v1/openapi.json`. The OpenAPI
document is versioned with the application (`1.0.0`) and is the source of truth
for client adapters.

## Authentication

Register and log in with JSON credentials. Both endpoints return a bearer
access token; send it on protected requests as `Authorization: Bearer <token>`.

```http
POST /api/v1/auth/register
Content-Type: application/json

{"email":"tech@example.com","password":"replace-with-a-strong-password"}
```

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"tech@example.com","password":"replace-with-a-strong-password"}
```

The access token uses `JWT_SECRET`, `JWT_ALGORITHM`, and `JWT_EXPIRE_MINUTES`
from the environment. Development can use the placeholder from `.env.example`.
Set `APP_ENV=production` and provide a unique secret before deployment; startup
fails with a clear configuration error if the production secret is missing or
is a known development placeholder. Passwords are hashed before they are
stored.

## Equipment and history

All equipment endpoints require a bearer token. `GET /api/v1/equipment`
supports `page` (default `1`) and `page_size` (default `20`, maximum `100`).
Responses use a stable envelope:

```json
{
  "items": [
    {
      "id": "EQ-001",
      "name": "Centrifugal Pump P-101",
      "type": "Pump",
      "model": "CP-3500X",
      "manufacturer": "FlowTech",
      "status": "operational",
      "criticality": "high",
      "location": "Plant A — Floor 1",
      "install_date": "2020-03-15T00:00:00Z",
      "created_at": "2026-11-26T10:30:00Z",
      "updated_at": "2026-11-26T10:30:00Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 5,
  "pages": 1
}
```

`GET /api/v1/equipment/{equipment_id}` returns one equipment record or a
structured `404` error. `GET /api/v1/equipment/{equipment_id}/history` returns
a page of typed timeline events (maintenance, failure, alert, metric, or field
observation when present) in the same pagination envelope. The PostgreSQL demo
seed uses the graph's canonical equipment keys `EQ-001` through `EQ-005`; the
human-readable tags such as `P-101` are part of each asset's name.

## Field observations

`POST /api/v1/observations` records a technician observation against an
existing equipment ID. It creates an observation record only; it does not
create a work order.

```http
POST /api/v1/observations
Authorization: Bearer <token>
Content-Type: application/json

{
  "equipment_id": "EQ-001",
  "category": "inspection",
  "severity": "medium",
  "note": "Slight vibration observed near the pump coupling."
}
```

The response contains the stable observation `id`, the submitted fields, a
`submitted` status, and its UTC `created_at` timestamp. The authenticated user
is stored as the `reported_by` user ID.

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "9e7862d8-b6dd-4da8-88bd-a647b6014bf1",
  "equipment_id": "EQ-001",
  "reported_by": "4f73e7c0-e124-4eab-a24b-1067fac3f2d7",
  "category": "inspection",
  "severity": "medium",
  "note": "Slight vibration observed near the pump coupling.",
  "status": "submitted",
  "created_at": "2026-11-26T10:30:00Z"
}
```

`Document.status` uses the shared lower-case states `uploaded`, `processing`,
`processed`, and `failed` in both the PostgreSQL enum and the API contract.

## Errors

API errors use the same envelope, including authorization, not-found, and
request-validation failures:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      {"loc": ["body", "email"], "msg": "Field required", "type": "missing"}
    ]
  }
}
```

Expected status codes are `401` for missing/invalid credentials, `404` for an
unknown equipment ID, `409` for a duplicate registration, and `422` for invalid
request data. Clients can display `message` and use `code` for stable handling.

## Local database workflow

Compose applies Alembic migrations before starting the API. A fresh database
and a repeated upgrade can be run with:

```bash
docker compose up --build -d
docker compose exec backend alembic upgrade head
```

Demo rows are opt-in and are not created by application startup. Seed the
canonical equipment and sample maintenance history with:

```bash
make seed-db
```

The command can be repeated safely. It uses the IDs and core equipment labels
from `Knowledge Graph Setup/seed.py`.

Run the focused contract and migration tests from the backend directory with:

```bash
pytest tests/test_platform_api.py -q
```
