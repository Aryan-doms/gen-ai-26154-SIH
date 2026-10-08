# AI Prompt, Schema & Structured Output Registry

This document catalogs every system prompt, extraction instruction, and Pydantic structured output schema across the platform. You can use this registry to tune, refine, or swap prompts and schemas for higher quality outputs.

---

## 1. Complete Prompt & Schema Mapping Table

| Component / Agent | Prompt Location in Code | Pydantic Schema | Input Context Provided | Output Purpose | Fine-Tuning / Optimization Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Canonical Source Extractor** | `backend/app/services/canonical_extractor.py` | `CanonicalSource` (`app/models/canonical.py`) | All raw source files (PDF text, logs, intel notes) | Extracts facts, entities, timeline, claims with exact evidence quotes, uncertainties, constraints | Add few-shot examples for irregular log formats; test Gemini-3.8 Flash temperature `0.1` for deterministic fact extraction. |
| **Transformation Planner** | `backend/app/workflow/planner.py` | `TransformationPlan` (`app/models/plan.py`) | `CanonicalSource` + `OperatorConfig` | Builds output items with specific claim IDs, mandatory elements, prohibited items, validation rules | Can be tuned to dynamically recommend new artifact types based on document domain (e.g., policy vs technical). |
| **Executive Summary Creator** | `backend/app/agents/executive_summary_creator.py` | `ExecutiveSummaryOutput` (`app/models/creators.py`) | Relevant claims (`CLM-001`, `CLM-002`, `CLM-004`, `CLM-005`, `CLM-006`) + Constraints | Produces high-level leadership brief with severity, outage duration, status, and uncertainties | Adjust tone guidelines to match specific executive styles (e.g., bulleted vs prose). |
| **Security Advisory Creator** | `backend/app/agents/security_advisory_creator.py` | `SecurityAdvisoryOutput` (`app/models/creators.py`) | IoC claims (`CLM-002`, `CLM-003`, `CLM-007`) + System claims + Constraints | Generates technical advisory with IoC table, affected assets, containment status, prioritized mitigations | Can fine-tune with MITRE ATT&CK technique tags or STIX 2.1 taxonomy. |
| **Social Media Creator** | `backend/app/agents/social_media_creator.py` | `SocialMediaOutput` (`app/models/creators.py`) | High-level claims (`CLM-001`, `CLM-005`, `CLM-006`) | Platform-appropriate public update (under 280 words) | Tune for specific channels (e.g., LinkedIn vs Twitter thread format); adjust hashtag generation. |
| **Presentation Creator** | `backend/app/agents/presentation_creator.py` | `PresentationOutput` (`app/models/creators.py`) | Full canonical claims package | 5-slide briefing outline with visual recommendations, speaker points, claim tags | Can be tuned to generate Marp or Reveal.js markdown syntax directly for instant rendering. |
| **Video Script Creator** | `backend/app/agents/video_script_creator.py` | `VideoScriptOutput` (`app/models/creators.py`) | Key chronological claims | 4-scene video storyboard with duration, narration text, on-screen text, visual descriptions | Tune speech cadence / word counts per second (standard is ~2.5 words per second). |
| **Cross-Checker Node** | `backend/app/workflow/cross_checker.py` | `CrossCheckResult` (`app/models/validation.py`) | All 5 generated outputs + Canonical ground truth constraints | Compares outputs against each other to catch date, duration, asset, and attribution drift | Expand checking categories (e.g., financial impact numbers, regulatory compliance references). |
| **Validator Node** | `backend/app/workflow/validator.py` | `ValidationReport` (`app/models/validation.py`) | Individual artifact + Output Plan requirements | Validates schema conformance, source grounding (no ungrounded claims), mandatory elements | Can add readability score metrics (Flesch-Kincaid) or tone alignment score. |

---

## 2. Core Prompt Templates (Ready for Fine-Tuning)

### Template A: Canonical Source Extractor
```text
You are the Canonical Source Extractor for an Incident Content Transformation Platform.
Source Files: {file_names}
Contents: {file_contents}

Instructions:
1. Decompose the source materials into atomic, verifiable facts.
2. Group confirmed entities by type (IP_ADDRESS, ACCOUNT, SYSTEM_ASSET, TOOL).
3. Build a strict chronological timeline in UTC.
4. Generate atomic claims (CLM-001, CLM-002...) linking to exact file names and supporting quotes.
5. Identify explicit uncertainties (e.g., unconfirmed threat attribution) and document them under uncertainties.
6. Declare strict constraints that downstream creators cannot violate.
7. Return strictly valid JSON conforming to the CanonicalSource schema.
```

### Template B: Executive Briefing Generator
```text
You are the Executive Summary Creator Agent.
Transformation Context: {work_title}
Target Audience: {target_audience}
Tone: {tone}
Objective: {communication_objective}

RELEVANT CANONICAL CLAIMS:
{relevant_claims_list}

CANONICAL CONSTRAINTS:
{constraints_list}

CANONICAL UNCERTAINTIES:
{uncertainties_list}

Generate a concise, professional executive briefing adhering strictly to the ExecutiveSummaryOutput schema.
Do NOT introduce any external threat actor names or unsupported facts.
Attribution MUST state UNCONFIRMED.
Cite all relevant claim IDs in brackets [CLM-xxx].
```

### Template C: Cross-Checker Evaluator
```text
You are the Independent Cross-Checker Node.
CANONICAL GROUND TRUTH & CONSTRAINTS:
{canonical_claims_and_constraints}

GENERATED OUTPUT ARTIFACTS:
1. Executive Summary: {exec_summary_text}
2. Security Advisory: {advisory_text}
3. Social Media: {social_text}
4. Presentation: {presentation_text}
5. Video Script: {video_text}

Task:
Compare all 5 artifacts against each other and against canonical ground truth.
Look for:
- Attribution drift (did any output name an attacker when canonical says UNCONFIRMED?)
- Numerical drift (did one output say 47 minutes and another 74 minutes?)
- Inconsistent system names or dates.

Return strictly structured JSON conforming to the CrossCheckResult schema.
```

---

## 3. API Endpoint to Pydantic Schema Mapping (Stage 7 & Core Operations)

This table defines the input request contracts, response payloads, and data models for all platform REST endpoints.

| API Endpoint | HTTP Method | Request Pydantic Model | Response Model / Payload | State Transition & Core Mechanics | Code Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/work` | `GET` | *None* | `Dict[str, List[Dict]]` | Fetches dashboard categories: `needs_attention`, `in_progress`, `recent_work`. | `backend/app/main.py:get_work_dashboard` |
| `/api/work/{id}` | `GET` | *None* | `Dict` (Sanitized work item) | Returns complete state: canonical claims, sources, deliverables, versions, and validation. | `backend/app/main.py:get_transformation_work` |
| `/api/transform` | `POST` | `TransformRequest` (`app/main.py`) | `Dict` (`id`, `title`, `status`) | Runs canonical extraction, transformation planner, creator agents, cross-checker, and validator. | `backend/app/main.py:create_transformation` |
| `/api/work/{id}/claims/{claim_id}` | `POST` | `UpdateClaimRequest` (`app/models/impact.py`) | `ImpactAnalysisResponse` (`app/models/impact.py`) | **Stage 7 Engine**: Updates canonical claim statement, resolves `claim_dependencies`, creates `v2` for affected deliverables, preserves unaffected deliverables, re-runs cross-checker & validator, resets affected status to `Needs review`. | `backend/app/main.py:update_canonical_claim` |
| `/api/work/{id}/edit` | `POST` | `EditArtifactRequest` (`app/main.py`) | `Dict` (`output`, `cross_check`) | Manual reviewer draft edit. Resets status to `Needs review`, re-runs Cross-Checker and Validator. | `backend/app/main.py:edit_artifact` |
| `/api/work/{id}/prompt-edit` | `POST` | `PromptEditRequest` (`app/main.py`) | `Dict` (`output`) | Prompt-driven editorial refinement instruction applied to draft. Resets status to `Needs review`. | `backend/app/main.py:prompt_edit_artifact` |
| `/api/work/{id}/approve` | `POST` | `ApproveRequest` (`app/main.py`) | `Dict` (`work_status`, `outputs`) | Human reviewer sign-off. Changes output status to `Approved`. | `backend/app/main.py:approve_output` |

### Stage 7 Core Data Models (`backend/app/models/impact.py`)

```python
class UpdateClaimRequest(BaseModel):
    new_claim_text: str = Field(description="Updated verified text for the canonical claim")
    new_value: Optional[str] = Field(default=None, description="Updated atomic value (e.g., '52 minutes')")
    reason: Optional[str] = Field(default="Analyst verified source correction", description="Audit justification")

class VersionRecord(BaseModel):
    version: int = Field(description="Version index (1, 2...)")
    content: str = Field(description="Document content snapshot at this version")
    status: str = Field(description="Approval status at this version snapshot")
    timestamp: str = Field(description="ISO timestamp when version was recorded")
    claim_snapshot: Optional[str] = Field(default=None, description="Claim text at the time of this version")

class VersionDiffItem(BaseModel):
    deliverable_type: str
    deliverable_title: str
    is_affected: bool
    v1_content: str
    v2_content: str
    changed_claim_id: str
    old_value: str
    new_value: str

class ImpactAnalysisResponse(BaseModel):
    work_id: str
    claim_id: str
    old_claim_text: str
    new_claim_text: str
    affected_deliverables: List[str]
    unaffected_deliverables: List[str]
    diffs: List[VersionDiffItem]
    cross_check_status: str
    validation_status: str
    message: str
```

---

## 4. Frontend-Backend API Parameter Specification

For a complete breakdown of all request parameters, response fields, default values, UI bindings, and curl test commands, see:
👉 [API Parameter Reference & Data Contract Matrix](file:///Users/aryan/Gen-Ai-26154-SIH/docs/API_PARAMETER_REFERENCE.md)

---

*This registry is kept continuously updated as new endpoints and models are added.*

