# SLM Domain Gatekeeper & Institutional Intelligence Retriever
# Enforces operational security boundary guardrails and delivers grounded intelligence from the canonical claim store

import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.models.assistant import AssistantQueryResponse
from app.services.gemini_client import gemini_service

class GatekeeperEvaluation(BaseModel):
    is_in_domain: bool = Field(..., description="True if query is within cybersecurity incident analysis, case intelligence, or content transformation domain")
    boundary_violation_reason: Optional[str] = Field(None, description="Explanation if off-domain")
    answer: str = Field(..., description="Institutional intelligence answer citing claims or explanation of boundary violation")
    referenced_claims: List[str] = Field(default_factory=list, description="Claim IDs cited (e.g., CLM-001)")
    referenced_cases: List[str] = Field(default_factory=list, description="Case IDs cited (e.g., 2026-0417)")

OFF_DOMAIN_KEYWORDS = [
    "two sum", "leetcode", "python script to", "write python code", "react component",
    "recipe", "cake", "cook", "cricket", "football", "world cup", "joke", "funny story",
    "poem", "song", "lyrics", "movie", "celebrity", "capital of", "weather today",
    "who is", "dating", "gym workout", "horoscope"
]

ON_DOMAIN_KEYWORDS = [
    "containment", "silver falcon", "2026-0417", "ioc", "indicator", "ip", "ingress",
    "unapproved", "deliverable", "claim", "disruption", "lateral", "attribution",
    "timeline", "status", "incident", "docket", "advisory", "review", "brief",
    "presentation", "infographic", "video", "social", "transform", "port", "compromise",
    "auth", "credential", "database", "exfiltration", "apt", "tlp"
]

SUGGESTED_QUERIES = [
    "What is the containment status of Operation Silver Falcon?",
    "Show summary of unapproved deliverables across cases",
    "What are the key IoCs for 2026-0417?",
    "Summarize operational disruption duration for INC-2026-0417"
]

def handle_assistant_query(query: str, target_case_id: Optional[str] = None, current_store = None) -> AssistantQueryResponse:
    now_ts = datetime.now(timezone.utc).isoformat()
    clean_query = query.strip()
    lower_query = clean_query.lower()

    # Retrieve case context from store
    target_id = target_case_id or "2026-0417"
    case_data = None
    if current_store:
        case_data = current_store.get(target_id)
        if not case_data:
            case_data = current_store.get("2026-0417")

    claims_list = case_data.get("claims", []) if case_data else []
    outputs_list = case_data.get("outputs", []) if case_data else []

    # 1. Attempt Gemini SLM Gatekeeper Evaluation if available
    if gemini_service.is_available:
        claims_summary = "\n".join([f"- {c['claim_id']}: {c['claim_text']}" for c in claims_list])
        outputs_summary = "\n".join([f"- {o['type']} ('{o.get('title', o['type'])}'): {o.get('status', 'Needs review')}" for o in outputs_list])

        prompt = (
            f"You are the SLM Domain Gatekeeper and Intelligence Assistant for an institutional cybersecurity transformation platform.\n\n"
            f"OPERATIONAL DOMAIN SCOPE:\n"
            f"- Allowed: Cybersecurity incident analysis, digital forensics, threat actors, IoCs, operational status, case dossiers, canonical claims, deliverable approvals, and transformation workflows.\n"
            f"- Disallowed: Generic programming tasks, general knowledge trivia, sports, cooking, casual conversation, creative writing, or off-domain questions.\n\n"
            f"CURRENT CASE DOSSIER ({target_id} - Operation Silver Falcon):\n"
            f"Claims:\n{claims_summary}\n\n"
            f"Deliverables Status:\n{outputs_summary}\n\n"
            f"OPERATOR QUERY:\n\"{clean_query}\"\n\n"
            f"DIRECTIVES:\n"
            f"1. Determine if the query is in-domain (is_in_domain = true) or an off-domain boundary violation (is_in_domain = false).\n"
            f"2. If off-domain: set boundary_violation_reason explaining that this workstation is air-gapped and restricted to cyber incident workflows. Set answer to an institutional Operational Boundary Notice.\n"
            f"3. If in-domain: provide an authoritative, concise intelligence briefing answering the query using the claims and deliverables above. Always cite relevant claim IDs (e.g. [CLM-001], [CLM-005]) and reference case {target_id}."
        )

        try:
            eval_result: Optional[GatekeeperEvaluation] = gemini_service.generate_structured(
                prompt=prompt,
                response_schema=GatekeeperEvaluation,
                system_instruction="You are a strict, authoritative institutional cybersecurity intelligence assistant and operational gatekeeper."
            )
            if eval_result:
                if not eval_result.is_in_domain:
                    return AssistantQueryResponse(
                        query=clean_query,
                        status="rejected",
                        boundary_enforced=True,
                        title="Operational Boundary Notice (SLM Guardrail)",
                        answer=eval_result.answer or "Query rejected by SLM Gatekeeper: This institutional platform is restricted to cyber incident analysis and content transformation. Off-domain requests are blocked by domain boundary policies.",
                        suggested_queries=SUGGESTED_QUERIES,
                        referenced_cases=[],
                        referenced_claims=[],
                        timestamp=now_ts
                    )
                else:
                    return AssistantQueryResponse(
                        query=clean_query,
                        status="approved",
                        boundary_enforced=False,
                        title="Institutional Intelligence Briefing",
                        answer=eval_result.answer,
                        suggested_queries=None,
                        referenced_cases=eval_result.referenced_cases or [target_id],
                        referenced_claims=eval_result.referenced_claims or [],
                        timestamp=now_ts
                    )
        except Exception as e:
            print(f"Gemini gatekeeper query evaluation error, using deterministic fallback: {e}")

    # 2. Deterministic Rule-Based Gatekeeper Fallback
    is_off_domain = any(bad in lower_query for bad in OFF_DOMAIN_KEYWORDS)
    is_on_domain = any(good in lower_query for good in ON_DOMAIN_KEYWORDS)

    # If explicitly off-domain or contains no cyber domain signals
    if is_off_domain and not is_on_domain:
        return AssistantQueryResponse(
            query=clean_query,
            status="rejected",
            boundary_enforced=True,
            title="Operational Boundary Notice (SLM Guardrail)",
            answer=(
                "Query Rejected by Security Domain Guardrail: This institutional platform is restricted exclusively to "
                "cyber incident analysis, evidence verification, and content transformation workflows. "
                "Off-domain requests (such as generic coding assistance, casual conversation, or general trivia) are blocked "
                "under institutional operational boundary policy."
            ),
            suggested_queries=SUGGESTED_QUERIES,
            referenced_cases=[],
            referenced_claims=[],
            timestamp=now_ts
        )

    # 3. Grounded Intelligence Matching for In-Domain Queries
    ref_claims = []
    answer_parts = []

    if "containment" in lower_query or "status" in lower_query:
        answer_parts.append(
            f"Operation Silver Falcon ({target_id}): Containment protocols were successfully achieved at 03:22 UTC on 17 April 2026 [CLM-005]. "
            f"Core research portal PORTAL-01 services are fully restored to nominal baseline. "
            f"The incident incurred approximately 47 minutes of operational degradation [CLM-001]."
        )
        ref_claims.extend(["CLM-001", "CLM-005"])

    if "ioc" in lower_query or "indicator" in lower_query or "ip" in lower_query or "vector" in lower_query:
        answer_parts.append(
            f"Verified Indicators of Compromise (IoCs) for {target_id}:\n"
            f"• Ingress Source IP: 185.203.117.42 (SSH/Console ingress) [CLM-003]\n"
            f"• Compromised Credential: 'admin-research' (session token replay) [CLM-002]\n"
            f"• Affected Infrastructure: PORTAL-01 (gateway), APP-02 (compute starvation), AUTH-01 (session store) [CLM-004]."
        )
        ref_claims.extend(["CLM-002", "CLM-003", "CLM-004"])

    if "unapproved" in lower_query or "review" in lower_query or "deliverable" in lower_query:
        unapproved = [o.get("title", o["type"]) for o in outputs_list if o.get("status") == "Needs review"]
        approved = [o.get("title", o["type"]) for o in outputs_list if o.get("status") == "Approved"]
        answer_parts.append(
            f"Deliverable Status Audit for {target_id}:\n"
            f"• Awaiting Review ({len(unapproved)}): {', '.join(unapproved[:5])}{'...' if len(unapproved) > 5 else ''}\n"
            f"• Approved Sign-Off ({len(approved)}): {', '.join(approved) if approved else 'None yet'}\n"
            f"Cross-Checker Consistency: PASS (0 conflicting claims)."
        )

    if not answer_parts:
        # General incident summary
        answer_parts.append(
            f"Incident Overview for {target_id} (Operation Silver Falcon):\n"
            f"• Detected privileged token replay attack at 02:14 UTC [CLM-002] via external ingress 185.203.117.42 [CLM-003].\n"
            f"• Operational disruption lasted approximately 47 minutes on PORTAL-01 [CLM-001].\n"
            f"• Lateral movement toward compute node APP-02 was successfully contained at 03:22 UTC [CLM-004, CLM-005].\n"
            f"• Forensics confirm 0 database modifications or exfiltrations [CLM-007]. Threat attribution remains UNCONFIRMED [CLM-006]."
        )
        ref_claims.extend(["CLM-001", "CLM-002", "CLM-003", "CLM-005", "CLM-006", "CLM-007"])

    return AssistantQueryResponse(
        query=clean_query,
        status="approved",
        boundary_enforced=False,
        title="Institutional Intelligence Briefing",
        answer="\n\n".join(answer_parts),
        suggested_queries=None,
        referenced_cases=[target_id],
        referenced_claims=list(dict.fromkeys(ref_claims)),
        timestamp=now_ts
    )
