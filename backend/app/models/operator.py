# Schema for operator configuration input from the frontend/reviewer
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field

# Supported artifact formats directly matching Problem Statement 26154
OutputType = Literal[
    "executive_summary",
    "advisory",
    "presentation",
    "infographic",
    "video_package",
    "linkedin_post",
    "twitter_post",
    "whatsapp_message",
    "instagram_post",
    # legacy aliases for backward compatibility with initial prototype files
    "security_advisory",
    "social_media",
    "video_script"
]

# Clean standalone tones - single dimensions only, no multi-attribute combinations
ToneType = Literal[
    "Authoritative",
    "Formal",
    "Urgent",
    "Objective",
    "Accessible",
    "Cautionary"
]

# Strict 4-tier detail levels
DetailType = Literal[
    "Brief",
    "Standard",
    "Detailed",
    "Technical"
]

# Universal organizational communication objectives
ObjectiveType = Literal[
    "Information Sharing",
    "Actionable Guidance",
    "Executive Briefing",
    "Public Announcement",
    "Compliance Update"
]

# Universal audience tiers
AudienceType = Literal[
    "Leadership",
    "Technical Specialists",
    "General Public",
    "Internal Staff",
    "Regulators and Partners"
]

# Handling classification
ClassificationType = Literal[
    "Public Release",
    "Internal Use Only",
    "Confidential"
]

# Per-deliverable override model (overrides only what is explicitly set)
class DeliverableOverride(BaseModel):
    audience: Optional[str] = None
    tone: Optional[str] = None
    detail: Optional[str] = None
    communication_objective: Optional[str] = None
    languages: Optional[List[str]] = None
    additional_instructions: Optional[str] = None
    twitter_account_type: Optional[Literal["standard", "premium"]] = "standard"

# Main operator configuration sent from ConfigureScreen
class OperatorConfig(BaseModel):
    audience: str = Field(
        default="Leadership",
        description="Target audience for the communications"
    )
    tone: str = Field(
        default="Objective",
        description="Stylistic tone of communication"
    )
    detail: str = Field(
        default="Standard",
        description="Detail depth level: Brief, Standard, Detailed, or Technical"
    )
    communication_objective: str = Field(
        default="Information Sharing",
        description="Core intent and objective"
    )
    classification: str = Field(
        default="Public Release",
        description="Handling classification: Public Release, Internal Use Only, or Confidential"
    )
    languages: List[str] = Field(
        default_factory=lambda: ["English"],
        description="List of selected languages (up to 3)"
    )
    additional_instructions: Optional[str] = Field(
        default="",
        description="Optional operator constraints"
    )
    requested_outputs: List[str] = Field(
        default_factory=lambda: [
            "executive_summary",
            "advisory",
            "presentation",
            "video_package",
            "twitter_post",
            "whatsapp_message"
        ],
        description="List of requested output artifact types"
    )
    output_overrides: Dict[str, DeliverableOverride] = Field(
        default_factory=dict,
        description="Per-deliverable specific overrides for audience, tone, languages, etc."
    )
