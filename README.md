# Gen AI Platform for Automated Content Transformation
### Smart India Hackathon (SIH) 2026 · Problem Statement 26154 (NTRO)

> **An institutional, multi-agent content transformation workstation that converts raw multimodal incident dossiers into verified, grounded communication work products across 9 official deliverables with deterministic cross-checking, human review gates, Stage 7 selective impact propagation, and cryptographic auditability.**

---

## Key Highlights

- **9 Universal Deliverables**: Executive Summary, Technical Advisory, Briefing Deck, Infographic, Video Package Script, Twitter/X Post, WhatsApp Dispatch, LinkedIn Post, and Instagram Caption.
- **Multimodal Ingestion & Verification**: SHA-256 cryptographic hashing of PDFs, telemetry diagrams, authentication logs, and media files.
- **Dynamic Token Budgeting**: Pre-flight token counting (`client.count_tokens()`) routing $< 32\text{k}$ tokens inline and $\ge 32\text{k}$ tokens through Gemini File API + `CachedContent` with lazy rehydration.
- **Canonical Grounding**: Atomic fact extraction (`CLM-001..007`) establishing bidirectional claim-to-source traceability.
- **Stage 7 "Fix Once → Update Everywhere"**: Evaluates dependency graphs when a factual claim is updated. **Core Invariant**: Unaffected approved deliverables are strictly preserved at `v1 Approved` with zero token waste; affected deliverables selectively regenerate `v2 Needs review`.
- **SLM Domain Boundary Gatekeeper**: Intercepts and rejects off-domain queries (generic programming, trivia) with an institutional **Operational Boundary Notice**, while providing grounded briefings citing canonical claims for in-domain incident queries.
- **Human Review Gates**: No automated publication. Reviewers can edit, apply natural language prompt revisions, inspect diffs, and approve.
- **Polygon Blockchain Anchoring**: Hash seals and publication manifests recorded on the Polygon Amoy testnet for immutable auditability.

---

## Architectural Pipeline

```
Raw Dossier (PDFs, Logs, PNG, MP4)
        ↓
[ SHA-256 Manifest Seal ]
        ↓
[ Dynamic Token Budgeting (< 32k inline / ≥ 32k Gemini File API Cache) ]
        ↓
[ Canonical Representation Extractor (CLM-001..CLM-007) ]
        ↓
[ Transformation Planner (Operator Config + Deliverable Overrides) ]
        ↓
┌────────────────────────────────────────────────────────┐
│   9 Parallel Creator Agents (Throttled Semaphore = 3)  │
│   • Executive Summary        • Technical Advisory      │
│   • Briefing Deck            • Infographic Data        │
│   • Video Package Script     • Twitter / X Thread      │
│   • WhatsApp Dispatch        • LinkedIn Post           │
│   • Instagram Caption                                  │
└────────────────────────────────────────────────────────┘
        ↓
[ Deterministic Cross-Checker (0 Numerical / Timeline / Scope Drift) ]
        ↓
[ Pydantic Schema & Grounding Validator ]
        ↓
[ Human Review Gate (Diff View / Prompt Edit / Manual Edit) ]
        ↓
[ Stage 7: Fix Once → Selective Impact Regeneration (Core Invariant) ]
        ↓
[ Final Publication & Polygon Amoy Blockchain Anchoring ]
```

---

## Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── agents/            # 9 specialized creator agent modules
│   │   ├── models/            # Pydantic schemas (canonical, impact, operator, assistant)
│   │   ├── services/          # Gemini client, in-memory store, gatekeeper, blockchain
│   │   ├── workflow/          # Planner, cross-checker, validator, impact evaluator, regenerator
│   │   ├── config.py          # Environment settings
│   │   └── main.py            # FastAPI endpoints
│   ├── test_api.py            # Core endpoint test suite
│   ├── test_assistant_gatekeeper.py # SLM gatekeeper boundary test suite
│   ├── test_stage6_flow.py    # Human review workflow verification
│   ├── test_stage7_invariant.py # Stage 7 invariant preservation verification
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # HomeScreen, ConfigureScreen, ProcessingScreen, WorkspaceScreen, FinalizeScreen
│   │   ├── services/          # API client with timeout fallbacks
│   │   ├── App.jsx            # Routing and state orchestration
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── dummy_data/                # Raw multimodal sample dossier (logs, timeline, reports, diagrams)
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

All 4 test suites verify 100% passing status across:
- All 6 FastAPI endpoints (`/work`, `/transform`, `/edit`, `/approve`, `/claims/{id}`, `/assistant/query`).
- SLM Gatekeeper domain boundary rejection for off-domain queries.
- Human review sign-off and reset state rules.
- Stage 7 invariant: 4 unaffected approved artifacts retained at v1; 5 affected artifacts selectively regenerated to v2.

---

## Technical Specifications

- **Backend**: Python 3.11+, FastAPI, Pydantic v2, Google GenAI SDK (`google-genai`).
- **Frontend**: React 18, Vite, Lucide Icons, clean CSS variables (minimalist stone palette, zero AI-slop).
- **Evaluation Criteria**: Grounding accuracy, cross-deliverable consistency, human editorial sovereignty, and selective regeneration efficiency.

---

## License & Attribution

Developed for **Smart India Hackathon 2026** under Problem Statement **26154** (National Technical Research Organisation - NTRO).
