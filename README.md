# Gen AI Platform for Automated Content Transformation
### Smart India Hackathon (SIH) 2026 · Problem Statement 26154 (NTRO)

> **A multi-agent content transformation platform that converts source project documents into verified, grounded communication deliverables across 9 formats with automated cross-checking, editorial review controls, selective fact updates, and auditability.**

---

## Key Highlights

- **9 Universal Deliverables**: Executive Summary, Advisory, Presentation, Infographic, Video Package, Twitter / X Post, WhatsApp, LinkedIn Post, and Instagram Post.
- **Multimodal Document Ingestion**: Ingests and validates documents, spreadsheets, logs, and diagrammatic assets.
- **Canonical Grounding**: Atomic fact and claim extraction establishing bidirectional traceability back to source files.
- **Selective Fact Propagation**: When a source fact is updated, the dependency graph identifies and updates only affected deliverables, keeping approved unaffected work untouched.
- **In-Domain Context Assistant**: Intelligent query assistant grounded in project source facts, designed to stay strictly focused on the current project context.
- **Editorial Review Controls**: Full human-in-the-loop oversight. Reviewers can edit text, request prompt adjustments, inspect revision diffs, and approve deliverables.
- **Tamper-Evident Audit Verification**: Cryptographic hashing and verification manifest for publication-ready outputs.

---

## Transformation Pipeline

```
Source Documents (PDFs, Reports, Images, Notes)
        ↓
[ Document Ingestion & Verification ]
        ↓
[ Canonical Fact & Evidence Extraction ]
        ↓
[ Transformation Planner (Audience, Tone, Deliverable Settings) ]
        ↓
┌────────────────────────────────────────────────────────┐
│   Tailored Deliverable Creators                        │
│   • Executive Summary        • Advisory                │
│   • Presentation             • Infographic             │
│   • Video Package            • Twitter / X Post        │
│   • WhatsApp                 • LinkedIn Post           │
│   • Instagram Post                                     │
└────────────────────────────────────────────────────────┘
        ↓
[ Automated Cross-Consistency & Fact Verification ]
        ↓
[ Editorial Review Workspace (Diff View / Prompt / Manual Edit) ]
        ↓
[ Targeted Fact Updates (Updates only affected deliverables) ]
        ↓
[ Final Export & Verification Manifest ]
```

---

## Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── agents/            # 9 specialized deliverable creator modules
│   │   ├── models/            # Pydantic schemas (canonical, impact, operator, assistant)
│   │   ├── services/          # Gemini client, in-memory store, gatekeeper, verification
│   │   ├── workflow/          # Planner, cross-checker, validator, impact evaluator, regenerator
│   │   ├── config.py          # Environment settings
│   │   └── main.py            # FastAPI endpoints
│   ├── test_api.py            # Core endpoint test suite
│   ├── test_assistant_gatekeeper.py # Assistant domain boundary test suite
│   ├── test_stage6_flow.py    # Editorial review workflow test suite
│   ├── test_stage7_invariant.py # Selective update preservation test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # HomeScreen, ConfigureScreen, ProcessingScreen, WorkspaceScreen, FinalizeScreen
│   │   ├── services/          # API client with timeout fallbacks
│   │   ├── App.jsx            # Routing and state orchestration
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── dummy_data/                # Sample source documents and project data
├── .env.example               # Configuration template
├── .gitignore                 # Strict repository hygiene rules
├── requirements.txt           # Python root dependencies
└── README.md
```

---

## Quickstart Guide

### 1. Backend Setup

```bash
# Navigate to repository root
cd Gen-Ai-26154-SIH

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env to set your GEMINI_API_KEY (optional; system includes full deterministic fallbacks)

# Launch FastAPI backend daemon
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be active at `http://localhost:8000`. Swagger documentation available at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend will be active at `http://localhost:3000`.

---

### 3. Running Verification Test Suites

```bash
# Run all automated backend tests from repository root
PYTHONPATH=backend python backend/test_api.py
PYTHONPATH=backend python backend/test_assistant_gatekeeper.py
PYTHONPATH=backend python backend/test_stage6_flow.py
PYTHONPATH=backend python backend/test_stage7_invariant.py
```

All test suites verify:
- Core API endpoints (`/work`, `/transform`, `/edit`, `/approve`, `/claims/{id}`, `/assistant/query`).
- Context Assistant boundary enforcement for project queries.
- Human review workflow (editing, diff tracking, sign-off).
- Selective fact propagation: when a claim changes, unaffected approved deliverables remain intact while affected deliverables regenerate for review.

---

## Technical Specifications

- **Backend**: Python 3.11+, FastAPI, Pydantic v2, Google GenAI SDK (`google-genai`).
- **Frontend**: React 18, Vite, Lucide Icons.
- **Evaluation Criteria**: Grounding accuracy, cross-deliverable consistency, human editorial sovereignty, and selective regeneration efficiency.

---

## License & Attribution

Developed for **Smart India Hackathon 2026** under Problem Statement **26154** (National Technical Research Organisation - NTRO).
