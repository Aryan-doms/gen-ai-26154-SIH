# Pydantic schemas for all 5 creator outputs
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field

# Model for Executive Summary output
class ExecutiveSummaryOutput(BaseModel):
    title: str = Field(description="Title of the executive summary")
    case_id: str = Field(description="Incident Case ID (e.g. INC-2026-0417)")
    severity: Literal["SEVERITY-CRITICAL", "SEVERITY-HIGH", "SEVERITY-MEDIUM", "SEVERITY-LOW"] = Field(
        description="Assigned severity rating"
    )
    incident_overview: str = Field(description="High-level synthesis of what transpired")
    operational_impact: str = Field(description="Statement of operational degradation and outage")
    disruption_duration_minutes: int = Field(description="Exact operational outage duration in minutes (e.g. 47)")
    affected_systems: List[str] = Field(description="List of verified affected infrastructure assets")
    key_timeline_highlights: List[str] = Field(description="Executive chronological milestone highlights")
    current_status: str = Field(description="Containment and operational status")
    important_uncertainties: List[str] = Field(description="Key uncertainties or gaps highlighted for leadership")
    attribution_status: str = Field(description="Formal statement on threat actor attribution (must reflect UNCONFIRMED)")
    cited_claim_ids: List[str] = Field(description="Canonical claim IDs grounded in this summary")
    content_markdown: str = Field(description="Full formatted executive briefing in Markdown")
    generated_at: str = Field(description="ISO timestamp of generation")

# Model for Security Advisory output
class SecurityAdvisoryOutput(BaseModel):
    title: str = Field(description="Title of security advisory")
    case_id: str = Field(description="Incident Case ID")
    advisory_id: str = Field(description="Official advisory tracking code")
    severity: Literal["SEVERITY-CRITICAL", "SEVERITY-HIGH", "SEVERITY-MEDIUM", "SEVERITY-LOW"] = Field(
        description="Advisory severity classification"
    )
    summary: str = Field(description="Technical summary of the threat and initial vector")
    affected_systems: List[str] = Field(description="Confirmed affected systems and asset roles")
    observed_indicators: List[Dict[str, str]] = Field(description="IoCs such as IP addresses, accounts, malware hash")
    impact: str = Field(description="Technical and operational impact details")
    recommended_actions: List[str] = Field(description="Prioritized remediation and hardening mitigations")
    current_status: str = Field(description="Containment and recovery state")
    attribution_status: str = Field(description="Attribution stance (must clearly say UNCONFIRMED)")
    cited_claim_ids: List[str] = Field(description="Referenced canonical claim IDs")
    content_markdown: str = Field(description="Full formatted advisory document in Markdown")
    generated_at: str = Field(description="ISO timestamp of generation")

# Model for Social Media Post output
class SocialMediaOutput(BaseModel):
    platform: str = Field(default="Public Awareness / Security Update", description="Target channel")
    post_text: str = Field(description="The actual text content for the post")
    character_count: int = Field(description="Length of the post text")
    hashtags: List[str] = Field(default_factory=list, description="Relevant topic tags")
    attribution_status: str = Field(description="Must remain UNCONFIRMED")
    service_status: str = Field(description="Summary of current service status")
    cited_claim_ids: List[str] = Field(description="Referenced canonical claim IDs")
    generated_at: str = Field(description="ISO timestamp of generation")

# Slide item for presentation deck
class SlideItem(BaseModel):
    slide_number: int = Field(description="Order index of slide")
    title: str = Field(description="Header title of the slide")
    key_points: List[str] = Field(description="Bullet points for slide body")
    visual_recommendation: str = Field(description="Suggested visual layout or chart idea")
    claim_refs: List[str] = Field(default_factory=list, description="Claim IDs supporting this slide")

# Model for Presentation Deck output
class PresentationOutput(BaseModel):
    deck_title: str = Field(description="Title of presentation deck")
    case_id: str = Field(description="Case ID")
    target_audience: str = Field(description="Intended audience")
    total_slides: int = Field(description="Total count of slides")
    slides: List[SlideItem] = Field(description="Individual slide outlines")
    cited_claim_ids: List[str] = Field(description="All claim IDs referenced across slides")
    generated_at: str = Field(description="ISO timestamp of generation")

# Scene item for video script
class SceneItem(BaseModel):
    scene_number: int = Field(description="Scene sequence number")
    duration_seconds: int = Field(description="Estimated scene duration in seconds")
    visual_description: str = Field(description="What the viewer sees on screen")
    narration: str = Field(description="Spoken voiceover script")
    on_screen_text: str = Field(description="Text overlays, lower thirds, or captions")
    supporting_claim_ids: List[str] = Field(default_factory=list, description="Claims backing this scene")

# Model for Video Script output
class VideoScriptOutput(BaseModel):
    script_title: str = Field(description="Title of the video script")
    case_id: str = Field(description="Case ID")
    target_duration_seconds: int = Field(description="Total video length in seconds")
    scenes: List[SceneItem] = Field(description="Ordered list of scenes")
    attribution_status: str = Field(description="Attribution status (UNCONFIRMED)")
    cited_claim_ids: List[str] = Field(description="All claim IDs cited across scenes")
    generated_at: str = Field(description="ISO timestamp of generation")
