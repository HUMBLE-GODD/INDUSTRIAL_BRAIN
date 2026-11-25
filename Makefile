.PHONY: dev down restart logs logs-backend clean seed verify-graph test shell psql neo4j-shell setup

dev:
	docker compose up --build

down:
	docker compose down

restart: down dev

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

clean:
	docker compose down -v

# Idempotent seed – populates the Knowledge Graph without destroying existing data
seed:
	docker compose exec backend python -m scripts.seed

# Destructive seed – clears all graph data before re-seeding (requires explicit intent)
seed-reset:
	docker compose exec backend python -m scripts.seed --reset

# Run graph verification and exit nonzero on failure
verify-graph:
	docker compose exec -T backend python -c "\
import sys, os; \
os.chdir('/app/knowledge_graph'); \
from verify import run_verification; \
from graph_service import GraphService; \
svc = GraphService(); success = run_verification(svc); svc.close(); sys.exit(0 if success else 1)"

test:
	docker compose exec backend pytest tests/ -v

shell:
	docker compose exec backend bash

psql:
	docker compose exec postgres psql -U epic -d industrial_brain

neo4j-shell:
	@echo "Open http://localhost:7474 in your browser to access Neo4j"

setup:
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example"; else echo ".env already exists"; fi
	$(MAKE) dev
