# 🧠 Industrial Brain — AI Decision Support Platform

An advanced AI-powered decision support platform built as a monorepo for industrial applications. It aggregates data via PostgreSQL, graphs relationships using Neo4j, retrieves vector embeddings with Qdrant, and orchestrates it all using a high-performance FastAPI backend connected to Next.js and Expo React Native frontends.

## 🏗 Architecture

```text
User 
 ├── Web App (Next.js)
 └── Mobile App (Expo React Native)
       ↓ (REST/GraphQL)
 FastAPI Backend (Python)
       ├── Relational Data   → PostgreSQL
       ├── Graph Data        → Neo4j
       ├── Vector Search     → Qdrant
       └── AI/ML Processing  → Gemini / ML Models
```

## 🛠 Tech Stack

| Component | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Web Frontend | Next.js (React) |
| Mobile App | Expo (React Native) |
| Graph Database | Neo4j |
| Vector Database | Qdrant |
| Relational DB | PostgreSQL |
| LLM Integration | Gemini |

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd EPIC
   ```

2. **Run setup:**
   ```bash
   chmod +x scripts/setup_dev.sh
   ./scripts/setup_dev.sh
   ```
   *Alternatively, use `make setup`.*

3. **Access Services:**
   - **Backend API:** [http://localhost:8000](http://localhost:8000)
   - **Neo4j Browser:** [http://localhost:7474](http://localhost:7474) (User: `neo4j`, Pass: `industrial_brain_neo4j`)
   - **Qdrant Dashboard:** [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

## 📁 Project Structure

```
EPIC/
├── backend/       # FastAPI application
├── docs/          # Project documentation
├── frontend/      # Next.js web application
├── ml/            # Machine Learning models, data, and notebooks
├── mobile/        # Expo React Native application
├── scripts/       # Utility and setup scripts
└── shared/        # Shared code and types (TypeScript)
```

## 📋 Available Commands (Make)

| Command | Description |
|---|---|
| `make dev` | Start all services via docker-compose |
| `make down` | Stop all services |
| `make restart` | Restart all services |
| `make logs` | View all container logs |
| `make logs-backend` | View only backend logs |
| `make clean` | Stop containers and remove volumes |
| `make seed` | Seed the database |
| `make test` | Run tests in the backend container |
| `make shell` | Open a bash shell in the backend container |
| `make psql` | Open a psql shell to the PostgreSQL DB |
| `make neo4j-shell`| Opens the Neo4j browser UI |

## 👥 Team

- **M1:** Team Member 1
- **M2:** Team Member 2
- **M3:** Team Member 3
- **M4:** Team Member 4
- **M5:** Team Member 5
- **M6:** Team Member 6

## 📜 License

[MIT License Placeholder]
