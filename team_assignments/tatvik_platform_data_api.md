# Tatvik — Platform, Data Contract, and Core API

**Estimated work allocation: 10 percentage points toward the 60% project milestone**
**Owner:** Tatvik
**Primary area:** backend foundation, PostgreSQL schema, identity, and equipment reference APIs

## Outcome

Give the other five members a stable API and canonical demo data to build against. The same equipment IDs and response shapes must be used by the backend, Neo4j seed, web app, and mobile app.

## What you’ll learn

- **Technical skills:** defining API schemas in OpenAPI; building JWT authentication and protected FastAPI routes; managing PostgreSQL models, Alembic migrations, and repeatable demo seeding.

**In plain language:** You’ll learn how to give the rest of the team a reliable way to share equipment data and user access.

## Work to complete

- Review the existing SQLAlchemy models and Alembic migration. Make upgrades work from a fresh database and make a second upgrade a no-op.
- Define request/response schemas and consistent error responses for `/api/v1`. Use the shared document states `uploaded`, `processing`, `processed`, and `failed`, and include the field-observation metadata needed by Surbhi. Publish an early, versioned API contract in OpenAPI for the other teams to build against.
- Implement registration/login with the configured JWT settings, password hashing, and a reusable current-user dependency. Keep secrets in environment variables; fail clearly when a production secret is missing.
- Implement authenticated `GET /api/v1/equipment`, `GET /api/v1/equipment/{equipment_id}`, and `GET /api/v1/equipment/{equipment_id}/history` endpoints.
- Implement authenticated `POST /api/v1/observations` for an observation-only report with `equipment_id`, `category`, `severity`, and `note`. Return a stable observation ID, status, and creation time; this endpoint does not create a work order.
- Add or reconcile the `Document` processing-state and `FieldObservation` persistence models so Kavyansh and Surbhi do not create competing schemas.
- Seed a small, deterministic PostgreSQL demo dataset using the same equipment IDs as `Knowledge Graph Setup/seed.py`. Keep demo seeding idempotent and separate it from production startup.
- Keep database connection, migration, and error behavior consistent with the current health endpoint and Compose setup.

## Ownership boundaries

- Own `backend/app/models/`, `backend/alembic/`, shared API schemas, and the auth/equipment route modules.
- Other members should propose shared schema changes through the API contract; only the Tatvik owner edits shared migrations.
- Kavyansh owns document parsing and vector indexing. Hardik owns Neo4j graph operations. Prathmesh owns AI and operational analysis endpoints. Anchal and Surbhi own their clients.

## Parallel work and integration

Other members can develop against the versioned OpenAPI contract using local fixtures, mocks, or adapters; they do not need to wait for the Tatvik implementation branch or any other unmerged branch. Keep work within the ownership areas above, coordinate contract changes, and include examples that make each PR reviewable and ready to integrate independently.

## Acceptance checklist

- [ ] A fresh database reaches Alembic `head`; repeated upgrade succeeds.
- [ ] Login returns a usable JWT; invalid credentials return 401; protected routes reject missing or invalid tokens.
- [ ] Equipment list/detail/history return typed, paginated data and useful 404/422 errors.
- [ ] The observation contract and examples document the request and response fields; an observation is persisted, tied to a valid equipment record, and returned with a stable ID and status.
- [ ] PostgreSQL and Neo4j use the same canonical equipment IDs and core labels.
- [ ] Demo data seeding can be run twice without duplicate rows.
- [ ] API schemas and example requests are visible in `/docs` and documented for the other five team members.
- [ ] Add focused tests for auth, equipment responses, migration behavior, and repeated seeding.

## PR instructions

Create `team/tatvik-platform-api`, push it, and open one PR against `main`. Include the API contract, migration notes, setup changes, and test output in the PR description. Invite the other five team members to review contract compatibility; their implementations can proceed independently with fixtures and adapters. Do not commit real credentials or merge directly to `main`.
