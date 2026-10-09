# Content Transformation Platform (CT)
## System Architecture & Engineering Design Document

**Problem Statement:** SIH 2026 — PS 26154 (National Technical Research Organisation - NTRO)  
**Project:** Automated Multimodal Content Transformation with High-Assurance Evidence Grounding  
**Target Environment:** Indian Government, Public Sector Undertakings (PSUs), and Institutional Enterprise Environments  

---

## 1. Executive System Overview

The **Content Transformation Platform (CT)** is an institutional-grade, multi-modal generative communication platform. It ingests complex, heterogeneous source records (technical reports, logs, policy notes, advisories) and transforms them into **9 purpose-built deliverables** for diverse audiences—ranging from executive decision-makers to frontline technical teams and the public.

### Core Engineering Tenets
1. **Zero Unanchored Hallucination (Strict Grounding):** Every statement, metric, entity, and directive must trace back to verified canonical source claims.
2. **Content is Structured Data, Not Flat Files:** Deliverables are stored as structured abstract syntax trees (ASTs) or schema-validated JSON—not opaque blobs or flat PDFs.
3. **Selective Impact Propagation (Anti-Drift):** Changes made to one deliverable or source document only update affected outputs, preventing cross-format drift.
4. **Lightweight & Sovereign Deployment:** No heavy 4 GB third-party Docker servers (avoiding ONLYOFFICE) and zero dependencies on public consumer cloud redirect hacks (avoiding Google Docs OAuth). 100% self-hostable and deployable on standard serverless/container stacks (e.g., Vercel, on-prem Kubernetes).

---

## 2. The Three-Layer System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LAYER 1: CANONICAL KNOWLEDGE BASE                     │
│  Heterogeneous Source Ingestion  ──►  Categorized Atomic Extraction (LLM)   │
│                                  ──►  Canonical Claims Ledger (Single Truth)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: MULTI-MODAL EDITABLE DELIVERABLES               │
│                                                                             │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐ │
│  │ Documents (Tiptap)    │ │ Presentation (Cards) │ │ Infographic (Canvas)│ │
│  │ • Executive Summary   │ │ • 16:9 Slide Deck    │ │ • Spatial Annotation│ │
│  │ • Technical Advisory  │ │ • Inline Rich Edit   │ │ • Regional Prompts  │ │
│  │ • Video Storyboard    │ │ • Claim-Mapped Slides│ │ • Layout Spec       │ │
│  └───────────────────────┘ └──────────────────────┘ └─────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Micro-Communications & Social Channels                                 │ │
│  │ • WhatsApp Dispatch (Character counter, bubble preview, media attach)  │ │
│  │ • X / Twitter Thread (280-char enforcement, card previews)             │ │
│  │ • LinkedIn Dispatch (Article formatting, executive tone, hashtags)     │ │
│  │ • Instagram Dispatch (Visual carousel cards, caption, tag compliance)  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               LAYER 3: EXPORT ENGINE & GOVERNANCE PIPELINE                  │
│  • DOCX Engine (HTML/AST to Word)      • PptxGenJS (JSON to PowerPoint)     │
│  • PDF Engine (Rendered Print CSS)     • SRT Subtitle Extractor (Captions)  │
│  • Institutional Audit Footer          • Version History & Provenance Ledger│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer 1: Canonical Source & Knowledge Extraction

### 3.1 The Problem with Naive Extraction
Standard prompts asking an LLM to *"Summarize and extract facts"* yield 4–5 generic, high-level bullets and miss critical operational specifics (such as CVE numbers, port numbers, affected server counts, and exact UTC timestamps).

### 3.2 Categorized Atomic Extraction Rubric
To extract **100% of facts** without loss, the platform executes a structured extraction against 5 discrete categories:

1. **Metrics & Quantities:** Specific counts, percentages, data sizes, financial costs, operational downtime numbers.
2. **Entities & Identifiers:** CVE IDs, IP addresses, hostnames, system names, file paths, hash values, affected departments.
3. **Timeline & Chronology:** Exact dates, UTC timestamps, incident discovery time, detection lag, containment milestones.
4. **Technical Mechanisms & Root Causes:** Specific vulnerabilities exploited, misconfigurations, protocols, authentication flaws.
5. **Directives & Operational Status:** Containment status, mandatory patch orders, mitigation checklists, leadership sign-offs.

### 3.3 Atomic Claims Schema
Each claim is extracted as an **atomic, single-fact assertion**:
```json
{
  "claim_id": "CLM-03",
  "category": "METRICS_AND_QUANTITIES",
  "assertion": "18 critical database servers in Subnet-B were compromised during initial lateral movement.",
  "source_document": "03_threat_intel.txt",
  "source_lines": [42, 45],
  "verification_status": "VERIFIED_GROUNDED",
  "confidence_score": 0.99
}
```

---

## 4. Layer 2: Deliverable-by-Deliverable Architecture

To ensure each deliverable is genuinely functional, the platform rejects a "one-size-fits-all" editor in favor of specialized, format-native representations:

| # | Deliverable | Underlying Data Structure | Editing Experience | Final Export Formats |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Executive Summary** | Markdown / HTML AST | **Tiptap Rich-Text Editor** (Notion/Docs UX) | `.docx`, `.pdf` |
| **2** | **Technical Advisory** | Markdown / HTML AST with Callout Nodes | **Tiptap Rich-Text Editor** (with code blocks & alerts) | `.docx`, `.pdf` |
| **3** | **Video Package** | Structured Scene Array + Media URLs | **Tiptap Storyboard Editor** (Keyframe thumbnails + narration) | `.docx`, `.pdf`, `.srt` |
| **4** | **Presentation** | Structured Slide JSON Array | **16:9 Interactive Slide Cards** (Inline field editing) | `.pptx`, `.pdf` |
| **5** | **Infographic** | Raster Base Image + Coordinate Pin Spec | **Image Canvas** with spatial annotation pins & prompt edits | `.png`, `.svg` |
| **6** | **WhatsApp Dispatch** | Plain text + Media attachment payload | **Message Editor** with live character counter & bubble preview | Copy Text, `.png` |
| **7** | **Social Media (X)** | Array of 280-character thread posts | **Thread Preview Card** with real-time character limit enforcement | Copy Text |
| **8** | **Social Media (LinkedIn)** | Formatted long-form text + hashtag array | **Article Post Preview** with executive tone formatting | Copy Text |
| **9** | **Social Media (Instagram)** | Carousel card array + caption string | **Visual Carousel Card Preview** + caption box | Copy Text, `.png` |

---

### Detailed Design of Key Deliverable Editors

#### A. Document Suite (Executive Summary, Advisory, Video Package)
- **Engine:** Headless **Tiptap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`).
- **Why Tiptap:**
  - Lightweight (~40KB), pure React, zero Docker or WebSocket infrastructure required.
  - Native inline image support for embedded charts, attack paths, and storyboard scene keyframes.
  - Notion-like rich formatting (H1/H2/H3, bullet points, callouts, tables) without forcing operators to see or write Markdown syntax (`##`, `**`).
- **Video Package Storyboard Integration:**
  - Each scene is represented as a structured card: Scene Number, Timestamp/Duration, Reference Keyframe Image, Narration Voiceover Script, and Production Cues.
  - Generates `.docx` and `.pdf` production briefs directly.
  - A 1-click parser converts voiceover script blocks and timestamps into standard `.srt` subtitle files.

#### B. Presentation Deck (16:9 Interactive Slide Cards)
- **Engine:** Custom 16:9 Slide Deck Component + **PptxGenJS**.
- **Underlying Schema:**
  ```json
  [
    {
      "slide_number": 1,
      "layout": "title",
      "title": "Critical Infrastructure Incident Response",
      "subtitle": "Briefing for Executive Leadership · 17 Apr 2026",
      "claims_cited": ["CLM-01"]
    },
    {
      "slide_number": 2,
      "layout": "two_column_metric",
      "title": "Containment Velocity & Asset Exposure",
      "left_column": ["18 Critical Servers Compromised", "Initial entry via legacy VPN"],
      "right_column": ["Lateral movement halted within 4 hours", "Zero exfiltration detected"],
      "speaker_notes": "Highlight that Tier-1 isolation prevented customer-facing outage.",
      "claims_cited": ["CLM-03", "CLM-04"]
    }
  ]
  ```
- **Operator Experience:**
  - Visual 16:9 aspect-ratio slide preview with a left-hand thumbnail rail.
  - Direct inline editing: clicking any headline, bullet point, or speaker note allows instant modification.
  - Slide-level claim attribution (e.g., Slide 2 indicates `Linked Claims: CLM-03, CLM-04`).
- **Export Pipeline:**
  - **Download PPTX:** `PptxGenJS` runs client-side, compiling genuine Microsoft PowerPoint `.pptx` presentations with native shapes, text boxes, and speaker notes.
  - **Download PDF:** Landscape 16:9 rendered PDF print.

#### C. Infographic Canvas
- **Engine:** SVG Canvas overlay over generated visual asset.
- **Workflow:**
  1. Base infographic generated by AI based on canonical metric claims.
  2. Operator zooms and clicks on any region to drop a **Spatial Annotation Pin**.
  3. Operator adds natural-language refinement prompt (e.g., *"Make the warning banner high-contrast amber"* or *"Highlight Subnet-B"*).
  4. System bundles the base image, spatial coordinates, and prompt into an edit request to produce revision `v1.1`.
  5. Operator approves or rolls back.

---

## 5. Layer 3: Dynamic Impact Evaluator & Post-Edit Validation

### 5.1 Factual Corrections vs. Stylistic Edits
A core requirement of Problem Statement 26154 is **Dynamic Impact Evaluation**. The platform cleanly distinguishes between human stylistic rewording and factual modifications:

```
                          Operator saves an edit
                                     │
                                     ▼
                      AI Semantic Impact Evaluator
               (Compares edit against Canonical Claims Ledger)
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
        [Stylistic Rewording]                   [Factual Claim Edit]
        (e.g., "18 servers were hit"            (e.g., "18 servers" → "24 servers")
         → "Eighteen nodes affected")                    │
                 │                                       ▼
        • Local revision v1.1 created          1. Update Canonical Claim CLM-03
        • Schema checked: PASS                    in central ledger.
        • Zero cross-output disruption         2. Identify affected deliverables
                                                  (Presentation Slide 2 & Advisory).
                                               3. Display 1-Click Sync Banner:
                                                  "Update affected outputs with AI?"
```

### 5.2 Handling Novel Operator Inputs (New Claims & Contradiction Checking)
When an operator adds information during editing that was not present in the original source documents:

1. **Novel Fact Detection:** The AI evaluator detects that the assertion does not map to any existing claim ID (`CLM-01` to `CLM-07`).
2. **Contradiction Verification:**
   - The evaluator cross-references the new assertion against all existing canonical claims.
   - **Conflict Scenario:** If the operator adds *"Backup power was unavailable"*, but `CLM-06` states *"Auxiliary generators operated continuously"*, the system immediately raises an alert:  
     `⚠️ Potential Contradiction: Conflicts with verified source claim CLM-06. [Override CLM-06] or [Review Edit]?`
   - **Clean Scenario:** If no contradiction exists, the system automatically registers a new claim into the project ledger:  
     `CLM-08: Secondary backup cluster in Mumbai activated at 04:15 UTC (Origin: Operator Input)`.
3. **Traceability Maintained:** All 9 deliverables can now reference `CLM-08`, maintaining a single cohesive knowledge base.

---

## 6. Architectural Evaluation & Trade-off Matrix

| Architecture Option | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- |
| **ONLYOFFICE Docs Integration** | Full Word/PowerPoint clone inside browser. | Requires separate 2–4 GB RAM Docker server (`DocumentServer`), complex WebSocket callbacks, AGPL v3 licensing, impossible on Vercel/serverless. | ❌ **Rejected:** Massive over-engineering; creates infrastructure bloat for a hackathon. |
| **Google Docs / Slides Redirect Hack** | Zero custom editor code; familiar UI. | Violates data sovereignty for Indian Government/NTRO; cannot sync edits back into platform database; breaks version history and claim impact analysis; unverified app warnings on Google OAuth. | ❌ **Rejected:** "Cheap system design" that breaks the core evaluation criteria of the problem statement. |
| **Unified Tiptap + PptxGenJS + Slide Card Engine** (Implemented) | 100% lightweight client-side React; zero extra servers; native image and callout support; clean AST/JSON underlying data; 1-click DOCX/PPTX/PDF/SRT export; sovereign and self-contained. | Requires assembling the UI toolbar and slide layout components. | ✅ **Selected:** Production-grade, elegant, robust, fully aligned with SIH criteria. |

---

## 7. Audit, Provenance & Export Standards

1. **Universal Institutional Phrasing:** The platform strictly adheres to universal enterprise and government terminology (*Project*, *Source Documents*, *Source Files*, *Records*, *Content Transformation Platform*). All military roleplay buzzwords and legacy labels are prohibited.
2. **Standard Institutional Audit Footer:** Every document output concludes with a standardized audit record:
   ```
   Document ID: DOC-2026-0417 · Version: v1.0 (Signed off) · Created: 17 Apr 2026 · Operator: Lead Operator
   Verification: 7 of 7 Source Claims Grounded · Cross-Output Drift: 0 Conflicts Detected
   ```
3. **Export Fidelity:**
   - **DOCX:** Clean headings, native tables, embedded figures, standard 1-inch margins.
   - **PDF:** Styled with institutional typography, running headers, and page-number footers.
   - **PPTX:** Native PowerPoint shapes and text boxes editable in Microsoft Office or LibreOffice.
   - **SRT:** Standard timestamped subtitle tracks for video production workflows.
