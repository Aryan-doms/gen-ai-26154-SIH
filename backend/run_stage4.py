# Stage 4 runner: runs all remaining 4 creator agents and outputs their validated data
import sys
import json
from pathlib import Path

# add backend folder to python search path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.models.canonical import CanonicalSource
from app.models.operator import OperatorConfig
from app.models.plan import TransformationPlan
from app.models.creators import (
    ExecutiveSummaryOutput,
    SecurityAdvisoryOutput,
    SocialMediaOutput,
    PresentationOutput,
    VideoScriptOutput
)
from app.agents.executive_summary_creator import executive_summary_creator_node
from app.agents.security_advisory_creator import security_advisory_creator_node
from app.agents.social_media_creator import social_media_creator_node
from app.agents.presentation_creator import presentation_creator_node
from app.agents.video_script_creator import video_script_creator_node
from app.workflow.state import CaseState

def main():
    canonical_file = backend_dir / "stage1_canonical_output.json"
    plan_file = backend_dir / "stage2_transformation_plan_output.json"

    if not canonical_file.exists() or not plan_file.exists():
        print("Error: Previous stage outputs missing. Please run stages 1 and 2.")
        sys.exit(1)

    print(f"[*] Loading CanonicalSource from: {canonical_file}")
    with open(canonical_file, "r", encoding="utf-8") as f:
        canonical = CanonicalSource.model_validate(json.load(f))

    print(f"[*] Loading TransformationPlan from: {plan_file}")
    with open(plan_file, "r", encoding="utf-8") as f:
        plan = TransformationPlan.model_validate(json.load(f))

    operator_config = OperatorConfig(
        audience="Government cybersecurity and security operations teams",
        tone="Professional, factual and concise",
        language="English",
        communication_objective="Awareness and response",
        requested_outputs=[
            "executive_summary",
            "security_advisory",
            "social_media",
            "presentation",
            "video_script"
        ]
    )

    state: CaseState = {
        "case_id": canonical.case_id,
        "source_files": canonical.source_files,
        "canonical_source": canonical,
        "operator_config": operator_config,
        "transformation_plan": plan,
        "generated_outputs": {},
        "reviewer_actions": [],
        "approval_status": "DRAFT",
        "iteration_count": 0
    }

    print("[*] Running all 5 creator agents across canonical source...")
    
    # 1. Executive Summary
    res1 = executive_summary_creator_node(state)
    state["generated_outputs"].update(res1["generated_outputs"])
    print("  [✓] Executive Summary Creator completed")

    # 2. Security Advisory
    res2 = security_advisory_creator_node(state)
    state["generated_outputs"].update(res2["generated_outputs"])
    print("  [✓] Security Advisory Creator completed")

    # 3. Social Media
    res3 = social_media_creator_node(state)
    state["generated_outputs"].update(res3["generated_outputs"])
    print("  [✓] Social Media Creator completed")

    # 4. Presentation Deck
    res4 = presentation_creator_node(state)
    state["generated_outputs"].update(res4["generated_outputs"])
    print("  [✓] Presentation Creator completed")

    # 5. Video Script
    res5 = video_script_creator_node(state)
    state["generated_outputs"].update(res5["generated_outputs"])
    print("  [✓] Video Script Creator completed")

    # Validate each one against its respective Pydantic model
    validated_outputs = {
        "executive_summary": ExecutiveSummaryOutput.model_validate(state["generated_outputs"]["executive_summary"]).model_dump(),
        "security_advisory": SecurityAdvisoryOutput.model_validate(state["generated_outputs"]["security_advisory"]).model_dump(),
        "social_media": SocialMediaOutput.model_validate(state["generated_outputs"]["social_media"]).model_dump(),
        "presentation": PresentationOutput.model_validate(state["generated_outputs"]["presentation"]).model_dump(),
        "video_script": VideoScriptOutput.model_validate(state["generated_outputs"]["video_script"]).model_dump()
    }

    # Save to disk
    output_path = backend_dir / "stage4_all_creators_output.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(validated_outputs, f, indent=2)

    print(f"\n[✓] All 5 creator outputs successfully generated and validated against Pydantic schemas!")
    print(f"[✓] Saved all outputs to: {output_path}")

    # Display clean summary of the 4 new outputs
    print("\n" + "="*80)
    print("SECURITY ADVISORY SUMMARY:")
    print("="*80)
    print(f"Title: {validated_outputs['security_advisory']['title']}")
    print(f"Advisory ID: {validated_outputs['security_advisory']['advisory_id']}")
    print(f"Attribution: {validated_outputs['security_advisory']['attribution_status']}")
    print(f"Observed IoCs: {len(validated_outputs['security_advisory']['observed_indicators'])} items")
    print(f"Mitigations: {len(validated_outputs['security_advisory']['recommended_actions'])} actions")

    print("\n" + "="*80)
    print("SOCIAL MEDIA POST:")
    print("="*80)
    print(validated_outputs['social_media']['post_text'])
    print(f"Tags: {' '.join(validated_outputs['social_media']['hashtags'])}")

    print("\n" + "="*80)
    print("PRESENTATION DECK OUTLINE:")
    print("="*80)
    print(f"Deck Title: {validated_outputs['presentation']['deck_title']}")
    for s in validated_outputs['presentation']['slides']:
        print(f"  Slide {s['slide_number']}: {s['title']} ({len(s['key_points'])} bullets, claim refs: {s['claim_refs']})")

    print("\n" + "="*80)
    print("VIDEO SCRIPT BREAKDOWN:")
    print("="*80)
    print(f"Title: {validated_outputs['video_script']['script_title']}")
    print(f"Target Duration: {validated_outputs['video_script']['target_duration_seconds']}s")
    for sc in validated_outputs['video_script']['scenes']:
        print(f"  Scene {sc['scene_number']} ({sc['duration_seconds']}s): Visual - '{sc['visual_description'][:50]}...'")
        print(f"    Narration: \"{sc['narration']}\"")
        print(f"    On-screen: [{sc['on_screen_text']}] (claims: {sc['supporting_claim_ids']})")

if __name__ == "__main__":
    main()
