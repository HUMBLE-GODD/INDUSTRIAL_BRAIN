# M6 — Mobile Field Workflow

**Estimated work allocation: 10 percentage points toward the 60% project milestone**
**Owner:** Team Member 6
**Primary area:** field asset lookup, issue reporting, and API-backed mobile experience

## What you’ll learn

- **Technical skills:** building a typed API client in Expo; securely storing auth tokens; implementing QR and manual equipment lookup; validating field submissions; handling offline, retry, and permission states.
- **In plain language:** You’ll learn how to build a phone workflow that helps a technician find the right asset, review its available information, and send an observation for follow-up, even when scanning or network access is unavailable.

## Outcome

Make the Expo app useful to a technician standing beside equipment: find an asset, see its current condition and history, ask a question, and submit an observation for follow-up.

## Work to complete

- Add a typed API client with an environment-configured backend URL and secure token storage for M1’s auth contract.
- Connect equipment list and detail to M1’s API. Display the selected asset’s actual status, metrics, maintenance history, linked supplier/failure risk, and compliance summary.
- Implement equipment lookup from a QR scan using an Expo-supported scanner package. Keep a manual equipment-ID entry path available for devices without camera permission or QR hardware.
- Add a field-observation submission flow with `equipment_id`, `category`, `severity`, and `note`, matching M1’s contract. This records an observation only; it does not create a work order. Show the returned observation ID and status; optional photo upload is a stretch task.
- Connect the Ask AI screen to M4’s query API and show answer mode, citations, and an explicit unavailable/error state.
- Implement authentication, loading, empty, offline, and retry states. Remove controls that imply unsupported behavior.
- Keep navigation and core workflows usable on a small screen and with camera permission denied.
- Add focused tests for API mapping, scanner/manual lookup, submission validation, and failure states.

## Ownership boundaries

- Own `mobile/` only. M1 owns backend auth/equipment contracts, M4 owns query/analysis contracts, and M5 owns the web client.
- Coordinate any new endpoint or response field with its backend owner before implementing it.

## Parallel work and integration

- Build against documented API contracts with local fixtures, mocks, or adapters, and do not import another team's unmerged branch. Keep changes in `mobile/` so the PR can be reviewed and integrated independently.

## Acceptance checklist

- [ ] A technician can sign in and load contract-compatible equipment data from a fixture or mock API.
- [ ] Scanning or manually entering `EQ-001` opens the correct equipment detail; the screen does not show fixed values for a different asset.
- [ ] A field observation can be submitted through the agreed contract and its API response is visible on screen.
- [ ] The Ask AI flow shows a sourced answer and citations or a clear empty/error response.
- [ ] Camera denial, no network, expired login, empty equipment results, and retry are handled gracefully.
- [ ] Mobile package lint/typecheck and focused tests pass; no secret is bundled in the client.

## Supervisor demo after all six PRs merge

1. Start the root stack with `make setup`, then seed and verify with `make seed` and `make verify-graph`.
2. Upload the supplied maintenance report from the web app and wait for indexing to finish.
3. Ask: “Which supplier provides components linked to high or critical failure risks across several assets, and what evidence supports that?” Show the cited document excerpts and Neo4j relationships.
4. Open the affected equipment and its recommended follow-up in the web dashboard.
5. Use the mobile app to look up the same equipment by QR or manual ID and submit a field observation.

## PR instructions

Create `team/m6-mobile-field`, push it, and open one PR against `main`. Include screenshots or a short screen recording using clearly labeled fixture data, device/emulator details, permission behavior, test output, and required public environment variables. Invite M1 and M4 to review API-contract compatibility; the PR must run without their branches.
