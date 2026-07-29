# 🧠 Industrial Brain — Complete Implementation Plan

**Project**: AI-powered Industrial Knowledge Management & Decision Support System
**Goal**: Build a unified platform that ingests industrial documents, constructs a Knowledge Graph, performs intelligent RAG-based Q&A, root cause analysis, predictive maintenance, and compliance monitoring — with both a Web Dashboard and Mobile App.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Repository Structure](#2-repository-structure)
3. [Data Layer — Datasets & Ingestion](#3-data-layer--datasets--ingestion)
4. [AI/ML Pipeline — Models & Training](#4-aiml-pipeline--models--training)
5. [Knowledge Graph — Neo4j Schema & Population](#5-knowledge-graph--neo4j-schema--population)
6. [RAG Pipeline — GraphRAG Architecture](#6-rag-pipeline--graphrag-architecture)
7. [Backend — FastAPI Services](#7-backend--fastapi-services)
8. [Frontend — Next.js Web Dashboard](#8-frontend--nextjs-web-dashboard)
9. [Web ↔ Mobile Seamless Connectivity](#9-web--mobile-seamless-connectivity)
10. [Mobile App — React Native / Expo](#10-mobile-app--react-native--expo)
11. [Deployment — Free Tier Strategy](#11-deployment--free-tier-strategy)
12. [Development Phases & Timeline](#12-development-phases--timeline)
13. [Verification Plan](#13-verification-plan)

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB["🖥️ Next.js Web Dashboard"]
        MOB["📱 React Native Mobile App"]
        SHARED["📦 Shared Package<br/>Types + API Client + Stores"]
    end

    subgraph "API Gateway"
        API["⚡ FastAPI Backend<br/>REST + WebSocket"]
        WS["🔌 WebSocket Server<br/>Real-time Events"]
    end

    subgraph "Notifications"
        PUSH["🔔 Push Notifications<br/>Expo Push Service"]
    end

    subgraph "AI Engine"
        RAG["🔍 GraphRAG Pipeline<br/>LlamaIndex + LangChain"]
        NER["📝 Entity Extractor<br/>spaCy + Custom NER"]
        RCA["🔬 Root Cause Analyzer"]
        PRED["📊 Predictive Maintenance<br/>LSTM / Transformer"]
        COMP["✅ Compliance Checker"]
    end

    subgraph "Data Stores"
        NEO["🕸️ Neo4j Aura<br/>Knowledge Graph"]
        QDR["📦 Qdrant Cloud<br/>Vector Store"]
        PG["🐘 PostgreSQL<br/>Supabase"]
        S3["📁 Object Storage<br/>Cloudflare R2"]
    end

    subgraph "Document Processing"
        OCR["👁️ PaddleOCR"]
        CHUNK["✂️ Document Chunker"]
        EMB["🧮 BGE Embeddings"]
    end

    subgraph "LLM Layer"
        LLM["🤖 Google Gemini 2.0 Flash<br/>(Free API)"]
    end

    WEB --> SHARED
    MOB --> SHARED
    SHARED --> API
    SHARED --> WS
    API --> RAG
    API --> RCA
    API --> PRED
    API --> COMP
    API --> PUSH
    PUSH --> MOB
    WS --> WEB
    WS --> MOB
    RAG --> NEO
    RAG --> QDR
    RAG --> LLM
    RCA --> NEO
    PRED --> PG
    COMP --> NEO
    API --> PG
    API --> OCR
    OCR --> CHUNK
    CHUNK --> EMB
    EMB --> QDR
    CHUNK --> NER
    NER --> NEO
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as FastAPI
    participant OCR as PaddleOCR
    participant NER as Entity Extractor
    participant EMB as BGE Embeddings
    participant QDR as Qdrant
    participant NEO as Neo4j
    participant RAG as GraphRAG
    participant LLM as Gemini 2.0 Flash

    Note over U,LLM: Document Ingestion Flow
    U->>API: Upload Document (PDF/Image/Text)
    API->>OCR: Extract text from document
    OCR-->>API: Raw text
    API->>API: Chunk text (512 tokens, 50 overlap)
    API->>EMB: Generate embeddings
    EMB-->>QDR: Store vectors + metadata
    API->>NER: Extract entities & relations
    NER-->>NEO: Create/update graph nodes & edges
    API->>API: Store metadata in PostgreSQL

    Note over U,LLM: Query Flow
    U->>API: Ask question
    API->>EMB: Embed question
    EMB->>QDR: Semantic search (top-k=10)
    QDR-->>RAG: Relevant chunks
    API->>NEO: Graph traversal query
    NEO-->>RAG: Related entities & context
    RAG->>LLM: Prompt with context + graph data
    LLM-->>RAG: Generated answer with citations
    RAG-->>API: Answer + sources + recommendations
    API-->>U: Formatted response
```

---

## 2. Repository Structure

```
EPIC/
├── README.md
├── docker-compose.yml              # Local dev orchestration
├── docker-compose.prod.yml         # Production config
├── .env.example                    # Environment variables template
├── Makefile                        # Common commands
│
├── backend/                        # FastAPI Backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── alembic/                    # Database migrations
│   │   ├── alembic.ini
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Settings & env vars
│   │   ├── api/                    # API routes
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py       # API v1 router
│   │   │   │   ├── documents.py    # Document upload/manage
│   │   │   │   ├── query.py        # Q&A endpoint
│   │   │   │   ├── rca.py          # Root cause analysis
│   │   │   │   ├── maintenance.py  # Predictive maintenance
│   │   │   │   ├── compliance.py   # Compliance checks
│   │   │   │   ├── knowledge.py    # Knowledge graph CRUD
│   │   │   │   ├── analytics.py    # Dashboard analytics
│   │   │   │   └── auth.py         # Authentication
│   │   ├── core/                   # Core business logic
│   │   │   ├── __init__.py
│   │   │   ├── document_processor.py  # OCR + chunking pipeline
│   │   │   ├── entity_extractor.py    # NER + relation extraction
│   │   │   ├── embedding_service.py   # BGE embedding generation
│   │   │   ├── graph_service.py       # Neo4j operations
│   │   │   ├── vector_service.py      # Qdrant operations
│   │   │   ├── rag_engine.py          # GraphRAG pipeline
│   │   │   ├── rca_engine.py          # Root cause analysis logic
│   │   │   ├── predictive_engine.py   # Failure prediction
│   │   │   ├── compliance_engine.py   # Regulation checker
│   │   │   └── llm_service.py         # LLM abstraction layer
│   │   ├── models/                 # Pydantic & SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── database.py         # SQLAlchemy models
│   │   │   ├── schemas.py          # Pydantic request/response
│   │   │   └── graph_models.py     # Knowledge graph node/edge types
│   │   ├── db/                     # Database connections
│   │   │   ├── __init__.py
│   │   │   ├── postgres.py         # PostgreSQL session
│   │   │   ├── neo4j.py            # Neo4j driver
│   │   │   └── qdrant.py           # Qdrant client
│   │   └── utils/                  # Utilities
│   │       ├── __init__.py
│   │       ├── file_handler.py     # File upload/storage
│   │       └── prompts.py          # LLM prompt templates
│   └── tests/
│       ├── test_document_processor.py
│       ├── test_rag_engine.py
│       └── test_api.py
│
├── ml/                             # ML Models & Training
│   ├── requirements.txt
│   ├── notebooks/                  # Jupyter notebooks
│   │   ├── 01_data_exploration.ipynb
│   │   ├── 02_ner_training.ipynb
│   │   ├── 03_rul_prediction.ipynb
│   │   └── 04_anomaly_detection.ipynb
│   ├── data/                       # Raw & processed data
│   │   ├── raw/
│   │   │   ├── cmapss/             # NASA CMAPSS dataset
│   │   │   ├── mimii/              # MIMII sound dataset
│   │   │   ├── manuals/            # Equipment manuals
│   │   │   ├── regulations/        # Safety regulations
│   │   │   └── maintenance_logs/   # Maintenance records
│   │   ├── processed/
│   │   └── synthetic/              # Generated synthetic data
│   │       ├── generate_maintenance_logs.py
│   │       ├── generate_inspection_reports.py
│   │       └── generate_work_orders.py
│   ├── models/                     # Trained model artifacts
│   │   ├── ner/                    # Custom NER model
│   │   ├── rul/                    # RUL prediction model
│   │   └── anomaly/                # Anomaly detection model
│   ├── training/
│   │   ├── train_ner.py            # Industrial NER training
│   │   ├── train_rul.py            # Remaining Useful Life model
│   │   ├── train_anomaly.py        # Anomaly detection model
│   │   └── evaluate.py             # Model evaluation
│   └── scripts/
│       ├── download_datasets.py    # Auto-download all datasets
│       └── preprocess.py           # Data preprocessing
│
├── frontend/                       # Next.js Web Dashboard
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Landing/Dashboard
│   │   │   ├── globals.css         # Global styles
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Main dashboard
│   │   │   ├── documents/
│   │   │   │   └── page.tsx        # Document management
│   │   │   ├── query/
│   │   │   │   └── page.tsx        # AI Q&A interface
│   │   │   ├── knowledge-graph/
│   │   │   │   └── page.tsx        # Graph visualization
│   │   │   ├── maintenance/
│   │   │   │   └── page.tsx        # Predictive maintenance
│   │   │   ├── compliance/
│   │   │   │   └── page.tsx        # Compliance monitoring
│   │   │   ├── rca/
│   │   │   │   └── page.tsx        # Root cause analysis
│   │   │   └── analytics/
│   │   │       └── page.tsx        # Analytics & reports
│   │   ├── components/
│   │   │   ├── ui/                 # Reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   └── FileUpload.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCards.tsx
│   │   │   │   ├── RecentAlerts.tsx
│   │   │   │   └── ActivityFeed.tsx
│   │   │   ├── graph/
│   │   │   │   ├── GraphCanvas.tsx   # react-force-graph
│   │   │   │   └── NodeDetail.tsx
│   │   │   └── charts/
│   │   │       ├── HealthGauge.tsx
│   │   │       └── TrendChart.tsx
│   │   ├── lib/
│   │   │   ├── api.ts              # API client
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useQuery.ts
│   │   │   └── useWebSocket.ts
│   │   └── types/
│   │       └── index.ts
│   └── tailwind.config.ts          # Using Tailwind only if user confirms
│
├── shared/                         # 📦 Shared Code (Web + Mobile)
│   ├── package.json                # Published as @epic/shared
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                # Barrel export
│   │   ├── types/                  # Shared TypeScript types
│   │   │   ├── equipment.ts        # Equipment, Component, Failure types
│   │   │   ├── documents.ts        # Document, Chunk types
│   │   │   ├── query.ts            # QueryRequest, QueryResponse
│   │   │   ├── maintenance.ts      # MaintenanceRecord, Prediction
│   │   │   ├── compliance.ts       # ComplianceGap, Regulation
│   │   │   ├── auth.ts             # User, AuthToken types
│   │   │   ├── websocket.ts        # WebSocket event types
│   │   │   └── api.ts              # All API request/response shapes
│   │   ├── api/                    # Shared API client
│   │   │   ├── client.ts           # Axios-based API client (works on web & native)
│   │   │   ├── endpoints.ts        # All endpoint URL constants
│   │   │   ├── documents.api.ts    # Document API methods
│   │   │   ├── query.api.ts        # Query API methods
│   │   │   ├── equipment.api.ts    # Equipment API methods
│   │   │   ├── maintenance.api.ts  # Maintenance API methods
│   │   │   ├── compliance.api.ts   # Compliance API methods
│   │   │   ├── auth.api.ts         # Auth API methods
│   │   │   └── websocket.ts        # WebSocket client (shared events)
│   │   ├── constants/
│   │   │   ├── equipment-types.ts  # Equipment type enums
│   │   │   ├── failure-modes.ts    # Failure mode enums
│   │   │   ├── severity-levels.ts  # Severity enums
│   │   │   └── colors.ts           # Shared color palette
│   │   └── utils/
│   │       ├── formatters.ts       # Date, number, unit formatters
│   │       └── validators.ts       # Input validation
│
├── mobile/                         # 📱 React Native Mobile App (Expo)
│   ├── package.json
│   ├── app.json                    # Expo configuration
│   ├── eas.json                    # EAS Build configuration
│   ├── babel.config.js
│   ├── tsconfig.json
│   ├── App.tsx                     # Root app with providers
│   ├── src/
│   │   ├── screens/                # All app screens
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx          # Email/password login
│   │   │   │   └── RegisterScreen.tsx       # New user registration
│   │   │   ├── home/
│   │   │   │   └── HomeScreen.tsx           # Dashboard with KPIs + alerts
│   │   │   ├── scan/
│   │   │   │   └── ScanScreen.tsx           # QR code scanner → equipment lookup
│   │   │   ├── equipment/
│   │   │   │   ├── EquipmentListScreen.tsx  # Browse all equipment
│   │   │   │   └── EquipmentDetailScreen.tsx # Full equipment details + health
│   │   │   ├── query/
│   │   │   │   └── QueryScreen.tsx          # AI chat (voice + text)
│   │   │   ├── camera/
│   │   │   │   └── CameraScreen.tsx         # Photo capture + OCR analysis
│   │   │   ├── maintenance/
│   │   │   │   ├── MaintenanceListScreen.tsx # Upcoming maintenance tasks
│   │   │   │   └── WorkOrderScreen.tsx      # Work order detail/creation
│   │   │   ├── compliance/
│   │   │   │   └── ComplianceScreen.tsx     # Compliance checklist view
│   │   │   ├── documents/
│   │   │   │   └── DocumentViewerScreen.tsx # PDF/document viewer
│   │   │   ├── alerts/
│   │   │   │   └── AlertsScreen.tsx         # Notifications center
│   │   │   └── settings/
│   │   │       └── SettingsScreen.tsx       # Profile, logout, preferences
│   │   ├── components/             # Reusable mobile components
│   │   │   ├── ui/
│   │   │   │   ├── Header.tsx               # Custom header with back/menu
│   │   │   │   ├── Card.tsx                 # Styled card component
│   │   │   │   ├── Badge.tsx                # Status badge (Critical/OK/Warning)
│   │   │   │   ├── LoadingSpinner.tsx       # Activity indicator
│   │   │   │   ├── BottomSheet.tsx          # Reusable bottom sheet
│   │   │   │   └── EmptyState.tsx           # No-data placeholder
│   │   │   ├── equipment/
│   │   │   │   ├── EquipmentCard.tsx         # Equipment list item
│   │   │   │   ├── HealthGauge.tsx           # Circular health indicator
│   │   │   │   └── SensorReadings.tsx        # Live sensor data display
│   │   │   ├── chat/
│   │   │   │   ├── ChatBubble.tsx            # Message bubble
│   │   │   │   ├── VoiceButton.tsx           # Voice input FAB
│   │   │   │   ├── SourceCitation.tsx        # Expandable source card
│   │   │   │   └── SuggestedQuestions.tsx    # Quick action chips
│   │   │   ├── maintenance/
│   │   │   │   ├── MaintenanceCard.tsx       # Work order summary card
│   │   │   │   └── PredictionAlert.tsx       # Failure prediction alert
│   │   │   └── scanner/
│   │   │       ├── ScanOverlay.tsx           # Camera overlay frame
│   │   │       └── ScanResult.tsx            # Scanned equipment result
│   │   ├── navigation/
│   │   │   ├── AppNavigator.tsx     # Root navigator (auth check)
│   │   │   ├── TabNavigator.tsx     # Bottom tab navigation
│   │   │   ├── HomeStack.tsx        # Home → Equipment Detail stack
│   │   │   ├── ScanStack.tsx        # Scan → Equipment Detail stack
│   │   │   ├── QueryStack.tsx       # Query → Document Viewer stack
│   │   │   └── SettingsStack.tsx    # Settings stack
│   │   ├── services/
│   │   │   ├── api.ts               # Imports from @epic/shared + adds native auth
│   │   │   ├── notifications.ts     # Expo push notification registration
│   │   │   ├── offline.ts           # Offline queue + background sync
│   │   │   ├── voiceInput.ts        # Voice-to-text service
│   │   │   └── cameraService.ts     # Photo capture + compression
│   │   ├── hooks/
│   │   │   ├── useAuth.ts           # Auth state hook
│   │   │   ├── useEquipment.ts      # Equipment data hook
│   │   │   ├── useQuery.ts          # AI query hook
│   │   │   ├── useWebSocket.ts      # Real-time WebSocket events
│   │   │   ├── useOffline.ts        # Offline detection + queue
│   │   │   └── usePushNotifications.ts # Push notification hook
│   │   ├── stores/
│   │   │   ├── authStore.ts         # Auth state (Zustand + AsyncStorage)
│   │   │   ├── equipmentStore.ts    # Equipment cache
│   │   │   ├── alertStore.ts        # Alerts state
│   │   │   └── offlineStore.ts      # Offline action queue
│   │   ├── theme/
│   │   │   ├── colors.ts            # Dark theme matching web
│   │   │   ├── spacing.ts           # Spacing scale
│   │   │   ├── typography.ts        # Font sizes/weights
│   │   │   └── index.ts             # Theme provider
│   │   └── utils/
│   │       ├── storage.ts           # AsyncStorage helpers
│   │       └── permissions.ts       # Camera/notification permission helpers
│   └── assets/
│       ├── fonts/
│       ├── images/
│       └── icons/
│
├── scripts/                        # DevOps & utility scripts
│   ├── setup_dev.sh                # One-command dev setup
│   ├── seed_data.sh                # Seed databases with sample data
│   ├── deploy.sh                   # Deployment script
│   └── generate_synthetic_data.py  # Generate demo data
│
└── docs/                           # Documentation
    ├── API.md                      # API documentation
    ├── ARCHITECTURE.md             # Architecture decisions
    ├── SETUP.md                    # Setup guide
    ├── MOBILE_SETUP.md             # Mobile dev environment setup
    └── DEMO_SCRIPT.md              # Hackathon demo script
```

---

## 3. Data Layer — Datasets & Ingestion

### 3.1 Datasets to Use

| Dataset | Source | Purpose | Size | Format |
|---------|--------|---------|------|--------|
| **NASA CMAPSS** | [NASA Prognostics Repository](https://data.nasa.gov/Aerospace/CMAPSS-Jet-Engine-Simulated-Data/vrks-gjie) | Predictive maintenance / RUL prediction | ~50 MB | Text/CSV |
| **MIMII** | [Zenodo](https://zenodo.org/record/3384388) | Acoustic anomaly detection for industrial machines | ~26 GB (subset ~2 GB) | WAV audio |
| **Kaggle Maintenance Logs** | [Kaggle - Predictive Maintenance](https://www.kaggle.com/datasets/shivamb/machine-predictive-maintenance-classification) | Maintenance classification training | ~12 MB | CSV |
| **Public Equipment Manuals** | Siemens/ABB/Schneider product portals | RAG document corpus | Varies | PDF |
| **Indian Safety Regulations** | [indiacode.nic.in](https://www.indiacode.nic.in) (Factory Act), [OISD](https://www.oisd.gov.in), [PESO](https://peso.gov.in) | Compliance checking | Varies | PDF |
| **Synthetic Industrial Data** | Self-generated | Demo data for all scenarios | ~100 MB | JSON/CSV |

### 3.2 NASA CMAPSS — Detailed Breakdown

The Commercial Modular Aero-Propulsion System Simulation dataset contains:
- **4 sub-datasets**: FD001, FD002, FD003, FD004
- **FD001** (recommended for hackathon): 100 engines, 1 operating condition, 1 fault mode
- **Columns (26 total)**: `engine_id`, `cycle`, `op_setting_1-3`, `sensor_1` through `sensor_21`
- **Task**: Predict Remaining Useful Life (RUL) — how many cycles until engine failure
- **Preprocessing needed**:
  - Normalize sensor readings (MinMaxScaler)
  - Remove constant/near-constant sensors (sensors 1, 5, 6, 10, 16, 18, 19)
  - Create RUL labels (clip at max 125 cycles)
  - Create sliding windows (window_size=30)

```python
# Preprocessing pseudocode
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

columns = ['engine_id', 'cycle', 'op1', 'op2', 'op3'] + [f'sensor_{i}' for i in range(1, 22)]
train_df = pd.read_csv('train_FD001.txt', sep=r'\s+', header=None, names=columns)

# Calculate RUL
max_cycles = train_df.groupby('engine_id')['cycle'].max()
train_df['RUL'] = train_df.apply(lambda r: max_cycles[r['engine_id']] - r['cycle'], axis=1)
train_df['RUL'] = train_df['RUL'].clip(upper=125)  # Cap at 125

# Drop useless sensors
drop_sensors = ['sensor_1', 'sensor_5', 'sensor_6', 'sensor_10', 'sensor_16', 'sensor_18', 'sensor_19']
train_df = train_df.drop(columns=drop_sensors + ['op3'])

# Normalize
scaler = MinMaxScaler()
sensor_cols = [c for c in train_df.columns if 'sensor' in c]
train_df[sensor_cols] = scaler.fit_transform(train_df[sensor_cols])
```

### 3.3 Synthetic Data Generation

We'll generate realistic synthetic data to simulate a complete factory environment:

#### Synthetic Datasets to Generate

| Dataset | Records | Fields |
|---------|---------|--------|
| **Equipment Registry** | 50 assets | ID, name, type, location, manufacturer, install_date, criticality |
| **Maintenance Work Orders** | 500 records | WO_id, equipment_id, type (preventive/corrective), description, technician, date, parts_used, duration, cost |
| **Inspection Reports** | 200 records | report_id, equipment_id, inspector, date, findings, severity, recommendations |
| **Failure Logs** | 150 records | failure_id, equipment_id, date, failure_mode, root_cause, downtime_hours, supplier_of_failed_part |
| **Technician Profiles** | 20 profiles | tech_id, name, certifications, specializations, years_experience |
| **Supplier Records** | 15 suppliers | supplier_id, name, parts_supplied, quality_rating, lead_time |
| **Compliance Checklists** | 30 checklists | checklist_id, regulation, equipment_ids, status, last_audit_date, gaps |

```python
# scripts/generate_synthetic_data.py — Key structure
import json, random, uuid
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

EQUIPMENT_TYPES = [
    {"type": "Centrifugal Pump", "prefix": "P", "failure_modes": ["bearing_failure", "seal_leak", "impeller_wear", "cavitation"]},
    {"type": "Compressor", "prefix": "C", "failure_modes": ["valve_failure", "bearing_wear", "overheating", "vibration"]},
    {"type": "Heat Exchanger", "prefix": "HX", "failure_modes": ["fouling", "tube_leak", "corrosion", "thermal_fatigue"]},
    {"type": "Electric Motor", "prefix": "M", "failure_modes": ["winding_failure", "bearing_damage", "overheating", "insulation_breakdown"]},
    {"type": "Conveyor Belt", "prefix": "CB", "failure_modes": ["belt_misalignment", "roller_failure", "belt_wear", "motor_burnout"]},
]

MANUFACTURERS = ["Siemens", "ABB", "Schneider Electric", "Emerson", "Honeywell", "Yokogawa"]
SUPPLIERS = ["BearingCo X", "SealTech Y", "ValveMaster Z", "PumpParts A", "MotorSpare B"]

def generate_equipment(n=50):
    equipment = []
    for i in range(n):
        eq_type = random.choice(EQUIPMENT_TYPES)
        equipment.append({
            "id": f"{eq_type['prefix']}-{100+i:03d}",
            "name": f"{eq_type['type']} {eq_type['prefix']}-{100+i:03d}",
            "type": eq_type["type"],
            "location": random.choice(["Unit-1", "Unit-2", "Unit-3", "Utility", "Tank Farm"]),
            "manufacturer": random.choice(MANUFACTURERS),
            "install_date": fake.date_between(start_date='-10y', end_date='-1y').isoformat(),
            "criticality": random.choice(["Critical", "High", "Medium", "Low"]),
            "failure_modes": eq_type["failure_modes"]
        })
    return equipment
```

### 3.4 Document Ingestion Pipeline

```mermaid
graph LR
    A["📄 Upload<br/>(PDF/Image/Doc/CSV)"] --> B{"File Type?"}
    B -->|PDF| C["PyPDF2 / pdfplumber<br/>Text Extraction"]
    B -->|Scanned PDF/Image| D["PaddleOCR<br/>Text Recognition"]
    B -->|DOCX| E["python-docx<br/>Text Extraction"]
    B -->|CSV/Excel| F["pandas<br/>Structured Parse"]
    C --> G["🧹 Text Cleaning"]
    D --> G
    E --> G
    F --> G
    G --> H["✂️ Recursive Chunking<br/>512 tokens, 50 overlap"]
    H --> I["🧮 BGE Embedding<br/>bge-base-en-v1.5"]
    H --> J["📝 Entity Extraction<br/>spaCy + Custom NER"]
    I --> K["📦 Qdrant<br/>Vector Storage"]
    J --> L["🕸️ Neo4j<br/>Graph Population"]
    H --> M["🐘 PostgreSQL<br/>Metadata Storage"]
```

**PaddleOCR Configuration**:
```python
from paddleocr import PaddleOCR

ocr = PaddleOCR(
    use_angle_cls=True,   # Detect rotated text
    lang='en',            # English (supports 80+ languages)
    use_gpu=False,        # CPU mode for free deployment
    det_model_dir=None,   # Use default detection model
    rec_model_dir=None,   # Use default recognition model
    show_log=False
)

def extract_text_from_image(image_path: str) -> str:
    result = ocr.ocr(image_path, cls=True)
    texts = []
    for line in result[0]:
        texts.append(line[1][0])  # Extract text from each detected line
    return "\n".join(texts)
```

**Chunking Strategy**:
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,          # ~512 tokens
    chunk_overlap=50,        # 50 token overlap for context continuity
    separators=["\n\n", "\n", ". ", " ", ""],
    length_function=len,
)

def chunk_document(text: str, metadata: dict) -> list[dict]:
    chunks = splitter.create_documents([text], metadatas=[metadata])
    return [
        {
            "text": chunk.page_content,
            "metadata": {
                **chunk.metadata,
                "chunk_index": i,
                "total_chunks": len(chunks),
            }
        }
        for i, chunk in enumerate(chunks)
    ]
```

---

## 4. AI/ML Pipeline — Models & Training

### 4.1 Models Overview

| Model | Type | Purpose | Training | Where It Runs |
|-------|------|---------|----------|---------------|
| **Google Gemini 2.0 Flash** | LLM (API) | Main reasoning & answer generation | No training (API) | Google Cloud (free tier) |
| **BGE-base-en-v1.5** | Embedding (local) | Document & query embeddings | No training (pretrained) | Backend server |
| **Custom Industrial NER** | spaCy NER | Extract equipment, failures, parts, etc. | Fine-tune on synthetic data | Backend server |
| **RUL Predictor** | LSTM / Temporal CNN | Predict remaining useful life | Train on CMAPSS | Backend server |
| **Anomaly Detector** | Autoencoder | Detect abnormal sensor patterns | Train on CMAPSS/synthetic | Backend server |

### 4.2 LLM Selection — Why Gemini 2.0 Flash (Free)

> [!IMPORTANT]
> We use **Google Gemini 2.0 Flash** via the free API tier instead of OpenAI/Llama because:
> - **Free**: 15 RPM, 1M TPM, 1500 RPD — more than enough for a hackathon demo
> - **Fast**: ~0.5s latency, excellent for interactive Q&A
> - **Capable**: 1M token context window, strong reasoning
> - **No GPU needed**: API-based, no local inference infrastructure required
> - **Fallback**: Groq free tier (Llama 3.1 8B) as backup — 30 RPM, 14,400 RPD

```python
# app/core/llm_service.py
import google.generativeai as genai
from groq import Groq

class LLMService:
    def __init__(self, primary="gemini", fallback="groq"):
        # Primary: Gemini 2.0 Flash (Free)
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.gemini = genai.GenerativeModel("gemini-2.0-flash")

        # Fallback: Groq (Llama 3.1 8B, also Free)
        self.groq = Groq(api_key=os.getenv("GROQ_API_KEY"))

    async def generate(self, prompt: str, context: str, system_prompt: str = None) -> str:
        try:
            response = self.gemini.generate_content(
                f"{system_prompt}\n\nContext:\n{context}\n\nQuestion:\n{prompt}",
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=2048,
                )
            )
            return response.text
        except Exception as e:
            # Fallback to Groq
            response = self.groq.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt or "You are an industrial AI assistant."},
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion:\n{prompt}"}
                ],
                temperature=0.3,
                max_tokens=2048,
            )
            return response.choices[0].message.content
```

### 4.3 Embedding Model — BGE-base-en-v1.5

| Property | Value |
|----------|-------|
| **Model** | `BAAI/bge-base-en-v1.5` |
| **Dimensions** | 768 |
| **Max Tokens** | 512 |
| **Size** | ~440 MB |
| **License** | MIT (fully free) |
| **Why chosen** | Best quality/size ratio for technical English text; outperforms OpenAI ada-002 on MTEB benchmark |

```python
# app/core/embedding_service.py
from sentence_transformers import SentenceTransformer
import numpy as np

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer("BAAI/bge-base-en-v1.5")
        self.instruction = "Represent this industrial document for retrieval: "

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Embed documents with retrieval instruction prefix"""
        prefixed = [self.instruction + t for t in texts]
        embeddings = self.model.encode(prefixed, normalize_embeddings=True, batch_size=32)
        return embeddings.tolist()

    def embed_query(self, query: str) -> list[float]:
        """Embed a search query (different prefix for asymmetric search)"""
        instruction = "Represent this search query for retrieving industrial documents: "
        embedding = self.model.encode(instruction + query, normalize_embeddings=True)
        return embedding.tolist()
```

### 4.4 Custom Industrial NER Model

**Training Data**: We create labeled synthetic data + annotate a subset of real documents.

**Entity Types**:

| Entity | Examples | Color |
|--------|----------|-------|
| `EQUIPMENT` | Pump P-101, Compressor C-205, Motor M-301 | 🔵 Blue |
| `COMPONENT` | Bearing, Seal, Impeller, Valve, Belt | 🟢 Green |
| `FAILURE_MODE` | Bearing failure, Seal leak, Overheating | 🔴 Red |
| `MEASUREMENT` | 2500 RPM, 85°C, 150 PSI, 3.2 mm/s vibration | 🟡 Yellow |
| `TECHNICIAN` | John Smith, Tech-042 | 🟣 Purple |
| `SUPPLIER` | BearingCo X, SealTech Y | 🟠 Orange |
| `DATE` | 2024-01-15, January 2024, last quarter | ⚪ Gray |
| `REGULATION` | OISD-STD-117, Factory Act Section 21 | 🔵 Cyan |
| `LOCATION` | Unit-1, Area B, Tank Farm | 🟤 Brown |

**Training Approach**:
```python
# ml/training/train_ner.py
import spacy
from spacy.training import Example
import json

def train_industrial_ner():
    # Start from pre-trained English model
    nlp = spacy.load("en_core_web_trf")  # Transformer-based for accuracy

    # Add custom NER labels
    ner = nlp.get_pipe("ner")
    custom_labels = [
        "EQUIPMENT", "COMPONENT", "FAILURE_MODE",
        "MEASUREMENT", "TECHNICIAN", "SUPPLIER",
        "REGULATION", "LOCATION"
    ]
    for label in custom_labels:
        ner.add_label(label)

    # Load synthetic training data
    with open("data/processed/ner_training_data.json") as f:
        training_data = json.load(f)

    # Training loop
    optimizer = nlp.resume_training()
    for epoch in range(30):
        losses = {}
        random.shuffle(training_data)
        for text, annotations in training_data:
            example = Example.from_dict(nlp.make_doc(text), annotations)
            nlp.update([example], drop=0.3, losses=losses)
        print(f"Epoch {epoch}: {losses}")

    nlp.to_disk("models/ner/industrial_ner_v1")
```

**NER Training Data Format** (400+ labeled sentences):
```json
[
    [
        "Pump P-101 experienced bearing failure due to seal leak on 2024-01-15",
        {"entities": [[0, 10, "EQUIPMENT"], [23, 38, "FAILURE_MODE"], [46, 55, "FAILURE_MODE"], [59, 69, "DATE"]]}
    ],
    [
        "Technician John Smith replaced the impeller from SealTech Y in Unit-2",
        {"entities": [[11, 21, "TECHNICIAN"], [35, 43, "COMPONENT"], [49, 59, "SUPPLIER"], [63, 69, "LOCATION"]]}
    ]
]
```

### 4.5 RUL Prediction Model (LSTM)

**Architecture**: Bidirectional LSTM with attention

```python
# ml/training/train_rul.py
import torch
import torch.nn as nn

class RULPredictor(nn.Module):
    def __init__(self, input_dim=14, hidden_dim=64, num_layers=2, dropout=0.3):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout
        )
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.Tanh(),
            nn.Linear(64, 1)
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, x):
        # x shape: (batch, seq_len, features)
        lstm_out, _ = self.lstm(x)  # (batch, seq_len, hidden*2)

        # Attention mechanism
        attn_weights = self.attention(lstm_out)  # (batch, seq_len, 1)
        attn_weights = torch.softmax(attn_weights, dim=1)
        context = torch.sum(lstm_out * attn_weights, dim=1)  # (batch, hidden*2)

        rul = self.fc(context)  # (batch, 1)
        return rul

# Training configuration
config = {
    "window_size": 30,        # 30 time steps lookback
    "batch_size": 64,
    "learning_rate": 0.001,
    "epochs": 100,
    "early_stopping_patience": 15,
    "optimizer": "Adam",
    "loss": "MSELoss",  # Alternatively HuberLoss for robustness
    "scheduler": "ReduceLROnPlateau",
}
```

**Expected Performance** (on FD001):
- RMSE: ~12-15 cycles
- Score: ~250-350 (NASA scoring function)

### 4.6 Anomaly Detection Model (Autoencoder)

For detecting abnormal sensor patterns in real-time:

```python
# ml/training/train_anomaly.py
import torch.nn as nn

class IndustrialAutoencoder(nn.Module):
    def __init__(self, input_dim=14, latent_dim=4):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.BatchNorm1d(32),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.BatchNorm1d(16),
            nn.Linear(16, latent_dim),
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 16),
            nn.ReLU(),
            nn.BatchNorm1d(16),
            nn.Linear(16, 32),
            nn.ReLU(),
            nn.BatchNorm1d(32),
            nn.Linear(32, input_dim),
        )

    def forward(self, x):
        z = self.encoder(x)
        x_hat = self.decoder(z)
        return x_hat

# Anomaly detection: if reconstruction_error > threshold → anomaly
# Threshold set at 95th percentile of training reconstruction errors
```

---

## 5. Knowledge Graph — Neo4j Schema & Population

### 5.1 Graph Schema

```mermaid
graph LR
    EQ["🔧 Equipment<br/>id, name, type, location,<br/>manufacturer, criticality"]
    COMP["⚙️ Component<br/>id, name, type,<br/>specifications"]
    FAIL["💥 Failure<br/>id, mode, date,<br/>severity, downtime_hrs"]
    MAINT["🔨 Maintenance<br/>id, type, date,<br/>description, cost"]
    TECH["👷 Technician<br/>id, name, certifications,<br/>experience_years"]
    SUPP["🏭 Supplier<br/>id, name, quality_rating,<br/>lead_time_days"]
    DOC["📄 Document<br/>id, title, type,<br/>upload_date, source"]
    REG["📋 Regulation<br/>id, name, standard,<br/>section, requirement"]
    INSP["🔍 Inspection<br/>id, date, result,<br/>findings, inspector"]
    LOC["📍 Location<br/>id, name, area, building"]

    EQ -->|HAS_COMPONENT| COMP
    EQ -->|EXPERIENCED_FAILURE| FAIL
    EQ -->|HAD_MAINTENANCE| MAINT
    EQ -->|LOCATED_AT| LOC
    EQ -->|MANUFACTURED_BY| SUPP
    EQ -->|REFERENCED_IN| DOC
    EQ -->|SUBJECT_TO| REG
    EQ -->|WAS_INSPECTED| INSP
    COMP -->|SUPPLIED_BY| SUPP
    COMP -->|CAUSED_FAILURE| FAIL
    FAIL -->|RESOLVED_BY| MAINT
    MAINT -->|PERFORMED_BY| TECH
    MAINT -->|USED_PART_FROM| SUPP
    TECH -->|CERTIFIED_FOR| EQ
    DOC -->|MENTIONS_EQUIPMENT| EQ
    DOC -->|DESCRIBES_FAILURE| FAIL
    REG -->|REQUIRES_INSPECTION| INSP
    INSP -->|PERFORMED_BY| TECH
    FAIL -->|SIMILAR_TO| FAIL
```

### 5.2 Cypher Schema Creation

```cypher
// Constraints (unique IDs for each node type)
CREATE CONSTRAINT equipment_id IF NOT EXISTS FOR (e:Equipment) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT component_id IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT failure_id IF NOT EXISTS FOR (f:Failure) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT maintenance_id IF NOT EXISTS FOR (m:Maintenance) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT technician_id IF NOT EXISTS FOR (t:Technician) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT supplier_id IF NOT EXISTS FOR (s:Supplier) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT document_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT regulation_id IF NOT EXISTS FOR (r:Regulation) REQUIRE r.id IS UNIQUE;
CREATE CONSTRAINT inspection_id IF NOT EXISTS FOR (i:Inspection) REQUIRE i.id IS UNIQUE;
CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE;

// Indexes for fast lookup
CREATE INDEX equipment_type IF NOT EXISTS FOR (e:Equipment) ON (e.type);
CREATE INDEX failure_mode IF NOT EXISTS FOR (f:Failure) ON (f.mode);
CREATE INDEX maintenance_date IF NOT EXISTS FOR (m:Maintenance) ON (m.date);
CREATE INDEX document_type IF NOT EXISTS FOR (d:Document) ON (d.doc_type);

// Full-text search indexes
CREATE FULLTEXT INDEX equipment_search IF NOT EXISTS FOR (e:Equipment) ON EACH [e.name, e.type, e.description];
CREATE FULLTEXT INDEX failure_search IF NOT EXISTS FOR (f:Failure) ON EACH [f.mode, f.description, f.root_cause];
```

### 5.3 Graph Population from NER Output

```python
# app/core/graph_service.py
from neo4j import AsyncGraphDatabase

class GraphService:
    def __init__(self, uri, user, password):
        self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))

    async def create_equipment(self, equipment: dict):
        query = """
        MERGE (e:Equipment {id: $id})
        SET e.name = $name, e.type = $type,
            e.location = $location, e.manufacturer = $manufacturer,
            e.criticality = $criticality, e.install_date = $install_date
        WITH e
        MERGE (l:Location {name: $location})
        MERGE (e)-[:LOCATED_AT]->(l)
        MERGE (s:Supplier {name: $manufacturer})
        MERGE (e)-[:MANUFACTURED_BY]->(s)
        """
        async with self.driver.session() as session:
            await session.run(query, **equipment)

    async def create_failure_event(self, failure: dict):
        query = """
        MATCH (e:Equipment {id: $equipment_id})
        MERGE (f:Failure {id: $failure_id})
        SET f.mode = $failure_mode, f.date = date($date),
            f.severity = $severity, f.downtime_hours = $downtime_hours,
            f.root_cause = $root_cause, f.description = $description
        MERGE (e)-[:EXPERIENCED_FAILURE]->(f)
        WITH f, e
        // Link failed component
        MERGE (c:Component {name: $failed_component})
        MERGE (c)-[:CAUSED_FAILURE]->(f)
        MERGE (e)-[:HAS_COMPONENT]->(c)
        // Link supplier of failed part
        MERGE (s:Supplier {name: $supplier})
        MERGE (c)-[:SUPPLIED_BY]->(s)
        """
        async with self.driver.session() as session:
            await session.run(query, **failure)

    async def link_document_to_entities(self, doc_id: str, entities: list[dict]):
        """After NER, connect document to all mentioned entities"""
        for entity in entities:
            if entity["type"] == "EQUIPMENT":
                query = """
                MATCH (d:Document {id: $doc_id})
                MERGE (e:Equipment {id: $entity_id})
                MERGE (d)-[:MENTIONS_EQUIPMENT]->(e)
                """
            elif entity["type"] == "FAILURE_MODE":
                query = """
                MATCH (d:Document {id: $doc_id})
                MERGE (f:Failure {mode: $entity_value})
                MERGE (d)-[:DESCRIBES_FAILURE]->(f)
                """
            # ... similar for other entity types
            async with self.driver.session() as session:
                await session.run(query, doc_id=doc_id,
                                  entity_id=entity.get("id", entity["text"]),
                                  entity_value=entity["text"])
```

### 5.4 Root Cause Analysis via Graph Traversal

```python
# app/core/rca_engine.py

class RCAEngine:
    def __init__(self, graph_service: GraphService, llm_service: LLMService):
        self.graph = graph_service
        self.llm = llm_service

    async def analyze_failure(self, equipment_id: str) -> dict:
        """Perform automated root cause analysis for an equipment failure"""

        # 1. Get failure history for this equipment
        failure_history = await self.graph.run_query("""
            MATCH (e:Equipment {id: $id})-[:EXPERIENCED_FAILURE]->(f:Failure)
            OPTIONAL MATCH (f)<-[:CAUSED_FAILURE]-(c:Component)-[:SUPPLIED_BY]->(s:Supplier)
            OPTIONAL MATCH (f)<-[:RESOLVED_BY]-(m:Maintenance)-[:PERFORMED_BY]->(t:Technician)
            RETURN f, c, s, m, t
            ORDER BY f.date DESC
        """, id=equipment_id)

        # 2. Find similar equipment with same failure patterns
        similar_failures = await self.graph.run_query("""
            MATCH (e1:Equipment {id: $id})-[:EXPERIENCED_FAILURE]->(f1:Failure)
            WITH e1, collect(f1.mode) AS modes
            MATCH (e2:Equipment)-[:EXPERIENCED_FAILURE]->(f2:Failure)
            WHERE e2.id <> e1.id AND f2.mode IN modes AND e2.type = e1.type
            RETURN e2.id, e2.name, collect(f2) AS failures
        """, id=equipment_id)

        # 3. Identify common supplier for failed components
        supplier_analysis = await self.graph.run_query("""
            MATCH (e:Equipment {id: $id})-[:EXPERIENCED_FAILURE]->(f:Failure)
                  <-[:CAUSED_FAILURE]-(c:Component)-[:SUPPLIED_BY]->(s:Supplier)
            RETURN s.name, count(f) AS failure_count,
                   collect(DISTINCT c.name) AS failed_components,
                   collect(DISTINCT f.mode) AS failure_modes
            ORDER BY failure_count DESC
        """, id=equipment_id)

        # 4. Check maintenance patterns
        maintenance_gaps = await self.graph.run_query("""
            MATCH (e:Equipment {id: $id})-[:HAD_MAINTENANCE]->(m:Maintenance)
            WHERE m.type = 'preventive'
            WITH e, m ORDER BY m.date DESC
            WITH e, collect(m.date) AS dates
            WITH e, [i IN range(0, size(dates)-2) |
                duration.between(dates[i+1], dates[i]).days] AS gaps
            RETURN avg(gaps) AS avg_gap_days, max(gaps) AS max_gap_days
        """, id=equipment_id)

        # 5. Use LLM to synthesize findings into a narrative
        rca_context = self._format_rca_context(
            failure_history, similar_failures, supplier_analysis, maintenance_gaps
        )

        rca_report = await self.llm.generate(
            prompt=f"Perform root cause analysis for equipment {equipment_id}",
            context=rca_context,
            system_prompt=RCA_SYSTEM_PROMPT
        )

        return {
            "equipment_id": equipment_id,
            "failure_history": failure_history,
            "similar_equipment_affected": similar_failures,
            "supplier_correlation": supplier_analysis,
            "maintenance_gap_analysis": maintenance_gaps,
            "rca_narrative": rca_report,
            "recommendations": self._extract_recommendations(rca_report)
        }
```

### 5.5 Compliance Gap Detection

```python
# app/core/compliance_engine.py

class ComplianceEngine:
    async def check_compliance(self, equipment_id: str = None) -> dict:
        """Check equipment compliance against stored regulations"""

        query = """
        MATCH (e:Equipment)-[:SUBJECT_TO]->(r:Regulation)
        OPTIONAL MATCH (e)-[:WAS_INSPECTED]->(i:Inspection)
        WHERE i.regulation_id = r.id
        WITH e, r,
             max(i.date) AS last_inspection,
             r.inspection_interval_days AS required_interval
        WHERE last_inspection IS NULL
              OR date() > last_inspection + duration({days: required_interval})
        RETURN e.id AS equipment_id, e.name AS equipment_name,
               r.name AS regulation, r.requirement AS requirement,
               last_inspection, required_interval,
               CASE WHEN last_inspection IS NULL
                    THEN 'NEVER_INSPECTED'
                    ELSE 'OVERDUE' END AS gap_type
        ORDER BY gap_type, e.criticality DESC
        """
        if equipment_id:
            query = query.replace(
                "MATCH (e:Equipment)",
                f"MATCH (e:Equipment {{id: '{equipment_id}'}})"
            )

        gaps = await self.graph.run_query(query)
        return {
            "total_gaps": len(gaps),
            "critical_gaps": [g for g in gaps if g.get("criticality") == "Critical"],
            "gaps": gaps,
            "compliance_score": self._calculate_score(gaps)
        }
```

---

## 6. RAG Pipeline — GraphRAG Architecture

### 6.1 How GraphRAG Works (Our Differentiator)

Unlike simple RAG (retrieve chunks → feed to LLM), our **GraphRAG** combines:

1. **Vector Search** (Qdrant): Find semantically relevant document chunks
2. **Graph Traversal** (Neo4j): Find structurally related entities and relationships
3. **Hybrid Context Assembly**: Merge both into a rich context for the LLM
4. **Citation Generation**: Track source documents for every claim

```python
# app/core/rag_engine.py
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

class GraphRAGEngine:
    def __init__(self, vector_service, graph_service, llm_service, embedding_service):
        self.vector = vector_service
        self.graph = graph_service
        self.llm = llm_service
        self.embedder = embedding_service

    async def query(self, question: str, filters: dict = None) -> dict:
        # Step 1: Extract entities from the question
        entities = self.extract_question_entities(question)

        # Step 2: Vector search — semantic similarity
        query_embedding = self.embedder.embed_query(question)
        vector_results = await self.vector.search(
            collection_name="industrial_docs",
            query_vector=query_embedding,
            limit=10,
            query_filter=self._build_filter(filters)
        )

        # Step 3: Graph search — structural relationships
        graph_context = []
        for entity in entities:
            if entity["type"] == "EQUIPMENT":
                # Get full equipment subgraph
                subgraph = await self.graph.run_query("""
                    MATCH (e:Equipment {id: $id})
                    OPTIONAL MATCH (e)-[r1]->(n1)
                    OPTIONAL MATCH (n1)-[r2]->(n2)
                    RETURN e, r1, n1, r2, n2
                    LIMIT 50
                """, id=entity["id"])
                graph_context.append(self._format_subgraph(subgraph))

            elif entity["type"] == "FAILURE_MODE":
                # Find all equipment with this failure mode
                related = await self.graph.run_query("""
                    MATCH (e:Equipment)-[:EXPERIENCED_FAILURE]->(f:Failure {mode: $mode})
                    OPTIONAL MATCH (f)<-[:CAUSED_FAILURE]-(c:Component)-[:SUPPLIED_BY]->(s:Supplier)
                    RETURN e, f, c, s
                """, mode=entity["text"])
                graph_context.append(self._format_subgraph(related))

        # Step 4: Assemble hybrid context
        context = self._assemble_context(
            vector_chunks=[r.payload["text"] for r in vector_results],
            graph_data=graph_context,
            sources=[r.payload["metadata"] for r in vector_results]
        )

        # Step 5: Generate answer with citations
        answer = await self.llm.generate(
            prompt=question,
            context=context,
            system_prompt=GRAPHRAG_SYSTEM_PROMPT
        )

        # Step 6: Extract citations and return
        return {
            "answer": answer,
            "sources": self._extract_citations(answer, vector_results),
            "graph_entities": entities,
            "confidence": self._calculate_confidence(vector_results),
            "recommendations": self._extract_recommendations(answer)
        }

    def _assemble_context(self, vector_chunks, graph_data, sources):
        context_parts = []

        # Add relevant document chunks
        context_parts.append("## Relevant Document Excerpts")
        for i, chunk in enumerate(vector_chunks):
            src = sources[i]
            context_parts.append(
                f"[Source {i+1}: {src.get('title', 'Unknown')} "
                f"(Page {src.get('page', 'N/A')})]\n{chunk}\n"
            )

        # Add knowledge graph context
        if graph_data:
            context_parts.append("## Knowledge Graph Context")
            for gd in graph_data:
                context_parts.append(gd)

        return "\n\n".join(context_parts)
```

### 6.2 Prompt Templates

```python
# app/utils/prompts.py

GRAPHRAG_SYSTEM_PROMPT = """You are an Industrial Brain AI assistant for a manufacturing plant.
You have access to equipment data, maintenance records, failure history, and safety regulations
through both document retrieval and a knowledge graph.

RULES:
1. Always cite your sources using [Source N] format
2. If the knowledge graph shows patterns (recurring failures, common suppliers), highlight them
3. If you detect a potential risk or compliance gap, flag it proactively
4. Provide actionable recommendations when relevant
5. If you're not sure about something, say so — never fabricate data
6. Use technical but clear language appropriate for plant engineers

RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide supporting evidence from documents and knowledge graph
- Include any relevant warnings or recommendations
- End with source citations
"""

RCA_SYSTEM_PROMPT = """You are performing Root Cause Analysis (RCA) for industrial equipment.
Analyze the provided failure history, supplier data, maintenance records, and similar equipment patterns.

Structure your analysis as:
1. **Summary**: Brief overview of the failure pattern
2. **Timeline**: Chronological failure events
3. **Root Cause Identification**: Most likely root cause(s) with evidence
4. **Contributing Factors**: Secondary causes
5. **Supplier Correlation**: Any supplier-related patterns
6. **Similar Equipment**: Risk assessment for similar assets
7. **Recommendations**: Specific corrective and preventive actions
8. **Priority**: Urgency rating (Critical/High/Medium/Low)

Be data-driven. Reference specific dates, measurements, and patterns.
"""

COMPLIANCE_SYSTEM_PROMPT = """You are a compliance analysis assistant for industrial safety.
Given the regulatory requirements and current inspection/maintenance status,
identify gaps and non-compliance issues.

For each gap, provide:
1. The specific regulation/standard being violated
2. The equipment affected
3. The nature of the gap (overdue inspection, missing certification, etc.)
4. Risk level (Critical/High/Medium/Low)
5. Recommended corrective action
6. Deadline for compliance
"""
```

---

## 7. Backend — FastAPI Services

### 7.1 Main Application

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1.router import api_router
from app.db.postgres import init_db
from app.db.neo4j import init_neo4j
from app.db.qdrant import init_qdrant

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await init_neo4j()
    await init_qdrant()
    yield
    # Shutdown
    # Close connections

app = FastAPI(
    title="Industrial Brain API",
    description="AI-powered Industrial Knowledge Management Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
```

### 7.2 API Endpoints

| Method | Endpoint | Purpose | Platform |
|--------|----------|---------|----------|
| `POST` | `/api/v1/documents/upload` | Upload & process documents | 🖥️📱 Both |
| `GET` | `/api/v1/documents` | List all documents | 🖥️📱 Both |
| `GET` | `/api/v1/documents/{id}` | Get document details | 🖥️📱 Both |
| `DELETE` | `/api/v1/documents/{id}` | Delete a document | 🖥️ Web |
| `POST` | `/api/v1/query` | Ask a question (GraphRAG) | 🖥️📱 Both |
| `POST` | `/api/v1/query/stream` | Streaming Q&A response | 🖥️📱 Both |
| `POST` | `/api/v1/rca/{equipment_id}` | Run root cause analysis | 🖥️📱 Both |
| `GET` | `/api/v1/equipment` | List all equipment | 🖥️📱 Both |
| `GET` | `/api/v1/equipment/{id}` | Get equipment details | 🖥️📱 Both |
| `GET` | `/api/v1/equipment/qr/{qr_code}` | Lookup equipment by QR code | 📱 Mobile |
| `GET` | `/api/v1/maintenance/predictions` | Get failure predictions | 🖥️📱 Both |
| `GET` | `/api/v1/maintenance/schedule` | Recommended maintenance schedule | 🖥️📱 Both |
| `POST` | `/api/v1/maintenance/work-orders` | Create work order | 🖥️📱 Both |
| `PATCH` | `/api/v1/maintenance/work-orders/{id}` | Update work order status | 🖥️📱 Both |
| `GET` | `/api/v1/compliance/check` | Run compliance audit | 🖥️📱 Both |
| `GET` | `/api/v1/compliance/gaps` | List compliance gaps | 🖥️📱 Both |
| `GET` | `/api/v1/knowledge/graph` | Get graph data for visualization | 🖥️ Web |
| `GET` | `/api/v1/knowledge/equipment/{id}` | Get equipment subgraph | 🖥️📱 Both |
| `POST` | `/api/v1/knowledge/search` | Search knowledge graph | 🖥️📱 Both |
| `GET` | `/api/v1/analytics/dashboard` | Dashboard statistics | 🖥️📱 Both |
| `GET` | `/api/v1/analytics/trends` | Failure/maintenance trends | 🖥️ Web |
| `POST` | `/api/v1/auth/login` | User authentication | 🖥️📱 Both |
| `POST` | `/api/v1/auth/register` | User registration | 🖥️📱 Both |
| `POST` | `/api/v1/mobile/photo-analyze` | Upload fault photo → OCR + AI | 📱 Mobile |
| `POST` | `/api/v1/notifications/register` | Register push notification token | 📱 Mobile |
| `DELETE` | `/api/v1/notifications/unregister` | Unregister push token | 📱 Mobile |
| `GET` | `/api/v1/mobile/sync` | Delta sync since timestamp | 📱 Mobile |
| `POST` | `/api/v1/mobile/offline-batch` | Submit offline-queued actions | 📱 Mobile |
| `WS` | `/ws/events` | Real-time WebSocket events | 🖥️📱 Both |

### 7.3 Key Route Implementations

```python
# backend/app/api/v1/query.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.core.rag_engine import GraphRAGEngine
from app.models.schemas import QueryRequest, QueryResponse

router = APIRouter(prefix="/query", tags=["Query"])

@router.post("/", response_model=QueryResponse)
async def ask_question(
    request: QueryRequest,
    rag_engine: GraphRAGEngine = Depends(get_rag_engine)
):
    """Ask the Industrial Brain a question using GraphRAG"""
    result = await rag_engine.query(
        question=request.question,
        filters=request.filters
    )
    return QueryResponse(
        answer=result["answer"],
        sources=result["sources"],
        graph_entities=result["graph_entities"],
        confidence=result["confidence"],
        recommendations=result["recommendations"]
    )

@router.post("/stream")
async def ask_question_stream(
    request: QueryRequest,
    rag_engine: GraphRAGEngine = Depends(get_rag_engine)
):
    """Stream the answer for real-time display"""
    async def generate():
        async for chunk in rag_engine.query_stream(
            question=request.question,
            filters=request.filters
        ):
            yield f"data: {json.dumps(chunk)}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

```python
# backend/app/api/v1/documents.py
from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from app.core.document_processor import DocumentProcessor

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = "general",
    background_tasks: BackgroundTasks = None,
    processor: DocumentProcessor = Depends(get_processor)
):
    """Upload and process an industrial document"""
    # Save file
    file_path = await save_upload(file)

    # Process in background (OCR, chunk, embed, extract entities, update graph)
    background_tasks.add_task(
        processor.process_document,
        file_path=file_path,
        doc_type=doc_type,
        filename=file.filename
    )

    return {
        "status": "processing",
        "message": f"Document '{file.filename}' is being processed",
        "document_id": file_path.stem
    }
```

### 7.4 PostgreSQL Schema

```sql
-- Database models for metadata storage

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'engineer',
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    doc_type VARCHAR(100),  -- manual, maintenance_log, inspection_report, regulation, etc.
    file_path TEXT,
    file_size_bytes BIGINT,
    upload_date TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    entity_count INTEGER DEFAULT 0,
    uploaded_by UUID REFERENCES users(id),
    metadata JSONB  -- flexible metadata storage
);

CREATE TABLE query_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    question TEXT NOT NULL,
    answer TEXT,
    sources JSONB,
    confidence FLOAT,
    feedback_rating INTEGER,  -- 1-5 user rating
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE equipment_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    sensor_data JSONB,  -- flexible sensor readings
    predicted_rul FLOAT,
    anomaly_score FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50),  -- failure_prediction, compliance_gap, anomaly
    severity VARCHAR(20),
    equipment_id VARCHAR(50),
    message TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_type ON documents(doc_type);
CREATE INDEX idx_documents_processed ON documents(processed);
CREATE INDEX idx_query_log_user ON query_log(user_id);
CREATE INDEX idx_equipment_metrics_id ON equipment_metrics(equipment_id);
CREATE INDEX idx_alerts_severity ON alerts(severity, resolved);
```

### 7.5 Requirements

```
# backend/requirements.txt
# Core
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic==2.9.0
pydantic-settings==2.5.0

# Database
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
alembic==1.13.0

# Neo4j
neo4j==5.25.0

# Vector DB
qdrant-client==1.12.0

# AI/ML
google-generativeai==0.8.0
groq==0.11.0
sentence-transformers==3.1.0
langchain==0.3.0
langchain-community==0.3.0
llama-index==0.11.0

# NLP
spacy==3.8.0

# Document Processing
paddleocr==2.8.0
paddlepaddle==2.6.0
PyPDF2==3.0.1
pdfplumber==0.11.0
python-docx==1.1.0
openpyxl==3.1.5

# ML
torch==2.4.0
scikit-learn==1.5.0
numpy==1.26.0
pandas==2.2.0

# Utilities
httpx==0.27.0
python-dotenv==1.0.1
celery[redis]==5.4.0  # Optional: for heavy background tasks
```

---

## 8. Frontend — Next.js Web Dashboard

### 8.1 Pages & Features

| Page | Features |
|------|----------|
| **Dashboard** | KPI cards (total docs, equipment health, open alerts, compliance score), recent alerts feed, equipment health heatmap, activity timeline |
| **AI Query** | Chat-like interface, voice input, source citations with document links, follow-up suggestions, conversation history |
| **Documents** | Upload with drag-drop, document list with filters, processing status, preview |
| **Knowledge Graph** | Interactive 3D graph visualization (react-force-graph-3d), node filtering, path finding, subgraph export |
| **Predictive Maintenance** | Equipment health scores, RUL predictions with gauges, trend charts, maintenance scheduling calendar |
| **Root Cause Analysis** | Equipment selector, automated RCA report, failure timeline, supplier correlation charts |
| **Compliance** | Regulation checklist, gap highlighting, overdue inspections, audit report generator |
| **Analytics** | Failure frequency charts, MTBF/MTTR metrics, cost analysis, technician performance |

### 8.2 Key Libraries

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-force-graph-3d": "^1.24.0",
    "recharts": "^2.12.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "react-dropzone": "^14.2.0",
    "react-markdown": "^9.0.0",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "date-fns": "^3.6.0",
    "sonner": "^1.5.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### 8.3 Design System

- **Color Palette**: Dark mode primary with industrial accent colors
  - Background: `#0a0a0f` (near black)
  - Surface: `#13131a` (dark cards)
  - Primary: `#6366f1` (indigo)
  - Accent: `#22d3ee` (cyan for data highlights)
  - Success: `#10b981` (green)
  - Warning: `#f59e0b` (amber)
  - Danger: `#ef4444` (red)
  - Text: `#e2e8f0` (light gray)

- **Typography**: Inter font family
- **Effects**: Glassmorphism cards, gradient borders, subtle glow on interactive elements
- **Animations**: Framer Motion for page transitions, chart animations, micro-interactions

---

## 9. Web ↔ Mobile Seamless Connectivity

> [!IMPORTANT]
> Both the **Web Dashboard** and **Mobile App** are **first-class clients** connected to the **same FastAPI backend**. They share types, API client code, authentication, and receive real-time updates through the same WebSocket channel.

### 9.1 Seamless Connection Architecture

```mermaid
graph TB
    subgraph "Shared Package (@epic/shared)"
        TYPES["📦 TypeScript Types<br/>Equipment, Failure, Query,<br/>Maintenance, Compliance"]
        APICLIENT["🔗 API Client<br/>Axios-based, works on<br/>web + React Native"]
        WSCLIENT["🔌 WebSocket Client<br/>Shared event types +<br/>reconnection logic"]
        STORES["🗂️ Zustand Stores<br/>Shared state patterns<br/>(different persistence)"]
    end

    subgraph "Web Dashboard (Next.js)"
        WEBUI["🖥️ Dashboard Pages"]
        WEBAUTH["🔐 JWT in HttpOnly Cookie"]
        WEBWS["🔌 WebSocket (native)"]
        WEBSTORE["💾 localStorage"]
    end

    subgraph "Mobile App (Expo)"
        MOBUI["📱 Native Screens"]
        MOBAUTH["🔐 JWT in SecureStore"]
        MOBWS["🔌 WebSocket (native)"]
        MOBSTORE["💾 AsyncStorage<br/>+ Offline Queue"]
        PUSH["🔔 Push Notifications"]
    end

    subgraph "Backend (FastAPI)"
        REST["⚡ REST API<br/>/api/v1/*"]
        WSSERVER["🔌 WebSocket Server<br/>/ws/events"]
        PUSHSVC["📤 Expo Push Service"]
        AUTH["🔐 JWT Auth<br/>(same tokens for web + mobile)"]
    end

    TYPES --> WEBUI
    TYPES --> MOBUI
    APICLIENT --> WEBUI
    APICLIENT --> MOBUI
    WSCLIENT --> WEBWS
    WSCLIENT --> MOBWS
    STORES --> WEBSTORE
    STORES --> MOBSTORE

    WEBUI --> REST
    MOBUI --> REST
    WEBWS --> WSSERVER
    MOBWS --> WSSERVER
    PUSHSVC --> PUSH
    WEBAUTH --> AUTH
    MOBAUTH --> AUTH
```

### 9.2 Shared TypeScript Types (`shared/src/types/`)

Both web and mobile import the **exact same types**, ensuring API contracts never drift:

```typescript
// shared/src/types/equipment.ts
export interface Equipment {
  id: string;                    // e.g. "P-101"
  name: string;                  // e.g. "Centrifugal Pump P-101"
  type: EquipmentType;
  location: string;
  manufacturer: string;
  installDate: string;
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Operational' | 'Under Maintenance' | 'Failed' | 'Decommissioned';
  healthScore: number;           // 0-100
  predictedRUL?: number;         // Remaining cycles/days
  lastMaintenance?: string;
  qrCode: string;                // QR code identifier for mobile scanning
}

export interface Failure {
  id: string;
  equipmentId: string;
  mode: string;
  date: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  downtimeHours: number;
  rootCause?: string;
  componentFailed: string;
  supplierOfPart: string;
}

export interface MaintenancePrediction {
  equipmentId: string;
  equipmentName: string;
  predictedFailureDate: string;
  confidence: number;
  recommendedAction: string;
  failureMode: string;
  urgency: 'Immediate' | 'This Week' | 'This Month' | 'Scheduled';
}

// shared/src/types/query.ts
export interface QueryRequest {
  question: string;
  filters?: {
    equipmentId?: string;
    docType?: string;
    dateRange?: { start: string; end: string };
  };
  conversationId?: string;       // For follow-up questions
  source: 'web' | 'mobile';     // Track query origin
}

export interface QueryResponse {
  answer: string;
  sources: SourceCitation[];
  graphEntities: GraphEntity[];
  confidence: number;
  recommendations: string[];
  conversationId: string;
}

export interface SourceCitation {
  documentId: string;
  documentTitle: string;
  chunkText: string;
  page?: number;
  relevanceScore: number;
}
```

### 9.3 Shared API Client (`shared/src/api/client.ts`)

One API client that works on **both web (browser fetch) and React Native**:

```typescript
// shared/src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class IndustrialBrainAPI {
  private client: AxiosInstance;
  private getToken: () => Promise<string | null>;

  constructor(config: {
    baseURL: string;
    getToken: () => Promise<string | null>;  // Different impl for web vs mobile
  }) {
    this.getToken = config.getToken;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach JWT token to every request
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  // === Equipment (used by BOTH web and mobile) ===
  async getEquipment(id: string): Promise<Equipment> {
    const { data } = await this.client.get(`/api/v1/equipment/${id}`);
    return data;
  }

  async getEquipmentByQR(qrCode: string): Promise<Equipment> {
    const { data } = await this.client.get(`/api/v1/equipment/qr/${qrCode}`);
    return data;
  }

  async listEquipment(filters?: EquipmentFilters): Promise<Equipment[]> {
    const { data } = await this.client.get('/api/v1/equipment', { params: filters });
    return data;
  }

  // === AI Query (same endpoint, same response for web and mobile) ===
  async askQuestion(request: QueryRequest): Promise<QueryResponse> {
    const { data } = await this.client.post('/api/v1/query', request);
    return data;
  }

  // === Documents ===
  async uploadDocument(formData: FormData): Promise<{ documentId: string }> {
    const { data } = await this.client.post('/api/v1/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  // === Mobile-Specific: Photo Upload (OCR Analysis) ===
  async uploadFaultPhoto(formData: FormData): Promise<FaultAnalysis> {
    const { data } = await this.client.post('/api/v1/mobile/photo-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  // === Maintenance ===
  async getPredictions(): Promise<MaintenancePrediction[]> {
    const { data } = await this.client.get('/api/v1/maintenance/predictions');
    return data;
  }

  // === Push Notifications (mobile only, but defined in shared) ===
  async registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
    await this.client.post('/api/v1/notifications/register', { token, platform });
  }
}
```

**Web initialization:**
```typescript
// frontend/src/lib/api.ts
import { IndustrialBrainAPI } from '@epic/shared';

export const api = new IndustrialBrainAPI({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  getToken: async () => {
    // Web: read from cookie or localStorage
    return localStorage.getItem('auth_token');
  },
});
```

**Mobile initialization:**
```typescript
// mobile/src/services/api.ts
import { IndustrialBrainAPI } from '@epic/shared';
import * as SecureStore from 'expo-secure-store';

export const api = new IndustrialBrainAPI({
  baseURL: 'https://your-api.onrender.com',
  getToken: async () => {
    // Mobile: read from encrypted SecureStore
    return await SecureStore.getItemAsync('auth_token');
  },
});
```

### 9.4 Real-Time WebSocket Events (Shared)

Both web and mobile connect to the **same WebSocket** for real-time updates:

```typescript
// shared/src/api/websocket.ts
export type WSEventType =
  | 'alert:new'                  // New alert (failure prediction, anomaly, compliance gap)
  | 'alert:resolved'             // Alert was resolved
  | 'equipment:status_change'    // Equipment status updated
  | 'equipment:health_update'    // Health score recalculated
  | 'document:processing_start'  // Document upload started processing
  | 'document:processing_done'   // Document finished processing
  | 'maintenance:prediction'     // New failure prediction generated
  | 'compliance:gap_detected'    // New compliance gap found
  | 'query:answer_ready';        // Async query answer completed

export interface WSEvent {
  type: WSEventType;
  payload: any;
  timestamp: string;
  targetUserIds?: string[];      // If null, broadcast to all
}

export class IndustrialBrainWS {
  private ws: WebSocket | null = null;
  private listeners: Map<WSEventType, Set<(payload: any) => void>> = new Map();
  private reconnectInterval = 3000;
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  connect() {
    this.ws = new WebSocket(`${this.url}/ws/events?token=${this.token}`);

    this.ws.onmessage = (event) => {
      const wsEvent: WSEvent = JSON.parse(event.data);
      const handlers = this.listeners.get(wsEvent.type);
      handlers?.forEach(handler => handler(wsEvent.payload));
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), this.reconnectInterval);
    };
  }

  on(event: WSEventType, handler: (payload: any) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: WSEventType, handler: (payload: any) => void) {
    this.listeners.get(event)?.delete(handler);
  }

  disconnect() {
    this.ws?.close();
  }
}
```

**Backend WebSocket server:**
```python
# backend/app/api/v1/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.core.auth import verify_ws_token
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}  # user_id -> connections

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        self.active_connections.get(user_id, []).remove(websocket)

    async def broadcast(self, event: dict):
        """Send event to ALL connected clients (web + mobile)"""
        for user_id, connections in self.active_connections.items():
            for ws in connections:
                try:
                    await ws.send_json(event)
                except:
                    pass

    async def send_to_user(self, user_id: str, event: dict):
        """Send event to specific user on ALL their devices (web + mobile)"""
        for ws in self.active_connections.get(user_id, []):
            try:
                await ws.send_json(event)
            except:
                pass

manager = ConnectionManager()

@router.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket, token: str):
    user = await verify_ws_token(token)
    await manager.connect(websocket, user.id)
    try:
        while True:
            data = await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
```

### 9.5 Push Notifications (Mobile-Specific)

When the mobile app is **backgrounded or closed**, critical alerts are delivered via **Expo Push Notifications**:

```python
# backend/app/core/push_service.py
import httpx

class PushNotificationService:
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

    async def send_alert(self, push_tokens: list[str], alert: dict):
        """Send push notification to mobile devices"""
        messages = [
            {
                "to": token,
                "title": f"⚠️ {alert['severity']} Alert",
                "body": alert['message'],
                "data": {
                    "type": alert['type'],
                    "equipmentId": alert.get('equipment_id'),
                    "screen": "EquipmentDetail",  # Deep link to screen
                },
                "sound": "default",
                "priority": "high",
                "channelId": "alerts",
            }
            for token in push_tokens
        ]

        async with httpx.AsyncClient() as client:
            await client.post(self.EXPO_PUSH_URL, json=messages)
```

### 9.6 Offline-First Strategy (Mobile)

Field technicians may work in areas with **poor or no connectivity**. The mobile app works offline:

```typescript
// mobile/src/services/offline.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface OfflineAction {
  id: string;
  type: 'query' | 'photo_upload' | 'work_order_update';
  payload: any;
  createdAt: string;
  synced: boolean;
}

export class OfflineManager {
  private queue: OfflineAction[] = [];

  async init() {
    const stored = await AsyncStorage.getItem('offline_queue');
    this.queue = stored ? JSON.parse(stored) : [];

    // Listen for connectivity changes
    NetInfo.addEventListener(state => {
      if (state.isConnected) this.syncQueue();
    });
  }

  async addToQueue(action: Omit<OfflineAction, 'id' | 'createdAt' | 'synced'>) {
    const item: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      synced: false,
    };
    this.queue.push(item);
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }

  async syncQueue() {
    const unsynced = this.queue.filter(a => !a.synced);
    for (const action of unsynced) {
      try {
        await this.executeAction(action);
        action.synced = true;
      } catch (e) {
        console.warn(`Failed to sync action ${action.id}:`, e);
      }
    }
    this.queue = this.queue.filter(a => !a.synced);
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }

  private async executeAction(action: OfflineAction) {
    switch (action.type) {
      case 'query':
        return api.askQuestion(action.payload);
      case 'photo_upload':
        return api.uploadFaultPhoto(action.payload);
      case 'work_order_update':
        return api.updateWorkOrder(action.payload);
    }
  }

  // Cache frequently accessed data for offline use
  async cacheEquipmentData(equipmentList: Equipment[]) {
    await AsyncStorage.setItem('cached_equipment', JSON.stringify(equipmentList));
  }

  async getCachedEquipment(): Promise<Equipment[] | null> {
    const cached = await AsyncStorage.getItem('cached_equipment');
    return cached ? JSON.parse(cached) : null;
  }
}
```

### 9.7 Authentication Flow (Unified Web + Mobile)

```mermaid
sequenceDiagram
    participant W as Web Browser
    participant M as Mobile App
    participant API as FastAPI Backend
    participant DB as PostgreSQL

    Note over W,DB: Same JWT token format for both platforms

    W->>API: POST /api/v1/auth/login {email, password}
    API->>DB: Verify credentials
    DB-->>API: User record
    API-->>W: {token, user, expiresIn}
    W->>W: Store in localStorage + cookie

    M->>API: POST /api/v1/auth/login {email, password}
    API->>DB: Verify credentials (SAME endpoint)
    DB-->>API: User record
    API-->>M: {token, user, expiresIn}
    M->>M: Store in SecureStore (encrypted)
    M->>API: POST /api/v1/notifications/register {pushToken}

    Note over W,DB: All subsequent API calls use same Bearer token
    W->>API: GET /api/v1/equipment (Authorization: Bearer <token>)
    M->>API: GET /api/v1/equipment (Authorization: Bearer <token>)
    Note over W,DB: Same response, same data
```

---

## 10. Mobile App — React Native / Expo

> [!IMPORTANT]
> The mobile app is a **full-featured field companion**, not a stripped-down version. It has feature parity with the web dashboard for all field-relevant tasks, plus **mobile-exclusive features** like QR scanning, voice input, camera OCR, and push notifications.

### 10.1 Complete Screen Breakdown

| Screen | Target User | Features | Web Equivalent |
|--------|-------------|----------|----------------|
| **🏠 Home Dashboard** | All | KPI cards (equipment health, open alerts, pending tasks), recent alerts feed, quick search bar, "Ask AI" FAB | Dashboard page |
| **📷 QR Scanner** | Field Technician | Camera-based QR scan → instant equipment lookup, history, health score, recent maintenance | ❌ Mobile-only |
| **🔧 Equipment List** | All | Filterable list of all equipment by location/type/criticality, pull-to-refresh, search | Equipment section |
| **📊 Equipment Detail** | All | Health gauge, RUL prediction, failure history timeline, maintenance schedule, linked documents, sensor readings, "Ask about this equipment" | Equipment detail |
| **🤖 AI Query Chat** | All | Text + voice input, streaming AI responses, source citations, follow-up suggestions, conversation history, context-aware (if opened from equipment) | Query page |
| **📸 Fault Camera** | Field Technician | Take photo of equipment fault → auto OCR → AI analysis → create work order | ❌ Mobile-only |
| **🔨 Maintenance Tasks** | Field Technician | Upcoming maintenance list, mark tasks complete, create new work orders, scan parts | Maintenance page |
| **✅ Compliance Checklist** | Inspector | Regulation-grouped checklists, tap-to-complete, photo evidence upload, digital signatures | Compliance page |
| **🔔 Alerts Center** | All | All notifications, filterable by severity, tap to navigate to related equipment/document | Alerts feed |
| **📄 Document Viewer** | All | In-app PDF viewer, linked from equipment detail or query citations | Documents page |
| **⚙️ Settings** | All | Profile, notification preferences, offline data management, dark/light theme, logout | Profile |

### 10.2 Navigation Architecture

```mermaid
graph TB
    subgraph "Auth Flow"
        AUTH["AuthNavigator"]
        LOGIN["LoginScreen"]
        REG["RegisterScreen"]
        AUTH --> LOGIN
        AUTH --> REG
    end

    subgraph "Main App (Bottom Tabs)"
        TABS["TabNavigator"]

        subgraph "Home Tab 🏠"
            H1["HomeScreen"]
            H2["EquipmentDetailScreen"]
            H3["DocumentViewerScreen"]
            H1 --> H2
            H2 --> H3
        end

        subgraph "Scan Tab 📷"
            S1["ScanScreen"]
            S2["EquipmentDetailScreen"]
            S3["CameraScreen"]
            S1 --> S2
            S1 --> S3
        end

        subgraph "AI Query Tab 🤖"
            Q1["QueryScreen"]
            Q2["DocumentViewerScreen"]
            Q1 --> Q2
        end

        subgraph "Tasks Tab 🔨"
            M1["MaintenanceListScreen"]
            M2["WorkOrderScreen"]
            M3["ComplianceScreen"]
            M1 --> M2
            M1 --> M3
        end

        subgraph "More Tab ⚙️"
            P1["AlertsScreen"]
            P2["EquipmentListScreen"]
            P3["SettingsScreen"]
        end

        TABS --> H1
        TABS --> S1
        TABS --> Q1
        TABS --> M1
        TABS --> P1
    end
```

```typescript
// mobile/src/navigation/TabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Scan, MessageSquare, Wrench, Menu } from 'lucide-react-native';
import { HomeStack } from './HomeStack';
import { ScanStack } from './ScanStack';
import { QueryStack } from './QueryStack';
import { TasksStack } from './TasksStack';
import { MoreStack } from './MoreStack';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 85,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tab.Screen name="Scan" component={ScanStack}
        options={{ tabBarIcon: ({ color, size }) => <Scan color={color} size={size} /> }} />
      <Tab.Screen name="Ask AI" component={QueryStack}
        options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }} />
      <Tab.Screen name="Tasks" component={TasksStack}
        options={{ tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} /> }} />
      <Tab.Screen name="More" component={MoreStack}
        options={{ tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}
```

### 10.3 Key Screen Implementations

#### QR Code Scanner → Equipment Lookup

The most critical mobile-exclusive feature. Field technicians scan a QR code on any equipment to **instantly see everything about it**:

```typescript
// mobile/src/screens/scan/ScanScreen.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { ScanOverlay } from '../../components/scanner/ScanOverlay';
import { ScanResult } from '../../components/scanner/ScanResult';

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<Equipment | null>(null);
  const [scanning, setScanning] = useState(true);
  const navigation = useNavigation();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    Vibration.vibrate(100);  // Haptic feedback

    try {
      // QR code contains equipment ID → fetch full details
      const equipment = await api.getEquipmentByQR(data);
      setScannedData(equipment);
    } catch (error) {
      Alert.alert('Equipment Not Found', `No equipment registered with QR: ${data}`);
      setScanning(true);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
      />
      <ScanOverlay />

      {scannedData && (
        <ScanResult
          equipment={scannedData}
          onViewDetails={() => {
            navigation.navigate('EquipmentDetail', { equipmentId: scannedData.id });
            setScannedData(null);
            setScanning(true);
          }}
          onAskAI={() => {
            navigation.navigate('Ask AI', {
              screen: 'Query',
              params: { prefilledContext: `About equipment ${scannedData.id}: ${scannedData.name}` }
            });
          }}
          onTakePhoto={() => {
            navigation.navigate('Camera', { equipmentId: scannedData.id });
          }}
          onDismiss={() => { setScannedData(null); setScanning(true); }}
        />
      )}
    </View>
  );
}
```

**QR Code Workflow:**
```mermaid
sequenceDiagram
    participant T as Technician
    participant APP as Mobile App
    participant API as Backend
    participant NEO as Neo4j

    T->>APP: Scan QR code on Pump P-101
    APP->>APP: Decode QR → "P-101"
    APP->>API: GET /api/v1/equipment/qr/P-101
    API->>NEO: MATCH (e:Equipment {qr_code: "P-101"}) ...
    NEO-->>API: Equipment + components + recent failures + health
    API-->>APP: Full equipment data
    APP->>T: Show bottom sheet with:
    Note over T,APP: • Health Score: 72/100<br/>• Last Maintenance: 3 days ago<br/>• Predicted RUL: 45 days<br/>• 2 Open Alerts<br/>• [View Details] [Ask AI] [Take Photo]
    T->>APP: Tap "Ask AI"
    APP->>APP: Navigate to QueryScreen with context pre-filled
    T->>APP: Voice: "Why is this pump vibrating?"
    APP->>API: POST /api/v1/query {question, equipmentId: "P-101"}
    API-->>APP: GraphRAG answer with citations
```

#### Voice Input for AI Queries

```typescript
// mobile/src/services/voiceInput.ts
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';

export class VoiceInputService {
  private onResult: ((text: string) => void) | null = null;
  private onPartialResult: ((text: string) => void) | null = null;

  constructor() {
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0] || '';
      this.onResult?.(text);
    };
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0] || '';
      this.onPartialResult?.(text);
    };
  }

  async startListening(
    onResult: (text: string) => void,
    onPartialResult?: (text: string) => void
  ) {
    this.onResult = onResult;
    this.onPartialResult = onPartialResult || null;
    await Voice.start('en-US');
  }

  async stopListening() {
    await Voice.stop();
  }

  async destroy() {
    await Voice.destroy();
  }
}
```

#### Camera Fault Capture + OCR Analysis

Technicians photograph faults → the backend runs **PaddleOCR** to extract nameplate/label data and the **LLM** to analyze the fault:

```typescript
// mobile/src/screens/camera/CameraScreen.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRef, useState } from 'react';
import { api } from '../../services/api';

export function CameraScreen({ route }) {
  const { equipmentId } = route.params;
  const cameraRef = useRef<CameraView>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FaultAnalysis | null>(null);

  const captureAndAnalyze = async () => {
    if (!cameraRef.current) return;
    setAnalyzing(true);

    // 1. Capture photo
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });

    // 2. Compress for upload
    const compressed = await ImageManipulator.manipulateAsync(
      photo!.uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 3. Upload to backend for OCR + AI analysis
    const formData = new FormData();
    formData.append('photo', {
      uri: compressed.uri,
      type: 'image/jpeg',
      name: `fault_${equipmentId}_${Date.now()}.jpg`,
    } as any);
    formData.append('equipment_id', equipmentId);

    try {
      const analysis = await api.uploadFaultPhoto(formData);
      setResult(analysis);
    } catch (e) {
      // Save to offline queue if no connectivity
      await offlineManager.addToQueue({
        type: 'photo_upload',
        payload: { uri: compressed.uri, equipmentId },
      });
      Alert.alert('Saved Offline', 'Photo will be analyzed when connectivity is restored.');
    }
    setAnalyzing(false);
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />

      {/* Capture button */}
      <TouchableOpacity style={styles.captureButton} onPress={captureAndAnalyze}>
        <View style={styles.captureInner} />
      </TouchableOpacity>

      {/* Analysis result overlay */}
      {result && (
        <FaultAnalysisResult
          analysis={result}
          onCreateWorkOrder={() => navigation.navigate('Tasks', {
            screen: 'WorkOrder',
            params: { prefill: result }
          })}
        />
      )}
    </View>
  );
}
```

**Backend photo analysis endpoint:**
```python
# backend/app/api/v1/mobile.py
from fastapi import APIRouter, UploadFile, File, Form

router = APIRouter(prefix="/mobile", tags=["Mobile"])

@router.post("/photo-analyze")
async def analyze_fault_photo(
    photo: UploadFile = File(...),
    equipment_id: str = Form(...),
    ocr_service = Depends(get_ocr_service),
    llm_service = Depends(get_llm_service),
    graph_service = Depends(get_graph_service),
):
    """Analyze a photo of equipment fault using OCR + AI"""
    # 1. Save photo
    photo_path = await save_upload(photo)

    # 2. OCR — extract any text visible (nameplate, error codes, labels)
    extracted_text = ocr_service.extract_text(photo_path)

    # 3. Get equipment context from knowledge graph
    equipment_context = await graph_service.get_equipment_subgraph(equipment_id)

    # 4. AI analysis — identify fault type, severity, recommended action
    analysis = await llm_service.generate(
        prompt=f"Analyze this equipment fault photo. Extracted text: {extracted_text}",
        context=f"Equipment: {equipment_context}",
        system_prompt=FAULT_ANALYSIS_PROMPT
    )

    return {
        "equipment_id": equipment_id,
        "extracted_text": extracted_text,
        "fault_type": analysis.get("fault_type"),
        "severity": analysis.get("severity"),
        "description": analysis.get("description"),
        "recommended_action": analysis.get("recommended_action"),
        "similar_past_incidents": analysis.get("similar_incidents", []),
        "photo_url": str(photo_path),
    }
```

### 10.4 Mobile App Dependencies

```json
// mobile/package.json
{
  "name": "industrial-brain-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "expo": "~52.0.0",
    "expo-camera": "~16.0.0",
    "expo-image-manipulator": "~13.0.0",
    "expo-notifications": "~0.29.0",
    "expo-secure-store": "~14.0.0",
    "expo-speech": "~13.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-file-system": "~18.0.0",
    "expo-haptics": "~14.0.0",
    "expo-linking": "~7.0.0",

    "react": "19.0.0",
    "react-native": "0.76.0",
    "react-native-screens": "~4.4.0",
    "react-native-safe-area-context": "~4.14.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-svg": "~15.8.0",

    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "@react-native-voice/voice": "^3.2.0",
    "@react-native-async-storage/async-storage": "~2.1.0",
    "@react-native-community/netinfo": "~11.4.0",

    "@epic/shared": "workspace:*",
    "axios": "^1.7.0",
    "zustand": "^4.5.0",
    "date-fns": "^3.6.0",
    "lucide-react-native": "^0.400.0",
    "react-native-pdf": "^6.7.0",
    "lottie-react-native": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "~19.0.0",
    "typescript": "~5.5.0"
  }
}
```

### 10.5 Mobile Theme (Matching Web Design System)

The mobile app uses the **exact same color palette** as the web dashboard for brand consistency:

```typescript
// mobile/src/theme/colors.ts
// Matches frontend/src/app/globals.css design system EXACTLY
export const colors = {
  background: '#0a0a0f',       // Same as web
  surface: '#13131a',           // Same as web
  surfaceHover: '#1a1a25',
  primary: '#6366f1',           // Indigo - same as web
  primaryLight: '#818cf8',
  accent: '#22d3ee',            // Cyan - same as web
  success: '#10b981',           // Green - same as web
  warning: '#f59e0b',           // Amber - same as web
  danger: '#ef4444',            // Red - same as web
  text: '#e2e8f0',              // Same as web
  textMuted: '#94a3b8',
  textDim: '#64748b',
  border: '#1e293b',
  cardGlass: 'rgba(19, 19, 26, 0.8)',  // Glassmorphism
};

// mobile/src/theme/typography.ts
export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '600' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  badge: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const },
};

// mobile/src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### 10.6 Mobile-Specific Backend API Endpoints

These endpoints are **in addition to** the shared REST API that both web and mobile use:

| Method | Endpoint | Purpose | Used By |
|--------|----------|---------|---------|
| `GET` | `/api/v1/equipment/qr/{qr_code}` | Lookup equipment by QR code | 📱 Mobile only |
| `POST` | `/api/v1/mobile/photo-analyze` | Upload fault photo → OCR + AI analysis | 📱 Mobile only |
| `POST` | `/api/v1/notifications/register` | Register Expo push token | 📱 Mobile only |
| `DELETE` | `/api/v1/notifications/unregister` | Unregister push token | 📱 Mobile only |
| `GET` | `/api/v1/mobile/sync` | Fetch all data changes since last sync timestamp | 📱 Mobile only |
| `POST` | `/api/v1/mobile/offline-batch` | Submit batch of offline-queued actions | 📱 Mobile only |
| `WS` | `/ws/events` | Real-time event stream | 🖥️ Web + 📱 Mobile |

### 10.7 Mobile Build & Distribution

```json
// mobile/eas.json — Expo Application Services build config
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@email.com" },
      "android": { "serviceAccountKeyPath": "./google-services.json" }
    }
  }
}
```

**Build & distribute for hackathon demo:**
```bash
# Generate development build (internal distribution)
npx eas build --platform android --profile preview

# Generate APK for hackathon judges
npx eas build --platform android --profile preview
# → Download APK link is generated → share with judges

# For iOS: use Expo Go app (no build needed for demo)
npx expo start
# → Scan QR code with Expo Go on iPhone

# OTA updates (push code updates without rebuilding)
npx eas update --branch preview --message "Demo hotfix"
```

---

## 11. Deployment — Free Tier Strategy

> [!IMPORTANT]
> **All services below are genuinely free**, not free trials. Carefully selected to avoid any costs for a hackathon demo.

### 10.1 Service Mapping

```mermaid
graph TB
    subgraph "Frontend (Free)"
        VER["Vercel<br/>Next.js Dashboard<br/>✅ 100 GB bandwidth/mo<br/>✅ Serverless functions<br/>✅ Custom domain"]
    end

    subgraph "Backend (Free)"
        REN["Render.com<br/>FastAPI Backend<br/>✅ 512 MB RAM<br/>✅ Shared CPU<br/>⚠️ Spins down after 15min idle"]
    end

    subgraph "Databases (Free)"
        NEO["Neo4j Aura Free<br/>✅ 200K nodes<br/>✅ 400K relationships<br/>✅ 1 database"]
        QDR["Qdrant Cloud Free<br/>✅ 1 GB storage<br/>✅ 1M vectors<br/>✅ 1 cluster"]
        SUP["Supabase Free<br/>PostgreSQL<br/>✅ 500 MB storage<br/>✅ 50K monthly active users<br/>✅ 2 GB bandwidth"]
    end

    subgraph "AI APIs (Free)"
        GEM["Google Gemini<br/>✅ 15 RPM<br/>✅ 1M tokens/min<br/>✅ 1,500 req/day"]
        GRQ["Groq (Backup)<br/>✅ 30 RPM<br/>✅ 14,400 req/day<br/>✅ Llama 3.1 8B"]
    end

    subgraph "Storage (Free)"
        R2["Cloudflare R2<br/>✅ 10 GB storage<br/>✅ 1M Class A ops/mo<br/>✅ 10M Class B ops/mo<br/>✅ No egress fees"]
    end

    subgraph "Mobile (Free)"
        EAS["Expo EAS<br/>✅ 30 builds/mo<br/>✅ OTA updates<br/>✅ TestFlight/Play Console"]
    end

    VER --> REN
    REN --> NEO
    REN --> QDR
    REN --> SUP
    REN --> GEM
    REN --> GRQ
    REN --> R2
```

### 10.2 Detailed Free Tier Limits

| Service | Free Tier | Limit Details | Sufficient for Hackathon? |
|---------|-----------|---------------|---------------------------|
| **Vercel** | Hobby | 100 GB bandwidth, 100 GB-hrs compute, serverless fns | ✅ More than enough |
| **Render** | Free Web Service | 512 MB RAM, shared CPU, spins down after 15min | ✅ OK (use keep-alive ping) |
| **Neo4j Aura** | Free | 200K nodes, 400K rels, 1 DB, community support | ✅ Perfect for demo |
| **Qdrant Cloud** | Free | 1 GB, 1 node, 1 cluster | ✅ Holds ~100K vectors |
| **Supabase** | Free | 500 MB DB, 1 GB file storage, 50K MAU | ✅ Excellent |
| **Google Gemini** | Free API | 15 RPM, 1M TPM, 1500 RPD | ✅ Good for demo |
| **Groq** | Free | 30 RPM, 14400 RPD, Llama 3.1 8B | ✅ Great backup |
| **Cloudflare R2** | Free | 10 GB storage, no egress fees | ✅ Perfect for docs |
| **Expo EAS** | Free | 30 builds/mo, updates | ✅ Sufficient |

### 10.3 Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://brain:brain@postgres:5432/industrial_brain
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=industrial_brain
      - QDRANT_URL=http://qdrant:6333
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
    depends_on:
      - postgres
      - neo4j
      - qdrant
    volumes:
      - ./backend:/app
      - upload_data:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: industrial_brain
      POSTGRES_USER: brain
      POSTGRES_PASSWORD: brain
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/industrial_brain
      NEO4J_PLUGINS: '["apoc"]'
    ports:
      - "7474:7474"  # Browser
      - "7687:7687"  # Bolt
    volumes:
      - neo4j_data:/data

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  neo4j_data:
  qdrant_data:
  upload_data:
```

### 10.4 Deployment Steps

```bash
# 1. Set up cloud databases (one-time)
# - Go to https://aura.neo4j.io → Create Free instance → Save credentials
# - Go to https://cloud.qdrant.io → Create Free cluster → Save API key
# - Go to https://supabase.com → Create project → Save connection string
# - Go to https://aistudio.google.com → Get Gemini API key
# - Go to https://console.groq.com → Get Groq API key

# 2. Deploy backend to Render
# - Connect GitHub repo
# - Set build command: pip install -r requirements.txt
# - Set start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
# - Add all environment variables

# 3. Deploy frontend to Vercel
# - Connect GitHub repo → Auto-detects Next.js
# - Set NEXT_PUBLIC_API_URL to Render backend URL
# - Deploy

# 4. Keep-alive for Render free tier (prevents spin-down)
# Use UptimeRobot (free) to ping your API every 14 minutes
```

---

## 12. Development Phases & Timeline

> [!TIP]
> Web and Mobile are developed **in parallel from Phase 4 onwards**. The shared package ensures both platforms stay in sync. Backend work in Phases 1-3 serves both clients equally.

### Phase 1: Foundation (Days 1-3)
- [ ] Set up monorepo structure with `shared/`, `frontend/`, `mobile/`, `backend/`, `ml/`
- [ ] Initialize `shared/` package with TypeScript types, API client, constants
- [ ] Initialize FastAPI backend with health checks + WebSocket support
- [ ] Initialize Next.js frontend with design system
- [ ] Initialize Expo React Native app with navigation skeleton
- [ ] Set up Docker Compose for local dev
- [ ] Connect PostgreSQL, Neo4j, Qdrant
- [ ] Generate synthetic datasets
- [ ] Implement document upload + OCR pipeline
- [ ] Set up shared mobile theme matching web design system

### Phase 2: AI Core (Days 4-7)
- [ ] Implement BGE embedding service
- [ ] Build document chunking + vector storage pipeline
- [ ] Train custom Industrial NER model
- [ ] Implement entity extraction → Knowledge Graph population
- [ ] Build GraphRAG query engine
- [ ] Integrate Gemini 2.0 Flash + Groq fallback
- [ ] Build prompt templates for all use cases
- [ ] Add equipment QR code lookup endpoint
- [ ] Add photo analysis endpoint (PaddleOCR + LLM)

### Phase 3: Intelligence Features (Days 8-10)
- [ ] Root Cause Analysis engine
- [ ] Train RUL prediction model on CMAPSS
- [ ] Build anomaly detection model
- [ ] Compliance gap detection engine
- [ ] Predictive maintenance recommendations
- [ ] Push notification service (Expo Push)
- [ ] WebSocket event broadcasting (alerts, status changes)

### Phase 4: Frontend + Mobile — Built in Parallel (Days 11-16)

**Web Dashboard (2 developers):**
- [ ] Dashboard with KPI cards and charts
- [ ] AI Query chat interface with streaming
- [ ] Knowledge Graph 3D visualization
- [ ] Document management page
- [ ] Predictive maintenance dashboard
- [ ] Compliance monitoring page
- [ ] RCA report page
- [ ] WebSocket integration for real-time alerts

**Mobile App (1-2 developers, in parallel):**
- [ ] Home Dashboard screen with KPIs + alerts
- [ ] QR Scanner screen with equipment lookup bottom sheet
- [ ] Equipment List + Detail screens with health gauge
- [ ] AI Query chat screen with voice input + text
- [ ] Camera Fault screen with OCR analysis
- [ ] Maintenance Tasks list + Work Order creation
- [ ] Compliance Checklist screen
- [ ] Alerts/Notifications center
- [ ] Document Viewer (PDF)
- [ ] Settings + Profile screen
- [ ] Push notification registration + handling
- [ ] Offline queue + background sync
- [ ] Deep linking (push notification → specific screen)

### Phase 5: Integration & Sync (Days 17-18)
- [ ] End-to-end web ↔ mobile testing (same login, same data)
- [ ] WebSocket real-time sync verification (alert on web appears on mobile)
- [ ] Offline mode testing (queue actions → sync when online)
- [ ] Push notification testing (background alerts)
- [ ] QR scan → Ask AI → View Document flow testing
- [ ] Camera → OCR → Create Work Order flow testing

### Phase 6: Polish & Deploy (Days 19-21)
- [ ] Deploy backend to Render, frontend to Vercel
- [ ] Deploy databases (Neo4j Aura, Qdrant Cloud, Supabase)
- [ ] Build mobile APK via Expo EAS (for demo distribution)
- [ ] Set up Expo Go for iOS demo
- [ ] End-to-end testing on deployed services
- [ ] Performance optimization (cold start handling, caching)
- [ ] Demo script preparation (web + mobile side-by-side)
- [ ] Documentation

---

## 13. Verification Plan

### Automated Tests
```bash
# Shared package type checking
cd shared && npx tsc --noEmit

# Backend unit tests
cd backend && pytest tests/ -v

# API integration tests (covers web + mobile endpoints)
pytest tests/test_api.py -v

# ML model evaluation
cd ml && python training/evaluate.py

# Frontend lint + type check
cd frontend && npm run lint && npx tsc --noEmit

# Mobile type check
cd mobile && npx tsc --noEmit
```

### Manual Verification — Web Dashboard
- [ ] Upload a PDF manual → Verify OCR + chunking + embedding + graph population
- [ ] Ask "When was Pump P-101 last serviced?" → Verify GraphRAG answer with citations
- [ ] Ask cross-document question → Verify multi-source reasoning
- [ ] Run RCA on equipment with multiple failures → Verify pattern detection
- [ ] Check compliance → Verify gap identification
- [ ] View Knowledge Graph → Verify interactive visualization
- [ ] Verify WebSocket alerts appear in real-time on dashboard

### Manual Verification — Mobile App
- [ ] Login with same credentials as web → Same data appears
- [ ] Scan QR code on equipment → Equipment detail loads correctly
- [ ] Tap "Ask AI" from scanned equipment → Context-aware question pre-filled
- [ ] Voice input: "Why is this pump vibrating?" → Answer with citations
- [ ] Take photo of equipment fault → OCR extracts text → AI analysis
- [ ] Create work order from fault analysis → Appears on web dashboard
- [ ] Turn off airplane mode → Offline-queued actions sync successfully
- [ ] Receive push notification for failure prediction → Tap → Opens equipment detail
- [ ] View PDF document from query citation → In-app viewer works
- [ ] Compliance checklist → Mark items complete → Reflects on web

### Cross-Platform Verification
- [ ] Create alert on backend → Appears on BOTH web dashboard and mobile notification
- [ ] Upload document on web → Processing status updates on mobile via WebSocket
- [ ] Complete work order on mobile → Shows as completed on web maintenance page
- [ ] Ask same question on web and mobile → Same answer, same sources

### Demo Scenario (Web + Mobile Side-by-Side)
1. **[Web]** Upload maintenance logs mentioning P-101 bearing failures
2. **[Mobile]** Receive push notification: "New document processed for P-101"
3. **[Mobile]** Scan QR code on Pump P-101
4. **[Mobile]** Tap "Ask AI" → Voice: "Why does this pump keep failing?"
5. **[Mobile]** System answers with 3 failures → same bearing → same supplier → recommend change
6. **[Web]** Show same answer in query history, view Knowledge Graph with failure patterns
7. **[Mobile]** Take photo of vibrating bearing → AI analysis identifies wear pattern
8. **[Mobile]** Create work order from analysis → Appears instantly on web dashboard
9. **[Web]** Show compliance status for P-101, overdue inspection flagged
10. **[Mobile]** Show compliance checklist for P-101 → Mark inspection complete

---

## Open Questions

> [!IMPORTANT]
> **1. Tailwind CSS**: The frontend plan assumes Tailwind CSS for rapid development. Should we use vanilla CSS instead? (Tailwind is common for hackathons due to speed)

> [!IMPORTANT]
> **2. LLM Choice**: The plan uses **Gemini 2.0 Flash** (free API) as primary and **Groq/Llama 3.1 8B** as fallback. Are you okay with this, or do you specifically want to self-host an open LLM like Llama 3.x using Ollama (requires GPU)?

> [!IMPORTANT]
> **3. Authentication**: Should we implement full auth (JWT + user roles + role-based access: Admin/Engineer/Technician) or keep it simpler (JWT + single user type) for the hackathon demo?

> [!IMPORTANT]
> **4. Team Size**: How many developers are working on this? The plan assumes 3-4 developers: 1 backend/ML, 1-2 web frontend, 1 mobile developer. If fewer, we need to adjust the parallel Phase 4.
