# Pydantic models for Cross-Checker and Validator nodes
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field

# Represents a single factual discrepancy found between outputs
class ContradictionItem(BaseModel):
    check_type: Literal["ATTRIBUTION", "DISRUPTION_DURATION", "SYSTEM_ASSETS", "TIMELINE", "SEVERITY", "GENERAL"]
    description: str = Field(description="Explanation of what contradicted what")
    conflicting_outputs: List[str] = Field(description="Names of output artifacts that disagree")
    canonical_truth: str = Field(description="What the canonical source actually says")
    observed_values: Dict[str, str] = Field(description="Values extracted from each output")
    recommended_fix: str = Field(description="Instruction on how to fix the affected output")

# Structured output returned by the Cross-Checker node
class CrossCheckResult(BaseModel):
    status: Literal["PASS", "FAIL"] = Field(description="Whether all outputs are factually aligned")
    total_checks: int = Field(description="Number of consistency rules evaluated")
    passed_checks: int = Field(description="Number of passed rules")
    contradictions: List[ContradictionItem] = Field(default_factory=list, description="Contradictions found")
    affected_outputs: List[str] = Field(default_factory=list, description="Outputs that need regeneration")
    affected_claim_ids: List[str] = Field(default_factory=list, description="Claim IDs tied to the failure")

# Validation result for a single individual output artifact
class SingleOutputValidation(BaseModel):
    output_type: str = Field(description="Artifact type (e.g. executive_summary)")
    schema_valid: bool = Field(description="Whether Pydantic schema validation passed")
    mandatory_elements_met: bool = Field(description="Whether required sections are present")
    source_grounded: bool = Field(description="Whether all cited claims exist in canonical source")
    unsupported_claims_found: List[str] = Field(default_factory=list, description="Claims without evidence")
    status: Literal["PASS", "FAIL"] = Field(description="Single output validation verdict")
    notes: List[str] = Field(default_factory=list, description="Validation feedback and notes")

# Structured output returned by the Validator node
class ValidationReport(BaseModel):
    status: Literal["PASS", "FAIL"] = Field(description="Overall validation verdict across all outputs")
    output_results: Dict[str, SingleOutputValidation] = Field(description="Per-output validation items")
    checked_at: str = Field(description="Timestamp of validation run")
