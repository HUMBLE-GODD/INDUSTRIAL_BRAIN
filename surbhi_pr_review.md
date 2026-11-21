# Review of Surbhi’s Mobile PR

## PR identified

The matching item in local Git history is **PR #3**, titled **“feat(mobile): Member 6 - Phase 1 Mobile App Skeleton.”** The merge commit is `c449d0c`; the reviewed PR snapshot is `b9515c4` (`feat(mobile): implement Phase 1 M6 mobile app skeleton with 5-tab navigation and dark industrial theme`).

This is an informational review for Surbhi; it does not change the merged PR or send a message to her.

This report reviews the code at that commit, not the current working tree. I found no separate Surbhi PR document in the repository, and the GitHub PR description could not be retrieved in this session. Some items below are incomplete features that may have been intended for a skeleton; they are still gaps because the screens look functional or make claims that the code does not support.

## Problems found

| Priority | Area | Problem in the PR snapshot | Why it matters |
|---|---|---|---|
| High | Equipment list and detail | `mobile/src/screens/equipment/EquipmentListScreen.tsx:18-25` uses six mock IDs such as `P-101`, `C-205`, and `M-301`, rather than the graph’s canonical `EQ-001`–`EQ-005` IDs. `EquipmentDetailScreen.tsx:17-34` then fills every selected asset with the same hardcoded pump type, manufacturer, health score, components, and failures. | Selecting a compressor or exchanger still displays pump information. Users could associate the wrong condition or maintenance details with an asset. |
| High | QR scanner | `mobile/src/screens/scan/ScanScreen.tsx:14-29` renders a camera-shaped placeholder and says a QR code will be detected, but the PR contains no camera/scanning implementation or manual ID entry. | The screen promises an equipment lookup workflow that cannot be used. |
| High | Ask AI | `mobile/src/screens/query/QueryScreen.tsx:42-60` creates a canned local reply for every submitted question. The screen says “Powered by GraphRAG + Gemini” at line 83, but this PR makes no backend request and returns no evidence citations or service errors. | A user could mistake a placeholder response for a real, sourced answer. The UI claim and behavior disagree. |
| Medium | Settings and controls | `SettingsScreen.tsx:8-9, 23-24` changes notification and dark-mode values only in component state; the theme itself is fixed in `src/theme/colors.ts`. Menu rows at lines 69-83 and the logout button at lines 89-92 have no action handlers. | The controls look active but do not change the app theme, configure notifications, navigate, or sign out. |
| Medium | Demo data consistency | The equipment list (`EquipmentListScreen.tsx:18-25`) and home alerts (`HomeScreen.tsx:17-18`) use mock assets and values that do not match the seeded industrial dataset. The equipment details also show fixed health, remaining-life, and failure history without identifying them as illustrative data. | Screens across the app can tell different stories about the same plant, and demo metrics may be mistaken for measured values. |
| Medium | Reproducible install and verification | The PR adds `mobile/package.json` but no `mobile/package-lock.json`, and adds no mobile test files. | Installs can resolve different dependency versions over time, and the main equipment, scan, query, and settings flows have no automated regression checks in this PR. |
| Low | App artwork | All six configured PNG assets are 1×1 pixels (`mobile/assets/`). `app.json:7, 13-18, 22-24` uses them for the app icon, Android adaptive icon, and web favicon. | The app has placeholder branding when installed or opened on the web. |

## Recommended fixes

1. Use the canonical equipment ID to load the matching asset record. Show a clear not-found state instead of reusing pump details; visibly label any sample-only health or history values.
2. Connect a supported Expo barcode/QR scanner and keep manual equipment-ID lookup as a fallback. Until scanning works, label the screen as a prototype and do not claim automatic detection.
3. Connect Ask AI to a service or clearly mark the response as a local sample. Show retrieved citations and loading/error states before describing results as GraphRAG or Gemini output.
4. Wire settings rows to real actions, or display them as disabled/planned. Make the theme switch update the rendered theme and persist preferences if those controls are offered.
5. Replace the 1×1 placeholder images with correctly sized app artwork, check in a lockfile, and add focused tests for equipment mapping, scan/manual lookup, query results, and settings behavior.

## Current-worktree note

Later local changes have aligned the mobile equipment catalog with `EQ-001`–`EQ-005` and added manual ID lookup. The camera scanner and service-backed AI query remain follow-up work in the team assignment. These later changes do not alter what was present in the historical PR snapshot reviewed above.
