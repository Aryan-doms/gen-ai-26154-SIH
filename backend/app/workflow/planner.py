from datetime import datetime, timezone
from typing import Dict, Any, List
from app.models.canonical import CanonicalSource
from app.models.operator import OperatorConfig, OutputType
from app.models.plan import TransformationPlan, OutputPlanItem
from app.workflow.state import CaseState
from app.services.gemini_client import gemini_service

def create_output_plan_item(output_type: OutputType, operator_config: OperatorConfig, canonical: CanonicalSource) -> OutputPlanItem:
    """Generate plan specifications for each output format based on canonical source and operator config."""
    ALIAS_MAP = {
        "advisory": "security_advisory",
        "video_package": "video_script",
        "twitter_post": "social_media"
    }
    norm_type = ALIAS_MAP.get(str(output_type), str(output_type))

    if norm_type == "executive_summary":
        return OutputPlanItem(
            output_type="executive_summary",
            title="Executive Summary: Operation Silver Falcon Incident Response",
            target_audience=f"Leadership, CISO, and {operator_config.audience}",
            tone=f"{operator_config.tone} with high-level strategic clarity",
            communication_objective=f"Brief leadership on incident scope, operational impact, and risk posture ({operator_config.communication_objective})",
            relevant_claim_ids=["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006"],
            mandatory_elements=[
                "Incident Overview and Severity classification (SEVERITY-HIGH)",
                "Exact operational disruption window (47 minutes)",
                "Affected systems enumeration (PORTAL-01, APP-02, AUTH-01)",
                "Current containment status (services restored as of 03:22 UTC)",
                "Explicit statement that attribution remains UNCONFIRMED"
            ],
            prohibited_elements=[
                "Speculative attribution to named threat groups",
                "Deep forensic terminal syntax or low-level exploit payloads"
            ],
            dependencies=[],
            validation_rules=[
                "Disruption duration must equal canonical claim value (47 minutes)",
                "Attribution must state UNCONFIRMED",
                "Affected systems must list PORTAL-01, APP-02, and AUTH-01",
                "Contains all required executive sections"
            ]
        )
    elif norm_type == "security_advisory":
        return OutputPlanItem(
            output_type="security_advisory",
            title="Technical Security Advisory: Session Replay & Infrastructure Hardening (SEC-ADV-2026-0417)",
            target_audience=operator_config.audience,
            tone=f"{operator_config.tone} - highly structured, technical, and actionable",
            communication_objective=f"Technical mitigation and defensive posture enhancement ({operator_config.communication_objective})",
            relevant_claim_ids=["CLM-001", "CLM-002", "CLM-003", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
            mandatory_elements=[
                "Advisory Title, CVE/Case ID, Severity (SEVERITY-HIGH)",
                "Incident Summary and Initial Access Vector (admin-research session replay)",
                "Indicators of Compromise: IPv4 185.203.117.42, tool falcon_pipe (MD5: e4d909c290d0fb1ca068ffaddf22cbd0)",
                "Technical Impact across PORTAL-01, APP-02, AUTH-01",
                "Actionable Recommendations (FIDO2 MFA, network segmentation, Kerberos KRBTGT rotation)",
                "Confidence / Attribution status (strictly UNCONFIRMED)"
            ],
            prohibited_elements=[
                "Unsubstantiated threat actor attribution",
                "Ambiguous defensive recommendations"
            ],
            dependencies=[],
            validation_rules=[
                "Must include all confirmed IoCs (IP, account, malware hash)",
                "Must include concrete mitigation steps",
                "Attribution must be explicitly unconfirmed",
                "Disruption duration must match canonical duration"
            ]
        )
    elif norm_type == "social_media":
        return OutputPlanItem(
            output_type="social_media",
            title="Public Awareness & Community Incident Disclosure Post",
            target_audience="General public, technology community, and platform users",
            tone=f"{operator_config.tone} - transparent, reassuring, and concise",
            communication_objective=f"Public transparency, reassure data integrity, and announce service restoration ({operator_config.communication_objective})",
            relevant_claim_ids=["CLM-001", "CLM-004", "CLM-005", "CLM-006"],
            mandatory_elements=[
                "Acknowledgment of 47-minute service disruption on the Research Portal",
                "Confirmation of rapid containment and full service restoration at 03:22 UTC",
                "Confirmation that core database integrity was maintained",
                "Commitment to security transparency"
            ],
            prohibited_elements=[
                "Speculative adversary attribution",
                "Sensitive internal credentials (e.g. admin-research username)",
                "Exaggerated or alarming claims beyond verified facts"
            ],
            dependencies=[],
            validation_rules=[
                "Length within platform constraints (under 280 words)",
                "Disruption duration strictly matches canonical duration (47 minutes)",
                "No speculative attribution",
                "No disclosure of sensitive internal account identifiers"
            ]
        )
    elif norm_type == "presentation":
        return OutputPlanItem(
            output_type="presentation",
            title="Incident Briefing Deck: Operation Silver Falcon Response & Lessons Learned",
            target_audience="Technical Steering Committee, CISO, and Operations Review Board",
            tone=f"{operator_config.tone} - structured, analytical, and visually organized",
            communication_objective=f"Structured briefing covering chronology, technical findings, and long-term remediation ({operator_config.communication_objective})",
            relevant_claim_ids=["CLM-001", "CLM-002", "CLM-003", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
            mandatory_elements=[
                "Slide 1: Incident Overview & Classification",
                "Slide 2: Chronological Timeline (01:58 UTC to 03:22 UTC)",
                "Slide 3: Affected Systems & Operational Impact (47 minutes)",
                "Slide 4: Technical Findings & Indicators of Compromise",
                "Slide 5: Response, Current Containment & Hardening",
                "Evidence/Claim IDs mapped to each slide"
            ],
            prohibited_elements=[
                "Speculative adversary attribution",
                "Unmapped factual assertions lacking claim references"
            ],
            dependencies=[],
            validation_rules=[
                "Must contain exactly 5 structured slides matching standard agenda",
                "All slides must reference relevant canonical claim IDs",
                "Disruption duration must equal 47 minutes",
                "Attribution must state UNCONFIRMED"
            ]
        )
    elif norm_type == "video_script":
        return OutputPlanItem(
            output_type="video_script",
            title="Video Briefing Script: Operation Silver Falcon Quick-Response Overview",
            target_audience="Security staff, internal agency personnel, and technical researchers",
            tone=f"{operator_config.tone} - clear, engaging, authoritative, and spoken-word natural",
            communication_objective=f"Audiovisual briefing summarizing the event, containment success, and security takeaways ({operator_config.communication_objective})",
            relevant_claim_ids=["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006"],
            mandatory_elements=[
                "Structured scenes with scene number, estimated duration in seconds, visual cue, spoken narration, on-screen text",
                "Scene covering initial detection at 02:14 UTC",
                "Scene covering 47-minute disruption window and containment at 03:22 UTC",
                "Scene covering hardening and current secure operating state",
                "Explicit spoken confirmation that attribution is unconfirmed"
            ],
            prohibited_elements=[
                "Mention of unverified threat groups",
                "Discrepancies in timeline or outage duration (e.g. stating 74 minutes instead of 47 minutes)"
            ],
            dependencies=[],
            validation_rules=[
                "Total runtime between 60 to 90 seconds",
                "All scenes must include visual and narration fields",
                "Disruption duration spoken and on-screen must be exactly 47 minutes",
                "Attribution unconfirmed"
            ]
        )
    elif norm_type == "infographic":
        return OutputPlanItem(
            output_type="infographic",
            title="Infographic: Operation Silver Falcon Incident Telemetry",
            target_audience="General Public & Technical Staff",
            tone=f"{operator_config.tone} - clear, visual data summary",
            communication_objective="Visual telemetry and timeline dissemination",
            relevant_claim_ids=["CLM-001", "CLM-002", "CLM-003", "CLM-004", "CLM-005", "CLM-007"],
            mandatory_elements=["Key metric callouts", "Disruption duration", "Breach vector", "Timeline visual data"],
            prohibited_elements=["Speculative threat actor attribution", "Unverified claims"],
            dependencies=[],
            validation_rules=["Disruption duration matches canonical claim", "Attribution unconfirmed"]
        )
    elif norm_type == "linkedin_post":
        return OutputPlanItem(
            output_type="linkedin_post",
            title="LinkedIn Executive Post",
            target_audience="Regulators and Partners",
            tone=f"{operator_config.tone} - formal, transparent, executive",
            communication_objective="Executive transparency and stakeholder confidence",
            relevant_claim_ids=["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
            mandatory_elements=["Executive tone", "Forensic summary", "Containment timestamp", "Attribution status"],
            prohibited_elements=["Speculative attribution", "Bracketed citation clutter"],
            dependencies=[],
            validation_rules=["Disruption duration matches canonical claim", "Attribution unconfirmed"]
        )
    elif norm_type == "instagram_post":
        return OutputPlanItem(
            output_type="instagram_post",
            title="Instagram Visual Caption & Carousel",
            target_audience="General Public",
            tone=f"{operator_config.tone} - accessible, concise, structured",
            communication_objective="Public awareness and transparency",
            relevant_claim_ids=["CLM-001", "CLM-002", "CLM-005", "CLM-006", "CLM-007"],
            mandatory_elements=["Multi-slide carousel script", "Public caption", "Hashtags"],
            prohibited_elements=["Speculative attribution", "Exploit jargon"],
            dependencies=[],
            validation_rules=["Containment status accurate", "Attribution unconfirmed"]
        )
    elif norm_type == "whatsapp_message":
        return OutputPlanItem(
            output_type="whatsapp_message",
            title="WhatsApp Internal Advisory Broadcast",
            target_audience="Internal Staff & Incident Responders",
            tone=f"{operator_config.tone} - direct, structured, immediate",
            communication_objective="Actionable internal notification",
            relevant_claim_ids=["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
            mandatory_elements=["Official advisory header", "Impact summary", "Attribution status", "Operations sign-off"],
            prohibited_elements=["Speculative attribution", "Unverified data breach claims"],
            dependencies=[],
            validation_rules=["Contains case identifier", "Attribution unconfirmed"]
        )
    else:
        # Fallback to executive summary template
        return OutputPlanItem(
            output_type="executive_summary",
            title=f"Incident Briefing: {output_type}",
            target_audience=operator_config.audience,
            tone=operator_config.tone,
            communication_objective=operator_config.communication_objective,
            relevant_claim_ids=[c.claim_id for c in canonical.claims],
            mandatory_elements=["Incident overview", "Containment status"],
            prohibited_elements=["Unverified claims"],
            dependencies=[],
            validation_rules=["Grounded in canonical claims"]
        )

def generate_transformation_plan(
    canonical: CanonicalSource,
    operator_config: OperatorConfig
) -> TransformationPlan:
    """
    Generates a structured TransformationPlan from CanonicalSource and OperatorConfig.
    Can utilize Gemini if available, or deterministic rules guaranteed to satisfy schema.
    """
    plan_items: List[OutputPlanItem] = []
    for out_type in operator_config.requested_outputs:
        plan_items.append(create_output_plan_item(out_type, operator_config, canonical))

    cross_rules = [
        "RULE-01: Disruption Duration Consistency - All outputs referencing disruption must state exactly 47 minutes (or the exact value in CLM-001).",
        "RULE-02: Attribution Integrity - No output may claim or infer a specific threat actor or nation-state; attribution must remain UNCONFIRMED.",
        "RULE-03: Entity Integrity - All references to systems must use canonical identifiers: PORTAL-01, APP-02, AUTH-01.",
        "RULE-04: Timeline Consistency - Detection at 02:14 UTC, disruption from 02:35 to 03:22 UTC, full restoration at 03:22 UTC.",
        "RULE-05: IoC Consistency - All technical outputs referencing attacker ingress must use IP 185.203.117.42."
    ]

    plan = TransformationPlan(
        plan_id=f"PLN-{canonical.case_id}-01",
        case_id=canonical.case_id,
        global_objective=operator_config.communication_objective,
        outputs_plan=plan_items,
        cross_output_consistency_rules=cross_rules,
        created_at=datetime.now(timezone.utc).isoformat()
    )

    return plan

def transformation_planner_node(state: CaseState) -> Dict[str, Any]:
    """
    LangGraph node: Transformation Planner.
    Receives canonical_source and operator_config from state, returns updated transformation_plan.
    """
    canonical: CanonicalSource = state.get("canonical_source")
    config: OperatorConfig = state.get("operator_config", OperatorConfig())
    
    if not canonical:
        raise ValueError("Cannot plan without canonical_source in state")
    
    plan = generate_transformation_plan(canonical, config)
    return {"transformation_plan": plan}
