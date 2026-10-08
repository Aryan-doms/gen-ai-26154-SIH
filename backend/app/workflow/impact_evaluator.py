# Stage 7: Dynamic Impact Evaluator
# Uses Gemini structured output to analyze semantic & citation dependencies across deliverables
# when a canonical claim is updated.

import re
from typing import Dict, Any, List, Optional
from app.models.impact import DynamicImpactEvaluation, AffectedOutputItem
from app.models.canonical import CanonicalSource
from app.services.gemini_client import gemini_service

CLAIM_TOPIC_MAP = {
    "CLM-001": "Operational disruption duration & window",
    "CLM-002": "Privileged account credential replay",
    "CLM-003": "Perimeter ingress IP & attacker hosting origin",
    "CLM-004": "Lateral movement & backend compute starvation",
    "CLM-005": "Containment timestamp & nominal restoration",
    "CLM-006": "Threat actor attribution assessment",
    "CLM-007": "Database audit & classified integrity status"
}

def evaluate_claim_impact(
    canonical: Optional[CanonicalSource],
    claim_id: str,
    old_claim_text: str,
    new_claim_text: str,
    outputs: List[Dict[str, Any]],
    new_value: Optional[str] = None
) -> DynamicImpactEvaluation:
    """
    Evaluates which deliverables depend on the updated canonical claim.
    Returns structured impact analysis distinguishing affected vs unaffected outputs.
    """
    # 1. Try Gemini structured impact evaluation if client is active
    if gemini_service.is_available:
        outputs_preview = []
        for out in outputs:
            out_type = out.get("type", "unknown")
            out_title = out.get("title", out_type)
            deps = out.get("claim_dependencies", [])
            content_preview = (out.get("content", "") or "")[:250].replace("\n", " ")
            outputs_preview.append(
                f"- ID: {out_type} | Title: '{out_title}' | Cited Claims: {deps}\n  Excerpt: {content_preview}..."
            )

        prompt = (
            f"You are the Impact Analysis Evaluator in an institutional cybersecurity incident management platform.\n\n"
            f"A canonical claim statement has been updated by an analyst:\n"
            f"- Claim ID: {claim_id}\n"
            f"- Topic: {CLAIM_TOPIC_MAP.get(claim_id, 'Forensic Claim')}\n"
            f"- Previous Statement: \"{old_claim_text}\"\n"
            f"- New Statement: \"{new_claim_text}\"\n\n"
            f"DELIVERABLES UNDER EVALUATION ({len(outputs)} total):\n"
            f"{chr(10).join(outputs_preview)}\n\n"
            f"EVALUATION DIRECTIVES:\n"
            f"1. Classify the change type ('value_update', 'timeline_update', 'attribution_update', 'scope_update').\n"
            f"2. Identify deliverables that depend on {claim_id} either via direct citation or semantic reliance.\n"
            f"3. For each AFFECTED deliverable:\n"
            f"   - output_id: deliverable identifier (e.g., 'executive_summary')\n"
            f"   - reason: concise institutional justification explaining why this deliverable is affected\n"
            f"   - old_fragment: exact previous metric or phrase in the text reflecting the old claim\n"
            f"   - new_fragment: updated metric or phrase to be used for the v2 draft\n"
            f"4. For each UNAFFECTED deliverable:\n"
            f"   - list output_id in 'unaffected_outputs'.\n"
            f"Do NOT rewrite the whole deliverables. Only return the structured impact evaluation."
        )

        try:
            gemini_result = gemini_service.generate_structured(
                prompt=prompt,
                response_schema=DynamicImpactEvaluation,
                system_instruction="You are a precise cybersecurity compliance and dependency auditing engine. Evaluate dependencies deterministically."
            )
            if gemini_result and (gemini_result.affected_outputs or gemini_result.unaffected_outputs):
                return gemini_result
        except Exception as e:
            print(f"Gemini impact evaluation failed, falling back to deterministic graph: {e}")

    # 2. Deterministic dependency graph fallback
    change_type = "value_update"
    if "minute" in new_claim_text.lower() or "utc" in new_claim_text.lower():
        change_type = "timeline_update"
    elif "actor" in new_claim_text.lower() or "apt" in new_claim_text.lower():
        change_type = "attribution_update"
    elif "ip" in new_claim_text.lower() or re.search(r"\d+\.\d+\.\d+\.\d+", new_claim_text):
        change_type = "scope_update"

    # Extract atomic fragments for UI diff
    old_fragment = "47 minutes"
    new_fragment = new_value or "52 minutes"
    
    # Check if number change
    m_old_num = re.search(r"(\d+)\s*minutes?", old_claim_text, re.IGNORECASE)
    m_new_num = re.search(r"(\d+)\s*minutes?", new_claim_text, re.IGNORECASE)
    if m_old_num and m_new_num:
        old_fragment = f"{m_old_num.group(1)} minutes"
        new_fragment = f"{m_new_num.group(1)} minutes"
    else:
        # Check if IP address change
        m_old_ip = re.search(r"(\d+\.\d+\.\d+\.\d+)", old_claim_text)
        m_new_ip = re.search(r"(\d+\.\d+\.\d+\.\d+)", new_claim_text)
        if m_old_ip and m_new_ip:
            old_fragment = m_old_ip.group(1)
            new_fragment = m_new_ip.group(1)

    affected_outputs: List[AffectedOutputItem] = []
    unaffected_outputs: List[str] = []

    for out in outputs:
        out_id = out.get("type", "")
        deps = out.get("claim_dependencies", [])
        content = out.get("content", "")

        is_dependent = (claim_id in deps) or (claim_id in content) or (old_fragment.lower() in content.lower())

        if is_dependent:
            topic = CLAIM_TOPIC_MAP.get(claim_id, "Incident facts")
            title = out.get("title", out_id)
            reason = f"{title} cites {claim_id} regarding {topic}; requires selective update to '{new_fragment}'"
            affected_outputs.append(AffectedOutputItem(
                output_id=out_id,
                reason=reason,
                old_fragment=old_fragment,
                new_fragment=new_fragment
            ))
        else:
            unaffected_outputs.append(out_id)

    summary_of_change = f"Updated {claim_id} from '{old_claim_text[:40]}...' to '{new_claim_text[:40]}...'"
    if new_value:
        summary_of_change += f" (Value: {new_value})"

    return DynamicImpactEvaluation(
        claim_id=claim_id,
        change_type=change_type,
        summary_of_change=summary_of_change,
        affected_outputs=affected_outputs,
        unaffected_outputs=unaffected_outputs
    )
