# Models for Stage 7: Source Change Detection, Impact Analysis & Version Diffing
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class UpdateClaimRequest(BaseModel):
    new_claim_text: str = Field(description="Updated verified text for the canonical claim")
    new_value: Optional[str] = Field(default=None, description="Updated atomic value (e.g., '52 minutes' or '198.51.100.2')")
    reason: Optional[str] = Field(default="Analyst verified source correction", description="Audit justification")

class AffectedOutputItem(BaseModel):
    output_id: str = Field(description="Deliverable key, e.g. 'executive_summary'")
    reason: str = Field(description="Explicit justification of why this deliverable is impacted")
    old_fragment: Optional[str] = Field(default=None, description="Previous phrase/value present in artifact for UI diff")
    new_fragment: Optional[str] = Field(default=None, description="Updated phrase/value present in artifact for UI diff")

class DynamicImpactEvaluation(BaseModel):
    claim_id: str
    change_type: str = Field(default="value_update", description="'value_update' | 'attribution_update' | 'timeline_update' | 'scope_update'")
    summary_of_change: str = Field(default="", description="High-level summary of what was corrected")
    affected_outputs: List[AffectedOutputItem] = Field(default_factory=list, description="Deliverables that depend on the changed claim")
    unaffected_outputs: List[str] = Field(default_factory=list, description="Deliverables that do NOT depend on the changed claim")

class VersionRecord(BaseModel):
    version: int = Field(description="Version index (e.g. 1 or 2)")
    content: str = Field(description="Document content snapshot at this version")
    status: str = Field(description="Approval status at this version snapshot")
    timestamp: str = Field(description="ISO timestamp when version was recorded")
    claim_snapshot: Optional[str] = Field(default=None, description="Claim text at the time of this version")
    reason: Optional[str] = Field(default=None, description="Reason for modification")

class VersionDiffItem(BaseModel):
    deliverable_type: str
    deliverable_title: str
    is_affected: bool
    v1_content: str
    v2_content: str
    changed_claim_id: str
    old_value: str
    new_value: str
    reason: Optional[str] = Field(default=None, description="Evaluator explanation of impact or preservation")
    old_fragment: Optional[str] = Field(default=None, description="Old phrase for UI diff highlighting")
    new_fragment: Optional[str] = Field(default=None, description="New phrase for UI diff highlighting")

class ImpactAnalysisResponse(BaseModel):
    work_id: str
    claim_id: str
    old_claim_text: str
    new_claim_text: str
    change_type: str = "value_update"
    summary_of_change: str = ""
    affected_deliverables: List[str] = Field(description="Deliverables citing this claim that were selectively regenerated to v2")
    unaffected_deliverables: List[str] = Field(description="Deliverables NOT citing this claim whose approval status was preserved")
    diffs: List[VersionDiffItem] = Field(description="Detailed version comparison entries for all deliverables")
    cross_check_status: str = Field(default="PASS", description="Re-evaluated cross-checker status across deliverables")
    validation_status: str = Field(default="PASS", description="Re-evaluated Pydantic validation status")
    message: str = Field(description="Human readable summary of the impact analysis and selective propagation")
