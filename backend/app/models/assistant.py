# Request and response models for the Assistant SLM Gatekeeper
from typing import List, Optional
from pydantic import BaseModel, Field

class AssistantQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language operator query")
    case_id: Optional[str] = Field(default=None, description="Optional target case identifier")

class AssistantQueryResponse(BaseModel):
    query: str
    status: str = Field(..., description="'approved' if within operational domain, 'rejected' if boundary violated")
    boundary_enforced: bool = Field(default=False, description="True if query violated operational domain boundary")
    title: str = Field(..., description="Institutional card title")
    answer: str = Field(..., description="Intelligence briefing or operational boundary rejection explanation")
    suggested_queries: Optional[List[str]] = Field(default=None, description="Suggested institutional queries")
    referenced_cases: Optional[List[str]] = Field(default=None, description="Referenced case IDs")
    referenced_claims: Optional[List[str]] = Field(default=None, description="Referenced canonical claim IDs")
    timestamp: str
