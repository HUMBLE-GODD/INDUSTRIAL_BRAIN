# M3 — Knowledge Graph and Supplier-Risk Evidence

**Estimated work allocation: 10 percentage points toward the 60% project milestone**
**Owner:** Team Member 3
**Primary area:** Neo4j integration, graph population, and explainable relationship queries

## Outcome

Make the Neo4j model usable by the API and surface a concrete, explainable supplier-risk finding from equipment, component, supplier, and failure relationships.

## What you’ll learn

- **Technical skills:** connecting FastAPI services to Neo4j with its async driver; repeatable graph seeding and parameterized Cypher; building explainable supplier-risk and failure-analysis APIs.

**In plain language:** You’ll learn how to follow the links between equipment, parts, suppliers, and failures to show why a risk finding was made.

## Work to complete

- Keep the labels and relationships in `Knowledge Graph Setup/graph_service.py` aligned with M1’s canonical equipment IDs and backend schemas.
- Integrate graph operations with the FastAPI lifecycle using the async Neo4j driver in `backend/app/db/neo4j.py`. Avoid blocking synchronous driver calls inside request handlers.
- Implement idempotent graph population from the approved demo dataset. Preserve the safe default seed behavior; destructive resets must require an explicit flag.
- Add `GET /api/v1/graph/summary` and `GET /api/v1/graph/supplier-risks`. Return supplier, rating, affected equipment, components, failure modes, severity, and counts.
- Add `GET /api/v1/rca/{equipment_id}` with a graph-derived timeline of linked failures and contributing equipment/component/supplier evidence.
- Parameterize values and validate labels/relationship types. Keep raw Cypher restricted to trusted code.
- Add a small service layer that M4 can call for equipment context and supplier-risk evidence.
- Update graph verification to assert the hidden demo pattern and to exit nonzero on any failed check.

## Ownership boundaries

- Own graph API routes and backend graph repositories/services. Coordinate any changes in `Knowledge Graph Setup/` with M1 because the seed IDs are shared data.
- M2 owns document extraction and vector indexing. M4 owns answer generation and maintenance/compliance analysis. M3 owns graph-derived RCA.
- Do not add a second source of truth for equipment IDs or supplier names.

## Parallel work and integration

Build against M1’s documented API contract and canonical demo IDs, using local fixtures, mocks, or an adapter for services that are still in progress. Do not import another team’s unmerged branch or wait for it to be ready. Keep changes within the ownership areas above, document contract needs, and include examples so the PR can be reviewed and integrated independently.

## Acceptance checklist

- [ ] The graph can be populated repeatedly without duplicate nodes or relationships.
- [ ] The seeded demo has five equipment, twelve components, five suppliers, five failure modes, and three locations.
- [ ] The supplier-risk response identifies EpsilonValves across three equipment and distinguishes medium from high/critical severity.
- [ ] RCA returns an explainable relationship timeline for a seeded equipment ID and a useful not-found response for an unknown ID.
- [ ] API responses include the graph evidence needed to explain a finding; no user-provided Cypher is executed.
- [ ] Neo4j unavailability produces a clear degraded response and does not leak credentials.
- [ ] Tests cover idempotent population, graph query results, invalid identifiers, and verification failures.
- [ ] `make seed` and `make verify-graph` work from the root project instructions.

## PR instructions

Create `team/m3-knowledge-graph`, push it, and open one PR against `main`. Include a sample supplier-risk response and the command output from graph verification. Invite M1 to review shared equipment/data changes and M4 to review the graph-service contract; do not wait for their implementation branches to be ready.
