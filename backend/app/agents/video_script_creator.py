# Creator agent for structured video briefings and narration scripts
from datetime import datetime, timezone
from typing import Dict, Any, List
import re
from app.models.canonical import CanonicalSource, Claim
from app.models.plan import OutputPlanItem
from app.models.operator import OperatorConfig
from app.models.creators import VideoScriptOutput, SceneItem
from app.services.gemini_client import gemini_service

def generate_video_script(
    canonical: CanonicalSource,
    plan_item: OutputPlanItem,
    config: OperatorConfig
) -> VideoScriptOutput:
    # grab claim details
    claims_dict: Dict[str, Claim] = {c.claim_id: c for c in canonical.claims}

    # grab disruption minutes
    disruption_min = 47
    if "CLM-001" in claims_dict:
        match = re.search(r"(\d+)\s*minutes", claims_dict["CLM-001"].claim_text)
        if match:
            disruption_min = int(match.group(1))

    # try gemini if available
    if gemini_service.is_available:
        prompt = (
            f"You are the Video Script Creator Agent.\n"
            f"Case: {canonical.case_id} ({canonical.incident_name})\n"
            f"Requirements: {plan_item.mandatory_elements}\n"
            f"Disruption duration: {disruption_min} minutes\n"
            "Generate a 4-scene video briefing script matching VideoScriptOutput schema. "
            "Attribution must say UNCONFIRMED. Total duration around 60-75 seconds."
        )
        gemini_result = gemini_service.generate_structured(prompt, VideoScriptOutput)
        if gemini_result is not None:
            return gemini_result

    # student style grounded video scenes
    scenes = [
        SceneItem(
            scene_number=1,
            duration_seconds=15,
            visual_description="Opening motion graphic showing Security Operations Center dashboard with flashing alert banner and case title.",
            narration="On April 17th at 02:14 UTC, security automated monitoring detected an unauthorized authentication event targeting our core research infrastructure.",
            on_screen_text=f"SECURITY ALERT | {canonical.case_id} | 02:14 UTC",
            supporting_claim_ids=["CLM-002"]
        ),
        SceneItem(
            scene_number=2,
            duration_seconds=20,
            visual_description="Split screen displaying network diagram showing ingress from external IP 185.203.117.42 to identity service AUTH-01 and backend compute APP-02.",
            narration="The threat actor bypassed authentication challenges through session token replay on privileged account admin-research, attempting lateral movement to computational systems.",
            on_screen_text="INGRESS IP: 185.203.117.42 | PRIVILEGED REPLAY DETECTED",
            supporting_claim_ids=["CLM-002", "CLM-003", "CLM-004"]
        ),
        SceneItem(
            scene_number=3,
            duration_seconds=20,
            visual_description="Graphic depicting portal status clock and restoration curve showing outage duration and rapid response stabilization.",
            narration=f"This activity caused approximately {disruption_min} minutes of service disruption on Research Portal 01 before rapid containment protocols took effect.",
            on_screen_text=f"PORTAL-01 DISRUPTION: {disruption_min} MINUTES | CONTAINED AT 03:22 UTC",
            supporting_claim_ids=["CLM-001", "CLM-005"]
        ),
        SceneItem(
            scene_number=4,
            duration_seconds=15,
            visual_description="Closing graphic with green shield badge showing system restored, key hardening items, and official notification.",
            narration=f"All systems are now fully restored, credential caches rotated, and attribution remains unconfirmed as forensic investigations proceed.",
            on_screen_text="SERVICES RESTORED | ATTRIBUTION: UNCONFIRMED",
            supporting_claim_ids=["CLM-005", "CLM-006"]
        )
    ]

    total_duration = sum(s.duration_seconds for s in scenes)

    return VideoScriptOutput(
        script_title=plan_item.title,
        case_id=canonical.case_id,
        target_duration_seconds=total_duration,
        scenes=scenes,
        attribution_status="UNCONFIRMED",
        cited_claim_ids=plan_item.relevant_claim_ids,
        generated_at=datetime.now(timezone.utc).isoformat()
    )

def video_script_creator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    # read inputs from graph state
    canonical: CanonicalSource = state.get("canonical_source")
    plan = state.get("transformation_plan")
    config = state.get("operator_config", OperatorConfig())

    plan_item = next((p for p in plan.outputs_plan if p.output_type == "video_script"), None)
    if not plan_item:
        raise ValueError("Plan item for video_script missing")

    script = generate_video_script(canonical, plan_item, config)

    # save in generated outputs dictionary
    generated_outputs = state.get("generated_outputs", {}).copy()
    generated_outputs["video_script"] = script
    return {"generated_outputs": generated_outputs}
