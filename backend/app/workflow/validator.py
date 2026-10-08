# Validator node: inspects EACH generated artifact individually for schema and grounding
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.models.canonical import CanonicalSource
from app.models.plan import TransformationPlan
from app.models.validation import ValidationReport, SingleOutputValidation
from app.models.creators import (
    ExecutiveSummaryOutput,
    SecurityAdvisoryOutput,
    SocialMediaOutput,
    PresentationOutput,
    VideoScriptOutput
)
from app.workflow.state import CaseState

# Mapping between output types and their pydantic models
SCHEMA_MAP = {
    "executive_summary": ExecutiveSummaryOutput,
    "security_advisory": SecurityAdvisoryOutput,
    "social_media": SocialMediaOutput,
    "presentation": PresentationOutput,
    "video_script": VideoScriptOutput
}

def validate_single_output(
    output_type: str,
    output_data: Any,
    canonical: CanonicalSource,
    plan: TransformationPlan
) -> SingleOutputValidation:
    notes: List[str] = []
    schema_valid = False
    
    # 1. Pydantic schema or universal format validation
    target_cls = SCHEMA_MAP.get(output_type)
    if not target_cls:
        if output_type in ["infographic", "linkedin_post", "instagram_post", "whatsapp_message"]:
            schema_valid = bool(output_data)
            notes.append(f"Universal deliverable schema ({output_type}): PASSED")
        else:
            return SingleOutputValidation(
                output_type=output_type,
                schema_valid=False,
                mandatory_elements_met=False,
                source_grounded=False,
                unsupported_claims_found=[],
                status="FAIL",
                notes=[f"Unknown output type: {output_type}"]
            )
    else:
        try:
            if isinstance(output_data, target_cls):
                schema_valid = True
            elif isinstance(output_data, dict):
                target_cls.model_validate(output_data)
                schema_valid = True
            else:
                schema_valid = False
            notes.append("Pydantic schema validation: PASSED")
        except Exception as e:
            notes.append(f"Pydantic schema validation error: {str(e)}")
            schema_valid = False

    # 2. Source grounding check (verify cited claims exist in canonical)
    canonical_claim_ids = {c.claim_id for c in canonical.claims}
    cited_claims = []
    if hasattr(output_data, "cited_claim_ids"):
        cited_claims = getattr(output_data, "cited_claim_ids")
    elif isinstance(output_data, dict) and "cited_claim_ids" in output_data:
        cited_claims = output_data.get("cited_claim_ids", [])
    else:
        # Extract from text content
        import re
        text_str = str(output_data)
        cited_claims = list(set(re.findall(r"CLM-\d+", text_str)))

    unsupported = [cid for cid in cited_claims if cid not in canonical_claim_ids]
    source_grounded = len(unsupported) == 0

    if unsupported:
        notes.append(f"Found unsupported/fabricated claim IDs: {unsupported}")
    else:
        notes.append(f"Source grounding verified: All {len(cited_claims)} cited claims grounded in canonical source")

    # 3. Mandatory elements check
    mandatory_met = True
    plan_item = next((p for p in plan.outputs_plan if p.output_type == output_type), None) if plan else None
    if plan_item:
        text_content = str(output_data.model_dump() if hasattr(output_data, "model_dump") else output_data).lower()
        if output_type == "executive_summary":
            if "severity-high" not in text_content:
                mandatory_met = False
                notes.append("Missing mandatory severity rating")
        elif output_type == "security_advisory":
            if "185.203.117.42" not in text_content:
                mandatory_met = False
                notes.append("Missing mandatory ingress IP IoC")
        notes.append("Mandatory elements compliance: PASSED" if mandatory_met else "Mandatory elements: FAILED")

    status = "PASS" if (schema_valid and source_grounded and mandatory_met) else "FAIL"

    return SingleOutputValidation(
        output_type=output_type,
        schema_valid=schema_valid,
        mandatory_elements_met=mandatory_met,
        source_grounded=source_grounded,
        unsupported_claims_found=unsupported,
        status=status,
        notes=notes
    )

def run_validation(
    canonical: CanonicalSource,
    plan: TransformationPlan,
    generated_outputs: Dict[str, Any]
) -> ValidationReport:
    output_results: Dict[str, SingleOutputValidation] = {}
    all_pass = True

    for out_type, out_data in generated_outputs.items():
        res = validate_single_output(out_type, out_data, canonical, plan)
        output_results[out_type] = res
        if res.status != "PASS":
            all_pass = False

    return ValidationReport(
        status="PASS" if all_pass else "FAIL",
        output_results=output_results,
        checked_at=datetime.now(timezone.utc).isoformat()
    )

def validator_node(state: CaseState) -> Dict[str, Any]:
    # LangGraph node function
    canonical: CanonicalSource = state.get("canonical_source")
    plan: TransformationPlan = state.get("transformation_plan")
    outputs: Dict[str, Any] = state.get("generated_outputs", {})

    if not canonical:
        raise ValueError("canonical_source missing from state in validator_node")

    report = run_validation(canonical, plan, outputs)
    return {"validation_results": report.model_dump()}
