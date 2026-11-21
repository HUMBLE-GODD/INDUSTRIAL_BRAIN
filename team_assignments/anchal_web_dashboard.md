# Anchal — Web Dashboard Integration

**Estimated work allocation: 10 percentage points toward the 60% project milestone**
**Owner:** Anchal
**Primary area:** connect the Next.js dashboard to the API and present evidence clearly

## What you’ll learn

- **Technical skills:** building a typed API client in Next.js; configuring public environment variables; handling loading, empty, stale, and error states; integrating auth tokens; making responsive and accessible data views.
- **In plain language:** You’ll learn how to connect a web dashboard to live backend data and help supervisors understand what the system knows, where an answer came from, and when data is unavailable.

## Outcome

Turn the current web prototype into the supervisor’s control-room view. The dashboard must show live API data, and the AI query screen must display source citations from Prathmesh.

## Work to complete

- Build one typed API client using the `/api/v1` contract. Configure the API base URL through a public environment variable; do not hardcode localhost into page components.
- Replace `mockData.ts` as the default source for dashboard KPIs, equipment, documents, maintenance, graph, RCA, and compliance pages. Keep a clearly labelled demo fallback only when the API is unavailable.
- Add loading, empty, stale, and error states to data-driven pages. Do not show fabricated metrics as live results.
- Connect document upload/list/status to Kavyansh; connect AI query and citations to Prathmesh; connect supplier-risk graph and RCA to Hardik; connect equipment detail to Tatvik; connect maintenance/compliance pages to Prathmesh.
- Add sign-in and token handling for Tatvik’s auth contract. Handle expired sessions without losing the user’s current form input.
- Preserve the existing visual system and ensure tables, dialogs, and graph/evidence views work at desktop and narrow widths.
- Add component or route-level tests for API states, source links, forms, and keyboard accessibility.

## Ownership boundaries

- Own `frontend/` only. Tatvik, Kavyansh, Hardik, and Prathmesh own backend contracts and Surbhi owns the mobile client.
- Do not change server response shapes to fit a page; request a contract update and coordinate it with the route owner.

## Parallel work and integration

- Build against the documented API contract using a local fixture or mock server, and do not import another team's unmerged branch. Keep changes in `frontend/` so the PR can be reviewed and integrated independently.

## Acceptance checklist

- [ ] Dashboard and equipment pages render contract-compatible API data with stable loading/error/empty states.
- [ ] With fixture or mock responses, document upload status and source material appear in the document list.
- [ ] The supervisor question displays the returned answer, evidence excerpts, and citations that open the correct document/page.
- [ ] Graph, RCA, maintenance, and compliance pages display API results and distinguish heuristic results from trained-model output.
- [ ] Sign-in follows the backend token contract; invalid and expired sessions show a clear recovery path.
- [ ] No API call is made directly from a server component with an exposed secret; public config contains no credentials.
- [ ] `npm ci`, lint, typecheck, build, and focused UI tests pass.

## PR instructions

Create `team/anchal-web-dashboard`, push it, and open one PR against `main`. Include screenshots of the fixture-backed dashboard and cited answer, clearly labeled as fixture data, a list of environment variables, and command output for lint/typecheck/build. Invite Tatvik, Kavyansh, Hardik, and Prathmesh to review API-contract compatibility; the PR must run without their branches.
