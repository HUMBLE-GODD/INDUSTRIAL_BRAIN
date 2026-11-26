# Industrial Brain

Industrial Brain is a prototype operations platform for equipment records, field observations, maintenance history, document retrieval, and supplier-risk investigations. All included equipment, maintenance, compliance, graph, and document records are synthetic demo data.

## Run the demo

Requirements: Docker Desktop with Compose, Node.js/npm, and an internet connection the first time the document embedding model is needed.

From the repository root:

```bash
cp .env.example .env
make demo
```

`make demo` starts PostgreSQL, Neo4j, Qdrant, and the FastAPI service, then seeds the SQL records, Neo4j graph, and searchable document fixtures. The seed commands are repeatable. They do not run automatically during application startup. The first document indexing run downloads the embedding model and can take several minutes on CPU.

In a second terminal, start the web app:

```bash
cp frontend/.env.local.example frontend/.env.local
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The example frontend settings use **live API mode**. The included records are synthetic demo data stored in the shared local backend.

### Live API walkthrough

Sign in from the web header with the demo account (`demo@industrialbrain.local` / `industrialbrain-demo`) or create another local account. Then:

1. Open **Equipment**, select `EQ-101` (Demo Factory pump P-102), and inspect the seeded maintenance, failure, metric, and field-observation history. The records are synthetic and stored in PostgreSQL.
2. Open **Knowledge Graph** and **RCA** to inspect the seeded supplier-risk data for the original five assets and Demo Factory assets `EQ-101` through `EQ-103`. The live graph API provides the canvas topology, summaries, supplier risks, and explainable equipment-to-component paths. Select or tap a graph node to inspect its details and connected entities.
3. Open **Maintenance** and **Compliance** to see transparent rule-based results from the seeded SQL records. Maintenance results are heuristics, not machine-learning predictions.
4. For document search and cited answers, ask about the pump manual, annual maintenance report, Demo Factory manual, maintenance log, or compliance register in **AI Query**. `make demo` already runs `make seed-docs`; that target can also be rerun independently. Without a configured Gemini or Groq key, the answer uses the labeled deterministic evidence-summary fallback.
5. Open the printable [Demo Factory QR labels](http://localhost:3000/demo-factory-qr-labels.html) and scan one in the mobile app. The scanner resolves the canonical ID through the same API.

The document fixture loader creates a local account if needed. Its defaults are `demo@industrialbrain.local` / `industrialbrain-demo`; override them with `DEMO_EMAIL` and `DEMO_PASSWORD` if you already registered a different local account.

## API and service URLs

- FastAPI docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/health](http://localhost:8000/health)
- Neo4j Browser: [http://localhost:7474](http://localhost:7474)
- Qdrant dashboard: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

The platform API includes registration/login, authenticated equipment list/detail/history, field observations, graph summary/supplier-risk/RCA queries, document upload/search, maintenance heuristics, compliance rules, and evidence-grounded query responses. See [backend/README.md](backend/README.md) for request and response examples.

## Demo data and reset commands

`make seed-db` upserts eight canonical equipment records, thirteen maintenance records, eight synthetic failures, nine compliance checks, ninety daily telemetry snapshots (thirty per factory asset), six field observations, and the factory suppliers/technicians in PostgreSQL. It leaves the original five equipment IDs and records intact and adds `EQ-101` (pump P-102), `EQ-102` (mixer MX-220), and `EQ-103` (conveyor CV-330). `make seed` adds the matching eight-equipment Neo4j graph, with twenty-one components, eight suppliers, nine failure modes, and four locations. `make seed-docs` uploads the pump manual/report plus the Demo Factory manual, maintenance log, and compliance register. `make demo` runs all three seed targets after setup.

`make seed-reset` deletes all Neo4j nodes and relationships before reseeding. Use it only with a dedicated demo database. `make clean` deletes every Compose volume, including PostgreSQL, Neo4j, Qdrant, and uploaded files.

To switch the website back to its explicitly labeled local UI fixture walkthrough, set `NEXT_PUBLIC_ENABLE_DEMO_DATA=true` and restart the web server.

## Mobile app

The Expo app shares equipment, history, observations, and Ask AI with the website. In another terminal:

```bash
cd mobile
npm ci
cp .env.example .env
npx expo start
```

The example URL works on iOS Simulator. For an Android emulator, use `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1`. For a physical phone on the same network as this computer, replace `localhost` with this computer's LAN IP (on macOS, `ipconfig getifaddr en0` usually shows it). Sign in with the same demo account in both clients; pull down on Home or Equipment in the app, or use Refresh on the website, to see changes saved by the other client. Camera QR scanning requires the iOS or Android app; the QR screen also supports manual ID lookup.

## Project structure

```text
backend/                 FastAPI, API schemas, migrations, and demo fixtures
Knowledge Graph Setup/   Neo4j seed, verification, and demo tools
frontend/                Next.js dashboard
mobile/                  Expo React Native app
team_assignments/        Six scoped team work packages
```

## Team work packages

- [Tatvik — platform and core API](team_assignments/tatvik_platform_data_api.md)
- [Kavyansh — document ingestion](team_assignments/kavyansh_documents_ingestion.md)
- [Hardik — knowledge graph](team_assignments/hardik_knowledge_graph.md)
- [Prathmesh — decision services](team_assignments/prathmesh_decision_services.md)
- [Anchal — web dashboard](team_assignments/anchal_web_dashboard.md)
- [Surbhi — mobile field app](team_assignments/surbhi_mobile_field_app.md)

## Safety and project status

This repository contains demonstration software and synthetic records. It has not been validated for a live plant or safety-critical operations. Human operators must review all results. Production deployment requires a strong unique `JWT_SECRET`, managed credentials, and operational hardening; the `.env.example` values are for local development only.
