# API Parameter Reference & Data Contract Matrix

This document provides an exhaustive reference of all API endpoints, request payloads, response schemas, and parameter mappings connecting the **React Frontend** (`frontend/src/`) and the **FastAPI Transformation Engine** (`backend/app/main.py`).

Use this document to diagnose parameter mismatches, navigate state transitions, or verify field contracts.

---

## 1. Network Topology & URL Resolution

In development, React runs on Vite (`http://127.0.0.1:3000`) and FastAPI runs on Uvicorn (`http://127.0.0.1:8000`).

To avoid sandboxed loopback proxy `EPERM` socket collisions on macOS:
- **Direct Base**: `http://${window.location.hostname}:8000/api` (leveraging FastAPI's `CORSMiddleware(allow_origins=["*"])`).
- **Secondary Fallback**: `/api` (Vite reverse proxy).
- **Offline / Disconnect Fallback**: Deterministic demo fixture (`getFallbackWorkItem`) in `frontend/src/services/api.js`.

---

## 2. Complete REST Endpoint Parameter Matrix

### 2.1 `GET /api/work` — Dashboard & Work Queue
- **Invoked By**: `frontend/src/components/HomeScreen.jsx` via `fetchWorkDashboard()`
- **HTTP Method**: `GET`
- **Request Parameters**: None

#### Response Payload Schema:
```json
{
  "needs_attention": [
    {
      "id": "2026-0417",
      "title": "Operation Silver Falcon",
      "status": "Needs review",
      "created_at": "2026-04-17T08:00:00Z",
      "sources_count": 6,
      "outputs_count": 5,
      "unapproved_count": 5
    }
  ],
  "in_progress": [],
  "recent_work": []
}
```

#### Parameter Breakdown:
| Parameter Name | Data Type | Required | Description / UI Binding |
| :--- | :--- | :--- | :--- |
| `needs_attention` | `Array<WorkSummary>` | Yes | Items requiring analyst review or sign-off. |
| `in_progress` | `Array<WorkSummary>` | Yes | Items currently undergoing extraction or generation. |
| `recent_work` | `Array<WorkSummary>` | Yes | Fully approved and finalized transformations. |
| `item.id` | `string` | Yes | Case docket identifier (format: `YYYY-XXXX`, e.g., `2026-0417`). Links to `/work/:id`. |
| `item.title` | `string` | Yes | Human-readable transformation title. |
| `item.status` | `string` | Yes | Status badge: `"Needs review"`, `"Approved"`, `"In progress"`. |
| `item.created_at` | `ISO 8601 string` | Yes | UTC timestamp displayed as relative time or date. |
| `item.sources_count` | `number` | Yes | Number of source files ingested. |
| `item.outputs_count` | `number` | Yes | Total deliverables configured. |
| `item.unapproved_count`| `number` | Yes | Count of deliverables pending sign-off. |

---

### 2.2 `POST /api/transform` — Launch Transformation Pipeline
- **Invoked By**: `frontend/src/components/ConfigureScreen.jsx` via `createTransformation(payload)`
- **HTTP Method**: `POST`
- **Request Headers**: `Content-Type: application/json`

#### Request Body Schema (`TransformRequest`):
```json
{
  "title": "Operation Silver Falcon",
  "audience": "Leadership",
  "tone": "Objective",
  "detail": "Standard",
  "objective": "Information Sharing",
  "classification": "Public Release",
  "languages": ["English"],
  "additional_instructions": "Prioritize timeline and containment facts.",
  "requested_outputs": [
    "executive_summary",
    "advisory",
    "presentation",
    "video_package",
    "twitter_post",
    "whatsapp_message"
  ],
  "output_overrides": {
    "twitter_post": {
      "account_type": "standard",
      "detail": "Brief"
    },
    "whatsapp_message": {
      "detail": "Brief",
      "objective": "Actionable Guidance"
    }
  }
}
```

#### Request Parameter Breakdown:
| Parameter Name | Type | Default | Accepted Values / Options | UI Control in ConfigureScreen |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | `"Operation Silver Falcon"` | Any non-empty string | Title input field |
| `audience` | `string` | `"Leadership"` | `"Leadership"`, `"Technical Specialists"`, `"General Public"`, `"Internal Staff"`, `"Regulators and Partners"` | Global Audience dropdown |
| `tone` | `string` | `"Objective"` | `"Authoritative"`, `"Formal"`, `"Urgent"`, `"Objective"`, `"Accessible"`, `"Cautionary"` | Global Tone dropdown |
| `detail` | `string` | `"Standard"` | `"Brief"`, `"Standard"`, `"Detailed"`, `"Technical"` | Global Detail dropdown |
| `objective` | `string` | `"Information Sharing"` | `"Information Sharing"`, `"Actionable Guidance"`, `"Executive Briefing"`, `"Public Announcement"`, `"Compliance Update"` | Communication Objective dropdown |
| `classification` | `string` | `"Public Release"` | `"Public Release"`, `"Internal Use Only"`, `"Confidential"` | Classification selector |
| `languages` | `Array<string>`| `["English"]` | Array from `["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada"]` | Target Languages multi-select |
| `additional_instructions` | `string` | `""` | Optional free-form guidance | Custom Guidance textarea |
| `requested_outputs` | `Array<string>` | `[...]` | Subset of: `executive_summary`, `advisory`, `presentation`, `video_package`, `twitter_post`, `whatsapp_message`, `linkedin_post`, `infographic`, `instagram_post` | Deliverables selection pills |
| `output_overrides` | `Record<string, object>` | `{}` | Per-deliverable override map (e.g. `twitter_post.account_type`) | Per-deliverable "Customize" drawer |

#### Response Payload Schema:
```json
{
  "id": "2026-0417",
  "title": "Operation Silver Falcon",
  "status": "Needs review",
  "outputs_count": 5,
  "message": "Transformation pipeline completed successfully"
}
```

---

### 2.3 `GET /api/work/{id}` — Load Editorial Workspace
- **Invoked By**: `frontend/src/components/WorkspaceScreen.jsx` and `FinalizeScreen.jsx` via `fetchWorkDetails(workId)`
- **HTTP Method**: `GET`
- **Path Parameter**: `id` (`string`, e.g. `2026-0417`)

#### Response Payload Schema:
```json
{
  "id": "2026-0417",
  "title": "Operation Silver Falcon",
  "status": "Needs review",
  "created_at": "2026-04-17T08:00:00Z",
  "source_package": [
    {
      "file_name": "01_incident_report.txt",
      "file_type": "text/plain",
      "file_hash_sha256": "e8f4702ba060a6a246ecdbfcf6e7bf7716f6b5536412f8646b9a8cf6ddbe38a1"
    }
  ],
  "canonical_representation": {
    "incident_id": "INC-2026-0417",
    "timestamp_utc": "2026-04-17T02:14:00Z",
    "entities": [ ... ],
    "timeline": [ ... ],
    "claims": [ ... ],
    "uncertainties": [ ... ],
    "constraints": [ ... ]
  },
  "claims": [
    {
      "claim_id": "CLM-001",
      "claim_text": "Research portal experienced approximately 47 minutes of operational disruption.",
      "confidence": "HIGH",
      "evidence": [
        {
          "source_file": "01_incident_report.txt",
          "location_type": "text_section",
          "location": "Section 3. IMPACT ASSESSMENT",
          "supporting_text_or_description": "Operational Impact: Research portal experienced approximately 47 minutes of disruption."
        }
      ]
    }
  ],
  "outputs": [
    {
      "type": "executive_summary",
      "title": "Executive Summary",
      "content": "# Executive Summary...",
      "status": "Needs review",
      "settings": {
        "audience": "Leadership",
        "tone": "Objective",
        "detail": "Standard"
      },
      "validation": {
        "grounding_status": "PASS",
        "prohibited_terms_status": "PASS",
        "issues": []
      },
      "claim_dependencies": ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006"],
      "versions": [
        {
          "version": 1,
          "content": "# Executive Summary (v1)...",
          "status": "Needs review",
          "timestamp": "2026-04-17T08:00:01Z",
          "claim_snapshot": "47 minutes disruption"
        }
      ]
    }
  ],
  "cross_check_summary": {
    "status": "PASS",
    "inconsistencies": [],
    "timestamp": "2026-04-17T08:00:02Z"
  }
}
```

#### Detailed Response Field Mapping:
| Path / Parameter | Type | UI Usage / Binding in `WorkspaceScreen.jsx` |
| :--- | :--- | :--- |
| `id` | `string` | Top bar docket ID badge (`2026-0417`). |
| `title` | `string` | Main header title. |
| `status` | `string` | Overall approval pill (`Needs review` vs `Approved`). |
| `source_package` | `Array` | Ingested files listed in left rail "Source Documents" section. |
| `claims` | `Array` | Left rail "Evidence Grounding" list. Clicking any claim filters citations in the active document. |
| `claims[i].claim_id` | `string` | Claim badge (e.g. `CLM-001`). Matches `[CLM-001]` tags in text. |
| `claims[i].claim_text` | `string` | Verified factual claim statement. |
| `claims[i].evidence` | `Array` | Supporting quotes with source filename and line/section location. |
| `outputs` | `Array` | Horizontal tab selector at top of editor. |
| `outputs[i].type` | `string` | Identifier key (`executive_summary`, `security_advisory`, etc.). |
| `outputs[i].title` | `string` | Human-readable tab label. |
| `outputs[i].content` | `string` | Active Markdown rendered in the document canvas. |
| `outputs[i].status` | `string` | Status badge (`Needs review` or `Approved`). Controls "Approve Deliverable" button. |
| `outputs[i].claim_dependencies` | `Array<string>` | Citations bound to this deliverable (e.g. `["CLM-001", "CLM-004"]`). Drives Stage 7 impact targeting. |
| `outputs[i].versions` | `Array<VersionRecord>` | Historical snapshots. Enables the "Compare v1 / v2" editorial diff toggle. |
| `outputs[i].validation` | `object` | Right rail validation panel (`grounding_status`, `prohibited_terms_status`). |
| `cross_check_summary` | `object` | Right rail Cross-Check status card (`PASS` or detected discrepancies). |

---

### 2.4 `POST /api/work/{id}/claims/{claim_id}` — Fix Once Impact Propagation (Stage 7)
- **Invoked By**: `frontend/src/components/WorkspaceScreen.jsx` via `updateClaim(workId, claimId, payload)`
- **HTTP Method**: `POST`
- **Path Parameters**:
  - `id`: Work item docket ID (`2026-0417`)
  - `claim_id`: Canonical claim to update (`CLM-001`)

#### Request Body Schema (`UpdateClaimRequest`):
```json
{
  "new_claim_text": "The incident resulted in approximately 52 minutes of service disruption before containment protocols were completed at 03:22 UTC.",
  "new_value": "52 minutes",
  "reason": "Lead forensic auditor confirmed updated containment log timestamp"
}
```

#### Response Payload Schema (`ImpactAnalysisResponse`):
```json
{
  "work_id": "2026-0417",
  "claim_id": "CLM-001",
  "old_claim_text": "Research portal experienced approximately 47 minutes of operational disruption.",
  "new_claim_text": "The incident resulted in approximately 52 minutes of service disruption before containment protocols were completed at 03:22 UTC.",
  "affected_deliverables": [
    "executive_summary",
    "security_advisory",
    "social_media",
    "presentation",
    "video_script"
  ],
  "unaffected_deliverables": [],
  "diffs": [
    {
      "deliverable_type": "executive_summary",
      "deliverable_title": "Executive Summary",
      "is_affected": true,
      "v1_content": "...approximately 47 minutes...",
      "v2_content": "...approximately 52 minutes...",
      "changed_claim_id": "CLM-001",
      "old_value": "47 minutes",
      "new_value": "52 minutes"
    }
  ],
  "cross_check_status": "PASS",
  "validation_status": "PASS",
  "message": "Impact analysis completed: 5 deliverables updated to v2, 0 unaffected preserved"
}
```

#### UI Impact in `WorkspaceScreen.jsx`:
1. Opens the **Selective Impact Notice** banner indicating which deliverables were regenerated and which were preserved.
2. Enables the **Compare v1 / v2** editorial diff viewer showing old vs new content side-by-side.
3. Resets affected deliverables to `"Needs review"`.
4. Updates all occurrences in the active document and evidence rail automatically.

---

### 2.5 `POST /api/work/{id}/edit` — Manual Reviewer Draft Edit
- **Invoked By**: `frontend/src/components/WorkspaceScreen.jsx` via `editArtifact(workId, outputType, content)`
- **HTTP Method**: `POST`

#### Request Body (`EditArtifactRequest`):
```json
{
  "output_type": "executive_summary",
  "updated_content": "# Updated Executive Summary text..."
}
```

#### Response:
- Returns updated `output` deliverable and newly evaluated `cross_check` result.

---

### 2.6 `POST /api/work/{id}/prompt-edit` — AI Prompt Refinement
- **Invoked By**: `frontend/src/components/WorkspaceScreen.jsx` via `promptEditArtifact(workId, outputType, instruction)`
- **HTTP Method**: `POST`

#### Request Body (`PromptEditRequest`):
```json
{
  "output_type": "executive_summary",
  "instruction": "Shorten Section 2 to two bullet points and emphasize that database integrity remained uncompromised."
}
```

#### Response:
- Returns updated `output` deliverable with new Markdown text.

---

### 2.7 `POST /api/work/{id}/approve` — Human Reviewer Approval
- **Invoked By**: `frontend/src/components/WorkspaceScreen.jsx` via `approveArtifact(workId, outputType)`
- **HTTP Method**: `POST`

#### Request Body (`ApproveRequest`):
```json
{
  "output_type": "executive_summary",
  "reviewer_name": "Lead Analyst"
}
```

#### Response:
```json
{
  "work_status": "Needs review",
  "outputs": [ ... ]
}
```
*Note: If all deliverables are approved, `work_status` transitions automatically to `"Approved"`.*

---

### 2.8 `POST /api/work/{id}/finalize` — Publish, Hash & Blockchain Anchor (Stage 8)
- **Invoked By**: `frontend/src/components/FinalizeScreen.jsx` via `finalizeWork(workId, payload)`
- **HTTP Method**: `POST`

#### Request Body (`FinalizeRequest`):
```json
{
  "publisher_identity": "Lead Analyst 04",
  "network": "polygon-amoy"
}
```

#### Response Payload (`PublishManifestResponse`):
```json
{
  "work_id": "2026-0417",
  "package_hash_sha256": "e8f4702ba060a6a246ecdbfcf6e7bf7716f6b5536412f8646b9a8cf6ddbe38a1",
  "artifact_hashes": {
    "executive_summary": "a1b2c3d4e5...",
    "security_advisory": "b2c3d4e5f6...",
    "social_media": "c3d4e5f6a1...",
    "presentation": "d4e5f6a1b2...",
    "video_script": "e5f6a1b2c3..."
  },
  "blockchain_anchor": {
    "network": "Polygon Amoy Testnet",
    "tx_hash": "0x89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
    "contract_address": "0x1234567890abcdef1234567890abcdef12345678",
    "block_number": 14920381,
    "explorer_url": "https://amoy.polygonscan.com/tx/0x89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
    "anchored_at": "2026-04-17T08:35:10Z"
  },
  "status": "Published"
}
```

---

## 3. Quick Debugging & Diagnostic Reference

If any endpoint fails or the frontend shows a connection issue, run these diagnostic curl commands:

1. **Verify Live Work Item**:
   ```bash
   curl -s http://127.0.0.1:8000/api/work/2026-0417 | grep "Operation Silver Falcon"
   ```

2. **Test Stage 7 Claim Update**:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/work/2026-0417/claims/CLM-001 \
     -H "Content-Type: application/json" \
     -d '{"new_claim_text": "Disruption lasted 52 minutes.", "new_value": "52 minutes"}'
   ```

3. **Test Deliverable Approval**:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/work/2026-0417/approve \
     -H "Content-Type: application/json" \
     -d '{"output_type": "executive_summary", "reviewer_name": "Lead Analyst"}'
   ```
