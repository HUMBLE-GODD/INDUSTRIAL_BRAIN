# Industrial Brain mobile

The app runs with local fixture records when `EXPO_PUBLIC_API_URL` is unset. To use the shared FastAPI data and bearer session:

1. Copy `.env.example` to `.env` in this directory.
2. Set `EXPO_PUBLIC_API_URL` to the API origin or its `/api/v1` root.
3. Start Expo with `npm start`, then sign in or create an API account in the app.

For a physical phone, use the computer's reachable LAN address instead of `localhost`. Android emulators commonly reach the host through `10.0.2.2`; iOS Simulator can usually use `localhost`.

Live equipment, history, field observations, graph supplier/failure paths, compliance assessments, and Ask AI use the same authenticated API as the web client. Pull down on Home or Equipment to refresh data. Observation submissions only record a note; they do not create work orders. Demo health scores, fixture graph links, and sample alerts remain labeled as fixture data.

QR camera scanning is available in the iOS and Android apps. The bundled Demo Factory labels encode canonical equipment IDs such as `EQ-101`; Expo Web and denied-camera states retain manual ID lookup. Live data failures show an error and retry path. Unsent observations are not queued while offline.

Run the app's TypeScript check from this directory with `npm run typecheck`.
