.PHONY: dev down restart logs logs-backend clean seed seed-db seed-reset verify-graph test shell psql neo4j-shell setup

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

seed:
	docker compose exec backend python /opt/knowledge-graph/seed.py

seed-db:
	docker compose exec backend python -m scripts.seed_demo

seed-reset:
	docker compose exec backend python /opt/knowledge-graph/seed.py --reset

verify-graph:
	docker compose exec backend python /opt/knowledge-graph/verify.py

test:
	docker compose exec backend pytest tests/ -v

shell:
	docker compose exec backend bash

psql:
	docker compose exec postgres sh -lc 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

neo4j-shell:
	@echo "Open http://localhost:7474 in your browser to access Neo4j"

setup:
	./scripts/setup_dev.sh
