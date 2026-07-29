.PHONY: dev down restart logs logs-backend clean seed test shell psql neo4j-shell setup

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
	docker compose exec backend python -m scripts.seed

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
