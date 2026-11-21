# Knowledge Graph — Hardik, Phase 1

Neo4j-based knowledge graph for the Industrial Brain project.
The standalone demo needs Docker and the Python dependencies in `requirements.txt`.

---

## Folder Structure

```
Knowledge Graph Setup/
├── graph_service.py     <- Reusable CRUD service class (import this everywhere)
├── seed.py              <- Populates Neo4j with 5 equipment + full relationships
├── verify.py            <- Checks all nodes/relationships are correctly created
├── demo.py              <- Live demo of the GraphService API
├── docker-compose.yml   <- Starts Neo4j with one command
├── requirements.txt     <- Python dependencies
├── .env.example         <- Copy to .env for local credentials
└── README.md            <- You are here
```

---

## Quick Start (3 steps)

Use this standalone stack when the root `docker compose` stack is not running; both stacks use the same local Neo4j ports.

### Step 1 - Start Neo4j
```bash
cd "Knowledge Graph Setup"
docker compose up -d
```
Neo4j Browser -> http://localhost:7474
Login: neo4j / industrial_brain_neo4j (or the password you set in `.env`)

### Step 2 - Install Python deps and configure env
```bash
python -m pip install -r requirements.txt
cp .env.example .env
# Edit .env if you want a different Neo4j password.
```

### Step 3 - Seed and Verify
```bash
python seed.py      # populates the graph
python verify.py    # confirms everything is correct
python demo.py      # optional: interactive API walkthrough
```

Seeding is safe to repeat and merges the sample records. To clear the graph first, use `python seed.py --reset` only with a dedicated demo database. The root Compose stack also exposes `make seed` and `make verify-graph`.

---

## Graph Schema

### Node Labels

| Label              | ID Property        | Key Properties                                       |
|--------------------|--------------------|------------------------------------------------------|
| Equipment          | equipment_id       | name, type, model, manufacturer, status, criticality |
| Component          | component_id       | name, type                                           |
| Supplier           | supplier_id        | name, country, rating                                |
| Location           | location_id        | name, building, floor                                |
| FailureMode        | failure_mode_id    | name, severity, typical_cause                        |
| MaintenanceRecord  | record_id          | (used in later phases)                               |
| Inspection         | inspection_id      | (used in later phases)                               |
| Document           | document_id        | (used in later phases)                               |
| Technician         | technician_id      | (used in later phases)                               |
| Regulation         | regulation_id      | (used in later phases)                               |

### Relationship Types

| Relationship    | From      | To          | Meaning                         |
|-----------------|-----------|-------------|---------------------------------|
| HAS_COMPONENT   | Equipment | Component   | Equipment contains component    |
| SUPPLIED_BY     | Component | Supplier    | Component was made by supplier  |
| LOCATED_AT      | Equipment | Location    | Equipment sits at this location |
| PRONE_TO        | Component | FailureMode | Component has this failure risk |
| SIMILAR_TO      | Equipment | Equipment   | Equipment shares characteristics|

### Architecture Diagram

```
         +------------------+
         |    Location      |
         +--------+---------+
                  | LOCATED_AT
         +--------v---------+     HAS_COMPONENT     +-------------+
         |    Equipment     | --------------------> |  Component  |
         +--------+---------+                       +------+------+
                  | SIMILAR_TO                             |
         +--------v---------+          SUPPLIED_BY  +------v------+
         |    Equipment     | <------------------- |   Supplier  |
         +------------------+                       +------+------+
                                                           |
                                         PRONE_TO  +------v------+
                                       ----------> | FailureMode |
                                                   +-------------+
```

---

## Seeded Data

### 5 Equipment Nodes

| ID     | Name                   | Type           | Criticality | Status      |
|--------|------------------------|----------------|-------------|-------------|
| EQ-001 | Centrifugal Pump P-101 | Pump           | High        | Operational |
| EQ-002 | Heat Exchanger HX-202  | Heat Exchanger | Medium      | Operational |
| EQ-003 | Compressor C-305       | Compressor     | High        | Maintenance |
| EQ-004 | Conveyor Belt CB-410   | Conveyor       | Low         | Operational |
| EQ-005 | Boiler BLR-501         | Boiler         | Critical    | Operational |

### 5 Suppliers

| ID     | Name              | Country | Rating          |
|--------|-------------------|---------|-----------------|
| SUP-001| AlphaSeals Ltd    | Germany | 4.5             |
| SUP-002| BetaBearings Inc  | USA     | 3.8             |
| SUP-003| GammaFluids Co    | India   | 4.1             |
| SUP-004| DeltaMotors GmbH  | Germany | 4.7             |
| SUP-005| EpsilonValves Ltd | UK      | 2.9  <<HIDDEN>> |

Also seeded: 12 Components, 5 Failure Modes, 3 Locations

---

## Hidden Failure Pattern

EpsilonValves Ltd (SUP-005, rating 2.9) supplies components across
3 different equipment. All three components are linked to failure modes,
including two high/critical risks and one medium-severity risk:

  - CMP-005  Shell Gasket on HX-202      -> Seal Leakage (high)
  - CMP-006  Inlet Valve on C-305        -> Valve Sticking (medium)
  - CMP-011  Safety Relief Valve BLR-501 -> Pressure Buildup (CRITICAL)

Run this Cypher in Neo4j Browser to expose it:

```cypher
MATCH (s:Supplier)<-[:SUPPLIED_BY]-(c:Component)-[:PRONE_TO]->(fm:FailureMode)
RETURN s.name AS supplier, s.rating AS rating,
       collect(fm.name) AS failure_modes,
       count(fm) AS risk_count
ORDER BY risk_count DESC
```

---

## GraphService API Reference

```python
from graph_service import GraphService

with GraphService() as svc:

    # --- Schema (run once, idempotent) ---
    svc.create_constraints_and_indexes()

    # --- Node CRUD ---
    svc.create_node("Equipment", {"equipment_id": "EQ-010", "name": "Motor"})
    svc.merge_node("Equipment", {"equipment_id": "EQ-010"}, {"status": "idle"})
    svc.get_node("Equipment", "equipment_id", "EQ-001")
    svc.update_node("Equipment", "equipment_id", "EQ-001", {"status": "maintenance"})
    svc.delete_node("Equipment", "equipment_id", "EQ-010")
    svc.list_nodes("Equipment", limit=50)

    # --- Relationship CRUD ---
    svc.create_relationship(
        "Equipment", "equipment_id", "EQ-001",
        "HAS_COMPONENT",
        "Component", "component_id", "CMP-001",
    )
    svc.merge_relationship(...)   # create only if not exists
    svc.get_relationships(
        "Equipment", "equipment_id", "EQ-001",
        rel_type="HAS_COMPONENT",  # optional filter
        direction="out",           # "out" | "in" | "both"
    )

    # --- Raw Cypher ---
    svc.run_query("MATCH (e:Equipment) RETURN e.name LIMIT 5")

    # --- Stats ---
    svc.count_nodes("Equipment")
    svc.count_relationships()
    svc.graph_summary()
```

---

## Deliverable Checklist (Hardik - Phase 1)

- [x] Neo4j connection configured and verified
- [x] All 10 node label UNIQUE constraints created (IF NOT EXISTS)
- [x] 6 additional property indexes created (IF NOT EXISTS)
- [x] Seed script creates 5 equipment nodes with components and relationships
- [x] Suppliers, locations, and failure modes seeded
- [x] Hidden failure pattern built in (EpsilonValves on 3 equipment)
- [x] Reusable GraphService class with full CRUD for nodes and relationships
- [x] Repeatable seed script merges demo records without clearing the graph by default
- [x] verify.py checks 13 assertions and exits nonzero if any fail
- [x] demo.py shows live API usage
- [x] docker-compose.yml for zero-config local setup
