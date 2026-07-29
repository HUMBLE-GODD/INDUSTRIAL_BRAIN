# 🧠 Industrial Brain — Work Division

**6 Members × 8 Phases = 48 Work Units**
Phases are sequential. Within each phase, all 6 members work **in parallel**.

> [!IMPORTANT]
> This document tells you **WHAT** to build and **WHAT** output is expected.
> It does **NOT** tell you **HOW**. Research, explore, and learn.


## Phase 1 — Project Foundation
**Day 1–2 · Goal: Every service runs locally with one command**

### M1 · Monorepo + DevOps
Set up the project structure with all directories (`backend/`, `frontend/`, `mobile/`, `shared/`, `ml/`). Create a Docker Compose file that starts the backend, PostgreSQL, Neo4j, and Qdrant together. Write a one-command setup script.

- [ ] `docker compose up` starts all services with zero manual steps
- [ ] `.env.example` documents every required variable
- [ ] `README.md` with setup instructions and architecture diagram

**Depends on:** Nothing

---

### M2 · Backend Skeleton + Database Schema
Initialize the FastAPI application with a clean project structure. Design and create the PostgreSQL schema (users, documents, query logs, equipment metrics, alerts). Set up database migrations.

- [ ] `GET /health` returns status with database connection confirmed
- [ ] All tables created via migration tool
- [ ] Base data models defined for all entities (Equipment, Document, Failure, etc.)

**Depends on:** M1

---

### M3 · Knowledge Graph Setup
Set up the Neo4j connection, create all node type constraints and indexes, and write a seed script that populates 5 sample equipment with components, suppliers, and relationships.

- [ ] Neo4j browser shows schema with all constraints and indexes
- [ ] 5 equipment nodes with components and relationships visible in the graph
- [ ] A reusable service class for basic graph CRUD operations

**Depends on:** M1

---

### M4 · Vector Database + Embeddings
Set up the Qdrant connection, create the vector collection, and build an embedding service that converts text to vectors. Write a test that embeds sample sentences and performs similarity search.

- [ ] Qdrant collection created with correct dimensions and distance metric
- [ ] Embedding service converts any text to a vector
- [ ] Test demonstrates: embed → store → search → return ranked results

**Depends on:** M1

---

### M5 · Web Frontend Skeleton
Initialize the Next.js app with a dark-themed design system. Build core reusable UI components. Create the sidebar layout with navigation to all pages (placeholder content).

- [ ] Frontend at `localhost:3000` shows a polished dark dashboard layout
- [ ] Sidebar navigates to 8 placeholder pages
- [ ] At least 6 reusable components built (buttons, cards, modals, badges, etc.)

**Depends on:** Nothing

---

### M6 · Mobile App Skeleton
Initialize the React Native (Expo) app. Set up bottom tab navigation with 5 tabs and stack navigators inside each. Create the mobile theme matching the web's look. Build core mobile components.

- [ ] App runs on Expo Go or emulator with 5 bottom tabs
- [ ] Each tab has stack navigation (e.g., list → detail)
- [ ] Theme matches the web dashboard's colors and feel

**Depends on:** Nothing

---

## Phase 2 — Data & Document Pipeline
**Day 3–4 · Goal: All data exists, documents can be processed end-to-end, shared package connects platforms, auth works**

### M1 · Dataset Collection + Preprocessing
Download the NASA CMAPSS dataset. Preprocess it for model training: clean columns, normalize sensors, compute target labels, create input sequences. Create an exploration notebook.

- [ ] Automated download script fetches the dataset
- [ ] Preprocessed data saved in ready-to-train format
- [ ] Notebook with at least 8 visualizations exploring the data

**Depends on:** Nothing

---

### M2 · Synthetic Factory Data Generation
Generate a complete simulated factory: 50 equipment, 500 maintenance records, 200 inspections, 150 failures, 20 technicians, 15 suppliers, 30 compliance checklists. Build **deliberate hidden patterns** into the data (e.g., one supplier's parts fail 3× more). Generate 20 sample PDF documents and QR codes for all equipment.

- [ ] All datasets saved as structured files
- [ ] At least 3 hidden failure/supplier patterns exist that the AI should discover
- [ ] 20 PDF documents and 50 QR code images generated
- [ ] README documenting what patterns are hidden

**Depends on:** Nothing

---

### M3 · Document Ingestion Pipeline
Build a service that accepts uploaded files (PDF, images, DOCX, CSV), extracts text using appropriate methods (text extraction, OCR for scanned docs), and cleans the output.

- [ ] Correctly extracts text from at least 4 different file types
- [ ] OCR works on scanned/photo-based documents
- [ ] Text cleaning removes noise without losing content
- [ ] Unit tests for each file type

**Depends on:** M2 (backend)

---

### M4 · Chunking + Vector Storage Pipeline
Build a pipeline that takes extracted text → splits it into overlapping chunks → embeds each chunk → stores in the vector database with metadata (document ID, title, type, page, chunk position).

- [ ] Chunking produces overlapping segments of consistent size
- [ ] Chunks are embedded and stored in Qdrant with full metadata
- [ ] Search function returns top-K relevant chunks for any query
- [ ] Tested with synthetic documents: relevant chunks rank highest

**Depends on:** M4-P1 (embeddings), M3-P2 (text extraction)

---

### M5 · Shared TypeScript Package
Create a shared package imported by both web and mobile. Define all TypeScript types matching backend schemas. Build a shared API client with injectable auth. Define WebSocket event types and a shared WS client.

- [ ] Both `frontend/` and `mobile/` import from the shared package without errors
- [ ] All entity types defined (20+ interfaces)
- [ ] API client works with both web and mobile auth mechanisms
- [ ] WebSocket client with connect, subscribe, and reconnect

**Depends on:** M2-P1 (backend schemas)

---

### M6 · Authentication System
Build user registration and login endpoints returning JWT tokens. Add token verification middleware to protect all API routes. Implement login flow on both web (storing token in browser) and mobile (storing in encrypted storage).

- [ ] Register → login → receive token → access protected endpoints
- [ ] Unauthorized requests return 401
- [ ] Web and mobile login both work and persist across restarts
- [ ] Same account works on both platforms simultaneously

**Depends on:** M2-P1 (users table), M5-P2 (shared API client)

---

## Phase 3 — AI/ML Models
**Day 5–7 · Goal: All ML models trained and exported. LLM integrated. Entity extraction populates the graph. OCR handles photos.**

### M1 · Industrial NER Model
Create labeled training data (400+ sentences) for industrial entity types (equipment IDs, components, failure modes, measurements, technicians, suppliers, dates, regulations, locations). Train a custom NER model and evaluate it.

- [ ] 400+ annotated sentences covering all 9 entity types
- [ ] Trained model saved and loadable
- [ ] F1-score ≥ 0.75 per entity type
- [ ] Demo: feed a sentence → get labeled entities

**Depends on:** M2-P2 (synthetic data for annotation)

---

### M2 · RUL Prediction Model
Build and train a deep learning model to predict Remaining Useful Life from sensor sequences. Use the preprocessed CMAPSS data. Implement proper training with validation, early stopping, and evaluation.

- [ ] Trained model saved and loadable
- [ ] RMSE ≤ 15 on test set
- [ ] Inference function: sensor sequence → predicted RUL
- [ ] Notebook with loss curves and predicted vs actual plots

**Depends on:** M1-P2 (preprocessed data)

---

### M3 · Anomaly Detection Model
Build an unsupervised model that learns "normal" sensor patterns and flags anomalies. Train on healthy equipment data. Validate that near-failure data is flagged as anomalous.

- [ ] Trained model saved and loadable
- [ ] ≥ 85% of near-failure samples detected as anomalous
- [ ] Inference function: sensor readings → anomaly score + boolean flag
- [ ] Visualization showing anomaly scores over equipment lifetime

**Depends on:** M1-P2 (preprocessed data)

---

### M4 · LLM Integration Service
Build an LLM abstraction that supports multiple providers (free APIs). Implement automatic fallback if the primary provider fails. Create prompt templates for different use cases (Q&A, RCA, compliance, fault analysis). Support streaming responses.

- [ ] Service works with at least 2 different LLM providers
- [ ] Automatic fallback: block primary → secondary takes over seamlessly
- [ ] 4+ prompt templates for different analysis types
- [ ] Streaming mode: tokens yielded one-by-one

**Depends on:** API keys in `.env`

---

### M5 · Entity Extraction → Graph Population
Build a pipeline that takes document chunks → runs NER → creates/merges Neo4j nodes and relationships for every extracted entity. Handle entity normalization (different mentions of same entity map to one node).

- [ ] Processing all synthetic docs populates Neo4j with ≥ 50 equipment nodes and ≥ 100 relationships
- [ ] Entity normalization: "P-101" and "Pump P-101" resolve to the same node
- [ ] Co-occurring entities in a chunk are linked with relationships
- [ ] Log/report of entities and relationships created per document

**Depends on:** M1-P3 (NER model), M3-P1 (graph service)

---

### M6 · OCR Service for Photos
Build an OCR service that handles scanned documents, equipment nameplate photos, and fault images. Include image preprocessing (rotation, contrast). Add table detection and structured extraction.

- [ ] Extracts text from 5 different test images (printed, nameplate, table, form, handwritten)
- [ ] Table extraction returns structured rows/columns
- [ ] Nameplate reader returns structured fields (model, serial, manufacturer)
- [ ] < 5 seconds per image on CPU

**Depends on:** Nothing

---

## Phase 4 — Intelligence Engines
**Day 8–10 · Goal: Graph fully populated. GraphRAG answers questions. RCA, compliance, predictive engines produce insights. Real-time events work.**

### M1 · Knowledge Graph Population
Bulk import all synthetic data into Neo4j — all equipment, maintenance, inspections, failures, technicians, suppliers, compliance records. Create all cross-entity relationships. Verify graph integrity.

- [ ] Graph contains ≥ 500 nodes and ≥ 1500 relationships
- [ ] Every equipment has: components, location, manufacturer, maintenance history
- [ ] Hidden failure patterns are queryable (e.g., "which supplier has most failures")
- [ ] Integrity check: no orphan nodes, no missing relationships

**Depends on:** M2-P2 (synthetic data), M5-P3 (extraction pipeline)

---

### M2 · GraphRAG Query Engine
Build the core question-answering engine. For each question: extract entities → vector search for relevant chunks → graph traversal for related context → assemble hybrid context → send to LLM → return answer with source citations.

- [ ] Correctly answers: "When was Pump P-101 last serviced?" with date and source
- [ ] Cross-references graph data: "Which supplier's parts fail most?" uses graph, not just documents
- [ ] Every answer includes citation references to source documents
- [ ] Handles follow-up questions using conversation context

**Depends on:** M4-P2 (vector pipeline), M1-P4 (populated graph), M4-P3 (LLM)

---

### M3 · Root Cause Analysis Engine
Build an engine that analyzes failure patterns for any equipment by traversing the knowledge graph. Detect: recurring failures, supplier correlations, maintenance gaps, similar equipment at risk. Use the LLM to generate a structured narrative.

- [ ] For P-101: identifies recurring bearing failures → links to supplier → recommends change
- [ ] Report includes: timeline, root cause, contributing factors, similar equipment at risk
- [ ] Recommendations are prioritized by urgency
- [ ] Identifies patterns across multiple equipment

**Depends on:** M1-P4 (populated graph), M4-P3 (LLM)

---

### M4 · Compliance Gap Detection Engine
Build an engine that checks equipment against regulatory requirements. Detect overdue inspections, missing certifications, violated maintenance intervals. Calculate compliance scores. Generate proactive warnings for upcoming deadlines.

- [ ] Returns all compliance gaps with severity ratings
- [ ] Compliance score (0–100%) calculated per equipment and plant-wide
- [ ] Proactive warnings for inspections due within 7 days
- [ ] Gaps grouped by regulation and sorted by severity

**Depends on:** M1-P4 (populated graph with regulations)

---

### M5 · Predictive Maintenance Engine
Build an engine that uses the trained RUL and anomaly models to assess equipment health. Calculate health scores (0–100). Generate maintenance recommendations with urgency. Create alerts when health drops below thresholds.

- [ ] Health score calculated for each equipment
- [ ] Recommendations: what to inspect, when, why, and urgency level
- [ ] Alerts auto-created when health < 50 or anomaly detected
- [ ] Maintenance schedule ordered by priority

**Depends on:** M2-P3 (RUL model), M3-P3 (anomaly model)

---

### M6 · Real-Time Events + Push Notifications
Build a WebSocket server that broadcasts events (alerts, status changes, processing updates) to all connected web and mobile clients. Build a push notification service for mobile alerts when the app is backgrounded. Implement token registration.

- [ ] WebSocket sends events to all connected clients (web + mobile)
- [ ] Push notification reaches mobile device when app is in background
- [ ] Push tap opens the relevant screen (deep linking)
- [ ] Connection manager handles multi-device per user

**Depends on:** M6-P2 (auth for token verification)

---

## Phase 5 — Backend API Completion
**Day 11–12 · Goal: Every API endpoint is implemented, tested, and documented.**

### M1 · Document Management APIs
Endpoints to upload documents (triggering background processing), list documents with filtering and pagination, get document details, and delete documents (cleaning up vectors and graph nodes too).

- [ ] Upload triggers full pipeline: OCR → chunk → embed → extract → graph update
- [ ] List supports filtering by type, status, and date with pagination
- [ ] Delete removes: file, DB record, Qdrant vectors, Neo4j references
- [ ] Processing status trackable in real-time

**Depends on:** M3-P2, M4-P2, M5-P3

---

### M2 · Query APIs
Endpoints for asking questions (returning full GraphRAG response), streaming responses via Server-Sent Events, query history, and user feedback on answer quality.

- [ ] Non-streaming endpoint returns full answer with citations
- [ ] Streaming endpoint sends tokens progressively
- [ ] Query history saved and retrievable
- [ ] Feedback rating (1–5) storable per query

**Depends on:** M2-P4 (GraphRAG engine)

---

### M3 · Equipment + Maintenance APIs
Endpoints to list/get equipment with filters, QR code lookup, failure predictions, maintenance schedule, work order creation, and work order status updates.

- [ ] Equipment list filterable by type, location, criticality
- [ ] QR lookup returns same data as equipment detail
- [ ] Work order creation with validation, status update with transition enforcement
- [ ] Predictions endpoint returns urgency-ranked list

**Depends on:** M1-P4, M5-P4

---

### M4 · RCA + Compliance + Analytics APIs
Endpoints for triggering RCA reports, running compliance audits, listing compliance gaps, dashboard statistics, and trend data for charts.

- [ ] RCA returns structured report for any equipment
- [ ] Compliance returns gaps sorted by severity
- [ ] Dashboard stats in a single JSON response (for both platforms)
- [ ] Trends return time-series data formatted for charting

**Depends on:** M3-P4 (RCA), M4-P4 (compliance)

---

### M5 · Mobile-Specific APIs
Endpoints for photo upload + AI fault analysis, delta sync (changes since timestamp), offline batch processing (submit queued actions), and simplified equipment subgraph for mobile.

- [ ] Photo analysis: upload → OCR → LLM → structured fault report
- [ ] Sync returns changes grouped by entity type since given timestamp
- [ ] Offline batch processes actions in order with per-item status
- [ ] Photo analysis responds within 10 seconds

**Depends on:** M6-P3 (OCR), M4-P3 (LLM)

---

### M6 · Alerts + Notification APIs
Endpoints for push token registration, alert listing with filters, alert resolution, and automatic alert creation pipeline (risk detected → alert created → WebSocket broadcast → push notification).

- [ ] Push token stored per user and used for notifications
- [ ] Alerts filterable by severity, type, resolved/unresolved
- [ ] Resolving an alert broadcasts event to all clients
- [ ] Auto-creation pipeline: health drop → alert → WebSocket → push (no duplicates)

**Depends on:** M6-P4 (WebSocket + push), M5-P4 (predictive engine)

---

## Phase 6 — Web Dashboard
**Day 13–15 · Goal: All 8 web pages are fully functional, polished, and visually impressive with real backend data.**

### M1 · Dashboard Home Page
KPI cards with animated counters, live-updating alerts feed (via WebSocket), equipment health overview (color-coded), and activity timeline.

- [ ] Real data from backend, animated on load
- [ ] Alerts update in real-time without page refresh
- [ ] Responsive across screen sizes
- [ ] Visually polished — dark glass cards, gradients, smooth animations

**Depends on:** M4-P5 (dashboard API)

---

### M2 · AI Query Chat Page
Chat interface with message bubbles, streaming AI responses, expandable source citation cards, suggested follow-up questions, and conversation history.

- [ ] Questions stream answers in real-time with typing animation
- [ ] Citations are clickable and show document excerpts
- [ ] Follow-up questions maintain context
- [ ] Chat history persists across page refreshes

**Depends on:** M2-P5 (query API)

---

### M3 · Knowledge Graph Visualization Page
Interactive graph visualization with color-coded node types, click-to-inspect detail panel, filter controls to show/hide node types, and search to highlight specific nodes.

- [ ] Graph renders all equipment, failures, suppliers from Neo4j
- [ ] Nodes color-coded by type, sized by importance
- [ ] Click node → side panel with details and connections
- [ ] Handles 500+ nodes without performance issues

**Depends on:** M1-P4 (populated graph)

---

### M4 · Document Management Page
Drag-and-drop upload with progress tracking, document list with type/status/date filters, document detail view showing extracted text, chunks, and entities.

- [ ] Drag-and-drop upload with real-time processing status (via WebSocket)
- [ ] Document list with filtering and search
- [ ] Detail view shows extracted text and entities
- [ ] Handles upload validation (file size, type)

**Depends on:** M1-P5 (document API)

---

### M5 · Maintenance + RCA Pages
Equipment health gauges, RUL predictions, maintenance schedule, and an RCA page where you select equipment and trigger analysis to see a structured report.

- [ ] Equipment sorted by health score with visual gauges
- [ ] RCA: select equipment → analyze → structured report with timeline and recommendations
- [ ] Trend charts showing health over time
- [ ] Urgency badges on predictions

**Depends on:** M3-P5 (equipment API), M4-P5 (RCA API)

---

### M6 · Compliance + Analytics Pages
Compliance score gauge, gap list grouped by regulation, overdue inspection warnings. Analytics with failure charts, MTBF/MTTR metrics, cost trends, and technician workload.

- [ ] Compliance score as a large gauge, gaps listed with severity badges
- [ ] At least 5 interactive charts with real data on analytics page
- [ ] Hover tooltips on charts
- [ ] Print-friendly for audit reports

**Depends on:** M4-P5 (compliance + analytics APIs)

---

## Phase 7 — Mobile App
**Day 16–18 · Goal: All 11 mobile screens functional with real data. Mobile-exclusive features (QR, voice, camera) work end-to-end.**

### M1 · Home Dashboard + Alerts Screens
Home screen with KPI cards, live alert feed (WebSocket), quick search, and an "Ask AI" button. Alerts screen with severity filters, swipe-to-resolve, and tap-to-navigate.

- [ ] KPIs load with real backend data
- [ ] Alerts appear in real-time via WebSocket
- [ ] Tapping alert navigates to related equipment
- [ ] Pull-to-refresh on both screens

**Depends on:** M6-P5 (alerts API), M6-P4 (WebSocket)

---

### M2 · QR Scanner + Equipment Detail Screens
Full-screen camera QR scanner with haptic feedback, bottom sheet showing scanned equipment summary with action buttons. Equipment detail with health gauge, failure timeline, maintenance history, and linked documents.

- [ ] QR scan → equipment info appears in < 1 second with haptic feedback
- [ ] Bottom sheet actions: View Details, Ask AI, Take Photo
- [ ] Equipment detail shows all data: health, RUL, failures, maintenance
- [ ] Works offline: shows cached data with "Offline" indicator

**Depends on:** M3-P5 (equipment + QR APIs)

---

### M3 · AI Chat + Voice Input
Chat screen with text and voice input, streaming responses, source citations, and follow-up suggestions. Voice: tap mic → speak → transcribed text appears in input.

- [ ] Text questions get streaming AI responses
- [ ] Voice input: tap → speak → text appears → send
- [ ] Source citations expandable to show excerpts
- [ ] Context-aware when opened from equipment detail

**Depends on:** M2-P5 (query API)

---

### M4 · Camera Fault Capture + Analysis
Camera screen to photograph equipment faults. Capture → compress → upload → show AI analysis result (extracted text, fault type, severity, recommended action). Option to create work order. Offline fallback.

- [ ] Photo capture → analysis result in bottom sheet
- [ ] Analysis shows: fault type, severity, recommended action
- [ ] "Create Work Order" pre-fills form with analysis data
- [ ] Offline: saves locally, syncs when connectivity returns

**Depends on:** M5-P5 (photo-analyze API)

---

### M5 · Maintenance Tasks + Work Orders
Task list sorted by urgency with color-coded badges, filter by equipment/type. Work order screen for viewing details or creating new ones with form validation. Mark-as-complete with notes.

- [ ] Tasks grouped by urgency: Immediate (red), This Week (amber), Scheduled (green)
- [ ] Work order creation with field validation
- [ ] Completing a work order reflects on web dashboard immediately
- [ ] Pull-to-refresh on task list

**Depends on:** M3-P5 (work order APIs)

---

### M6 · Compliance + Documents + Settings
Compliance checklists grouped by regulation with tap-to-complete. In-app document/PDF viewer. Settings: profile, notification toggle, cache management, theme toggle, logout.

- [ ] Checklist items markable as complete → updates backend → reflects on web
- [ ] Document viewer opens PDFs inline
- [ ] Logout clears stored token and navigates to login
- [ ] Cache clear and force sync work correctly

**Depends on:** M4-P5 (compliance API), M1-P5 (document API)

---

## Phase 8 — Integration, Testing & Deployment
**Day 19–21 · Goal: Everything deployed (free), tested end-to-end, and demo-ready.**

### M1 · Cross-Platform Testing
Write and execute a test suite verifying web ↔ mobile synchronization. Test real-time sync, offline→online recovery, shared auth, and data consistency across platforms.

- [ ] 15+ cross-platform test cases written with pass/fail results
- [ ] WebSocket sync verified: < 1 second latency between platforms
- [ ] Offline→online sync verified on mobile
- [ ] Bug report for any issues found

**Depends on:** All Phase 5–7 work

---

### M2 · Backend + Database Deployment
Deploy FastAPI to a free hosting platform. Set up cloud instances for Neo4j, Qdrant, and PostgreSQL (all free tiers). Migrate schema and seed data to all cloud databases. Set up keep-alive pings.

- [ ] Backend accessible at a public URL with healthy status
- [ ] All 3 databases connected and seeded with data
- [ ] Keep-alive configured to prevent service spin-down
- [ ] All secrets stored as environment variables

**Depends on:** All backend work

---

### M3 · Frontend + Mobile Deployment
Deploy Next.js to a free hosting platform. Build mobile APK for Android distribution. Set up Expo Go for iOS demo. Test on multiple browsers.

- [ ] Web dashboard accessible at a public URL with all pages working
- [ ] Android APK built and downloadable via shareable link
- [ ] iOS loadable via Expo Go
- [ ] Works on Chrome, Firefox, Safari

**Depends on:** M2-P8 (deployed backend)

---

### M4 · Demo Scenario + Seed Data
Set up the complete demo scenario with pre-loaded data. Prepare 5 showcase questions. Print QR codes for live scanning. Rehearse the demo flow. Prepare a backup scenario.

- [ ] Demo runs flawlessly start-to-finish (rehearsed 3+ times)
- [ ] 5 prepared questions produce impressive, well-cited answers
- [ ] QR codes scan correctly from the mobile app
- [ ] Backup plan ready for API issues or connectivity problems

**Depends on:** M2-P8, M3-P8

---

### M5 · Error Handling + Performance
Add loading states everywhere (no blank screens). Add error boundaries and retry logic. Handle cold starts gracefully. Handle API rate limits with fallback messaging.

- [ ] No screen ever shows blank — always loading state or error message
- [ ] Cold start shows "Connecting..." instead of timeout error
- [ ] Rate limit triggers fallback LLM automatically
- [ ] All endpoints respond within 5 seconds (excluding LLM generation)

**Depends on:** All previous phases

---

### M6 · Documentation + Demo Script
Write API docs, architecture explanation, setup guide, mobile setup guide, and a timed demo script with talking points, expected answers, and fallback plans.

- [ ] API docs cover all endpoints with example requests
- [ ] Architecture doc explains key design decisions and trade-offs
- [ ] Setup guide: new developer can run the project in < 30 minutes
- [ ] Demo script: timed to the minute with exact flow and fallback plans

**Depends on:** All previous phases
