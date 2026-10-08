# Models for storing canonical incident data, claims, and evidence links
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# Evidence pointer linking a claim directly back to a source file and location
class Evidence(BaseModel):
    source_file: str = Field(description="Name or path of the source file")
    location_type: Literal["pdf_page", "pdf_section", "image_region", "video_timestamp", "text_section", "unknown"] = Field(
        description="Type of location in the source material"
    )
    location: str = Field(description="Specific location identifier (e.g., 'Section 3. Impact Assessment', 'Line 14')")
    supporting_text_or_description: str = Field(description="Exact quote or precise visual/textual evidence excerpt")

# Atomic claim extracted from the source files with confidence score
class Claim(BaseModel):
    claim_id: str = Field(description="Unique stable claim identifier (e.g., CLM-001)")
    claim_text: str = Field(description="Atomic, verifiable factual statement")
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = Field(description="Confidence rating of the claim")
    evidence: List[Evidence] = Field(default_factory=list, description="List of evidence supporting this claim")

# Confirmed fact with references to claim ids
class Fact(BaseModel):
    fact_id: str = Field(description="Unique fact identifier (e.g., FCT-001)")
    category: str = Field(description="Category (e.g., 'Infrastructure', 'Timeline', 'Forensics', 'Status')")
    statement: str = Field(description="Clear statement of confirmed fact")
    claim_refs: List[str] = Field(default_factory=list, description="Referenced claim IDs")

# Key entity like IP, username, or server hostname
class Entity(BaseModel):
    entity_id: str = Field(description="Unique entity identifier (e.g., ENT-001)")
    name: str = Field(description="Name of entity (e.g., 'PORTAL-01', '185.203.117.42', 'admin-research')")
    entity_type: Literal["IP_ADDRESS", "ACCOUNT", "SYSTEM_ASSET", "ORGANIZATION", "FILE_HASH", "TOOL", "ROLE"] = Field(
        description="Type classification of entity"
    )
    role_or_impact: str = Field(description="Role in the incident or how it was impacted")
    claim_refs: List[str] = Field(default_factory=list, description="Referenced claim IDs")

# Event in the chronological timeline
class TimelineEvent(BaseModel):
    event_id: str = Field(description="Unique event identifier (e.g., EVT-001)")
    timestamp_utc: str = Field(description="Event timestamp in UTC or relative time")
    description: str = Field(description="Description of what occurred")
    systems_involved: List[str] = Field(default_factory=list, description="System names involved")
    claim_refs: List[str] = Field(default_factory=list, description="Referenced claim IDs")

# Things we do not know for sure (e.g. attribution or initial vector)
class Uncertainty(BaseModel):
    uncertainty_id: str = Field(description="Unique uncertainty identifier (e.g., UNC-001)")
    topic: str = Field(description="Topic of uncertainty (e.g., 'Attribution', 'Exfiltration volume')")
    description: str = Field(description="Details on what is unconfirmed or unknown")
    investigative_guidance: str = Field(description="Instructions to prevent unauthorized assumptions (e.g., 'DO NOT assign attribution')")

# Hard rules that downstream creators cannot break
class Constraint(BaseModel):
    constraint_id: str = Field(description="Unique constraint identifier (e.g., CST-001)")
    description: str = Field(description="Strict boundary condition (e.g., 'Never assert threat group attribution')")
    rationale: str = Field(description="Reason for constraint")

# Basic metadata for each file in the source package
class SourceMetadata(BaseModel):
    file_name: str
    file_type: str
    file_hash_sha256: Optional[str] = None
    file_size_bytes: Optional[int] = None
    summary_of_content: str

# Main canonical representation container
class CanonicalSource(BaseModel):
    case_id: str = Field(description="Unique incident case identifier (e.g., INC-2026-0417)")
    incident_name: str = Field(description="Name of the incident / operation")
    source_files: List[str] = Field(description="List of source file names included in this case")
    source_metadata: List[SourceMetadata] = Field(default_factory=list, description="Metadata for each source file")
    facts: List[Fact] = Field(default_factory=list, description="Extracted confirmed facts")
    entities: List[Entity] = Field(default_factory=list, description="Extracted key entities and indicators")
    timeline: List[TimelineEvent] = Field(default_factory=list, description="Chronological timeline of events")
    claims: List[Claim] = Field(default_factory=list, description="Atomic claims with direct evidence linkage")
    uncertainties: List[Uncertainty] = Field(default_factory=list, description="Explicit unconfirmed areas and gaps")
    constraints: List[Constraint] = Field(default_factory=list, description="Strict factual constraints for downstream creators")
