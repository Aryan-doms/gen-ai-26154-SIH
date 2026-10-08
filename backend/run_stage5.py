# Stage 5 runner: demonstrates Cross-Checker and Validator with real contradiction catch & regeneration
import sys
import json
from pathlib import Path

# add backend folder to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

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
from app.workflow.regenerator import regenerate_affected_outputs

def main():
    canonical_file = backend_dir / "stage1_canonical_output.json"
    plan_file = backend_dir / "stage2_transformation_plan_output.json"
    outputs_file = backend_dir / "stage4_all_creators_output.json"

    if not canonical_file.exists() or not plan_file.exists() or not outputs_file.exists():
        print("Error: Previous stage output files missing. Run stages 1-4 first.")
        sys.exit(1)

    print(f"[*] Loading CanonicalSource from: {canonical_file}")
    with open(canonical_file, "r", encoding="utf-8") as f:
        canonical = CanonicalSource.model_validate(json.load(f))

    print(f"[*] Loading TransformationPlan from: {plan_file}")
    with open(plan_file, "r", encoding="utf-8") as f:
        plan = TransformationPlan.model_validate(json.load(f))

    print(f"[*] Loading generated outputs from: {outputs_file}")
    with open(outputs_file, "r", encoding="utf-8") as f:
        raw_outputs = json.load(f)

    # Convert raw json into typed pydantic creator outputs
    typed_outputs = {
        "executive_summary": ExecutiveSummaryOutput.model_validate(raw_outputs["executive_summary"]),
        "security_advisory": SecurityAdvisoryOutput.model_validate(raw_outputs["security_advisory"]),
        "social_media": SocialMediaOutput.model_validate(raw_outputs["social_media"]),
        "presentation": PresentationOutput.model_validate(raw_outputs["presentation"]),
        "video_script": VideoScriptOutput.model_validate(raw_outputs["video_script"])
    }

    operator_config = OperatorConfig(
        audience="Government cybersecurity and security operations teams",
        tone="Professional, factual and concise",
        language="English",
        communication_objective="Awareness and response",
        requested_outputs=["executive_summary", "security_advisory", "social_media", "presentation", "video_script"]
    )

    print("\n" + "="*80)
    print("STEP 1: INJECTING CONTRADICTION FOR DEMO (Per Section 35, Step 13)")
    print("="*80)
    # We simulate an erroneous social media post claiming attribution to 'Threat Group X'
    bad_outputs = typed_outputs.copy()
    corrupted_post = SocialMediaOutput.model_validate(raw_outputs["social_media"])
    corrupted_post.post_text = (
        "Security Alert: The recent cyber attack on our Research Portal was confirmed to be carried out "
        "by Threat Group X. All systems have now been restored."
    )
    corrupted_post.attribution_status = "Attributed to Threat Group X"
    bad_outputs["social_media"] = corrupted_post

    print("[*] Injected unconfirmed attribution into 'social_media':")
    print(f"    Text: \"{corrupted_post.post_text}\"")
    print(f"    Attribution: \"{corrupted_post.attribution_status}\"")

    print("\n[*] Running Cross-Checker on corrupted outputs...")
    cross_check_failure = run_cross_check(canonical, bad_outputs)
    print(f"[*] Cross-Checker Verdict: {cross_check_failure.status}")
    print(f"    Passed checks: {cross_check_failure.passed_checks} / {cross_check_failure.total_checks}")
    print(f"    Affected outputs flagged: {cross_check_failure.affected_outputs}")
    for contra in cross_check_failure.contradictions:
        print(f"    - [{contra.check_type}] {contra.description}")
        print(f"      Canonical truth: {contra.canonical_truth}")
        print(f"      Observed values: {contra.observed_values}")
        print(f"      Recommended fix: {contra.recommended_fix}")

    print("\n" + "="*80)
    print("STEP 2: TARGETED REGENERATION OF AFFECTED OUTPUT (Per Section 17)")
    print("="*80)
    print(f"[*] Routing affected outputs {cross_check_failure.affected_outputs} back to Creator...")
    repaired_outputs = regenerate_affected_outputs(
        affected_types=cross_check_failure.affected_outputs,
        canonical=canonical,
        plan=plan,
        config=operator_config,
        existing_outputs=bad_outputs
    )
    print(f"[✓] Regenerated 'social_media' output successfully.")
    print(f"    Regenerated text: \"{repaired_outputs['social_media'].post_text[:120]}...\"")
    print(f"    Regenerated attribution status: \"{repaired_outputs['social_media'].attribution_status}\"")

    print("\n" + "="*80)
    print("STEP 3: RE-RUNNING CROSS-CHECKER & VALIDATOR ON REPAIRED ARTIFACTS")
    print("="*80)
    clean_cross_check = run_cross_check(canonical, repaired_outputs)
    print(f"[*] Re-check Cross-Checker Verdict: {clean_cross_check.status}")
    print(f"    Checks passed: {clean_cross_check.passed_checks} / {clean_cross_check.total_checks}")
    print(f"    Contradictions found: {len(clean_cross_check.contradictions)}")

    print("\n[*] Running Validator across all 5 individual outputs...")
    val_report = run_validation(canonical, plan, repaired_outputs)
    print(f"[*] Validator Overall Verdict: {val_report.status}")
    for name, res in val_report.output_results.items():
        print(f"    - {name:<20} Verdict: {res.status} (Schema: {res.schema_valid}, Grounded: {res.source_grounded}, Elements: {res.mandatory_elements_met})")

    # Save complete Stage 5 output to json
    stage5_result = {
        "simulated_contradiction_test": cross_check_failure.model_dump(),
        "repaired_cross_check_result": clean_cross_check.model_dump(),
        "validator_report": val_report.model_dump()
    }

    output_path = backend_dir / "stage5_crosscheck_validation_output.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(stage5_result, f, indent=2)

    print(f"\n[✓] Stage 5 execution completed successfully!")
    print(f"[✓] Saved results to: {output_path}")

if __name__ == "__main__":
    main()
