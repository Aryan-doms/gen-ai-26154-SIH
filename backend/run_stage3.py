import sys
import json
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.models.canonical import CanonicalSource
from app.models.operator import OperatorConfig
from app.models.plan import TransformationPlan
from app.models.creators import ExecutiveSummaryOutput
from app.agents.executive_summary_creator import executive_summary_creator_node
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
        requested_outputs=["executive_summary"]
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

    print("[*] Executing LangGraph 'Executive Summary Creator' node...")
    result = executive_summary_creator_node(state)
    exec_summary: ExecutiveSummaryOutput = result["generated_outputs"]["executive_summary"]

    # Validate output against Pydantic schema
    validated_output = ExecutiveSummaryOutput.model_validate(exec_summary)
    json_output = validated_output.model_dump_json(indent=2)
    
    print("\n" + "="*80)
    print("STRUCTURED JSON OUTPUT (Validated Pydantic ExecutiveSummaryOutput):")
    print("="*80)
    print(json_output)

    print("\n" + "="*80)
    print("RENDERED BRIEFING DOCUMENT (Markdown):")
    print("="*80)
    print(validated_output.content_markdown)

    output_path = backend_dir / "stage3_executive_summary_output.json"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json_output)
    print(f"\n[✓] Executive Summary successfully created and validated against Pydantic schema!")
    print(f"[✓] Saved output to: {output_path}")

if __name__ == "__main__":
    main()
