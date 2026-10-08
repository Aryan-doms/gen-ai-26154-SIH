# Data models for the Transformation Planner output
from typing import List, Literal
from pydantic import BaseModel, Field
from app.models.operator import OutputType

# Plan specifications for a single output artifact
class OutputPlanItem(BaseModel):
    output_type: OutputType = Field(description="Artifact type identifier")
    title: str = Field(description="Descriptive title of the artifact")
    target_audience: str = Field(description="Target audience specific to this format")
    tone: str = Field(description="Stylistic tone specific to this format")
    communication_objective: str = Field(description="Specific objective for this format")
    relevant_claim_ids: List[str] = Field(description="Canonical claim IDs relevant to this output")
    mandatory_elements: List[str] = Field(description="Key structural or factual requirements that must be present")
    prohibited_elements: List[str] = Field(description="Information that must NOT be stated (e.g. speculative attribution)")
    dependencies: List[str] = Field(default_factory=list, description="Output dependencies, if any")
    validation_rules: List[str] = Field(description="Criteria for validator to confirm compliance")

# Complete transformation plan produced by the planner node
class TransformationPlan(BaseModel):
    plan_id: str = Field(description="Unique plan identifier (e.g., PLN-2026-0417-01)")
    case_id: str = Field(description="Associated incident case ID")
    global_objective: str = Field(description="Global communication objective")
    outputs_plan: List[OutputPlanItem] = Field(description="Structured plan for each requested output")
    cross_output_consistency_rules: List[str] = Field(description="Rules for cross-checker node to compare across outputs")
    created_at: str = Field(description="Timestamp of plan generation")
