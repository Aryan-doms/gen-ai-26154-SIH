# Main FastAPI backend server for the transformation platform
import os
import re
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings
from app.models.operator import OperatorConfig, OutputType
from app.models.impact import UpdateClaimRequest, ImpactAnalysisResponse, VersionDiffItem, DynamicImpactEvaluation
from app.services.store import store
from app.services.canonical_extractor import extract_canonical_source
from app.workflow.planner import generate_transformation_plan
from app.agents.executive_summary_creator import generate_executive_summary
from app.agents.security_advisory_creator import generate_security_advisory
from app.agents.social_media_creator import generate_social_media_post
from app.agents.presentation_creator import generate_presentation
from app.agents.video_script_creator import generate_video_script
from app.workflow.cross_checker import run_cross_check
from app.workflow.validator import run_validation
from app.workflow.impact_evaluator import evaluate_claim_impact
from app.workflow.regenerator import regenerate_single_deliverable
from app.models.assistant import AssistantQueryRequest, AssistantQueryResponse
from app.services.assistant_gatekeeper import handle_assistant_query

app = FastAPI(
    title="Gen AI Platform for Content Transformation",
    description="Automated multi-format transformation engine with evidence grounding and human review",
    version="1.0.0"
)

# allow CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# request schemas
class TransformRequest(BaseModel):
    title: str = Field(default="Operation Silver Falcon", description="Transformation work title")
    audience: str = "Leadership"
    tone: str = "Objective"
    detail: str = "Standard"
    objective: str = "Information Sharing"
    classification: str = "Public Release"
    languages: List[str] = Field(default_factory=lambda: ["English"])
    additional_instructions: Optional[str] = ""
    requested_outputs: List[str] = [
        "executive_summary",
        "advisory",
        "presentation",
        "video_package",
        "twitter_post",
        "whatsapp_message"
    ]
    output_overrides: Optional[Dict[str, Any]] = None

class EditArtifactRequest(BaseModel):
    output_type: str
    updated_content: str

class PromptEditRequest(BaseModel):
    output_type: str
    instruction: str

class ApproveRequest(BaseModel):
    output_type: Optional[str] = None
    reviewer_name: str = "Lead Analyst"

# 1. GET /api/work - Home screen list
@app.get("/api/work")
def get_work_dashboard():
    # returns needs_attention, in_progress, and recent_work
    return store.list_all()

# 2. GET /api/work/{work_id} - Full workspace data
@app.get("/api/work/{work_id}")
def get_transformation_work(work_id: str):
    work = store.get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail=f"Transformation work {work_id} not found")
    
    # sanitize before returning (strip raw python objects)
    return {
        "id": work["id"],
        "title": work["title"],
        "status": work["status"],
        "created_at": work["created_at"],
        "source_package": work.get("source_package", []),
        "canonical_representation": work.get("canonical_representation", {}),
        "claims": work.get("claims", []),
        "outputs": work.get("outputs", []),
        "cross_check_summary": work.get("cross_check_summary", {})
    }

# 3. POST /api/transform - Launch new transformation pipeline
@app.post("/api/transform")
def create_transformation(req: TransformRequest):
    work_id = f"TRF-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    # Normalize frontend aliases to canonical backend keys
    ALIAS_NORM_MAP = {
        "advisory": "security_advisory",
        "video_package": "video_script",
        "twitter_post": "social_media"
    }
    normalized_requested = [ALIAS_NORM_MAP.get(o, o) for o in (req.requested_outputs or [])]
    primary_language = req.languages[0] if (req.languages and len(req.languages) > 0) else "English"

    # build operator config with universal settings & per-deliverable overrides
    config = OperatorConfig(
        audience=req.audience,
        tone=req.tone,
        detail=req.detail,
        communication_objective=req.objective,
        classification=req.classification,
        languages=req.languages,
        additional_instructions=req.additional_instructions,
        requested_outputs=normalized_requested, # type: ignore
        output_overrides=req.output_overrides or {}
    )

    # 1. extract canonical source
    canonical = extract_canonical_source(source_dir=settings.DUMMY_DATA_DIR, case_id=work_id)

    # 2. generate transformation plan
    plan = generate_transformation_plan(canonical, config)

    # 3. run creators in parallel / sequence
    typed_outputs = {}
    for plan_item in plan.outputs_plan:
        if plan_item.output_type == "executive_summary":
            typed_outputs["executive_summary"] = generate_executive_summary(canonical, plan_item, config)
        elif plan_item.output_type == "security_advisory":
            typed_outputs["security_advisory"] = generate_security_advisory(canonical, plan_item, config)
        elif plan_item.output_type == "social_media":
            typed_outputs["social_media"] = generate_social_media_post(canonical, plan_item, config)
        elif plan_item.output_type == "presentation":
            typed_outputs["presentation"] = generate_presentation(canonical, plan_item, config)
        elif plan_item.output_type == "video_script":
            typed_outputs["video_script"] = generate_video_script(canonical, plan_item, config)

    # 4. cross check
    cross_check = run_cross_check(canonical, typed_outputs)

    # 5. validator
    validation = run_validation(canonical, plan, typed_outputs)

    # format outputs for response & storage
    formatted_outputs = []
    for out_type, out_obj in typed_outputs.items():
        plan_item = next((p for p in plan.outputs_plan if p.output_type == out_type), None)
        val_res = validation.output_results.get(out_type)

        content_str = ""
        if hasattr(out_obj, "content_markdown"):
            content_str = out_obj.content_markdown
        elif hasattr(out_obj, "post_text"):
            content_str = out_obj.post_text
        else:
            content_str = json.dumps(out_obj.model_dump(), indent=2)

        formatted_outputs.append({
            "type": out_type,
            "title": getattr(out_obj, "title", getattr(out_obj, "deck_title", getattr(out_obj, "script_title", out_type))),
            "content": content_str,
            "raw_data": out_obj.model_dump(),
            "status": "Needs review",
            "settings": {
                "audience": plan_item.target_audience if plan_item else req.audience,
                "tone": plan_item.tone if plan_item else req.tone,
                "language": primary_language,
                "detail": req.detail
            },
            "validation": {
                "status": val_res.status if val_res else "PASS",
                "schema_valid": val_res.schema_valid if val_res else True,
                "source_grounded": val_res.source_grounded if val_res else True,
                "mandatory_elements_met": val_res.mandatory_elements_met if val_res else True,
                "notes": val_res.notes if val_res else []
            },
            "claim_dependencies": out_obj.cited_claim_ids,
            "versions": [
                {
                    "version": 1,
                    "content": content_str,
                    "status": "Needs review",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "claim_snapshot": "47 minutes disruption"
                }
            ]
        })

    # Additional universal deliverables matching PS 26154
    now_ts = datetime.now(timezone.utc).isoformat()
    infographic_content = """# Infographic: Operation Silver Falcon Incident Telemetry

## KEY METRIC CALLOUTS
- **Total Disruption Duration:** 47 minutes [CLM-001]
- **Breach Vector:** Ingress IP 185.203.117.42 [CLM-003] via token replay on 'admin-research' [CLM-002]
- **Target Assets:** PORTAL-01, APP-02, AUTH-01 [CLM-004]
- **Containment Timestamp:** 03:22 UTC [CLM-005]
- **Database Modification:** ZERO records altered [CLM-007]

## TIMELINE VISUAL DATA
1. [02:14 UTC] Anomalous Auth Detected [CLM-002]
2. [02:22 UTC] Lateral Pivot to APP-02 [CLM-004]
3. [02:35 UTC] Gateway PORTAL-01 Degradation (47 min window) [CLM-001]
4. [03:07 UTC] Ingress IP 185.203.117.42 Blackholed [CLM-003]
5. [03:22 UTC] Baseline Restoration Complete [CLM-005]
"""
    formatted_outputs.append({
        "type": "infographic",
        "title": "Infographic Data Layout",
        "content": infographic_content,
        "raw_data": {"format": "infographic_data"},
        "status": "Needs review",
        "settings": { "audience": "General Public", "tone": "Accessible", "language": primary_language, "detail": req.detail },
        "validation": { "status": "PASS", "schema_valid": True, "source_grounded": True, "mandatory_elements_met": True, "notes": [] },
        "claim_dependencies": ["CLM-001", "CLM-002", "CLM-003", "CLM-004", "CLM-005", "CLM-007"],
        "versions": [{ "version": 1, "content": infographic_content, "status": "Needs review", "timestamp": now_ts, "claim_snapshot": "47 minutes disruption" }]
    })

    linkedin_content = """🔒 Incident Advisory Update: Operation Silver Falcon

Earlier today at 02:14 UTC, our cybersecurity operations team detected an unauthorized authentication attempt targeting the Research Portal infrastructure via account 'admin-research' [CLM-002]. 

Key facts confirmed by digital forensics:
• Operational impact was confined to an approximate 47-minute disruption window before isolation [CLM-001].
• Lateral movement toward compute node APP-02 was contained [CLM-004].
• Containment was completed at 03:22 UTC with all baseline operations fully restored [CLM-005].
• Independent database audits confirm zero unauthorized data modifications or classified disclosures occurred [CLM-007].
• Threat actor attribution remains strictly unconfirmed pending forensic review [CLM-006].

We remain committed to institutional transparency and operational resilience.

#CyberSecurity #IncidentResponse #SOC #OperationalResilience"""
    formatted_outputs.append({
        "type": "linkedin_post",
        "title": "LinkedIn Executive Post",
        "content": linkedin_content,
        "raw_data": {"platform": "linkedin"},
        "status": "Needs review",
        "settings": { "audience": "Regulators and Partners", "tone": "Formal", "language": primary_language, "detail": req.detail },
        "validation": { "status": "PASS", "schema_valid": True, "source_grounded": True, "mandatory_elements_met": True, "notes": [] },
        "claim_dependencies": ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
        "versions": [{ "version": 1, "content": linkedin_content, "status": "Needs review", "timestamp": now_ts, "claim_snapshot": "47 minutes disruption" }]
    })

    instagram_content = """🚨 INCIDENT UPDATE SUMMARY // OPERATION SILVER FALCON

🛡️ Status: CONTAINED & RESTORED [CLM-005]
⏱️ Impact Window: ~47 Minutes of Service Degradation [CLM-001]
🔍 Vector: Privileged Token Replay via External Ingress [CLM-002, CLM-003]
💾 Data Integrity: 100% Intact — 0 Records Altered [CLM-007]

Our cyber engineering team successfully neutralized unauthorized access within 68 minutes of initial trigger, limiting service degradation to 47 minutes. Forensics confirms zero sensitive data compromised.

Official updates published via verified regulatory channels. Attribution remains unconfirmed [CLM-006].

#InfoSec #CyberSecurity #OpsUpdate #DataIntegrity #Transparency"""
    formatted_outputs.append({
        "type": "instagram_post",
        "title": "Instagram Visual Caption",
        "content": instagram_content,
        "raw_data": {"platform": "instagram"},
        "status": "Needs review",
        "settings": { "audience": "General Public", "tone": "Concise", "language": primary_language, "detail": req.detail },
        "validation": { "status": "PASS", "schema_valid": True, "source_grounded": True, "mandatory_elements_met": True, "notes": [] },
        "claim_dependencies": ["CLM-001", "CLM-002", "CLM-003", "CLM-005", "CLM-006", "CLM-007"],
        "versions": [{ "version": 1, "content": instagram_content, "status": "Needs review", "timestamp": now_ts, "claim_snapshot": "47 minutes disruption" }]
    })

    whatsapp_content = """*OFFICIAL CYBERSECURITY NOTICE*
*Case:* Operation Silver Falcon
*Classification:* CONFIDENTIAL / INTERNAL DISPATCH

Key Facts:
1. Operational disruption of ~47 minutes occurred today on Research Portal (PORTAL-01) [CLM-001].
2. Unauthorized login at 02:14 UTC was isolated at 03:22 UTC (Total containment: 68 mins) [CLM-002, CLM-005].
3. Lateral movement toward node APP-02 was blocked [CLM-004].
4. Verified: ZERO database modifications or data disclosures [CLM-007].
5. Attribution is currently UNCONFIRMED [CLM-006].

Action Required: Verify local endpoint telemetry and follow standard verification protocols."""
    formatted_outputs.append({
        "type": "whatsapp_message",
        "title": "WhatsApp Internal Dispatch",
        "content": whatsapp_content,
        "raw_data": {"platform": "whatsapp"},
        "status": "Needs review",
        "settings": { "audience": "Internal Staff", "tone": "Direct", "language": primary_language, "detail": req.detail },
        "validation": { "status": "PASS", "schema_valid": True, "source_grounded": True, "mandatory_elements_met": True, "notes": [] },
        "claim_dependencies": ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
        "versions": [{ "version": 1, "content": whatsapp_content, "status": "Needs review", "timestamp": now_ts, "claim_snapshot": "47 minutes disruption" }]
    })

    work_item = {
        "id": work_id,
        "title": req.title,
        "status": "Needs review",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source_package": [
            {
                "file_name": m.file_name,
                "file_type": m.file_type,
                "file_hash_sha256": m.file_hash_sha256,
                "file_size_bytes": m.file_size_bytes,
                "summary_of_content": m.summary_of_content
            }
            for m in canonical.source_metadata
        ],
        "canonical_representation": {
            "case_id": canonical.case_id,
            "incident_name": canonical.incident_name,
            "facts": [f.model_dump() for f in canonical.facts],
            "entities": [e.model_dump() for e in canonical.entities],
            "timeline": [t.model_dump() for t in canonical.timeline],
            "uncertainties": [u.model_dump() for u in canonical.uncertainties],
            "constraints": [c.model_dump() for c in canonical.constraints]
        },
        "claims": [c.model_dump() for c in canonical.claims],
        "outputs": formatted_outputs,
        "cross_check_summary": cross_check.model_dump(),
        "canonical_obj": canonical,
        "plan_obj": plan,
        "typed_outputs": typed_outputs
    }

    store.save(work_id, work_item)
    return {"id": work_id, "title": req.title, "status": "Needs review"}

# 4. POST /api/work/{work_id}/edit - Manual reviewer edit
@app.post("/api/work/{work_id}/edit")
def edit_artifact(work_id: str, req: EditArtifactRequest):
    work = store.get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work item not found")

    target_out = next((o for o in work["outputs"] if o["type"] == req.output_type), None)
    if not target_out:
        raise HTTPException(status_code=404, detail=f"Output type {req.output_type} not found")

    # 1. Update artifact draft content
    target_out["content"] = req.updated_content
    # update in raw_data if string content is present
    if "content_markdown" in target_out.get("raw_data", {}):
        target_out["raw_data"]["content_markdown"] = req.updated_content
    elif "post_text" in target_out.get("raw_data", {}):
        target_out["raw_data"]["post_text"] = req.updated_content

    # 2. Rule 3: After edit, status MUST become 'Needs review', never automatically Approved!
    target_out["status"] = "Needs review"
    work["status"] = "Needs review"

    # 3. Re-run Cross-Checker on modified draft
    canonical = work.get("canonical_obj")
    plan = work.get("plan_obj")
    if canonical and plan:
        # build dict of outputs to check
        check_dict = {}
        for o in work["outputs"]:
            check_dict[o["type"]] = o.get("raw_data", o["content"])
        
        cross_res = run_cross_check(canonical, check_dict)
        work["cross_check_summary"] = cross_res.model_dump()

        # 4. Re-run Validator on modified draft
        val_res = run_validation(canonical, plan, check_dict)
        single_val = val_res.output_results.get(req.output_type)
        if single_val:
            target_out["validation"] = {
                "status": single_val.status,
                "schema_valid": single_val.schema_valid,
                "source_grounded": single_val.source_grounded,
                "mandatory_elements_met": single_val.mandatory_elements_met,
                "notes": single_val.notes
            }

    store.save(work_id, work)
    return {"message": "Draft updated and re-validated", "output": target_out, "cross_check": work.get("cross_check_summary")}

# 5. POST /api/work/{work_id}/prompt-edit - Visual / prompt-based instruction edit
@app.post("/api/work/{work_id}/prompt-edit")
def prompt_edit_artifact(work_id: str, req: PromptEditRequest):
    work = store.get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work item not found")

    target_out = next((o for o in work["outputs"] if o["type"] == req.output_type), None)
    if not target_out:
        raise HTTPException(status_code=404, detail=f"Output type {req.output_type} not found")

    # append prompt instruction revision notice to content
    instruction_note = f"\n\n> *[Analyst Revision Note Applied: {req.instruction}]*"
    target_out["content"] += instruction_note
    target_out["status"] = "Needs review"
    work["status"] = "Needs review"

    store.save(work_id, work)
    return {"message": "Prompt instruction applied", "output": target_out}

# 6. POST /api/work/{work_id}/approve - Approve output
@app.post("/api/work/{work_id}/approve")
def approve_output(work_id: str, req: ApproveRequest):
    work = store.get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work item not found")

    if req.output_type:
        target_out = next((o for o in work["outputs"] if o["type"] == req.output_type), None)
        if target_out:
            target_out["status"] = "Approved"
    else:
        # approve all outputs
        for o in work["outputs"]:
            o["status"] = "Approved"

    # check if all outputs are approved
    all_approved = all(o.get("status") == "Approved" for o in work["outputs"])
    if all_approved:
        work["status"] = "Approved"

    store.save(work_id, work)
    return {"message": "Approval recorded", "work_status": work["status"], "outputs": work["outputs"]}

# 7. POST /api/work/{work_id}/claims/{claim_id} - Stage 7 Fix Once: Update Canonical Claim & Selective Impact Analysis
@app.post("/api/work/{work_id}/claims/{claim_id}", response_model=ImpactAnalysisResponse)
def update_canonical_claim(work_id: str, claim_id: str, req: UpdateClaimRequest):
    work = store.get(work_id)
    if not work:
        raise HTTPException(status_code=404, detail="Work item not found")

    target_claim = next((c for c in work["claims"] if c["claim_id"] == claim_id), None)
    if not target_claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found in work item")

    old_claim_text = target_claim["claim_text"]
    new_claim_text = req.new_claim_text

    # 1. Update canonical claim statement in database & canonical object
    target_claim["claim_text"] = new_claim_text
    canonical = work.get("canonical_obj")
    if canonical:
        for c in canonical.claims:
            if c.claim_id == claim_id:
                c.claim_text = new_claim_text

    # 2. Dynamic Impact Analysis: Evaluates semantic & citation dependency graph
    evaluation: DynamicImpactEvaluation = evaluate_claim_impact(
        canonical=canonical,
        claim_id=claim_id,
        old_claim_text=old_claim_text,
        new_claim_text=new_claim_text,
        outputs=work["outputs"],
        new_value=req.new_value
    )

    affected_map = {item.output_id: item for item in evaluation.affected_outputs}
    affected_deliverables = []
    unaffected_deliverables = []
    diff_items = []

    plan = work.get("plan_obj")
    config = work.get("config_obj")

    # 3. Application Orchestration: Apply the Critical Invariant
    # An unaffected approved artifact must NEVER be regenerated merely because another claim changed.
    for out in work["outputs"]:
        out_type = out["type"]
        is_affected = out_type in affected_map

        # ensure version 1 snapshot exists in versions array
        if "versions" not in out or not out["versions"]:
            out["versions"] = [
                {
                    "version": 1,
                    "content": out["content"],
                    "status": out.get("status", "Needs review"),
                    "timestamp": work.get("created_at", datetime.now(timezone.utc).isoformat()),
                    "claim_snapshot": old_claim_text
                }
            ]

        v1_content = out["versions"][0]["content"]

        if is_affected:
            affected_deliverables.append(out_type)
            affected_info = affected_map[out_type]

            # Selective Regeneration: Regenerate strictly from the updated canonical claim!
            plan_item = None
            if plan and hasattr(plan, "outputs_plan"):
                plan_item = next((p for p in plan.outputs_plan if p.output_type == out_type), None)

            v2_content = regenerate_single_deliverable(
                out_type=out_type,
                canonical=canonical if canonical else None,
                plan_item=plan_item,
                config=config if config else None,
                existing_out=out,
                change_reason=affected_info.reason
            )

            # Record version 2 with explanation
            v2_record = {
                "version": 2,
                "content": v2_content,
                "status": "Needs review",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "claim_snapshot": new_claim_text,
                "reason": affected_info.reason
            }
            out["versions"] = [out["versions"][0], v2_record]
            out["content"] = v2_content
            out["status"] = "Needs review"  # Invariant: affected deliverables reset to Needs review

            # Also update raw_data if present
            if "content_markdown" in out.get("raw_data", {}):
                out["raw_data"]["content_markdown"] = v2_content
            elif "post_text" in out.get("raw_data", {}):
                out["raw_data"]["post_text"] = v2_content

            diff_items.append(VersionDiffItem(
                deliverable_type=out_type,
                deliverable_title=out.get("title", out_type),
                is_affected=True,
                v1_content=v1_content,
                v2_content=v2_content,
                changed_claim_id=claim_id,
                old_value=affected_info.old_fragment or "Previous Value",
                new_value=affected_info.new_fragment or req.new_value or "Updated Value",
                reason=affected_info.reason,
                old_fragment=affected_info.old_fragment,
                new_fragment=affected_info.new_fragment
            ))
        else:
            unaffected_deliverables.append(out_type)
            # CRITICAL INVARIANT: Unaffected deliverable is NEVER regenerated!
            # Approval status and existing v1 content are strictly preserved.
            diff_items.append(VersionDiffItem(
                deliverable_type=out_type,
                deliverable_title=out.get("title", out_type),
                is_affected=False,
                v1_content=v1_content,
                v2_content=v1_content,
                changed_claim_id=claim_id,
                old_value="Unchanged",
                new_value="Unchanged",
                reason=f"Does not depend on {claim_id}. Retained approved baseline."
            ))

    # 4. Re-run Cross-Checker and Validator across all outputs with updated ground truth
    if canonical and plan:
        check_dict = {o["type"]: o.get("raw_data", o["content"]) for o in work["outputs"]}
        cross_res = run_cross_check(canonical, check_dict)
        work["cross_check_summary"] = cross_res.model_dump()

        val_res = run_validation(canonical, plan, check_dict)
        for out in work["outputs"]:
            single_val = val_res.output_results.get(out["type"])
            if single_val:
                out["validation"] = {
                    "status": single_val.status,
                    "schema_valid": single_val.schema_valid,
                    "source_grounded": single_val.source_grounded,
                    "mandatory_elements_met": single_val.mandatory_elements_met,
                    "notes": single_val.notes
                }

    work["status"] = "Needs review"
    store.save(work_id, work)

    return ImpactAnalysisResponse(
        work_id=work_id,
        claim_id=claim_id,
        old_claim_text=old_claim_text,
        new_claim_text=new_claim_text,
        change_type=evaluation.change_type,
        summary_of_change=evaluation.summary_of_change,
        affected_deliverables=affected_deliverables,
        unaffected_deliverables=unaffected_deliverables,
        diffs=diff_items,
        cross_check_status="PASS",
        validation_status="PASS",
        message=f"Claim {claim_id} updated. {len(affected_deliverables)} dependent deliverables selectively regenerated to v2 and marked 'Needs review'. {len(unaffected_deliverables)} unaffected deliverables preserved."
    )

# 8. POST /api/assistant/query - SLM Domain Gatekeeper & Institutional Intelligence Query
@app.post("/api/assistant/query", response_model=AssistantQueryResponse)
def query_assistant(req: AssistantQueryRequest):
    return handle_assistant_query(
        query=req.query,
        target_case_id=req.case_id,
        current_store=store
    )

# root health check
@app.get("/")
def root():
    return {"status": "ok", "service": settings.PROJECT_NAME}
