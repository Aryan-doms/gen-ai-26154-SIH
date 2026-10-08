import sys
import json
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.models.canonical import CanonicalSource
from app.models.operator import OperatorConfig
from app.models.plan import TransformationPlan
from app.workflow.planner import transformation_planner_node
from app.workflow.state import CaseState

def main():
    canonical_file = backend_dir / "stage1_canonical_output.json"
    if not canonical_file.exists():
        print(f"Error: {canonical_file} does not exist. Run stage 1 first.")
        sys.exit(1)
        
    print(f"[*] Loading CanonicalSource from: {canonical_file}")
    with open(canonical_file, "r", encoding="utf-8") as f:
        canonical_data = json.load(f)
    canonical = CanonicalSource.model_validate(canonical_data)

    # Sample operator configuration from PS Section 5
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
    print(f"[*] Operator Configuration loaded:")
    print(f"    - Audience: {operator_config.audience}")
    print(f"    - Tone: {operator_config.tone}")
    print(f"    - Language: {operator_config.language}")
    print(f"    - Objective: {operator_config.communication_objective}")
    print(f"    - Requested Outputs: {operator_config.requested_outputs}\n")

    # LangGraph State
    initial_state: CaseState = {
        "case_id": canonical.case_id,
        "source_files": canonical.source_files,
        "canonical_source": canonical,
        "operator_config": operator_config,
        "generated_outputs": {},
        "reviewer_actions": [],
        "approval_status": "DRAFT",
        "iteration_count": 0
    }

    # Execute Transformation Planner Node
    print("[*] Executing LangGraph 'Transformation Planner' node...")
    result = transformation_planner_node(initial_state)
    plan: TransformationPlan = result["transformation_plan"]

    # Validate output against Pydantic schema
    validated_plan = TransformationPlan.model_validate(plan)
    json_output = validated_plan.model_dump_json(indent=2)
    print(json_output)

    # Save to disk
    output_path = backend_dir / "stage2_transformation_plan_output.json"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json_output)
    print(f"\n[✓] Transformation Plan successfully generated and validated against Pydantic schema!")
    print(f"[✓] Saved structured plan to: {output_path}")

if __name__ == "__main__":
    main()
