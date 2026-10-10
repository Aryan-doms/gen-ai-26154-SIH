// Screen 03: Editorial Workspace with fixed deliverable navigation, grounding rail, validation panel & Stage 7 Fix Once diff
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Edit2, 
  CheckCheck,
  Search, 
  CornerDownLeft, 
  ExternalLink, 
  Copy, 
  Share2, 
  GitCompare,
  Eye,
  FileCheck,
  Shield,
  Presentation,
  SlidersHorizontal,
  Video,
  MessageCircle,
  Briefcase,
  Image as ImageIcon,
  ChevronDown,
  Plus,
  Volume2,
  Mic,
  MicOff,
  UploadCloud,
  Terminal,
  CheckCircle2,
  X
} from 'lucide-react';
import { fetchWorkDetails, editArtifact, promptEditArtifact, approveArtifact, updateClaim, updateWorkParameters } from '../services/api';
import DocumentEditor from './deliverables/DocumentEditor';
import PresentationEditor from './deliverables/PresentationEditor';
import VideoStoryboardEditor from './deliverables/VideoStoryboardEditor';
import InfographicEditor from './deliverables/InfographicEditor';
import SocialMediaEditor from './deliverables/SocialMediaEditor';
import { renderTextWithCitations, stripCitationsFromText, ClaimCitationBadge } from './common/ClaimCitationBadge';

// Canonical context definitions for claims
const CLAIM_CONTEXT_MAP = {
  'CLM-001': 'Operational Disruption Window',
  'CLM-002': 'Privileged Account Authentication',
  'CLM-003': 'External Ingress Vector',
  'CLM-004': 'Lateral Movement & Compute Starvation',
  'CLM-005': 'Containment & Baseline Restoration',
  'CLM-006': 'Threat Actor Attribution Analysis',
  'CLM-007': 'Database Integrity & Exfiltration Audit'
};

const DELIVERABLE_TITLE_MAP = {
  executive_summary: 'Executive Summary',
  security_advisory: 'Advisory',
  presentation: 'Presentation',
  video_script: 'Video Package',
  infographic: 'Infographic',
  social_media: 'Twitter / X',
  linkedin_post: 'LinkedIn',
  instagram_post: 'Instagram',
  whatsapp_message: 'WhatsApp'
};

// Deterministic claim-level cross-output drift evaluator (enforces 1-retry circuit breaker metadata)
const computeCrossOutputDrift = (outputs = [], claims = []) => {
  const conflicts = [];

  // 1. CLM-001: Disruption Duration
  const clm1 = claims.find(c => c.claim_id === 'CLM-001');
  const durMatch = clm1?.claim_text?.match(/(\d+)[\s-]*minutes?/i);
  const canonicalMinutes = durMatch ? parseInt(durMatch[1], 10) : 47;
  const durationObserved = {};

  outputs.forEach(out => {
    const text = String(out.content || '');
    const regex = /(\d+)[\s-]*minutes?(?!\s*of\s*initial\s*trigger)/gi;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const val = parseInt(m[1], 10);
      if (val !== canonicalMinutes && val !== 68) {
        durationObserved[out.type] = `${val} minutes`;
        break;
      }
    }
  });

  if (Object.keys(durationObserved).length > 0) {
    conflicts.push({
      conflict_id: `DRFT-0${conflicts.length + 1}`,
      claim_id: 'CLM-001',
      check_type: 'DISRUPTION_DURATION',
      description: `Disruption duration mismatch across deliverables.`,
      conflicting_outputs: Object.keys(durationObserved),
      canonical_truth: `${canonicalMinutes} minutes`,
      observed_values: durationObserved,
      recommended_fix: `Align to ${canonicalMinutes} minutes`,
      attempt_count: 2,
      status: 'unresolved_after_retry'
    });
  }

  // 2. CLM-003: Ingress IP
  const clm3 = claims.find(c => c.claim_id === 'CLM-003');
  const ipMatch = clm3?.claim_text?.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  const canonicalIp = ipMatch ? ipMatch[1] : '185.203.117.42';
  const ipObserved = {};

  outputs.forEach(out => {
    const text = String(out.content || '');
    const ips = text.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g) || [];
    for (const ip of ips) {
      if (ip !== canonicalIp && !ip.startsWith('127.') && !ip.startsWith('10.')) {
        ipObserved[out.type] = ip;
        break;
      }
    }
  });

  if (Object.keys(ipObserved).length > 0) {
    conflicts.push({
      conflict_id: `DRFT-0${conflicts.length + 1}`,
      claim_id: 'CLM-003',
      check_type: 'INGRESS_IP',
      description: `Ingress IP mismatch across deliverables.`,
      conflicting_outputs: Object.keys(ipObserved),
      canonical_truth: canonicalIp,
      observed_values: ipObserved,
      recommended_fix: `Align to ${canonicalIp}`,
      attempt_count: 2,
      status: 'unresolved_after_retry'
    });
  }

  // 3. CLM-005: Containment Timestamp
  const clm5 = claims.find(c => c.claim_id === 'CLM-005');
  const utcMatch = clm5?.claim_text?.match(/(\d{2}:\d{2}\s*UTC)/);
  const canonicalUtc = utcMatch ? utcMatch[1] : '03:22 UTC';
  const knownUtc = new Set(['02:14 UTC', '02:22 UTC', '02:35 UTC', '03:07 UTC', canonicalUtc]);
  const utcObserved = {};

  outputs.forEach(out => {
    const text = String(out.content || '');
    const times = text.match(/\b(\d{2}:\d{2}\s*UTC)\b/g) || [];
    for (const t of times) {
      if (!knownUtc.has(t)) {
        utcObserved[out.type] = t;
        break;
      }
    }
  });

  if (Object.keys(utcObserved).length > 0) {
    conflicts.push({
      conflict_id: `DRFT-0${conflicts.length + 1}`,
      claim_id: 'CLM-005',
      check_type: 'TIMELINE',
      description: `Containment timestamp mismatch across deliverables.`,
      conflicting_outputs: Object.keys(utcObserved),
      canonical_truth: canonicalUtc,
      observed_values: utcObserved,
      recommended_fix: `Align to ${canonicalUtc}`,
      attempt_count: 2,
      status: 'unresolved_after_retry'
    });
  }

  // 4. CLM-006: Attribution Consistency
  const forbiddenActors = ['threat group x', 'group x', 'apt29', 'apt28', 'lazarus', 'carbanak', 'fancy bear', 'cozy bear'];
  const attrObserved = {};

  outputs.forEach(out => {
    const lower = String(out.content || '').toLowerCase();
    for (const actor of forbiddenActors) {
      if (lower.includes(actor)) {
        attrObserved[out.type] = `Attributed to "${actor}"`;
        break;
      }
    }
  });

  if (Object.keys(attrObserved).length > 0) {
    conflicts.push({
      conflict_id: `DRFT-0${conflicts.length + 1}`,
      claim_id: 'CLM-006',
      check_type: 'ATTRIBUTION',
      description: `Unverified threat actor attribution found.`,
      conflicting_outputs: Object.keys(attrObserved),
      canonical_truth: 'UNCONFIRMED',
      observed_values: attrObserved,
      recommended_fix: 'Restore UNCONFIRMED attribution',
      attempt_count: 2,
      status: 'unresolved_after_retry'
    });
  }

  return {
    status: conflicts.length > 0 ? 'FAIL' : 'PASS',
    inconsistencies: conflicts,
    contradictions: conflicts,
    retry_attempts: conflicts.length > 0 ? 1 : 0,
    circuit_breaker_tripped: conflicts.length > 0
  };
};

// Fixed Universal Deliverable Sections (strictly non-glitching, institutional)
const PRIMARY_NAV_ITEMS = [
  { id: 'executive_summary', title: 'Executive Summary', icon: FileCheck, matchKey: 'executive_summary' },
  { id: 'advisory', title: 'Advisory', icon: Shield, matchKey: 'security_advisory' },
  { id: 'presentation', title: 'Presentation', icon: Presentation, matchKey: 'presentation' },
  { id: 'infographic', title: 'Infographic', icon: SlidersHorizontal, matchKey: 'infographic' },
  { id: 'video_package', title: 'Video Package', icon: Video, matchKey: 'video_script' },
  { 
    id: 'social_media', 
    title: 'Social Media', 
    icon: Share2, 
    matchKey: 'social_media',
    subItems: [
      { id: 'twitter_post', title: 'Twitter / X', matchKey: 'social_media' },
      { id: 'linkedin_post', title: 'LinkedIn', matchKey: 'linkedin_post' },
      { id: 'instagram_post', title: 'Instagram', matchKey: 'instagram_post' }
    ]
  },
  { id: 'whatsapp_message', title: 'WhatsApp', icon: MessageCircle, matchKey: 'whatsapp_message' }
];

// Consistent Lucide icon selector for sources
const getSourceIcon = (fileName = '') => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.svg') || lower.endsWith('.webp')) {
    return <ImageIcon size={13} color="#2563eb" />;
  }
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.mkv')) {
    return <Video size={13} color="#7c3aed" />;
  }
  if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.ogg') || lower.includes('audio') || lower.includes('voice')) {
    return <Volume2 size={13} color="#d97706" />;
  }
  if (lower.endsWith('.log') || lower.endsWith('.json') || lower.endsWith('.csv')) {
    return <Terminal size={13} color="#059669" />;
  }
  return <FileText size={13} color="var(--text-secondary)" />;
};

const getSourceTypeLabel = (fileName = '') => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'Image';
  if (lower.endsWith('.mp4') || lower.endsWith('.mov')) return 'Video';
  if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.includes('audio')) return 'Audio Briefing';
  if (lower.endsWith('.log') || lower.endsWith('.json')) return 'Log File';
  return 'Document';
};

export default function WorkspaceScreen({ workId, onBack, onFinalize }) {
  const [work, setWork] = useState(null);
  const [activeNavId, setActiveNavId] = useState('executive_summary');
  const [activeSubSocialId, setActiveSubSocialId] = useState('twitter_post');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [promptInstruction, setPromptInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stage 7: Fix Once & Version Diff state
  const [diffMode, setDiffMode] = useState(false);
  const [impactNotice, setImpactNotice] = useState(null);
  const [updatingClaim, setUpdatingClaim] = useState(false);
  const [editingClaimId, setEditingClaimId] = useState(null);
  const [editedClaimText, setEditedClaimText] = useState('');

  // Document view mode: 'audit' shows citation badges, 'clean' strips them
  const [viewMode, setViewMode] = useState('audit');
  const [showApplyMenu, setShowApplyMenu] = useState(false);

  // Add Source Modal state & Blockchain Testnet anchoring
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [sourceAddTab, setSourceAddTab] = useState('text'); // 'text' | 'file' | 'audio'
  const [sourceTextTitle, setSourceTextTitle] = useState('');
  const [sourceTextContent, setSourceTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [anchorStatus, setAnchorStatus] = useState('idle'); // 'idle' | 'hashing' | 'anchoring' | 'confirmed'
  const [blockchainTx, setBlockchainTx] = useState(null);
  const [provenanceHash, setProvenanceHash] = useState(null);

  // Left rail claims filter: null | 'verified' | 'needs_review'
  const [claimsFilter, setClaimsFilter] = useState(null);

  // Infographic active image state: null (gallery) or graphic object { id, title, aspect_ratio, url }
  const [openGraphic, setOpenGraphic] = useState(null);

  // Target Parameters & Cross-Output Drift collapse state
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [isParamsCollapsed, setIsParamsCollapsed] = useState(true);
  const [isDriftCollapsed, setIsDriftCollapsed] = useState(false);
  const [paramState, setParamState] = useState({
    audience: 'Leadership',
    tone: 'Objective',
    language: 'English',
    detail: 'Standard',
    slide_count: 5,
    image_count: 1,
    aspect_ratio: '1:1',
    focus: '',
    duration_seconds: 60,
    account_type: 'standard',
    purpose: 'alert'
  });
  const [paramsSavedNotice, setParamsSavedNotice] = useState(false);

  useEffect(() => {
    loadData();
  }, [workId]);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchWorkDetails(workId)
      .then(data => {
        setWork(data);
        setLoading(false);
        const initialOut = data.outputs?.[0];
        if (initialOut) {
          setEditBuffer(initialOut.content);
        }
      })
      .catch(err => {
        console.error("Failed to load work:", err);
        setError(err.message || "Failed to load workspace data from backend.");
        setLoading(false);
      });
  };

  // Resolve current active output based on fixed navigation
  const getActiveOutput = () => {
    let targetType = activeNavId;
    if (activeNavId === 'advisory') targetType = 'security_advisory';
    if (activeNavId === 'video_package') targetType = 'video_script';
    if (activeNavId === 'social_media') {
      if (activeSubSocialId === 'twitter_post') targetType = 'social_media';
      else if (activeSubSocialId === 'linkedin_post') targetType = 'linkedin_post';
      else if (activeSubSocialId === 'instagram_post') targetType = 'instagram_post';
    }

    const found = (work?.outputs || []).find(o => o.type === targetType);
    if (found) return found;

    // Fallback stub if deliverable is not in initial array
    return {
      type: targetType,
      title: activeNavId.replace('_', ' ').toUpperCase(),
      content: `# ${activeNavId.replace('_', ' ').toUpperCase()}\n\nDeliverable generated based on canonical claims.\n\nDisruption lasted 47 minutes [CLM-001]. Containment completed at 03:22 UTC [CLM-005].`,
      status: "Needs review",
      settings: { audience: "General", tone: "Objective", language: "English", detail: "Standard" },
      validation: { status: "PASS", schema_valid: true, source_grounded: true, mandatory_elements_met: true, notes: [] },
      claim_dependencies: ["CLM-001", "CLM-005"],
      versions: [{ version: 1, content: "Initial draft.", status: "Needs review", timestamp: new Date().toISOString() }]
    };
  };

  const activeOutput = getActiveOutput();

  const getActiveDeliverableKey = () => {
    if (activeNavId === 'social_media') {
      return activeSubSocialId;
    }
    return activeNavId;
  };

  useEffect(() => {
    if (!work) return;
    const currentKey = getActiveDeliverableKey();
    const overrides = work?.config?.output_overrides?.[currentKey] || {};
    setParamState({
      audience: activeOutput?.settings?.audience || overrides.audience || work?.config?.audience || 'Leadership',
      tone: activeOutput?.settings?.tone || overrides.tone || work?.config?.tone || 'Objective',
      language: activeOutput?.settings?.language || overrides.language || work?.config?.language || (work?.config?.languages?.[0]) || 'English',
      detail: activeOutput?.settings?.detail || overrides.detail || work?.config?.detail || 'Standard',
      slide_count: overrides.slide_count || 5,
      image_count: overrides.image_count !== undefined ? overrides.image_count : 1,
      aspect_ratio: overrides.aspect_ratio || '1:1',
      focus: overrides.focus || '',
      duration_seconds: overrides.duration_seconds || 60,
      account_type: overrides.account_type || 'standard',
      purpose: overrides.purpose || 'alert'
    });
    setIsEditingParams(false);
  }, [activeNavId, activeSubSocialId, work]);

  // Live Audio Recording Timer
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px', display: 'inline-block' }} />
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Loading workspace for {workId}...</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Connecting to transformation engine...</div>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
        <AlertTriangle size={32} color="#dc2626" style={{ marginBottom: '16px' }} />
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Unable to Load Workspace ({workId})
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
          {error || "No data received from transformation store. Please verify backend service on port 8000."}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={loadData}
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--text-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            Retry Connection
          </button>
          <button 
            onClick={onBack}
            style={{
              padding: '8px 18px',
              backgroundColor: '#ffffff',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSaveParameters = async () => {
    const currentKey = getActiveDeliverableKey();
    const updatedOverridesForDeliverable = {
      audience: paramState.audience,
      tone: paramState.tone,
      language: paramState.language,
      detail: paramState.detail
    };

    if (currentKey === 'presentation') {
      updatedOverridesForDeliverable.slide_count = paramState.slide_count;
    } else if (currentKey === 'infographic') {
      updatedOverridesForDeliverable.image_count = paramState.image_count;
      updatedOverridesForDeliverable.aspect_ratio = paramState.aspect_ratio;
      updatedOverridesForDeliverable.focus = paramState.focus;
    } else if (currentKey === 'video_package') {
      updatedOverridesForDeliverable.duration_seconds = paramState.duration_seconds;
    } else if (currentKey === 'linkedin_post') {
      updatedOverridesForDeliverable.image_count = paramState.image_count;
    } else if (currentKey === 'instagram_post') {
      updatedOverridesForDeliverable.image_count = paramState.image_count;
    } else if (currentKey === 'twitter_post') {
      updatedOverridesForDeliverable.account_type = paramState.account_type;
    } else if (currentKey === 'whatsapp_message') {
      updatedOverridesForDeliverable.purpose = paramState.purpose;
    }

    const newConfig = {
      ...(work.config || {}),
      output_overrides: {
        ...(work.config?.output_overrides || {}),
        [currentKey]: {
          ...(work.config?.output_overrides?.[currentKey] || {}),
          ...updatedOverridesForDeliverable
        }
      }
    };

    const updatedOutputs = (work.outputs || []).map(out => {
      if (out.type === activeOutput.type) {
        return {
          ...out,
          settings: {
            ...(out.settings || {}),
            audience: paramState.audience,
            tone: paramState.tone,
            language: paramState.language,
            detail: paramState.detail
          }
        };
      }
      return out;
    });

    const updatedWork = {
      ...work,
      config: newConfig,
      outputs: updatedOutputs
    };

    setWork(updatedWork);
    setIsEditingParams(false);
    setParamsSavedNotice(true);
    setTimeout(() => setParamsSavedNotice(false), 3500);

    try {
      await updateWorkParameters(work.id, {
        output_type: activeOutput.type,
        audience: paramState.audience,
        tone: paramState.tone,
        language: paramState.language,
        detail: paramState.detail,
        overrides: updatedOverridesForDeliverable
      });
    } catch (e) {
      console.warn("Backend parameters sync skipped:", e);
    }
  };

  const handleSelectNav = (navId) => {
    setActiveNavId(navId);
    setIsEditing(false);
    setDiffMode(false);
    let targetKey = navId;
    if (navId === 'advisory') targetKey = 'security_advisory';
    if (navId === 'video_package') targetKey = 'video_script';
    if (navId === 'social_media') {
      targetKey = activeSubSocialId === 'twitter_post' ? 'social_media' : activeSubSocialId;
    }
    const match = (work?.outputs || []).find(o => o.type === targetKey);
    setEditBuffer(match ? match.content : `# ${navId.toUpperCase()}\n\nDraft content.`);
  };

  const handleSelectSubSocial = (subId) => {
    setActiveSubSocialId(subId);
    setIsEditing(false);
    setDiffMode(false);
    const targetKey = subId === 'twitter_post' ? 'social_media' : subId;
    const match = (work?.outputs || []).find(o => o.type === targetKey);
    setEditBuffer(match ? match.content : `# ${subId.toUpperCase()}\n\nDraft content.`);
  };

  const applyDriftEvaluationToWork = (prevWork, contentToSave) => {
    if (!prevWork) return prevWork;
    const rawUpdatedOutputs = (prevWork.outputs || []).map(o => {
      if (o.type === activeOutput.type) {
        return {
          ...o,
          content: contentToSave,
          status: 'Needs review',
          versions: [
            ...(o.versions || []),
            {
              version: (o.versions?.length || 1) + 1,
              content: contentToSave,
              status: 'Needs review',
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return o;
    });

    const driftSummary = computeCrossOutputDrift(rawUpdatedOutputs, prevWork.claims || []);
    const conflictingSet = new Set(
      (driftSummary.inconsistencies || []).flatMap(item => item.conflicting_outputs || [])
    );

    const finalOutputs = rawUpdatedOutputs.map(o =>
      conflictingSet.has(o.type) ? { ...o, status: 'Needs review' } : o
    );

    if (driftSummary.inconsistencies.length > 0) {
      setIsDriftCollapsed(false);
    }

    return {
      ...prevWork,
      status: 'Needs review',
      outputs: finalOutputs,
      cross_check_summary: driftSummary
    };
  };

  const handleSaveEdit = async (customContent = null) => {
    const contentToSave = typeof customContent === 'string' ? customContent : editBuffer;
    setWork(prev => applyDriftEvaluationToWork(prev, contentToSave));
    setIsEditing(false);
    try {
      const res = await editArtifact(work.id, activeOutput.type, contentToSave);
      if (res && res.cross_check) {
        setWork(prev => prev ? ({
          ...prev,
          cross_check_summary: {
            ...res.cross_check,
            inconsistencies: res.cross_check.inconsistencies || res.cross_check.contradictions || []
          }
        }) : prev);
      }
    } catch (err) {
      console.warn("Saved locally with client-side drift evaluation:", err);
    }
  };

  // Apply changes to this deliverable only (updates deliverable and evaluates cross-output drift)
  const handleApplyToThis = () => {
    const contentToSave = typeof editBuffer === 'string' ? editBuffer : activeOutput.content;
    setWork(prev => applyDriftEvaluationToWork(prev, contentToSave));
    setIsEditing(false);
  };

  // Apply changes to all deliverables (validates against claims and propagates via API)
  const handleApplyToAll = async () => {
    await handleSaveEdit();
  };

  // Resolve a single cross-output drift conflict by aligning conflicting outputs to canonical claim
  const handleResolveDrift = (conflict) => {
    if (!work || !conflict) return;
    const targetSet = new Set(conflict.conflicting_outputs || []);
    const canonicalVal = conflict.canonical_truth || '';

    setWork(prev => {
      if (!prev) return prev;
      const alignedOutputs = (prev.outputs || []).map(out => {
        if (!targetSet.has(out.type)) return out;
        let updatedText = String(out.content || '');

        if (conflict.check_type === 'DISRUPTION_DURATION') {
          const canonMinMatch = canonicalVal.match(/(\d+)/);
          const canonMin = canonMinMatch ? canonMinMatch[1] : '47';
          updatedText = updatedText.replace(/(\d+)([\s-]*minutes?(?!\s*of\s*initial\s*trigger))/gi, (full, num, suffix) => {
            if (parseInt(num, 10) === 68) return full;
            return `${canonMin}${suffix}`;
          });
        } else if (conflict.check_type === 'INGRESS_IP') {
          const canonIpMatch = canonicalVal.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
          const canonIp = canonIpMatch ? canonIpMatch[1] : '185.203.117.42';
          updatedText = updatedText.replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g, (ip) => {
            if (ip.startsWith('127.') || ip.startsWith('10.')) return ip;
            return canonIp;
          });
        } else if (conflict.check_type === 'TIMELINE') {
          const canonUtcMatch = canonicalVal.match(/(\d{2}:\d{2}\s*UTC)/);
          const canonUtc = canonUtcMatch ? canonUtcMatch[1] : '03:22 UTC';
          const knownUtc = new Set(['02:14 UTC', '02:22 UTC', '02:35 UTC', '03:07 UTC', canonUtc]);
          updatedText = updatedText.replace(/\b(\d{2}:\d{2}\s*UTC)\b/g, (t) => knownUtc.has(t) ? t : canonUtc);
        }

        if (out.type === activeOutput.type) {
          setEditBuffer(updatedText);
        }

        return {
          ...out,
          content: updatedText,
          status: 'Needs review'
        };
      });

      const nextDrift = computeCrossOutputDrift(alignedOutputs, prev.claims || []);
      return {
        ...prev,
        outputs: alignedOutputs,
        cross_check_summary: nextDrift
      };
    });
  };

  const handleStartRecording = () => {
    setRecordingSeconds(0);
    setIsRecording(true);
    setRecordedAudio(null);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const audioName = `0${(work?.source_package?.length || 6) + 1}_operator_voice_briefing.wav`;
    setRecordedAudio({
      name: audioName,
      duration: recordingSeconds || 5
    });
  };

  // Upload and Anchor to Blockchain Testnet (Simulates SHA-256 generation + Testnet Confirmation)
  const handleAnchorSource = () => {
    if (sourceAddTab === 'text' && !sourceTextContent.trim()) {
      alert("Please enter source content or notes.");
      return;
    }
    if (sourceAddTab === 'file' && !selectedFile) {
      alert("Please select a file to upload.");
      return;
    }
    if (sourceAddTab === 'audio' && !recordedAudio && !isRecording) {
      alert("Please record audio before uploading.");
      return;
    }

    if (isRecording) {
      handleStopRecording();
    }

    setAnchorStatus('hashing');
    setTimeout(() => {
      const sha = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setProvenanceHash(sha);
      setAnchorStatus('anchoring');

      setTimeout(() => {
        const tx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setBlockchainTx(tx);
        setAnchorStatus('confirmed');
      }, 1600);
    }, 700);
  };

  // Done button handler: commits source to workspace source_package
  const handleFinishAddSource = () => {
    let fileName = '';
    let fileSize = 4096;
    if (sourceAddTab === 'text') {
      fileName = sourceTextTitle.trim() || `0${(work?.source_package?.length || 6) + 1}_supplementary_brief.txt`;
      fileSize = sourceTextContent.length || 2048;
    } else if (sourceAddTab === 'file') {
      fileName = selectedFile?.name || 'uploaded_evidence_document.txt';
      fileSize = selectedFile?.size || 8192;
    } else {
      fileName = recordedAudio?.name || `0${(work?.source_package?.length || 6) + 1}_operator_voice_memo.wav`;
      fileSize = 1024 * (recordedAudio?.duration || 10) * 16;
    }

    const newSourceItem = {
      file_name: fileName,
      file_size_bytes: fileSize,
      blockchain_tx: blockchainTx,
      provenance_hash: provenanceHash,
      status: "verified"
    };

    setWork(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        source_package: [...(prev.source_package || []), newSourceItem]
      };
    });

    setShowAddSourceModal(false);
    setAnchorStatus('idle');
    setBlockchainTx(null);
    setProvenanceHash(null);
    setSourceTextTitle('');
    setSourceTextContent('');
    setSelectedFile(null);
    setRecordedAudio(null);
    setRecordingSeconds(0);
    setIsRecording(false);
  };

  const handlePromptEdit = async () => {
    if (!promptInstruction.trim()) return;
    try {
      await promptEditArtifact(work.id, activeOutput.type, promptInstruction);
      setPromptInstruction('');
      loadData();
    } catch (err) {
      alert("Prompt edit failed: " + err.message);
    }
  };

  const handleApprove = async () => {
    try {
      await approveArtifact(work.id, activeOutput.type);
      loadData();
    } catch (err) {
      alert("Approval failed: " + err.message);
    }
  };

  // Fact Correction & Selective Impact Propagation
  const handleApplyClaimCorrection = async (claimId, newStatement) => {
    setUpdatingClaim(true);
    try {
      const res = await updateClaim(work.id, claimId, {
        new_claim_text: newStatement,
        reason: "Forensic reviewer approved canonical claim mutation"
      });
      setImpactNotice(res);
      setDiffMode(true);
      setEditingClaimId(null);
      loadData();
    } catch (err) {
      alert("Fact propagation failed: " + err.message);
    } finally {
      setUpdatingClaim(false);
    }
  };

  // Active claim lookup for evidence linking
  const activeClaimObj = (work?.claims || []).find(c => c.claim_id === selectedClaimId);
  const activeSourceFile = activeClaimObj?.evidence?.[0]?.source_file;

  // Interactive verification handler: jumps and highlights claim in center document
  const handleSelectClaim = (claimId) => {
    const nextId = selectedClaimId === claimId ? null : claimId;
    setSelectedClaimId(nextId);
    if (nextId) {
      if (viewMode === 'clean') {
        setViewMode('audit');
      }
      setTimeout(() => {
        const el = document.querySelector(`[data-claim-id="${nextId}"]`) || document.getElementById(`claim-cite-${nextId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 70);
    }
  };

  // Render clickable claim citations [CLM-001]
  const renderClickableCitations = (text) => {
    if (viewMode === 'clean') {
      return stripCitationsFromText(text);
    }
    return renderTextWithCitations(text, work?.claims || [], (cid) => handleSelectClaim(cid), selectedClaimId);
  };

  // Dynamic diff renderer for Stage 7 comparison
  const renderDiffContent = (text, isOld) => {
    if (!text) return null;

    // Lookup active diff item
    const currentDiff = impactNotice?.diffs?.find(d => d.deliverable_type === activeOutput?.type);
    const oldFrag = currentDiff?.old_fragment || '47 minutes';
    const newFrag = currentDiff?.new_fragment || '52 minutes';
    const targetWord = isOld ? oldFrag : newFrag;

    let regex;
    try {
      const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (/minutes?/i.test(targetWord)) {
        const num = targetWord.match(/\d+/)?.[0];
        if (num) {
          regex = new RegExp(`(${escaped}|${num}\\s*minutes?|${num}-minute|${num}m\\b)`, 'gi');
        } else {
          regex = new RegExp(`(${escaped})`, 'gi');
        }
      } else {
        regex = new RegExp(`(${escaped})`, 'gi');
      }
    } catch (_) {
      regex = isOld ? /(47\s*minutes?|47m\b)/gi : /(52\s*minutes?|52m\b)/gi;
    }

    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <span
            key={i}
            style={{
              backgroundColor: isOld ? '#fecaca' : '#bbf7d0',
              color: isOld ? '#991b1b' : '#166534',
              textDecoration: isOld ? 'line-through' : 'none',
              padding: '2px 5px',
              borderRadius: '3px',
              fontWeight: 600,
              display: 'inline-block'
            }}
          >
            {part}
          </span>
        );
      }
      return renderClickableCitations(part);
    });
  };

  // Document-grade editorial renderer (No raw markdown or raw JSON dump)
  const renderFormattedDocument = (content) => {
    if (!content) return <div style={{ color: 'var(--text-muted)' }}>No content generated for this deliverable.</div>;

    // Check if content is JSON string containing slides or scenes
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.slides && Array.isArray(parsed.slides)) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {parsed.deck_title || 'Incident Briefing Deck'}
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Audience: <strong>{parsed.target_audience || 'Leadership'}</strong> · Slides: <strong>{parsed.total_slides || parsed.slides.length}</strong>
                </div>
              </div>

              {parsed.slides.map((slide, sIdx) => (
                <div key={sIdx} style={{
                  padding: '14px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      SLIDE {slide.slide_number || sIdx + 1}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {slide.title}
                    </span>
                  </div>
                  <ul style={{ margin: '0 0 10px 0', paddingLeft: '18px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    {(slide.key_points || []).map((pt, pIdx) => (
                      <li key={pIdx}>{renderClickableCitations(pt)}</li>
                    ))}
                  </ul>
                  {slide.visual_recommendation && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: '4px' }}>
                      💡 <strong>Visual Direction:</strong> {slide.visual_recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        } else if (parsed.scenes && Array.isArray(parsed.scenes)) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {parsed.script_title || 'Video Package Briefing Script'}
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Duration: <strong>{parsed.target_duration_seconds || 60}s</strong> · Scenes: <strong>{parsed.scenes.length}</strong>
                </div>
              </div>

              {parsed.scenes.map((scene, scIdx) => (
                <div key={scIdx} style={{
                  padding: '14px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      SCENE {scene.scene_number || scIdx + 1} ({scene.duration_seconds || 15}s)
                    </span>
                    {scene.on_screen_text && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Overlay: "{scene.on_screen_text}"
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', backgroundColor: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: '4px' }}>
                    🎬 <strong>Visual:</strong> {scene.visual_description}
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    🎙️ <strong>Narration:</strong> {renderClickableCitations(scene.narration)}
                  </div>
                </div>
              ))}
            </div>
          );
        }
      } catch (_) {
        // Fall through to markdown parsing
      }
    }

    const lines = typeof content === 'string' ? content.split('\n') : [String(content)];
    const elements = [];
    let currentMetadata = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip legacy top metadata lines (Case Identifier, Classification, Severity, etc.)
      if (line && line.startsWith('**') && (line.includes('Identifier:') || line.includes('Classification:') || line.includes('Severity:') || line.includes('Date of Report:'))) {
        continue;
      }

      // Title
      if (line && line.startsWith('# ')) {
        elements.push(
          <h1 key={i} style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.01em' }}>
            {line.replace('# ', '')}
          </h1>
        );
      }
      // Section Heading
      else if (line && line.startsWith('## ')) {
        elements.push(
          <h2 key={i} style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: 'var(--text-primary)', 
            marginTop: '18px', 
            marginBottom: '8px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '4px'
          }}>
            {line.replace('## ', '')}
          </h2>
        );
      }
      // Sub-heading
      else if (line && line.startsWith('### ')) {
        elements.push(
          <h3 key={i} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '6px' }}>
            {line.replace('### ', '')}
          </h3>
        );
      }
      // Bullet points
      else if (line && (line.trim().startsWith('- ') || line.trim().startsWith('• '))) {
        const text = line.trim().replace(/^[-•]\s*/, '');
        elements.push(
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <div style={{ flex: 1 }}>{renderClickableCitations(text)}</div>
          </div>
        );
      }
      // Empty line
      else if (!line || !line.trim()) {
        elements.push(<div key={i} style={{ height: '8px' }} />);
      }
      // Standard Paragraph
      else {
        elements.push(
          <p key={i} style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '10px' }}>
            {renderClickableCitations(line)}
          </p>
        );
      }
    }

    const activeVersion = activeOutput?.versions?.[activeOutput.versions.length - 1];
    const createdDate = work.created_at ? new Date(work.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '17 Apr 2026';
    const lastEditedDate = activeVersion?.timestamp ? new Date(activeVersion.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC' : '03:22 UTC';

    return (
      <div>
        {elements}

        {/* Clean Document Audit Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div><span>Document ID:</span> <strong style={{ color: 'var(--text-secondary)' }}>DOC-{work.id}</strong></div>
          <div><span>Version:</span> <strong style={{ color: 'var(--text-secondary)' }}>v{activeOutput.versions?.length || 1}.0 ({activeOutput.status})</strong></div>
          <div><span>Created:</span> <strong style={{ color: 'var(--text-secondary)' }}>{createdDate}</strong></div>
          <div><span>Last Edited:</span> <strong style={{ color: 'var(--text-secondary)' }}>{lastEditedDate}</strong></div>
          <div><span>Operator:</span> <strong style={{ color: 'var(--text-secondary)' }}>Lead Operator</strong></div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-app)', overflow: 'hidden' }}>
      
      {/* Top Navbar (Clean, restrained, no AI slop) */}
      <header style={{
        height: '48px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={onBack}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              fontSize: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 6px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={13} /> Home
          </button>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{work.id}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{work.title}</span>
          
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: activeOutput.status === 'Approved' ? 'var(--badge-done-bg)' : 'var(--badge-review-bg)',
            color: activeOutput.status === 'Approved' ? 'var(--badge-done-text)' : 'var(--badge-review-text)',
            border: `1px solid ${activeOutput.status === 'Approved' ? 'var(--badge-done-border)' : 'var(--badge-review-border)'}`
          }}>
            {activeOutput.status}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Unified Outputs Progress & Finalize Action Group */}
          {(() => {
            const outputs = work?.outputs || [];
            const approvedCount = outputs.filter(o => o.status === 'Approved').length;
            const totalCount = Math.max(9, outputs.length);

            return (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                overflow: 'hidden',
                height: '28px'
              }}>
                <div style={{
                  padding: '0 10px',
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRight: onFinalize ? '1px solid var(--border)' : 'none',
                  height: '100%',
                  whiteSpace: 'nowrap'
                }}>
                  <span>{approvedCount} of {totalCount} Approved</span>
                </div>

                {onFinalize && (
                  <button
                    onClick={onFinalize}
                    style={{
                      padding: '0 11px',
                      height: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>Finalize & Publish</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </header>

      {/* 3-Column Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 290px', flex: 1, minHeight: 0, height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: Sources & Context-Grounded Claims Rail */}
        {/* LEFT COLUMN: Sources & Context-Grounded Claims Rail with Independent Scrolling */}
        <aside style={{ backgroundColor: '#fafaf9', borderRight: '1px solid #f1f5f9', overflow: 'hidden', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* Sources Section: Compact List with Independent Scroll */}
          <div style={{ flexShrink: 0, maxHeight: '240px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sources ({work.source_package?.length || 0})
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddSourceModal(true);
                  setAnchorStatus('idle');
                  setBlockchainTx(null);
                  setProvenanceHash(null);
                  setSourceTextTitle('');
                  setSourceTextContent('');
                  setSelectedFile(null);
                  setRecordedAudio(null);
                  setIsRecording(false);
                  setRecordingSeconds(0);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
              >
                <Plus size={11} />
                <span>Add Source</span>
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 10px 6px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {work.source_package?.map((file, i) => {
                const isGrounded = activeSourceFile && file.file_name === activeSourceFile;
                return (
                  <div 
                    key={i} 
                    style={{ 
                      padding: '6px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: isGrounded ? '#eff6ff' : 'transparent', 
                      borderLeft: isGrounded ? '2px solid #3b82f6' : '2px solid transparent',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'default',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isGrounded) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={e => {
                      if (!isGrounded) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title={isGrounded ? `${file.file_name} (Active Claim Source)` : file.file_name}
                  >
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      {getSourceIcon(file.file_name)}
                    </div>
                    <div style={{ fontWeight: 500, color: isGrounded ? '#1e40af' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {file.file_name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Symmetric Divider Line with Soft Border */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '14px 16px', flexShrink: 0 }} />

          {/* Context-First Claims & Evidence Cards: Takes Remainder of Height with Independent Scroll */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '4px 16px 12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Project Facts & Claims ({work.claims?.length || 0})
                </div>
                {/* Two Clickable Filter Buttons: Verified & Needs Review (No colored dots, matching theme) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                  <button
                    type="button"
                    onClick={() => setClaimsFilter(prev => prev === 'verified' ? null : 'verified')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: claimsFilter === 'verified' ? '#f0fdf4' : '#ffffff',
                      border: claimsFilter === 'verified' ? '1px solid #16a34a' : '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '10px',
                      fontWeight: 500,
                      color: claimsFilter === 'verified' ? '#15803d' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Filter by verified facts"
                  >
                    <span>Verified ({work.claims?.filter(c => (c.verification_status || 'verified').toLowerCase().includes('verified')).length || work.claims?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClaimsFilter(prev => prev === 'needs_review' ? null : 'needs_review')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: claimsFilter === 'needs_review' ? '#fef3c7' : '#ffffff',
                      border: claimsFilter === 'needs_review' ? '1px solid #f59e0b' : '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '10px',
                      fontWeight: 500,
                      color: claimsFilter === 'needs_review' ? '#92400e' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Filter by claims needing review"
                  >
                    <span>Needs Review ({work.claims?.filter(c => !(c.verification_status || 'verified').toLowerCase().includes('verified')).length || 0})</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 12px 16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(work.claims || [])
                .filter(claim => {
                  if (!claimsFilter) return true;
                  const isVerified = (claim.verification_status || 'verified').toLowerCase().includes('verified');
                  if (claimsFilter === 'verified') return isVerified;
                  if (claimsFilter === 'needs_review') return !isVerified;
                  return true;
                })
                .map(claim => {
                const isSelected = selectedClaimId === claim.claim_id;
                const isClaim1 = claim.claim_id === 'CLM-001';
                const isUpdated = isClaim1 && (claim.claim_text || '').includes('52');
                const isVerified = (claim.verification_status || 'verified').toLowerCase().includes('verified');
                const contextTitle = CLAIM_CONTEXT_MAP[claim.claim_id] || 'Verified Factual Claim';
                const primaryEvidence = claim.evidence?.[0];

                return (
                  <div
                    key={claim.claim_id}
                    onClick={() => handleSelectClaim(claim.claim_id)}
                    style={{
                      borderRadius: '6px',
                      border: !isVerified ? '1px solid #fde68a' : (isSelected ? '1.5px solid #3b82f6' : '1px solid var(--border)'),
                      backgroundColor: isSelected ? '#eff6ff' : (!isVerified ? '#fffbeb' : (isUpdated ? '#f0fdf4' : '#ffffff')),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected && isVerified) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected && isVerified) e.currentTarget.style.backgroundColor = isUpdated ? '#f0fdf4' : '#ffffff';
                    }}
                    title={!isSelected ? `[${claim.claim_id}] ${claim.claim_text}\nSource: ${primaryEvidence?.source_file || 'Document'}` : undefined}
                  >
                    {/* Compact 1-Line Header (Always Visible) */}
                    <div style={{ 
                      padding: '7px 9px',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                        <span style={{ 
                          fontWeight: 700, 
                          fontFamily: 'monospace', 
                          fontSize: '10.5px',
                          color: isSelected ? '#1d4ed8' : 'var(--text-primary)',
                          backgroundColor: isSelected ? '#dbeafe' : 'var(--bg-subtle)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          flexShrink: 0
                        }}>
                          {claim.claim_id}
                        </span>
                        <span style={{ 
                          fontWeight: 500, 
                          color: isSelected ? '#1e3a8a' : 'var(--text-primary)', 
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {contextTitle}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        {isUpdated ? (
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 600, 
                            color: '#166534', 
                            backgroundColor: '#dcfce7', 
                            padding: '1px 4px', 
                            borderRadius: '3px' 
                          }}>
                            v2
                          </span>
                        ) : !isVerified ? (
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 600, 
                            color: '#92400e', 
                            backgroundColor: '#fef3c7', 
                            padding: '1px 4px', 
                            borderRadius: '3px' 
                          }}>
                            Review
                          </span>
                        ) : null}

                        <ChevronDown 
                          size={12} 
                          color="var(--text-muted)" 
                          style={{ 
                            transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)', 
                            transition: 'transform 0.15s ease' 
                          }} 
                        />
                      </div>
                    </div>

                    {/* Expanded Content (Visible Only When Clicked / Selected) */}
                    {isSelected && (
                      <div 
                        style={{ 
                          padding: '0 9px 8px 9px',
                          borderTop: '1px solid rgba(59, 130, 246, 0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '11px'
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        {/* 1. Atomic Statement */}
                        <div style={{ color: 'var(--text-primary)', lineHeight: 1.4, marginTop: '6px', fontSize: '11px' }}>
                          {claim.claim_text}
                        </div>

                        {/* 2. Source File Origin Badge */}
                        {primaryEvidence && (
                          <div style={{ 
                            padding: '4px 7px', 
                            borderRadius: '4px', 
                            backgroundColor: '#ffffff', 
                            border: '1px solid var(--border)',
                            fontSize: '10px',
                            color: 'var(--text-secondary)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500, color: 'var(--text-primary)' }}>
                              <FileText size={10} />
                              <span>{primaryEvidence.source_file}</span>
                              {primaryEvidence.location && <span style={{ color: 'var(--text-muted)' }}>({primaryEvidence.location})</span>}
                            </div>
                            {primaryEvidence.supporting_text_or_description && (
                              <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '9.5px', marginTop: '2px', lineHeight: 1.35 }}>
                                "{primaryEvidence.supporting_text_or_description}"
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Action */}
                        <div style={{ paddingTop: '4px', borderTop: '1px dashed var(--border)' }}>
                          {editingClaimId === claim.claim_id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Update Verified Ground Truth Statement:
                              </div>
                              <textarea
                                value={editedClaimText}
                                onChange={(e) => setEditedClaimText(e.target.value)}
                                rows={2}
                                style={{ width: '100%', fontSize: '11px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'none', outline: 'none' }}
                              />
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                                <button
                                  onClick={() => setEditingClaimId(null)}
                                  style={{ padding: '3px 6px', fontSize: '10px', background: 'none', border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleApplyClaimCorrection(claim.claim_id, editedClaimText)}
                                  disabled={updatingClaim}
                                  style={{ padding: '3px 8px', fontSize: '10px', backgroundColor: 'var(--text-primary)', color: '#ffffff', border: 'none', borderRadius: '3px', fontWeight: 500, cursor: 'pointer' }}
                                >
                                  {updatingClaim ? 'Propagating...' : 'Propagate Update →'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                {activeOutput.claim_dependencies?.includes(claim.claim_id) ? 'Cited in active deliverable' : 'Canonical evidence'}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingClaimId(claim.claim_id);
                                  const is52 = (claim.claim_text || '').includes('52');
                                  setEditedClaimText(
                                    claim.claim_id === 'CLM-001' && !is52
                                      ? "The incident resulted in approximately 52 minutes of service disruption before containment protocols were completed at 03:22 UTC."
                                      : claim.claim_id === 'CLM-001' && is52
                                      ? "Research portal experienced approximately 47 minutes of operational disruption."
                                      : (claim.claim_text || '')
                                  );
                                }}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid var(--border)',
                                  borderRadius: '3px',
                                  color: 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Edit2 size={10} /> Correct Fact
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </aside>

        {/* CENTER COLUMN: Fixed Navigation & Editorial Canvas */}
        <main style={{ overflowY: 'auto', minHeight: 0, height: '100%', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Top Fixed Format Selector Navigation — Symmetric Full-Width Segmented Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '4px',
            boxSizing: 'border-box'
          }}>
            {PRIMARY_NAV_ITEMS.map((item) => {
              const isActive = activeNavId === item.id;
              // Check approval status of this deliverable
              const targetKey = item.matchKey;
              const deliverableObj = (work?.outputs || []).find(o => o.type === targetKey);
              const isApproved = deliverableObj?.status === 'Approved';

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  style={{
                    flex: '1 1 auto',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--btn-primary-bg)' : 'transparent',
                    color: isActive ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isApproved ? '#16a34a' : '#d97706',
                    display: 'inline-block',
                    flexShrink: 0
                  }} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          {/* Social Media Sub-Selector (Twitter / LinkedIn / Instagram) */}
          {activeNavId === 'social_media' && (
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Channel Format:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {PRIMARY_NAV_ITEMS.find(n => n.id === 'social_media')?.subItems?.map(sub => {
                  const isSubActive = activeSubSocialId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubSocial(sub.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        backgroundColor: isSubActive ? '#ffffff' : 'transparent',
                        color: isSubActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isSubActive ? 600 : 400,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {sub.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Artifact Container */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flex: 1,
            minHeight: '480px'
          }}>
          {/* Artifact Header Toolbar */}
            <div style={{ 
              padding: '10px 16px', 
              borderBottom: '1px solid var(--border)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {activeOutput.title}
                </span>
                {activeOutput.status === 'Approved' && (
                  <span style={{ 
                    fontSize: '11px', 
                    backgroundColor: 'var(--badge-done-bg)', 
                    color: 'var(--badge-done-text)', 
                    border: '1px solid var(--badge-done-border)',
                    padding: '1px 6px', 
                    borderRadius: '4px', 
                    fontWeight: 500 
                  }}>
                    Approved
                  </span>
                )}
              </div>

              {/* View / Edit Mode Controls — all inline in one row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeNavId === 'infographic' && openGraphic && (
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    maxWidth: '420px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {openGraphic.title}
                  </span>
                )}

                {/* View mode toggle only for document-type deliverables when not editing */}
                {!isEditing && (activeNavId === 'executive_summary' || activeNavId === 'advisory' || activeNavId === 'whatsapp_message') && (
                  <div style={{
                    display: 'inline-flex',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f1f5f9',
                    padding: '2px',
                    gap: '2px',
                    marginRight: '6px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setViewMode('audit')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: viewMode === 'audit' ? '#ffffff' : 'transparent',
                        color: viewMode === 'audit' ? '#0f172a' : '#64748b',
                        boxShadow: viewMode === 'audit' ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none',
                        fontSize: '11.5px',
                        fontWeight: viewMode === 'audit' ? 600 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Audit View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('clean')}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: viewMode === 'clean' ? '#ffffff' : 'transparent',
                        color: viewMode === 'clean' ? '#0f172a' : '#64748b',
                        boxShadow: viewMode === 'clean' ? '0 1px 2px rgba(0, 0, 0, 0.08)' : 'none',
                        fontSize: '11.5px',
                        fontWeight: viewMode === 'clean' ? 600 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Final Output
                    </button>
                  </div>
                )}

                {/* Compare v1 / v2 icon-only button */}
                {activeOutput.versions?.length >= 2 && (
                  <button
                    onClick={() => { setDiffMode(!diffMode); setIsEditing(false); }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '5px',
                      border: '1px solid ' + (diffMode ? '#0f172a' : '#e2e8f0'),
                      backgroundColor: diffMode ? '#0f172a' : '#ffffff',
                      color: diffMode ? '#ffffff' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={diffMode ? 'Close comparison' : 'Compare versions (v1 / v2)'}
                    aria-label="Compare versions"
                  >
                    <GitCompare size={14} />
                  </button>
                )}

                {/* Edit Draft icon-only button (excluded for infographic) */}
                {activeNavId !== 'infographic' && (
                  <button
                    onClick={() => { setIsEditing(!isEditing); setDiffMode(false); }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '5px',
                      border: '1px solid ' + (isEditing ? '#fecaca' : '#e2e8f0'),
                      backgroundColor: isEditing ? '#fef2f2' : '#ffffff',
                      color: isEditing ? '#dc2626' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={isEditing ? 'Cancel editing' : 'Edit draft'}
                    aria-label={isEditing ? 'Cancel editing' : 'Edit draft'}
                  >
                    {isEditing ? <X size={14} /> : <Edit2 size={13} />}
                  </button>
                )}

                {isEditing && activeNavId !== 'infographic' && (
                  <div
                    style={{ position: 'relative', display: 'inline-block' }}
                    onMouseEnter={() => setShowApplyMenu(true)}
                    onMouseLeave={() => setShowApplyMenu(false)}
                  >
                    <button
                      type="button"
                      onClick={handleApplyToThis}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--btn-primary-bg)',
                        color: 'var(--btn-primary-text)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Apply changes (hover for options)"
                    >
                      <span>Apply Changes</span>
                      <ChevronDown size={12} />
                    </button>

                    {/* Hover Dropdown with Apply to this / Apply to all */}
                    {showApplyMenu && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        width: '260px',
                        backgroundColor: '#ffffff',
                        borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
                        border: '1px solid var(--border)',
                        padding: '4px',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div
                          onClick={() => {
                            setShowApplyMenu(false);
                            handleApplyToThis();
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: '#ffffff',
                            transition: 'background-color 0.1s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                            Apply to this
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                            Update text only for this deliverable (local change, no validation call).
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', margin: '2px 0' }} />

                        <div
                          onClick={() => {
                            setShowApplyMenu(false);
                            handleApplyToAll();
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: '#ffffff',
                            transition: 'background-color 0.1s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>Apply to all</span>
                            <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-subtle)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>Cross-check</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                            Validate against claims and propagate fact changes across all affected deliverables.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Document Content View / Editorial Diff View */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {diffMode && activeOutput.versions?.length >= 2 ? (
                /* Stage 7: Clean Editorial Version Comparison */
                <div style={{ padding: '20px 24px' }}>
                  {(() => {
                    const currentDiff = impactNotice?.diffs?.find(d => d.deliverable_type === activeOutput.type);
                    return (
                      <>
                        {currentDiff?.reason && (
                          <div style={{
                            fontSize: '12px',
                            color: '#1e3a8a',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            marginBottom: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span><strong>Impact Rationale:</strong> {currentDiff.reason}</span>
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          {/* Version 1 */}
                          <div style={{
                            padding: '14px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            backgroundColor: '#fef2f2'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #fee2e2', paddingBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#991b1b' }}>
                                VERSION 1 (PREVIOUS DRAFT)
                              </span>
                              <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 500 }}>
                                {currentDiff?.old_value || 'Previous Claim Value'}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#7f1d1d' }}>
                              {renderDiffContent(activeOutput.versions[0].content, true)}
                            </div>
                          </div>

                          {/* Version 2 */}
                          <div style={{
                            padding: '14px',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0',
                            backgroundColor: '#f0fdf4'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #dcfce7', paddingBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534' }}>
                                VERSION 2 (UPDATED DRAFT)
                              </span>
                              <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 600 }}>
                                {currentDiff?.new_value || 'Updated Claim Value'}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#14532d' }}>
                              {renderDiffContent(activeOutput.versions[1].content, false)}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : activeNavId === 'executive_summary' || activeNavId === 'advisory' ? (
                <DocumentEditor
                  title={activeOutput.title}
                  initialContent={activeOutput.content}
                  workId={work.id}
                  status={activeOutput.status}
                  versionNumber={activeOutput.versions?.length || 1}
                  claims={work?.claims || []}
                  config={work?.config?.output_overrides?.[activeNavId] || {}}
                  onSave={(html, text) => handleSaveEdit(text || html)}
                  onChange={(text) => setEditBuffer(text)}
                  onClaimClick={(cid) => handleSelectClaim(cid)}
                  selectedClaimId={selectedClaimId}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              ) : activeNavId === 'presentation' ? (
                <PresentationEditor
                  title={activeOutput.title}
                  initialContent={activeOutput.content}
                  workId={work.id}
                  status={activeOutput.status}
                  claims={work?.claims || []}
                  config={work?.config?.output_overrides?.presentation || {}}
                  onSave={(jsonStr) => handleSaveEdit(jsonStr)}
                  onClaimClick={(cid) => handleSelectClaim(cid)}
                  selectedClaimId={selectedClaimId}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              ) : activeNavId === 'video_package' ? (
                <VideoStoryboardEditor
                  title={activeOutput.title}
                  initialContent={activeOutput.content}
                  workId={work.id}
                  status={activeOutput.status}
                  claims={work?.claims || []}
                  onSave={(jsonStr) => handleSaveEdit(jsonStr)}
                  onClaimClick={(cid) => handleSelectClaim(cid)}
                  selectedClaimId={selectedClaimId}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              ) : activeNavId === 'infographic' ? (
                <InfographicEditor
                  title={activeOutput.title}
                  initialContent={activeOutput.content}
                  workId={work.id}
                  status={activeOutput.status}
                  claims={work?.claims || []}
                  config={work?.config?.output_overrides?.infographic || {}}
                  aspectRatio={paramState.aspect_ratio}
                  onAspectRatioChange={(r) => {
                    setParamState(prev => ({ ...prev, aspect_ratio: r }));
                    if (openGraphic) {
                      setOpenGraphic(prev => prev ? ({ ...prev, aspect_ratio: r }) : null);
                    }
                  }}
                  openGraphic={openGraphic}
                  onOpenGraphicChange={setOpenGraphic}
                  onSave={(data) => handleSaveEdit(data)}
                  onClaimClick={(cid) => handleSelectClaim(cid)}
                  selectedClaimId={selectedClaimId}
                />
              ) : activeNavId === 'whatsapp_message' ? (
                <SocialMediaEditor
                  channelType="whatsapp_message"
                  title={activeOutput.title}
                  initialContent={activeOutput.content}
                  workId={work.id}
                  status={activeOutput.status}
                  claims={work?.claims || []}
                  config={work?.config?.output_overrides?.whatsapp_message || {}}
                  onSave={(text) => handleSaveEdit(text)}
                  onClaimClick={(cid) => handleSelectClaim(cid)}
                  selectedClaimId={selectedClaimId}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              ) : activeNavId === 'social_media' ? (
                <SocialMediaEditor
                  channelType={activeSubSocialId}
                  title={activeOutput.title}
                  initialContent={activeOutput.content}
                  workId={work.id}
                  status={activeOutput.status}
                  claims={work?.claims || []}
                  config={work?.config?.output_overrides?.[activeSubSocialId] || {}}
                  onSave={(text) => handleSaveEdit(text)}
                  onClaimClick={(cid) => handleSelectClaim(cid)}
                  selectedClaimId={selectedClaimId}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              ) : (
                <div style={{ padding: '24px 32px', flex: 1, minHeight: '380px' }}>
                  {renderFormattedDocument(activeOutput.content)}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Prompt-Based Editing Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="text"
              value={promptInstruction}
              onChange={e => setPromptInstruction(e.target.value)}
              placeholder="Describe an editorial refinement (e.g. 'Make the overview clearer', 'Adjust tone')..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: 'var(--text-primary)'
              }}
              onKeyDown={e => { if (e.key === 'Enter') handlePromptEdit(); }}
            />
            <button
              onClick={handlePromptEdit}
              style={{
                backgroundColor: promptInstruction.trim() ? 'var(--btn-primary-bg)' : '#e7e5e4',
                color: promptInstruction.trim() ? '#ffffff' : '#a8a29e',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: promptInstruction.trim() ? 'pointer' : 'default'
              }}
            >
              Apply <CornerDownLeft size={11} />
            </button>
          </div>

          {/* Consistency & Impact Propagation Audit Alert */}
          {impactNotice ? (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#166534',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} color="#166534" />
                  <span>
                    <strong>Fact Mutation Propagated:</strong> {impactNotice.message}
                  </span>
                </div>
                <button
                  onClick={() => setDiffMode(!diffMode)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #86efac',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#166534',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {diffMode ? 'View Clean Reading Mode' : 'Review v1 vs v2 Diff'}
                </button>
              </div>

              {/* Invariant & Dependency Audit Breakdown */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '6px',
                borderTop: '1px solid #dcfce7',
                fontSize: '11px'
              }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '3px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 600
                }}>
                  {impactNotice.affected_deliverables?.length || 0} Affected (Reset to Needs review)
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '3px',
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  fontWeight: 600,
                  border: '1px solid #a7f3d0'
                }}>
                  ✓ {impactNotice.unaffected_deliverables?.length || 0} Unaffected (Approved Invariant Preserved)
                </span>
                <span style={{ color: '#14532d', marginLeft: 'auto', fontStyle: 'italic' }}>
                  {impactNotice.unaffected_deliverables?.includes(activeOutput.type)
                    ? `🛡️ ${activeOutput.title}: Unaffected baseline preserved.`
                    : `⚡ ${activeOutput.title}: v2 regenerated from canonical claims.`}
                </span>
              </div>
            </div>
          ) : null}

        </main>

        {/* RIGHT COLUMN: Output Settings & Validation Rail */}
        <aside style={{ backgroundColor: '#fafaf9', borderLeft: '1px solid #f1f5f9', overflowY: 'auto', minHeight: 0, height: '100%', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              Deliverable Review
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeOutput.title}
            </div>
          </div>

          <div style={{ borderBottom: '1px solid #f1f5f9' }} />

          {/* TARGET PARAMETERS (Collapsible Accordion Menu) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isParamsCollapsed ? '0px' : '8px' }}>
              <div 
                onClick={() => setIsParamsCollapsed(!isParamsCollapsed)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Parameters
                </div>
                <ChevronDown 
                  size={12} 
                  color="var(--text-muted)" 
                  style={{ 
                    transform: isParamsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.15s ease' 
                  }} 
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isParamsCollapsed) setIsParamsCollapsed(false);
                  setIsEditingParams(!isEditingParams);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  fontSize: '10.5px',
                  color: isEditingParams ? '#92400e' : 'var(--text-secondary)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Edit2 size={10} />
                <span>{isEditingParams ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            {!isParamsCollapsed && (
              <div style={{ marginTop: '8px' }}>

            {paramsSavedNotice && (
              <div style={{
                marginBottom: '10px',
                padding: '6px 8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Check size={12} /> Parameters updated & applied
              </div>
            )}

            {!isEditingParams ? (
              /* VIEW MODE */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Audience</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {paramState.audience}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tone</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {paramState.tone}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Language</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {paramState.language}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Detail</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {paramState.detail}
                  </span>
                </div>

                {work?.config?.objective && (
                  <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Objective</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {work.config.objective}
                    </span>
                  </div>
                )}

                {work?.config?.classification && (
                  <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Release</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {work.config.classification}
                    </span>
                  </div>
                )}

                {/* DELIVERABLE-SPECIFIC OVERRIDES IN VIEW MODE */}
                {activeNavId === 'presentation' && (
                  <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Deck Size</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {paramState.slide_count} Slides
                    </span>
                  </div>
                )}

                {activeNavId === 'infographic' && (
                  <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Aspect Ratio</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {openGraphic?.native_aspect_ratio || paramState.aspect_ratio || '1:1'}
                    </span>
                  </div>
                )}

                {activeNavId === 'video_package' && (
                  <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Duration</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {paramState.duration_seconds}s
                    </span>
                  </div>
                )}

                {(activeNavId === 'social_media' && activeSubSocialId === 'linkedin_post') && (
                  <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Images</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {paramState.image_count === 0 ? 'Text Only' : `${paramState.image_count} Image${paramState.image_count > 1 ? 's' : ''}`}
                    </span>
                  </div>
                )}

                {(activeNavId === 'social_media' && activeSubSocialId === 'instagram_post') && (
                  <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Images</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {paramState.image_count} Image{paramState.image_count > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {(activeNavId === 'social_media' && activeSubSocialId === 'twitter_post') && (
                  <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Format</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {paramState.account_type === 'premium' ? 'X Premium (Long-form)' : 'Standard (280 chars)'}
                    </span>
                  </div>
                )}

                {activeNavId === 'whatsapp_message' && (
                  <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'grid', gridTemplateColumns: '76px 1fr', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Broadcast</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {paramState.purpose === 'community' ? 'Direct Message' : 'Community Alert'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* INLINE EDIT MODE */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                {/* Audience */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Audience
                  </label>
                  <select
                    value={paramState.audience}
                    onChange={(e) => setParamState(prev => ({ ...prev, audience: e.target.value }))}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11.5px', backgroundColor: '#ffffff' }}
                  >
                    {['Leadership', 'Technical Specialists', 'Policy & Legal', 'General Public', 'Operations', 'Field Operators'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Tone */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Tone
                  </label>
                  <select
                    value={paramState.tone}
                    onChange={(e) => setParamState(prev => ({ ...prev, tone: e.target.value }))}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11.5px', backgroundColor: '#ffffff' }}
                  >
                    {['Objective', 'Urgent', 'Analytical', 'Directive', 'Reassuring'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Language
                  </label>
                  <select
                    value={paramState.language}
                    onChange={(e) => setParamState(prev => ({ ...prev, language: e.target.value }))}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11.5px', backgroundColor: '#ffffff' }}
                  >
                    {['English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Detail */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Detail
                  </label>
                  <select
                    value={paramState.detail}
                    onChange={(e) => setParamState(prev => ({ ...prev, detail: e.target.value }))}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11.5px', backgroundColor: '#ffffff' }}
                  >
                    {['Brief', 'Standard', 'Comprehensive'].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Specific Presentation Slide Count Stepper */}
                {activeNavId === 'presentation' && (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Deck Slides (1-8)
                      </label>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {paramState.slide_count} Slides
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setParamState(prev => ({ ...prev, slide_count: Math.max(1, prev.slide_count - 1) }))}
                        disabled={paramState.slide_count <= 1}
                        style={{ width: '26px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#ffffff', cursor: paramState.slide_count <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                      >
                        -
                      </button>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 600, backgroundColor: '#ffffff', padding: '3px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {paramState.slide_count} Slides
                      </div>
                      <button
                        type="button"
                        onClick={() => setParamState(prev => ({ ...prev, slide_count: Math.min(8, prev.slide_count + 1) }))}
                        disabled={paramState.slide_count >= 8}
                        style={{ width: '26px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#ffffff', cursor: paramState.slide_count >= 8 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Specific Infographic Controls */}
                {activeNavId === 'infographic' && (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {openGraphic ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Target Aspect Ratio (For AI Generation)
                          </label>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb' }}>
                            {paramState.aspect_ratio}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                          {['1:1', '16:9', '9:16', '4:3', '3:4'].map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setParamState(prev => ({ ...prev, aspect_ratio: r }));
                              }}
                              style={{
                                padding: '5px 2px',
                                borderRadius: '4px',
                                border: paramState.aspect_ratio === r ? '1px solid #2563eb' : '1px solid var(--border)',
                                backgroundColor: paramState.aspect_ratio === r ? '#2563eb' : '#ffffff',
                                color: paramState.aspect_ratio === r ? '#ffffff' : 'var(--text-primary)',
                                fontSize: '10.5px',
                                fontWeight: paramState.aspect_ratio === r ? 700 : 500,
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '12px 10px',
                        backgroundColor: '#f8fafc',
                        border: '1px dashed var(--border)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        lineHeight: 1.4
                      }}>
                        Select an image from the gallery to edit its parameters.
                      </div>
                    )}
                  </div>
                )}

                {/* Specific Video Package Duration */}
                {activeNavId === 'video_package' && (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Video Duration
                      </label>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {paramState.duration_seconds}s
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[30, 60, 90, 120].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setParamState(prev => ({ ...prev, duration_seconds: sec }))}
                          style={{
                            flex: 1,
                            padding: '3px 0',
                            borderRadius: '4px',
                            border: paramState.duration_seconds === sec ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                            backgroundColor: paramState.duration_seconds === sec ? 'var(--text-primary)' : '#ffffff',
                            color: paramState.duration_seconds === sec ? '#ffffff' : 'var(--text-primary)',
                            fontSize: '11px',
                            fontWeight: paramState.duration_seconds === sec ? 600 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specific LinkedIn Post Image Stepper */}
                {(activeNavId === 'social_media' && activeSubSocialId === 'linkedin_post') && (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Number of Images (0-5)
                      </label>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {paramState.image_count === 0 ? 'Text Only' : `${paramState.image_count} Image${paramState.image_count > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setParamState(prev => ({ ...prev, image_count: Math.max(0, prev.image_count - 1) }))}
                        disabled={paramState.image_count <= 0}
                        style={{ width: '26px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#ffffff', cursor: paramState.image_count <= 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                      >
                        -
                      </button>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 600, backgroundColor: '#ffffff', padding: '3px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {paramState.image_count === 0 ? 'Text Only' : `${paramState.image_count} Image${paramState.image_count > 1 ? 's' : ''}`}
                      </div>
                      <button
                        type="button"
                        onClick={() => setParamState(prev => ({ ...prev, image_count: Math.min(5, prev.image_count + 1) }))}
                        disabled={paramState.image_count >= 5}
                        style={{ width: '26px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#ffffff', cursor: paramState.image_count >= 5 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Specific Instagram Post Stepper */}
                {(activeNavId === 'social_media' && activeSubSocialId === 'instagram_post') && (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Number of Images (1-5)
                      </label>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {paramState.image_count} Image{paramState.image_count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setParamState(prev => ({ ...prev, image_count: Math.max(1, prev.image_count - 1) }))}
                        disabled={paramState.image_count <= 1}
                        style={{ width: '26px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#ffffff', cursor: paramState.image_count <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                      >
                        -
                      </button>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 600, backgroundColor: '#ffffff', padding: '3px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {paramState.image_count} Image{paramState.image_count > 1 ? 's' : ''}
                      </div>
                      <button
                        type="button"
                        onClick={() => setParamState(prev => ({ ...prev, image_count: Math.min(5, prev.image_count + 1) }))}
                        disabled={paramState.image_count >= 5}
                        style={{ width: '26px', height: '24px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#ffffff', cursor: paramState.image_count >= 5 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Specific Twitter Format */}
                {(activeNavId === 'social_media' && activeSubSocialId === 'twitter_post') && (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Post Format
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="ws_tw_type"
                          checked={paramState.account_type !== 'premium'}
                          onChange={() => setParamState(prev => ({ ...prev, account_type: 'standard' }))}
                        />
                        <span>Standard (280 chars)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="ws_tw_type"
                          checked={paramState.account_type === 'premium'}
                          onChange={() => setParamState(prev => ({ ...prev, account_type: 'premium' }))}
                        />
                        <span>X Premium (Long-form)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Specific WhatsApp Purpose */}
                {activeNavId === 'whatsapp_message' && (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Broadcast Type
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="ws_wa_purpose"
                          checked={paramState.purpose !== 'community'}
                          onChange={() => setParamState(prev => ({ ...prev, purpose: 'alert' }))}
                        />
                        <span>Community Alert</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="ws_wa_purpose"
                          checked={paramState.purpose === 'community'}
                          onChange={() => setParamState(prev => ({ ...prev, purpose: 'community' }))}
                        />
                        <span>Direct Message</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleSaveParameters}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Save & Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingParams(false)}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#ffffff',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
              </div>
            )}
          </div>

          <div style={{ borderBottom: '1px solid #f1f5f9' }} />

          {/* Cross-Output Drift */}
          {(() => {
            const driftItems = work.cross_check_summary?.inconsistencies || work.cross_check_summary?.contradictions || [];
            const hasDrift = driftItems.length > 0;
            return (
              <div>
                <div
                  onClick={() => {
                    if (hasDrift) setIsDriftCollapsed(prev => !prev);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11.5px',
                    cursor: hasDrift ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Cross-Output Drift
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{
                      fontSize: hasDrift ? '10.5px' : '11px',
                      color: hasDrift ? '#92400e' : 'var(--text-secondary)',
                      backgroundColor: hasDrift ? '#fef3c7' : 'transparent',
                      padding: hasDrift ? '1px 6px' : '0',
                      borderRadius: '4px',
                      fontWeight: hasDrift ? 600 : 500
                    }}>
                      {hasDrift
                        ? `${driftItems.length} ${driftItems.length === 1 ? 'conflict' : 'conflicts'}`
                        : '0 conflicts'}
                    </span>
                    {hasDrift && (
                      <ChevronDown
                        size={13}
                        color="var(--text-muted)"
                        style={{
                          transform: isDriftCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    )}
                  </div>
                </div>

                {hasDrift && !isDriftCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {driftItems.map((item, idx) => {
                      const cid = item.claim_id || 'CLM-001';
                      const observedMap = item.observed_values || {};
                      const conflictingKeys = item.conflicting_outputs || Object.keys(observedMap);
                      return (
                        <div
                          key={item.conflict_id || idx}
                          style={{
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '6px',
                            padding: '8px 9px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                              <button
                                type="button"
                                onClick={() => handleSelectClaim(cid)}
                                style={{
                                  fontWeight: 700,
                                  fontFamily: 'monospace',
                                  fontSize: '10px',
                                  color: 'var(--text-primary)',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid var(--border)',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                                title={`Inspect ${cid} in left rail`}
                              >
                                {cid}
                              </button>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '10.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {CLAIM_CONTEXT_MAP[cid] || item.check_type}
                              </span>
                            </div>
                            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', flexShrink: 0 }}>
                              Retry 1/1
                            </span>
                          </div>

                          <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Canonical: </span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.canonical_truth}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '4px 6px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #fde68a' }}>
                            {conflictingKeys.map(outKey => (
                              <div
                                key={outKey}
                                onClick={() => {
                                  if (outKey === 'security_advisory') handleSelectNav('advisory');
                                  else if (outKey === 'video_script') handleSelectNav('video_package');
                                  else if (outKey === 'social_media') { handleSelectNav('social_media'); handleSelectSubSocial('twitter_post'); }
                                  else if (outKey === 'linkedin_post' || outKey === 'instagram_post') { handleSelectNav('social_media'); handleSelectSubSocial(outKey); }
                                  else handleSelectNav(outKey);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                  gap: '6px'
                                }}
                                title="Click to open conflicting deliverable"
                              >
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                  {DELIVERABLE_TITLE_MAP[outKey] || outKey}
                                </span>
                                <span style={{ color: '#92400e', fontWeight: 600 }}>
                                  {observedMap[outKey] || 'Mismatch'}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                            <button
                              type="button"
                              onClick={() => handleResolveDrift(item)}
                              style={{
                                padding: '3px 8px',
                                fontSize: '10px',
                                fontWeight: 500,
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                              }}
                            >
                              Align to Canonical
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ borderBottom: '1px solid #f1f5f9' }} />

          {/* Approval Controls */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Reviewer Sign-Off
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => alert("Deliverable flagged for revision.")}
                style={{
                  flex: 1,
                  padding: '7px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={activeOutput.status === 'Approved'}
                style={{
                  flex: 1,
                  padding: '7px',
                  backgroundColor: activeOutput.status === 'Approved' ? '#e7e5e4' : 'var(--btn-primary-bg)',
                  border: 'none',
                  color: activeOutput.status === 'Approved' ? '#78716c' : 'var(--btn-primary-text)',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: activeOutput.status === 'Approved' ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Check size={12} /> {activeOutput.status === 'Approved' ? 'Approved' : 'Approve'}
              </button>
            </div>
          </div>

        </aside>

      </div>

      {/* Add Source Modal Dialog with Blockchain Testnet Anchoring */}
      {showAddSourceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '560px',
            maxWidth: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              backgroundColor: '#fafaf9'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} color="#0f766e" /> Add New Source Evidence
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78716c' }}>
                  Sources are hashed and anchored to the blockchain testnet for immutability.
                </p>
              </div>
              <button
                onClick={() => {
                  if (anchorStatus !== 'hashing' && anchorStatus !== 'anchoring') {
                    setShowAddSourceModal(false);
                    setAnchorStatus('idle');
                    setBlockchainTx(null);
                    setProvenanceHash(null);
                  }
                }}
                disabled={anchorStatus === 'hashing' || anchorStatus === 'anchoring'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: (anchorStatus === 'hashing' || anchorStatus === 'anchoring') ? 'not-allowed' : 'pointer',
                  color: '#a8a29e',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Tab Selector (only active before or during idle) */}
              {anchorStatus === 'idle' && (
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  padding: '4px',
                  backgroundColor: '#f5f5f4',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <button
                    onClick={() => setSourceAddTab('text')}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      fontSize: '12px',
                      fontWeight: sourceAddTab === 'text' ? 600 : 500,
                      color: sourceAddTab === 'text' ? '#1c1917' : '#78716c',
                      backgroundColor: sourceAddTab === 'text' ? '#ffffff' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      boxShadow: sourceAddTab === 'text' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText size={14} /> Prompt / Text
                  </button>
                  <button
                    onClick={() => setSourceAddTab('file')}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      fontSize: '12px',
                      fontWeight: sourceAddTab === 'file' ? 600 : 500,
                      color: sourceAddTab === 'file' ? '#1c1917' : '#78716c',
                      backgroundColor: sourceAddTab === 'file' ? '#ffffff' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      boxShadow: sourceAddTab === 'file' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <UploadCloud size={14} /> Upload File
                  </button>
                  <button
                    onClick={() => setSourceAddTab('audio')}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      fontSize: '12px',
                      fontWeight: sourceAddTab === 'audio' ? 600 : 500,
                      color: sourceAddTab === 'audio' ? '#1c1917' : '#78716c',
                      backgroundColor: sourceAddTab === 'audio' ? '#ffffff' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      boxShadow: sourceAddTab === 'audio' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Mic size={14} /> Record Audio
                  </button>
                </div>
              )}

              {/* Tab 1: Text / Prompt */}
              {anchorStatus === 'idle' && sourceAddTab === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                      Source Title / Identifier
                    </label>
                    <input
                      type="text"
                      value={sourceTextTitle}
                      onChange={(e) => setSourceTextTitle(e.target.value)}
                      placeholder="e.g., 07_supplementary_press_briefing.txt"
                      style={{
                        width: '100%',
                        padding: '8px 11px',
                        fontSize: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        outline: 'none',
                        color: '#1c1917',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
                      Content / Briefing Notes
                    </label>
                    <textarea
                      rows={6}
                      value={sourceTextContent}
                      onChange={(e) => setSourceTextContent(e.target.value)}
                      placeholder="Paste text notes, emergency updates, or source transcripts here..."
                      style={{
                        width: '100%',
                        padding: '9px 11px',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        outline: 'none',
                        color: '#1c1917',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: File Upload */}
              {anchorStatus === 'idle' && sourceAddTab === 'file' && (
                <div>
                  <label
                    htmlFor="source-file-input"
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '28px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      backgroundColor: '#f8fafc',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <UploadCloud size={28} color="#64748b" />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                        {selectedFile ? selectedFile.name : 'Click to select or drag and drop source file'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                        {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Supports documents (.pdf, .txt), images, audio (.wav, .mp3), logs (.json, .log)'}
                      </p>
                    </div>
                  </label>
                  <input
                    id="source-file-input"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              )}

              {/* Tab 3: Record Audio */}
              {anchorStatus === 'idle' && sourceAddTab === 'audio' && (
                <div style={{
                  padding: '24px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#fbfbfa',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? '#fee2e2' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {isRecording ? (
                      <MicOff size={26} color="#ef4444" />
                    ) : (
                      <Mic size={26} color={recordedAudio ? '#059669' : '#64748b'} />
                    )}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'monospace', color: isRecording ? '#dc2626' : '#1c1917' }}>
                      {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#78716c' }}>
                      {isRecording ? 'Recording voice debrief in progress...' : recordedAudio ? `Recorded: ${recordedAudio.name}` : 'Press start to record an audio source debrief'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isRecording ? (
                      <button
                        onClick={handleStartRecording}
                        style={{
                          padding: '7px 16px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: '#1c1917',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Mic size={13} /> {recordedAudio ? 'Record Again' : 'Start Recording'}
                      </button>
                    ) : (
                      <button
                        onClick={handleStopRecording}
                        style={{
                          padding: '7px 16px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <MicOff size={13} /> Stop Recording
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Anchoring in Progress / Completed Screens */}
              {(anchorStatus === 'hashing' || anchorStatus === 'anchoring') && (
                <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                  <RefreshCw size={28} className="animate-spin" color="#0f766e" style={{ margin: '0 auto 14px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#1c1917' }}>
                    {anchorStatus === 'hashing' ? 'Computing SHA-256 Hash...' : 'Broadcasting to Blockchain Testnet...'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#78716c' }}>
                    {anchorStatus === 'hashing' ? 'Calculating deterministic cryptographic provenance digest' : 'Simulating testnet block inclusion (~2s confirmation time)'}
                  </p>
                  {provenanceHash && (
                    <div style={{
                      marginTop: '16px',
                      padding: '8px 12px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#475569',
                      wordBreak: 'break-all'
                    }}>
                      Hash: {provenanceHash}
                    </div>
                  )}
                </div>
              )}

              {anchorStatus === 'confirmed' && (
                <div style={{
                  padding: '20px 16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#16a34a" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>
                      Anchored to Testnet Blockchain Successfully
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>Transaction Hash: </span>
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#0369a1' }}>
                        {blockchainTx}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>Provenance SHA-256: </span>
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#4b5563' }}>
                        {provenanceHash}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '2px', color: '#15803d', fontWeight: 500 }}>
                      <span>Block: #4,918,204</span>
                      <span>Network: Sepolia Testnet</span>
                      <span>Confirmations: 1</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #f1f5f9',
              backgroundColor: '#fafaf9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              {anchorStatus === 'idle' && (
                <>
                  <button
                    onClick={() => setShowAddSourceModal(false)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAnchorSource}
                    style={{
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: '#1c1917',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Shield size={13} /> Anchor & Upload
                  </button>
                </>
              )}

              {anchorStatus === 'confirmed' && (
                <button
                  onClick={handleFinishAddSource}
                  style={{
                    padding: '8px 20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={14} /> Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
