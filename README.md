# 🧠 Industrial Brain — AI Decision Support Platform

Industrial Brain is a prototype decision-support platform for plant operations. Its planned workflows combine equipment and maintenance records with manuals, reports, and supplier/failure relationships so engineers can investigate issues and make maintenance decisions.

## 🏗 Target Architecture

```text
User 
 ├── Web App (Next.js)
 └── Mobile App (Expo React Native)
       ↓ (REST + WebSocket)
 FastAPI Backend (Python)
       ├── Relational Data   → PostgreSQL
       ├── Graph Data        → Neo4j
       ├── Vector Search     → Qdrant
       └── AI/ML Processing  → Gemini / local models (planned)
```

This is the planned end-state architecture. In the current prototype, the web and mobile clients still use local demo data, and the full REST, WebSocket, and Gemini workflows are not yet connected end to end.

## 🛠 Tech Stack

This table lists the selected target technologies; some integrations remain planned work.

| Component | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Web Frontend | Next.js (React) |
| Mobile App | Expo (React Native) |
| Graph Database | Neo4j |
| Vector Database | Qdrant |
| Relational DB | PostgreSQL |
| LLM Integration | Gemini (planned; not wired into the current prototype) |

## Project Overview and 100% Completion Goal

Industrial Brain is being built to help people who operate and maintain factories find useful information across scattered equipment records, manuals, inspection reports, and maintenance history. In plain terms, it aims to connect an asset, its parts, the documents about it, and the problems it has had so a technician or supervisor can make a better-informed decision from one place.

### Key deliverables

- **Shared platform and equipment API (M1):** secure accounts, consistent equipment records, maintenance history, and a stable interface for the other parts of the system.
- **Document intake and evidence search (M2):** upload manuals and reports, extract searchable text, and keep page or row references so users can check the original source.
- **Knowledge graph and root-cause evidence (M3):** map equipment, components, suppliers, locations, and failure modes to reveal related risks and explain how they connect.
- **Decision services (M4):** answer questions using document and graph evidence, show citations, and provide clearly labeled maintenance and compliance analysis.
- **Supervisor dashboard (M5):** view assets, evidence, supplier risks, maintenance, and compliance information on the web.
- **Technician mobile workflow (M6):** look up an asset by QR code or ID, review available information, ask a question, and submit a field observation.

### What 100% completion could help with in real operations

At the intended 100% completion point—after all planned features are implemented, connected, and validated with approved operational data—the system could help teams:

- Find relevant manual passages and incident history faster while troubleshooting equipment.
- Spot common component or supplier risks across several assets, with links to the evidence behind the finding.
- Prioritize inspections and maintenance using recorded history and, once trained and evaluated, predictive models.
- Track compliance requirements and surface possible gaps with supporting records.
- Keep field observations, equipment records, and supervisor follow-up in one connected workflow.
- Send timely notifications about issues that meet agreed risk or maintenance rules.

These are intended decision-support capabilities, not claims that the current prototype provides them all. Full completion also includes testing and evaluating models on representative data, production security and privacy controls, monitoring, reliable deployment and recovery, and end-to-end validation with plant users. Recommendations should remain reviewable by qualified staff, who make and approve operational decisions.

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/HUMBLE-GODD/INDUSTRIAL_BRAIN.git
   cd INDUSTRIAL_BRAIN
   ```

2. **Run setup:**
   ```bash
   chmod +x scripts/setup_dev.sh
   ./scripts/setup_dev.sh
   ```
   *Alternatively, use `make setup`.*

3. **Access Services:**
   - **Backend API:** [http://localhost:8000](http://localhost:8000)
   - **API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Neo4j Browser:** [http://localhost:7474](http://localhost:7474) (User: `neo4j`, Pass: `industrial_brain_neo4j`)
   - **Qdrant Dashboard:** [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

The web and mobile apps run separately from Compose:

```bash
cd frontend && npm ci && npm run dev
```

```bash
cd mobile && npm ci && npx expo start
```

The current clients use local demo data. End-to-end API workflows are part of the team assignments under `team_assignments/`.

The backend container installs CPU-only PyTorch, so local embedding work runs on the CPU without CUDA libraries. On ARM-based machines, this avoids pulling the large CUDA packages that are not used. The first embedding operation or vector integration test downloads the BGE model from Hugging Face; keep an internet connection available for that first run.

For any non-local deployment, set `APP_ENV=production` and provide a unique `JWT_SECRET`; the application rejects the development placeholder in production mode.

## 📁 Project Structure

```
INDUSTRIAL_BRAIN/
├── backend/       # FastAPI application
├── Knowledge Graph Setup/ # Neo4j schema, seed, verify, and demo tools
├── frontend/      # Next.js web application
├── ml/            # Machine Learning models, data, and notebooks
├── mobile/        # Expo React Native application
├── scripts/       # Utility and setup scripts
├── shared/        # Reserved for shared web/mobile types and API clients
└── team_assignments/ # Six scoped team work packages
```

## 📋 Available Commands (Make)

| Command | Description |
|---|---|
| `make dev` | Start all services via docker-compose |
| `make down` | Stop all services |
| `make restart` | Restart all services |
| `make logs` | View all container logs |
| `make logs-backend` | View only backend logs |
| `make clean` | Stop containers and remove local database volumes |
| `make seed` | Idempotently seed the demo knowledge graph |
| `make seed-reset` | Clear and reseed the dedicated demo graph |
| `make verify-graph` | Verify the demo knowledge graph and fail on errors |
| `make test` | Run tests in the backend container |
| `make shell` | Open a bash shell in the backend container |
| `make psql` | Open a psql shell to the PostgreSQL DB |
| `make neo4j-shell`| Opens the Neo4j browser UI |

## Supervisor Demo Milestone

The six team packages below are estimated to complete about 60% of the planned project scope needed for a supervisor demo, split evenly at 10 percentage points per member. This percentage describes project work, not the share of words in this README or the current completion level of the codebase. Count a package complete only after its acceptance checklist passes and its PR is merged. The remaining estimated 40% includes full ML training/evaluation on real datasets, push notifications, production security/operations, and deployment hardening.

| Member | Assignment | Weight |
|---|---|---:|
| M1 | [Platform, data contract, and core API](team_assignments/M1_PLATFORM_DATA_API.md) | 10% |
| M2 | [Document intake and evidence index](team_assignments/M2_DOCUMENTS_INGESTION.md) | 10% |
| M3 | [Knowledge graph and supplier-risk evidence](team_assignments/M3_KNOWLEDGE_GRAPH.md) | 10% |
| M4 | [AI query and decision services](team_assignments/M4_DECISION_SERVICES.md) | 10% |
| M5 | [Web dashboard integration](team_assignments/M5_WEB_DASHBOARD.md) | 10% |
| M6 | [Mobile field workflow](team_assignments/M6_MOBILE_FIELD_APP.md) | 10% |

### Independent parallel work

All six members can work from the current `main`; no assignment requires another team's branch to be merged first. Use the contracts in the assignment files and current repository, with local fixtures, mock APIs, or adapters for services another team is building. Do not import code from an unmerged branch. Keep each PR limited to its owned files and make its build and tests pass on its own. Record any contract assumptions so they can be reconciled during integration.

After the six independent PRs are merged, wire the adapters to the real services and run the combined demo: upload a document, show a cited supplier-risk answer, follow up on the equipment in the dashboard, and submit a technician observation from mobile. Count the 60% milestone only after this integration and the acceptance criteria pass.

## 👥 Team

- **M1:** Tatvik
- **M2:** Kavyansh
- **M3:** Hardik
- **M4:** Prathmesh
- **M5:** Anchal
- **M6:** Surbhi

`make clean` deletes local database volumes, including stored demo data.
`make seed-reset` deletes every node and relationship in the configured Neo4j database before reseeding; use it only with a dedicated demo database.

## 📜 License

License selection is pending.
