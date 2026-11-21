# M4 — AI Query, Maintenance, and Compliance Services

**Estimated work allocation: 10 percentage points toward the 60% project milestone**
**Owner:** Team Member 4
**Primary area:** evidence-grounded query responses, maintenance predictions, and compliance gaps

## What you’ll learn

- **Technical skills:** designing typed API endpoints; combining vector search and graph evidence; preserving citation provenance across LLM and deterministic response paths; adding timeouts, fallbacks, and focused tests with fake services.
- **In plain language:** You’ll learn how to turn documents and graph relationships into answers people can trace back to evidence, and how to explain rule-based maintenance and compliance results without presenting them as trained predictions.

## Outcome

Deliver the supervisor-demo feature: ask an industrial question, combine document evidence with graph relationships, and return a traceable answer with citations and a practical next step.

## Work to complete

- Implement `POST /api/v1/query` with a typed request and response. Use M2’s Qdrant search and M3’s graph evidence service; return citations with document ID, title, page/row, chunk ID, and excerpt.
- Add Gemini as the configured provider and Groq as fallback when keys are present. If no provider is configured, return a clearly labelled deterministic evidence summary so the demo still works without secret keys.
- Never invent citations or assert an inferred supplier cause as proven fact. Separate retrieved facts, model-generated summary, confidence/source mode, and recommendations.
- Implement `GET /api/v1/maintenance/predictions` and `GET /api/v1/compliance/gaps` using available demo records and transparent rules. Label heuristic estimates; do not present them as trained model outputs.
- Add bounded timeouts, error handling, and structured logging for external LLM calls. Keep API keys out of responses and logs.
- Add focused tests using fake vector/graph/LLM services so the core behavior does not require external API keys.

## Ownership boundaries

- Own query/analysis routes and the decision-service layer. M2 owns document indexing; M3 owns graph storage and supplier-risk queries; M1 owns schema and auth.
- M5 and M6 consume the published OpenAPI contract. Notify both when response fields change.

## Parallel work and integration

- Keep M2/M3 calls behind adapters that follow their documented contracts, and use local fixtures or fakes until concrete services are available; do not import another team's unmerged branch. Keep changes within the query/analysis routes and decision-service layer so the PR can be reviewed and integrated independently.

## Acceptance checklist

- [ ] With contract-compatible local fixtures, the seeded question “Which supplier is linked to repeated component failures, and what evidence supports that?” returns an answer with graph evidence and document citations.
- [ ] The no-key path works and clearly labels its deterministic answer mode.
- [ ] The configured Gemini/Groq path has timeout and fallback behavior and preserves citations from retrieval.
- [ ] Maintenance and compliance endpoints return structured, explainable results for the demo dataset.
- [ ] Missing assets, empty retrieval, provider failure, and invalid input return useful status codes and messages.
- [ ] Tests cover citations, no-key behavior, provider failure, and the three analysis endpoints.

## PR instructions

Create `team/m4-decision-services`, push it, and open one PR against `main`. Include a redacted request/response transcript using contract-compatible fixtures, tests, and the source of each deterministic rule. Invite M2 and M3 to review the service interfaces; the PR must run without their branches.
