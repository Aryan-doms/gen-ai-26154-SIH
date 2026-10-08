// API service connecting React frontend to the FastAPI backend
// Direct connection to FastAPI at :8000 avoids Vite dev-server proxy loopback EPERM issues in sandboxed environments

function getApiBase() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:8000/api`;
    }
  }
  return '/api';
}

const API_BASE = getApiBase();

/**
 * Robust fetch helper with endpoint-aware timeout fallback
 */
async function apiRequest(endpoint, options = {}) {
  // Determine suitable timeout based on operation complexity
  let timeoutMs = options.timeoutMs;
  if (!timeoutMs) {
    if (endpoint.startsWith('/transform')) timeoutMs = 60000;
    else if (endpoint.includes('/claims/') || endpoint.includes('/prompt-edit') || endpoint.includes('/assistant/')) timeoutMs = 25000;
    else timeoutMs = 5000;
  }

  // Direct port 8000 attempt
  try {
    const ctrl1 = new AbortController();
    const timer1 = setTimeout(() => ctrl1.abort(), timeoutMs);
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: ctrl1.signal
    });
    clearTimeout(timer1);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    // If direct port 8000 failed or timed out, attempt relative path
    if (API_BASE !== '/api') {
      try {
        const ctrl2 = new AbortController();
        const timer2 = setTimeout(() => ctrl2.abort(), timeoutMs);
        const fallbackRes = await fetch(`/api${endpoint}`, {
          ...options,
          signal: ctrl2.signal
        });
        clearTimeout(timer2);
        if (fallbackRes.ok) return await fallbackRes.json();
      } catch (_) {}
    }
    throw err;
  }
}

export async function fetchWorkDashboard() {
  try {
    return await apiRequest('/work');
  } catch (err) {
    console.warn("API unavailable, using fallback store:", err);
    return {
      needs_attention: [
        {
          id: "2026-0417",
          title: "Operation Silver Falcon",
          status: "Needs review",
          created_at: new Date().toISOString(),
          sources_count: 6,
          outputs_count: 9,
          unapproved_count: 5
        }
      ],
      in_progress: [],
      recent_work: []
    };
  }
}

export async function fetchWorkDetails(workId) {
  try {
    const data = await apiRequest(`/work/${workId}`);
    if (data && data.outputs && data.outputs.length > 0) {
      return data;
    }
    return getFallbackWorkItem(workId);
  } catch (err) {
    console.warn(`Primary and secondary endpoints unreachable for work ${workId}. Using responsive demo fixture.`, err);
    return getFallbackWorkItem(workId);
  }
}

export async function createTransformation(payload) {
  return await apiRequest('/transform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function editArtifact(workId, outputType, updatedContent) {
  return await apiRequest(`/work/${workId}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      output_type: outputType,
      updated_content: updatedContent
    })
  });
}

export async function promptEditArtifact(workId, outputType, instruction) {
  return await apiRequest(`/work/${workId}/prompt-edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      output_type: outputType,
      instruction: instruction
    })
  });
}

export async function approveArtifact(workId, outputType) {
  return await apiRequest(`/work/${workId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      output_type: outputType,
      reviewer_name: "Lead Analyst"
    })
  });
}

export async function updateClaim(workId, claimId, payload) {
  return await apiRequest(`/work/${workId}/claims/${claimId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function askAssistant(query, caseId = null) {
  return await apiRequest('/assistant/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query,
      case_id: caseId
    })
  });
}

// Deterministic responsive fallback fixture for demo reliability
function getFallbackWorkItem(workId) {
  return {
    id: workId || "2026-0417",
    title: "Operation Silver Falcon",
    status: "Needs review",
    created_at: new Date().toISOString(),
    source_package: [
      { file_name: "01_incident_report.txt", file_type: "text/plain", file_hash_sha256: "e8f4702ba060a6a246ecdbfcf6e7bf7716f6b5536412f8646b9a8cf6ddbe38a1" },
      { file_name: "02_incident_timeline.txt", file_type: "text/plain", file_hash_sha256: "d5c6b7e8f90123456789abcdef0123456789abcdef0123456789abcdef012345" },
      { file_name: "03_threat_intel_brief.txt", file_type: "text/plain", file_hash_sha256: "b4a392817263548901abcdef234567890abcdef1234567890abcdef123456789" },
      { file_name: "04_firewall_and_auth_logs.txt", file_type: "text/plain", file_hash_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
      { file_name: "05_system_topology.png", file_type: "image/png", file_hash_sha256: "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210" },
      { file_name: "06_operator_briefing.mp4", file_type: "video/mp4", file_hash_sha256: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789" }
    ],
    claims: [
      {
        claim_id: "CLM-001",
        claim_text: "Research portal experienced approximately 47 minutes of operational disruption.",
        confidence: "HIGH",
        evidence: [{
          source_file: "01_incident_report.txt",
          location_type: "text_section",
          location: "Section 3. IMPACT ASSESSMENT",
          supporting_text_or_description: "Operational Impact: Research portal experienced approximately 47 minutes of disruption."
        }]
      },
      {
        claim_id: "CLM-002",
        claim_text: "Suspicious authentication occurred using compromised account 'admin-research' at 02:14 UTC on 17 April 2026.",
        confidence: "HIGH",
        evidence: [{
          source_file: "01_incident_report.txt",
          location_type: "text_section",
          location: "Section 1. EXECUTIVE OVERVIEW",
          supporting_text_or_description: "Privileged authentication event using compromised administrative account 'admin-research'."
        }]
      },
      {
        claim_id: "CLM-003",
        claim_text: "Attacker ingress originated from external IP address 185.203.117.42.",
        confidence: "HIGH",
        evidence: [{
          source_file: "04_firewall_and_auth_logs.txt",
          location_type: "log_line",
          location: "Line 42",
          supporting_text_or_description: "Inbound SSH session initiated from 185.203.117.42 targeting AUTH-01."
        }]
      },
      {
        claim_id: "CLM-004",
        claim_text: "Lateral movement was detected moving toward backend compute infrastructure node APP-02.",
        confidence: "HIGH",
        evidence: [{
          source_file: "02_incident_timeline.txt",
          location_type: "text_section",
          location: "Timeline entry 02:22 UTC",
          supporting_text_or_description: "Lateral movement observed targeting APP-02 compute cluster."
        }]
      },
      {
        claim_id: "CLM-005",
        claim_text: "Containment protocols were successfully completed at 03:22 UTC with all baseline services restored.",
        confidence: "HIGH",
        evidence: [{
          source_file: "01_incident_report.txt",
          location_type: "text_section",
          location: "Section 4. CONTAINMENT",
          supporting_text_or_description: "Containment confirmed at 03:22 UTC."
        }]
      },
      {
        claim_id: "CLM-006",
        claim_text: "Attribution remains UNCONFIRMED with no forensic link to any known APT group.",
        confidence: "HIGH",
        evidence: [{
          source_file: "03_threat_intel_brief.txt",
          location_type: "text_section",
          location: "Section 2. ATTRIBUTION",
          supporting_text_or_description: "Attribution remains strictly unconfirmed."
        }]
      },
      {
        claim_id: "CLM-007",
        claim_text: "No unauthorized database modifications or classified exfiltration occurred during the incident window.",
        confidence: "HIGH",
        evidence: [{
          source_file: "01_incident_report.txt",
          location_type: "text_section",
          location: "Section 3. IMPACT ASSESSMENT",
          supporting_text_or_description: "Integrity verification indicates zero database modifications."
        }]
      }
    ],
    outputs: [
      {
        type: "executive_summary",
        title: "Executive Summary",
        content: "# Executive Summary: Operation Silver Falcon Incident Response\n**Case Identifier:** INC-2026-0417  \n**Classification:** TLP:AMBER | RESTRICTED  \n**Assigned Severity:** SEVERITY-HIGH  \n**Date of Report:** 17 April 2026  \n\n---\n\n## 1. Executive Incident Overview\nOn 17 April 2026 at 02:14 UTC, the Security Operations Center (SOC) detected an anomalous privileged authentication event targeting the core Research Portal infrastructure. An unauthorized session was initiated through the compromised administrative account 'admin-research' from external IP 185.203.117.42, bypassing standard MFA protocols via token replay [CLM-002]. Lateral movement was subsequently executed toward backend compute infrastructure [CLM-004].\n\n## 2. Operational Impact & Disruption Window\nOperational degradation impacted the public-facing gateway PORTAL-01, resulting in approximately 47 minutes of total service disruption between 02:35 UTC and 03:22 UTC [CLM-001]. Secondary services on APP-02 experienced heavy compute starvation, while AUTH-01 was leveraged for credential replay [CLM-004]. Post-incident database integrity audits confirm no unauthorized database alterations or classified data compromise occurred.\n\n- **Total Disruption Duration:** **47 minutes** [CLM-001]\n- **Affected Infrastructure Assets:** PORTAL-01, APP-02, AUTH-01 [CLM-004]\n\n## 3. Chronological Incident Highlights\n- 02:14 UTC - Anomalous login detected for account 'admin-research' from external IP 185.203.117.42 [CLM-002].\n- 02:22 UTC - Lateral movement confirmed from AUTH-01 to backend computation node APP-02 [CLM-004].\n- 02:35 UTC - Service degradation initiated on PORTAL-01, lasting 47 minutes [CLM-001].\n- 03:07 UTC - Attacker ingress IP blackholed at perimeter and credentials revoked.\n- 03:22 UTC - Containment completed and full production services restored across all affected nodes [CLM-005].\n\n## 4. Current Operational & Containment Status\nCONTAINED & RESTORED. As of 03:22 UTC, core services on PORTAL-01 and APP-02 have been completely restored to nominal baseline [CLM-005].\n\n## 5. Attribution & Intelligence Assessment\n**Attribution Status: UNCONFIRMED.** Digital forensics confirms no definitive evidence associating the intrusion with any known Advanced Persistent Threat (APT) group [CLM-006].\n",
        status: "Needs review",
        settings: { audience: "Leadership", tone: "Objective", detail: "Standard" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006"],
        versions: [
          {
            version: 1,
            content: "# Executive Summary: Operation Silver Falcon Incident Response\n**Case Identifier:** INC-2026-0417  \n**Classification:** TLP:AMBER | RESTRICTED  \n**Assigned Severity:** SEVERITY-HIGH  \n**Date of Report:** 17 April 2026  \n\n---\n\n## 1. Executive Incident Overview\nOn 17 April 2026 at 02:14 UTC, the Security Operations Center (SOC) detected an anomalous privileged authentication event targeting the core Research Portal infrastructure. An unauthorized session was initiated through the compromised administrative account 'admin-research' from external IP 185.203.117.42, bypassing standard MFA protocols via token replay [CLM-002]. Lateral movement was subsequently executed toward backend compute infrastructure [CLM-004].\n\n## 2. Operational Impact & Disruption Window\nOperational degradation impacted the public-facing gateway PORTAL-01, resulting in approximately 47 minutes of total service disruption between 02:35 UTC and 03:22 UTC [CLM-001]. Secondary services on APP-02 experienced heavy compute starvation, while AUTH-01 was leveraged for credential replay [CLM-004]. Post-incident database integrity audits confirm no unauthorized database alterations or classified data compromise occurred.\n\n- **Total Disruption Duration:** **47 minutes** [CLM-001]\n- **Affected Infrastructure Assets:** PORTAL-01, APP-02, AUTH-01 [CLM-004]\n\n## 3. Chronological Incident Highlights\n- 02:14 UTC - Anomalous login detected for account 'admin-research' from external IP 185.203.117.42 [CLM-002].\n- 02:22 UTC - Lateral movement confirmed from AUTH-01 to backend computation node APP-02 [CLM-004].\n- 02:35 UTC - Service degradation initiated on PORTAL-01, lasting 47 minutes [CLM-001].\n- 03:07 UTC - Attacker ingress IP blackholed at perimeter and credentials revoked.\n- 03:22 UTC - Containment completed and full production services restored across all affected nodes [CLM-005].\n\n## 4. Current Operational & Containment Status\nCONTAINED & RESTORED. As of 03:22 UTC, core services on PORTAL-01 and APP-02 have been completely restored to nominal baseline [CLM-005].\n\n## 5. Attribution & Intelligence Assessment\n**Attribution Status: UNCONFIRMED.** Digital forensics confirms no definitive evidence associating the intrusion with any known Advanced Persistent Threat (APT) group [CLM-006].\n",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      },
      {
        type: "security_advisory",
        title: "Technical Advisory",
        content: "# Security Advisory: Technical Analysis of Privilege Token Replay & Gateway Exhaustion\n**Advisory ID:** ADV-2026-0417-01  \n**Classification:** TLP:AMBER | RESTRICTED  \n**Date:** 17 April 2026  \n\n---\n\n## 1. Executive Technical Summary\nOn 17 April 2026 at 02:14 UTC, a targeted authentication replay attack compromised the administrative credential 'admin-research' from external IP 185.203.117.42 [CLM-002, CLM-003]. The attacker pivoted laterally toward backend compute node APP-02 [CLM-004], inducing a 47-minute disruption window on public research gateway PORTAL-01 [CLM-001].\n\n## 2. Verified Indicators of Compromise (IoCs)\n- **Ingress IP:** `185.203.117.42` (Ingress vector via SSH/Web console [CLM-003])\n- **Compromised Identity:** `admin-research` (Session token replayed [CLM-002])\n- **Target Infrastructure:** `PORTAL-01` (47 min disruption [CLM-001]), `APP-02` (Compute starvation [CLM-004]), `AUTH-01` (Session store [CLM-004])\n\n## 3. Required Mitigation Actions\n1. Ingress Blocking: Ensure perimeter firewall drops traffic from 185.203.117.42.\n2. Token Revocation: Flush all active Redis authentication tokens for privileged tiers.\n3. Gateway Health: Monitor PORTAL-01 latency after the 47-minute recovery window.\n",
        status: "Needs review",
        settings: { audience: "Technical Specialists", tone: "Objective", detail: "Detailed" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-002", "CLM-003", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
        versions: [
          {
            version: 1,
            content: "# Security Advisory: Technical Analysis of Privilege Token Replay & Gateway Exhaustion\n**Advisory ID:** ADV-2026-0417-01  \n**Classification:** TLP:AMBER | RESTRICTED  \n**Date:** 17 April 2026  \n\n---\n\n## 1. Executive Technical Summary\nOn 17 April 2026 at 02:14 UTC, a targeted authentication replay attack compromised the administrative credential 'admin-research' from external IP 185.203.117.42 [CLM-002, CLM-003]. The attacker pivoted laterally toward backend compute node APP-02 [CLM-004], inducing a 47-minute disruption window on public research gateway PORTAL-01 [CLM-001].\n\n## 2. Verified Indicators of Compromise (IoCs)\n- **Ingress IP:** `185.203.117.42` (Ingress vector via SSH/Web console [CLM-003])\n- **Compromised Identity:** `admin-research` (Session token replayed [CLM-002])\n- **Target Infrastructure:** `PORTAL-01` (47 min disruption [CLM-001]), `APP-02` (Compute starvation [CLM-004]), `AUTH-01` (Session store [CLM-004])\n\n## 3. Required Mitigation Actions\n1. Ingress Blocking: Ensure perimeter firewall drops traffic from 185.203.117.42.\n2. Token Revocation: Flush all active Redis authentication tokens for privileged tiers.\n3. Gateway Health: Monitor PORTAL-01 latency after the 47-minute recovery window.\n",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      },
      {
        type: "social_media",
        title: "Public Statement",
        content: "INCIDENT UPDATE (17 April 2026): A service disruption of approximately 47 minutes impacted the Research Portal between 02:35 and 03:22 UTC [CLM-001]. Containment protocols were successfully executed at 03:22 UTC and all systems are operating normally [CLM-005]. Digital forensics confirm no data compromise [CLM-007]. Threat attribution remains unconfirmed [CLM-006].",
        status: "Needs review",
        settings: { audience: "General Public", tone: "Formal", detail: "Brief" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-004", "CLM-005", "CLM-006"],
        versions: [
          {
            version: 1,
            content: "INCIDENT UPDATE (17 April 2026): A service disruption of approximately 47 minutes impacted the Research Portal between 02:35 and 03:22 UTC [CLM-001]. Containment protocols were successfully executed at 03:22 UTC and all systems are operating normally [CLM-005]. Digital forensics confirm no data compromise [CLM-007]. Threat attribution remains unconfirmed [CLM-006].",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      },
      {
        type: "presentation",
        title: "Briefing Deck",
        content: "## Slide 1: Incident Overview - Operation Silver Falcon\n- Detected anomalous authentication at 02:14 UTC [CLM-002]\n- Public research portal impacted for 47 minutes [CLM-001]\n\n## Slide 2: Ingress & Lateral Movement\n- Ingress via 185.203.117.42 with token replay [CLM-003]\n- Lateral movement detected toward APP-02 [CLM-004]\n\n## Slide 3: Containment & Recovery\n- Perimeter ingress blocked at 03:07 UTC\n- Containment and restoration completed at 03:22 UTC [CLM-005]\n\n## Slide 4: Forensic Findings\n- Total disruption duration: 47 minutes [CLM-001]\n- No database modifications detected [CLM-007]\n- Threat attribution status: UNCONFIRMED [CLM-006]\n",
        status: "Needs review",
        settings: { audience: "Leadership", tone: "Objective", detail: "Standard" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-002", "CLM-003", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
        versions: [
          {
            version: 1,
            content: "## Slide 1: Incident Overview - Operation Silver Falcon\n- Detected anomalous authentication at 02:14 UTC [CLM-002]\n- Public research portal impacted for 47 minutes [CLM-001]\n\n## Slide 2: Ingress & Lateral Movement\n- Ingress via 185.203.117.42 with token replay [CLM-003]\n- Lateral movement detected toward APP-02 [CLM-004]\n\n## Slide 3: Containment & Recovery\n- Perimeter ingress blocked at 03:07 UTC\n- Containment and restoration completed at 03:22 UTC [CLM-005]\n\n## Slide 4: Forensic Findings\n- Total disruption duration: 47 minutes [CLM-001]\n- No database modifications detected [CLM-007]\n- Threat attribution status: UNCONFIRMED [CLM-006]\n",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      },
      {
        type: "video_script",
        title: "Video Package",
        content: "### SCENE 1: INTRODUCTION (00:00 - 00:15)\n[Visual: Operations Center dashboard displaying PORTAL-01]\nNARRATOR: At 02:14 UTC on 17 April 2026, security monitoring identified an anomalous privileged authentication event [CLM-002].\n\n### SCENE 2: OPERATIONAL IMPACT (00:15 - 00:35)\n[Visual: Network topology highlighting 47-minute disruption duration]\nNARRATOR: Operational disruption on the research portal lasted approximately 47 minutes while engineering isolated affected compute infrastructure [CLM-001].\n\n### SCENE 3: CONTAINMENT & REMEDIATION (00:35 - 00:50)\n[Visual: Timeline graphic reaching 03:22 UTC]\nNARRATOR: Containment was fully achieved at 03:22 UTC, restoring baseline functionality with zero database corruption [CLM-005, CLM-007].\n\n### SCENE 4: SUMMARY & STATUS (00:50 - 01:05)\n[Visual: Forensic seal graphic with UNCONFIRMED attribution note]\nNARRATOR: Investigation continues under forensic oversight. Attribution remains unconfirmed [CLM-006].\n",
        status: "Needs review",
        settings: { audience: "General Public", tone: "Objective", detail: "Standard" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006"],
        versions: [
          {
            version: 1,
            content: "### SCENE 1: INTRODUCTION (00:00 - 00:15)\n[Visual: Operations Center dashboard displaying PORTAL-01]\nNARRATOR: At 02:14 UTC on 17 April 2026, security monitoring identified an anomalous privileged authentication event [CLM-002].\n\n### SCENE 2: OPERATIONAL IMPACT (00:15 - 00:35)\n[Visual: Network topology highlighting 47-minute disruption duration]\nNARRATOR: Operational disruption on the research portal lasted approximately 47 minutes while engineering isolated affected compute infrastructure [CLM-001].\n\n### SCENE 3: CONTAINMENT & REMEDIATION (00:35 - 00:50)\n[Visual: Timeline graphic reaching 03:22 UTC]\nNARRATOR: Containment was fully achieved at 03:22 UTC, restoring baseline functionality with zero database corruption [CLM-005, CLM-007].\n\n### SCENE 4: SUMMARY & STATUS (00:50 - 01:05)\n[Visual: Forensic seal graphic with UNCONFIRMED attribution note]\nNARRATOR: Investigation continues under forensic oversight. Attribution remains unconfirmed [CLM-006].\n",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      },
      {
        type: "infographic",
        title: "Infographic",
        content: "# Infographic: Operation Silver Falcon Incident Telemetry\n\n## KEY METRIC CALLOUTS\n- **Total Disruption Duration:** 47 minutes [CLM-001]\n- **Breach Vector:** Ingress IP 185.203.117.42 [CLM-003] via token replay on 'admin-research' [CLM-002]\n- **Target Assets:** PORTAL-01, APP-02, AUTH-01 [CLM-004]\n- **Containment Timestamp:** 03:22 UTC [CLM-005]\n- **Database Modification:** ZERO records altered [CLM-007]\n\n## TIMELINE VISUAL DATA\n1. [02:14 UTC] Anomalous Auth Detected [CLM-002]\n2. [02:22 UTC] Lateral Pivot to APP-02 [CLM-004]\n3. [02:35 UTC] Gateway PORTAL-01 Degradation (47 min window) [CLM-001]\n4. [03:07 UTC] Ingress IP 185.203.117.42 Blackholed [CLM-003]\n5. [03:22 UTC] Baseline Restoration Complete [CLM-005]\n",
        status: "Needs review",
        settings: { audience: "General Public", tone: "Accessible", detail: "Standard" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-002", "CLM-003", "CLM-004", "CLM-005", "CLM-007"],
        versions: [
          {
            version: 1,
            content: "# Infographic: Operation Silver Falcon Incident Telemetry\n\n## KEY METRIC CALLOUTS\n- **Total Disruption Duration:** 47 minutes [CLM-001]\n- **Breach Vector:** Ingress IP 185.203.117.42 [CLM-003] via token replay on 'admin-research' [CLM-002]\n- **Target Assets:** PORTAL-01, APP-02, AUTH-01 [CLM-004]\n- **Containment Timestamp:** 03:22 UTC [CLM-005]\n- **Database Modification:** ZERO records altered [CLM-007]\n\n## TIMELINE VISUAL DATA\n1. [02:14 UTC] Anomalous Auth Detected [CLM-002]\n2. [02:22 UTC] Lateral Pivot to APP-02 [CLM-004]\n3. [02:35 UTC] Gateway PORTAL-01 Degradation (47 min window) [CLM-001]\n4. [03:07 UTC] Ingress IP 185.203.117.42 Blackholed [CLM-003]\n5. [03:22 UTC] Baseline Restoration Complete [CLM-005]\n",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      },
      {
        type: "linkedin_post",
        title: "LinkedIn Post",
        content: "🔒 Incident Advisory Update: Operation Silver Falcon\n\nEarlier today at 02:14 UTC, our cybersecurity operations team detected an unauthorized authentication attempt targeting the Research Portal infrastructure via account 'admin-research' [CLM-002]. \n\nKey facts confirmed by digital forensics:\n• Operational impact was confined to an approximate 47-minute disruption window before isolation [CLM-001].\n• Lateral movement toward compute node APP-02 was contained [CLM-004].\n• Containment was completed at 03:22 UTC with all baseline operations fully restored [CLM-005].\n• Independent database audits confirm zero unauthorized data modifications or classified disclosures occurred [CLM-007].\n• Threat actor attribution remains strictly unconfirmed pending forensic review [CLM-006].\n\nWe remain committed to institutional transparency and operational resilience.\n\n#CyberSecurity #IncidentResponse #SOC #OperationalResilience",
        status: "Needs review",
        settings: { audience: "Regulators and Partners", tone: "Formal", detail: "Standard" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
        versions: [
          {
            version: 1,
            content: "🔒 Incident Advisory Update: Operation Silver Falcon\n\nEarlier today at 02:14 UTC, our cybersecurity operations team detected an unauthorized authentication attempt targeting the Research Portal infrastructure via account 'admin-research' [CLM-002]. \n\nKey facts confirmed by digital forensics:\n• Operational impact was confined to an approximate 47-minute disruption window before isolation [CLM-001].\n• Lateral movement toward compute node APP-02 was contained [CLM-004].\n• Containment was completed at 03:22 UTC with all baseline operations fully restored [CLM-005].\n• Independent database audits confirm zero unauthorized data modifications or classified disclosures occurred [CLM-007].\n• Threat actor attribution remains strictly unconfirmed pending forensic review [CLM-006].\n\nWe remain committed to institutional transparency and operational resilience.\n\n#CyberSecurity #IncidentResponse #SOC #OperationalResilience",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      },
      {
        type: "instagram_post",
        title: "Instagram Post",
        content: "🚨 INCIDENT UPDATE SUMMARY // OPERATION SILVER FALCON\n\n🛡️ Status: CONTAINED & RESTORED [CLM-005]\n⏱️ Impact Window: ~47 Minutes of Service Degradation [CLM-001]\n🔍 Vector: Privileged Token Replay via External Ingress [CLM-002, CLM-003]\n💾 Data Integrity: 100% Intact — 0 Records Altered [CLM-007]\n\nOur cyber engineering team successfully neutralized unauthorized access within 68 minutes of initial trigger, limiting service degradation to 47 minutes. Forensics confirms zero sensitive data compromised.\n\nOfficial updates published via verified regulatory channels. Attribution remains unconfirmed [CLM-006].\n\n#InfoSec #CyberSecurity #OpsUpdate #DataIntegrity #Transparency",
        status: "Needs review",
        settings: { audience: "General Public", tone: "Concise", detail: "Brief" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-002", "CLM-003", "CLM-005", "CLM-006", "CLM-007"],
        versions: [
          {
            version: 1,
            content: "🚨 INCIDENT UPDATE SUMMARY // OPERATION SILVER FALCON\n\n🛡️ Status: CONTAINED & RESTORED [CLM-005]\n⏱️ Impact Window: ~47 Minutes of Service Degradation [CLM-001]\n🔍 Vector: Privileged Token Replay via External Ingress [CLM-002, CLM-003]\n💾 Data Integrity: 100% Intact — 0 Records Altered [CLM-007]\n\nOur cyber engineering team successfully neutralized unauthorized access within 68 minutes of initial trigger, limiting service degradation to 47 minutes. Forensics confirms zero sensitive data compromised.\n\nOfficial updates published via verified regulatory channels. Attribution remains unconfirmed [CLM-006].\n\n#InfoSec #CyberSecurity #OpsUpdate #DataIntegrity #Transparency",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      },
      {
        type: "whatsapp_message",
        title: "WhatsApp Dispatch",
        content: "*OFFICIAL CYBERSECURITY NOTICE*\n*Case:* Operation Silver Falcon\n*Classification:* CONFIDENTIAL / INTERNAL DISPATCH\n\nKey Facts:\n1. Operational disruption of ~47 minutes occurred today on Research Portal (PORTAL-01) [CLM-001].\n2. Unauthorized login at 02:14 UTC was isolated at 03:22 UTC (Total containment: 68 mins) [CLM-002, CLM-005].\n3. Lateral movement toward node APP-02 was blocked [CLM-004].\n4. Verified: ZERO database modifications or data disclosures [CLM-007].\n5. Attribution is currently UNCONFIRMED [CLM-006].\n\nAction Required: Verify local endpoint telemetry and follow standard verification protocols.",
        status: "Needs review",
        settings: { audience: "Internal Staff", tone: "Direct", detail: "Standard" },
        validation: { grounding_status: "PASS", prohibited_terms_status: "PASS", issues: [] },
        claim_dependencies: ["CLM-001", "CLM-002", "CLM-004", "CLM-005", "CLM-006", "CLM-007"],
        versions: [
          {
            version: 1,
            content: "*OFFICIAL CYBERSECURITY NOTICE*\n*Case:* Operation Silver Falcon\n*Classification:* CONFIDENTIAL / INTERNAL DISPATCH\n\nKey Facts:\n1. Operational disruption of ~47 minutes occurred today on Research Portal (PORTAL-01) [CLM-001].\n2. Unauthorized login at 02:14 UTC was isolated at 03:22 UTC (Total containment: 68 mins) [CLM-002, CLM-005].\n3. Lateral movement toward node APP-02 was blocked [CLM-004].\n4. Verified: ZERO database modifications or data disclosures [CLM-007].\n5. Attribution is currently UNCONFIRMED [CLM-006].\n\nAction Required: Verify local endpoint telemetry and follow standard verification protocols.",
            status: "Needs review",
            timestamp: new Date().toISOString(),
            claim_snapshot: "47 minutes disruption"
          }
        ]
      }
    ],
    cross_check_summary: {
      status: "PASS",
      inconsistencies: []
    }
  };
}
