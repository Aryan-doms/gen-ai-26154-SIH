# Cross-Checker node: compares generated outputs against each other and canonical ground truth
from typing import Dict, Any, List
import re
from app.models.canonical import CanonicalSource
from app.models.validation import CrossCheckResult, ContradictionItem
from app.workflow.state import CaseState

def run_cross_check(
    canonical: CanonicalSource,
    generated_outputs: Dict[str, Any]
) -> CrossCheckResult:
    # list to hold any contradictions we find
    contradictions: List[ContradictionItem] = []
    affected_outputs: set = set()
    affected_claim_ids: set = set()
    total_checks = 0
    passed_checks = 0

    # 1. CHECK ATTRIBUTION CONSISTENCY
    # canonical truth: attribution must be UNCONFIRMED
    total_checks += 1
    attribution_failures = {}
    
    # suspicious attribution keywords that shouldn't appear if unconfirmed
    forbidden_actors = ["threat group x", "group x", "apt29", "apt28", "lazarus", "carbanak", "fancy bear", "cozy bear"]

    for name, out in generated_outputs.items():
        # extract text to inspect
        text_corpus = ""
        if hasattr(out, "model_dump"):
            dumped = out.model_dump()
            text_corpus = str(dumped).lower()
        elif isinstance(out, dict):
            text_corpus = str(out).lower()

        # check if someone invented an attacker
        for actor in forbidden_actors:
            if actor in text_corpus:
                attribution_failures[name] = f"Speculative attribution to '{actor}' found in text"
                affected_outputs.add(name)
                affected_claim_ids.add("CLM-006")
                break

        # also verify explicit attribution_status field if present
        attr_field = ""
        if hasattr(out, "attribution_status"):
            attr_field = getattr(out, "attribution_status")
        elif isinstance(out, dict) and "attribution_status" in out:
            attr_field = out.get("attribution_status", "")

        if attr_field and "UNCONFIRMED" not in attr_field.upper():
            attribution_failures[name] = f"attribution_status is '{attr_field}', expected 'UNCONFIRMED'"
            affected_outputs.add(name)
            affected_claim_ids.add("CLM-006")

    if attribution_failures:
        contradictions.append(ContradictionItem(
            check_type="ATTRIBUTION",
            description="Attribution contradiction: One or more outputs assert specific threat actors when canonical source is UNCONFIRMED.",
            conflicting_outputs=list(attribution_failures.keys()),
            canonical_truth="Attribution is strictly UNCONFIRMED (CLM-006, CST-001).",
            observed_values=attribution_failures,
            recommended_fix="Regenerate output strictly enforcing UNCONFIRMED attribution."
        ))
    else:
        passed_checks += 1

    # 2. CHECK DISRUPTION DURATION CONSISTENCY
    # canonical truth: 47 minutes (or whatever CLM-001 specifies)
    total_checks += 1
    canonical_minutes = 47
    for c in canonical.claims:
        if c.claim_id == "CLM-001":
            match = re.search(r"(\d+)\s*minutes", c.claim_text)
            if match:
                canonical_minutes = int(match.group(1))

    duration_failures = {}
    for name, out in generated_outputs.items():
        text_corpus = ""
        if hasattr(out, "model_dump"):
            text_corpus = str(out.model_dump())
        elif isinstance(out, dict):
            text_corpus = str(out)

        # find mentions like '74 minutes' or '52 minutes'
        matches = re.findall(r"(\d+)\s*minutes", text_corpus, re.IGNORECASE)
        for m in matches:
            val = int(m)
            if val != canonical_minutes:
                duration_failures[name] = f"Found '{val} minutes', expected '{canonical_minutes} minutes'"
                affected_outputs.add(name)
                affected_claim_ids.add("CLM-001")
                break

    if duration_failures:
        contradictions.append(ContradictionItem(
            check_type="DISRUPTION_DURATION",
            description=f"Conflicting disruption duration: One or more outputs state a duration other than canonical {canonical_minutes} minutes.",
            conflicting_outputs=list(duration_failures.keys()),
            canonical_truth=f"{canonical_minutes} minutes of disruption (CLM-001, CST-002).",
            observed_values=duration_failures,
            recommended_fix=f"Align disruption duration to exactly {canonical_minutes} minutes."
        ))
    else:
        passed_checks += 1

    # 3. CHECK CORE SYSTEM IDENTIFIERS
    total_checks += 1
    system_failures = {}
    required_systems = ["PORTAL-01", "APP-02", "AUTH-01"]
    
    # check technical formats
    for name in ["executive_summary", "security_advisory", "presentation"]:
        if name in generated_outputs:
            out = generated_outputs[name]
            text_corpus = str(out.model_dump() if hasattr(out, "model_dump") else out)
            missing = [s for s in required_systems if s not in text_corpus]
            if missing:
                system_failures[name] = f"Missing canonical system identifiers: {missing}"
                affected_outputs.add(name)
                affected_claim_ids.add("CLM-004")

    if system_failures:
        contradictions.append(ContradictionItem(
            check_type="SYSTEM_ASSETS",
            description="Missing or inconsistent affected systems across technical artifacts.",
            conflicting_outputs=list(system_failures.keys()),
            canonical_truth="Affected systems must include PORTAL-01, APP-02, and AUTH-01 (CLM-004).",
            observed_values=system_failures,
            recommended_fix="Include all 3 verified canonical systems."
        ))
    else:
        passed_checks += 1

    # compute overall status
    status = "FAIL" if len(contradictions) > 0 else "PASS"

    return CrossCheckResult(
        status=status,
        total_checks=total_checks,
        passed_checks=passed_checks,
        contradictions=contradictions,
        affected_outputs=list(affected_outputs),
        affected_claim_ids=list(affected_claim_ids)
    )

def cross_checker_node(state: CaseState) -> Dict[str, Any]:
    # LangGraph node function
    canonical: CanonicalSource = state.get("canonical_source")
    outputs: Dict[str, Any] = state.get("generated_outputs", {})

    if not canonical:
        raise ValueError("canonical_source missing from state in cross_checker_node")

    result = run_cross_check(canonical, outputs)
    return {"cross_check_results": result.model_dump()}
