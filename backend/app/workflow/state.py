# Shared LangGraph state dictionary for passing case data between graph nodes
from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict
from app.models.canonical import CanonicalSource
from app.models.operator import OperatorConfig
from app.models.plan import TransformationPlan

# Central case state for orchestrating all agents
class CaseState(TypedDict, total=False):
    case_id: str
    source_files: List[str]
    source_context_reference: Optional[str]
    canonical_source: Optional[CanonicalSource]
    operator_config: Optional[OperatorConfig]
    transformation_plan: Optional[TransformationPlan]
    generated_outputs: Dict[str, Any]
    cross_check_results: Optional[Dict[str, Any]]
    validation_results: Optional[Dict[str, Any]]
    reviewer_actions: List[Dict[str, Any]]
    approval_status: str
    provenance_metadata: Optional[Dict[str, Any]]
    iteration_count: int
