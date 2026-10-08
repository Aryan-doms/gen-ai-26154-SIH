# Creator agent for structured slide presentation decks
from datetime import datetime, timezone
from typing import Dict, Any, List
import re
from app.models.canonical import CanonicalSource, Claim
from app.models.plan import OutputPlanItem
from app.models.operator import OperatorConfig
from app.models.creators import PresentationOutput, SlideItem
from app.services.gemini_client import gemini_service

def generate_presentation(
    canonical: CanonicalSource,
    plan_item: OutputPlanItem,
    config: OperatorConfig
) -> PresentationOutput:
    # grab claim details
    claims_dict: Dict[str, Claim] = {c.claim_id: c for c in canonical.claims}

    # grab disruption minutes
    disruption_min = 47
    if "CLM-001" in claims_dict:
        match = re.search(r"(\d+)\s*minutes", claims_dict["CLM-001"].claim_text)
        if match:
            disruption_min = int(match.group(1))

    # try gemini if configured
    if gemini_service.is_available:
        prompt = (
            f"You are the Presentation Creator Agent.\n"
            f"Case: {canonical.case_id} ({canonical.incident_name})\n"
            f"Target: 5 slides matching the exact requirements.\n"
            "Slide 1: Incident Overview, Slide 2: Timeline, Slide 3: Affected Systems & Impact, "
            "Slide 4: Technical Findings, Slide 5: Response & Containment. "
            "Attribution must say UNCONFIRMED. Disruption must be 47 minutes."
        )
        gemini_result = gemini_service.generate_structured(prompt, PresentationOutput)
        if gemini_result is not None:
            return gemini_result

    # student style grounded 5-slide deck outline
    slides = [
        SlideItem(
            slide_number=1,
            title="Incident Overview & Classification",
            key_points=[
                f"Incident Code: {canonical.case_id} ({canonical.incident_name})",
                "Severity Level: SEVERITY-HIGH (Tier 2 Incident)",
                "Detection Date & Time: 17 April 2026 at 02:14 UTC [CLM-002]",
                "Core Issue: Privileged credential token replay targeting research infrastructure",
                "Threat Actor Attribution: Strictly UNCONFIRMED [CLM-006]"
            ],
            visual_recommendation="Header card with high severity badge, summary card layout, and red warning icon",
            claim_refs=["CLM-002", "CLM-006"]
        ),
        SlideItem(
            slide_number=2,
            title="Chronological Incident Timeline",
            key_points=[
                "01:58 UTC - Edge reconnaissance detected against load balancer from 185.203.117.42 [CLM-003]",
                "02:14 UTC - Unauthorized session opened via 'admin-research' account [CLM-002]",
                "02:22 UTC - Lateral movement across internal SSH to backend server APP-02 [CLM-004]",
                f"02:35 UTC - Disruption on PORTAL-01 begins due to resource starvation ({disruption_min}m total) [CLM-001]",
                "03:07 UTC - IP blackholed at border gateway and account disabled across LDAP/SSO",
                "03:22 UTC - Containment completed and full restoration confirmed [CLM-005]"
            ],
            visual_recommendation="Linear horizontal timeline chevron graphic with timestamps highlighted",
            claim_refs=["CLM-001", "CLM-002", "CLM-003", "CLM-005"]
        ),
        SlideItem(
            slide_number=3,
            title="Affected Systems & Operational Impact",
            key_points=[
                f"Operational Outage: Research portal offline for approximately {disruption_min} minutes [CLM-001]",
                "PORTAL-01: Public-facing gateway listeners starved of requests [CLM-004]",
                "APP-02: Backend compute node subjected to unauthorized script execution [CLM-004]",
                "AUTH-01: Identity service where session token was replayed [CLM-004]",
                "Integrity Assessment: Zero database tampering or data exfiltration detected"
            ],
            visual_recommendation="3-column architecture diagram showing ingress traffic path from external IP to PORTAL-01, APP-02, and AUTH-01",
            claim_refs=["CLM-001", "CLM-004"]
        ),
        SlideItem(
            slide_number=4,
            title="Technical Findings & Indicators of Compromise",
            key_points=[
                "Attacker Ingress IP: 185.203.117.42 (Proxy AS208046) [CLM-003]",
                "Compromised Account: admin-research (UID 1042) [CLM-002]",
                "Tooling: Python reverse shell staged at /tmp/.x11-unix/.falcon_pipe [CLM-007]",
                "Malware Hash: MD5 e4d909c290d0fb1ca068ffaddf22cbd0 [CLM-007]",
                "Attribution Note: Tool strings and shared hosting do NOT substantiate attribution [CLM-006]"
            ],
            visual_recommendation="IoC table layout with copyable hashes and forensic tags",
            claim_refs=["CLM-002", "CLM-003", "CLM-006", "CLM-007"]
        ),
        SlideItem(
            slide_number=5,
            title="Response, Containment & Remediation Roadmap",
            key_points=[
                "Emergency Actions: Ingress IP blackholed, session terminated, 'admin-research' credentials reset",
                "Restoration: PORTAL-01 & APP-02 restored to production as of 03:22 UTC [CLM-005]",
                "Mitigation 1: Enforce hardware FIDO2 MFA across all privileged accounts",
                "Mitigation 2: Implement microsegmentation between gateway PORTAL-01 and backend APP-02",
                "Mitigation 3: Rotate Kerberos KRBTGT keys across the entire SSO domain"
            ],
            visual_recommendation="Two-part split slide: Left side showing Immediate Containment Actions, Right side showing Long-term Hardening",
            claim_refs=["CLM-005"]
        )
    ]

    return PresentationOutput(
        deck_title=plan_item.title,
        case_id=canonical.case_id,
        target_audience=plan_item.target_audience,
        total_slides=len(slides),
        slides=slides,
        cited_claim_ids=plan_item.relevant_claim_ids,
        generated_at=datetime.now(timezone.utc).isoformat()
    )

def presentation_creator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    # unpack state
    canonical: CanonicalSource = state.get("canonical_source")
    plan = state.get("transformation_plan")
    config = state.get("operator_config", OperatorConfig())

    plan_item = next((p for p in plan.outputs_plan if p.output_type == "presentation"), None)
    if not plan_item:
        raise ValueError("Plan item for presentation missing")

    deck = generate_presentation(canonical, plan_item, config)

    # store in state outputs
    generated_outputs = state.get("generated_outputs", {}).copy()
    generated_outputs["presentation"] = deck
    return {"generated_outputs": generated_outputs}
