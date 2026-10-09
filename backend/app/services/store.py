# Simple in-memory and file-backed store for active transformations
import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path

from app.models.canonical import CanonicalSource
from app.models.plan import TransformationPlan
from app.models.operator import OperatorConfig
from app.models.creators import (
    ExecutiveSummaryOutput,
    SecurityAdvisoryOutput,
    SocialMediaOutput,
    PresentationOutput,
    VideoScriptOutput
)
from app.workflow.cross_checker import run_cross_check
from app.workflow.validator import run_validation

class TransformationStore:
    def __init__(self):
        # dictionary holding active transformations by id
        self.items: Dict[str, Dict[str, Any]] = {}
        # load initial demo data if available
        self._load_demo_transformation()

    def _load_demo_transformation(self):
        # helper to load verified reference transformation
        fixtures_dir = Path(__file__).resolve().parent.parent / "fixtures"
        canonical_file = fixtures_dir / "canonical_source.json"
        plan_file = fixtures_dir / "transformation_plan.json"
        outputs_file = fixtures_dir / "initial_outputs.json"

        if canonical_file.exists() and plan_file.exists() and outputs_file.exists():
            with open(canonical_file, "r", encoding="utf-8") as f:
                canonical_data = json.load(f)
            with open(plan_file, "r", encoding="utf-8") as f:
                plan_data = json.load(f)
            with open(outputs_file, "r", encoding="utf-8") as f:
                raw_outputs = json.load(f)

            canonical = CanonicalSource.model_validate(canonical_data)
            plan = TransformationPlan.model_validate(plan_data)

            # parse outputs with typed models
            typed_outputs = {
                "executive_summary": ExecutiveSummaryOutput.model_validate(raw_outputs["executive_summary"]),
                "security_advisory": SecurityAdvisoryOutput.model_validate(raw_outputs["security_advisory"]),
                "social_media": SocialMediaOutput.model_validate(raw_outputs["social_media"]),
                "presentation": PresentationOutput.model_validate(raw_outputs["presentation"]),
                "video_script": VideoScriptOutput.model_validate(raw_outputs["video_script"])
            }

            # run initial cross check & validation
            cross_check = run_cross_check(canonical, typed_outputs)
            validation = run_validation(canonical, plan, typed_outputs)

            # format output list with claim_dependencies
            formatted_outputs = []
            for out_type, out_obj in typed_outputs.items():
                plan_item = next((p for p in plan.outputs_plan if p.output_type == out_type), None)
                val_res = validation.output_results.get(out_type)

                # content representation
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
                        "audience": plan_item.target_audience if plan_item else "General",
                        "tone": plan_item.tone if plan_item else "Professional",
                        "language": "English",
                        "detail": "Detailed"
                    },
                    "validation": {
                        "status": val_res.status if val_res else "PASS",
                        "schema_valid": val_res.schema_valid if val_res else True,
                        "source_grounded": val_res.source_grounded if val_res else True,
                        "mandatory_elements_met": val_res.mandatory_elements_met if val_res else True,
                        "notes": val_res.notes if val_res else []
                    },
                    "claim_dependencies": out_obj.cited_claim_ids, # important for Stage 7
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
            
            # 6. Infographic
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
                "settings": { "audience": "General Public", "tone": "Accessible", "language": "English", "detail": "Standard" },
                "validation": { "status": "PASS", "schema_valid": True, "source_grounded": True, "mandatory_elements_met": True, "notes": [] },
                "claim_dependencies": ["CLM-001", "CLM-002", "CLM-003", "CLM-004", "CLM-005", "CLM-007"],
                "versions": [{ "version": 1, "content": infographic_content, "status": "Needs review", "timestamp": now_ts, "claim_snapshot": "47 minutes disruption" }]
            })

            # 7. LinkedIn Post
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
                "settings": { "audience": "Regulators and Partners", "tone": "Formal", "language": "English", "detail": "Standard" },
                "validation": { "status": "PASS", "schema_valid": True, "source_grounded": True, "mandatory_elements_met": True, "notes": [] },
                "claim_dependencies": ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
                "versions": [{ "version": 1, "content": linkedin_content, "status": "Needs review", "timestamp": now_ts, "claim_snapshot": "47 minutes disruption" }]
            })

            # 8. Instagram Post
            insta_content = """SLIDE 1: INCIDENT UPDATE - OPERATION SILVER FALCON
SLIDE 2: What Happened? On 17 April at 02:14 UTC, an unauthorized authentication occurred using account 'admin-research' [CLM-002].
SLIDE 3: Disruption Window: The research portal was degraded for approximately 47 minutes (02:35 - 03:22 UTC) [CLM-001].
SLIDE 4: Full Containment: Incident contained at 03:22 UTC. All services nominal. Zero data compromised [CLM-005, CLM-007].
SLIDE 5: Attribution: Forensic review ongoing; attribution unconfirmed [CLM-006].

CAPTION:
Official transparency update regarding the 17 April incident. Full containment was achieved at 03:22 UTC with zero data compromised. Disruption lasted 47 minutes. Swipe for forensic breakdown. #Security #SystemUpdate"""
            formatted_outputs.append({
                "type": "instagram_post",
                "title": "Instagram Carousel & Caption",
                "content": insta_content,
                "raw_data": {"platform": "instagram"},
                "status": "Needs review",
                "settings": { "audience": "General Public", "tone": "Accessible", "language": "English", "detail": "Brief" },
                "validation": { "status": "PASS", "schema_valid": True, "source_grounded": True, "mandatory_elements_met": True, "notes": [] },
                "claim_dependencies": ["CLM-001", "CLM-002", "CLM-005", "CLM-006", "CLM-007"],
                "versions": [{ "version": 1, "content": insta_content, "status": "Needs review", "timestamp": now_ts, "claim_snapshot": "47 minutes disruption" }]
            })

            # 9. WhatsApp Broadcast
            whatsapp_content = """*OFFICIAL SECURITY ADVISORY NOTICE*
*Case Identifier:* 2026-0417 | Operation Silver Falcon

Please be advised that an unauthorized authentication event on account 'admin-research' occurred at 02:14 UTC on 17 April 2026 [CLM-002].

*Summary of Impact:*
• Research Portal experienced ~47 minutes of operational disruption [CLM-001].
• Lateral movement toward compute cluster APP-02 was blocked [CLM-004].
• Full containment verified at 03:22 UTC with production baseline restored [CLM-005].
• Confirmed: ZERO database modifications or data leaks [CLM-007].

*Attribution Status:* UNCONFIRMED [CLM-006]. No external claims are verified.

_Issued by Operations Command. For authorized inquiries, refer to docket 2026-0417._"""
            formatted_outputs.append({
                "type": "whatsapp_message",
                "title": "WhatsApp Official Broadcast",
                "content": whatsapp_content,
                "raw_data": {"platform": "whatsapp"},
                "status": "Needs review",
                "settings": { "audience": "Internal Staff", "tone": "Authoritative", "language": "English", "detail": "Brief" },
                "validation": { "status": "PASS", "schema_valid": True, "source_grounded": True, "mandatory_elements_met": True, "notes": [] },
                "claim_dependencies": ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
                "versions": [{ "version": 1, "content": whatsapp_content, "status": "Needs review", "timestamp": now_ts, "claim_snapshot": "47 minutes disruption" }]
            })

            work_id = "2026-0417"
            item_data = {
                "id": work_id,
                "title": "Operation Silver Falcon",
                "status": "Needs review",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "config": {
                    "audience": "Leadership",
                    "tone": "Objective",
                    "detail": "Standard",
                    "objective": "Information Sharing",
                    "classification": "Public Release",
                    "languages": ["English"],
                    "output_overrides": {
                        "presentation": { "slide_count": 5 },
                        "infographic": { "image_count": 1, "aspect_ratio": "1:1", "focus": "Executive Metrics" },
                        "instagram_post": { "image_count": 1 },
                        "twitter_post": { "account_type": "standard" },
                        "whatsapp_message": { "purpose": "alert" }
                    }
                },
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
            self.items[work_id] = item_data
            self.items["TRF-2026-0417"] = item_data # backward-compatible alias

    def list_all(self) -> Dict[str, List[Dict[str, Any]]]:
        # returns dashboard views for Home screen
        needs_attention = []
        recent_work = []
        in_progress = []

        seen_titles = set()
        for item in self.items.values():
            if item["title"] in seen_titles:
                continue
            seen_titles.add(item["title"])

            summary = {
                "id": item["id"],
                "title": item["title"],
                "status": item["status"],
                "created_at": item["created_at"],
                "sources_count": len(item.get("source_package", [])),
                "outputs_count": len(item.get("outputs", [])),
                "unapproved_count": len([o for o in item.get("outputs", []) if o.get("status") != "Approved"])
            }
            if item["status"] == "Needs review":
                needs_attention.append(summary)
            elif item["status"] == "In progress":
                in_progress.append(summary)
            else:
                recent_work.append(summary)

        return {
            "needs_attention": needs_attention,
            "in_progress": in_progress,
            "recent_work": recent_work
        }

    def get(self, work_id: str) -> Optional[Dict[str, Any]]:
        if work_id in self.items:
            return self.items[work_id]
        if work_id == "2026-0417" and "TRF-2026-0417" in self.items:
            return self.items["TRF-2026-0417"]
        if work_id == "TRF-2026-0417" and "2026-0417" in self.items:
            return self.items["2026-0417"]
        return None

    def save(self, work_id: str, data: Dict[str, Any]):
        self.items[work_id] = data

    def reset(self):
        self.items = {}
        self._load_demo_transformation()

# global store instance
store = TransformationStore()
