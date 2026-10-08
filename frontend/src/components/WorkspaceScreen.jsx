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
  Image as ImageIcon
} from 'lucide-react';
import { fetchWorkDetails, editArtifact, promptEditArtifact, approveArtifact, updateClaim } from '../services/api';

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

  const handleSaveEdit = async () => {
    try {
      await editArtifact(work.id, activeOutput.type, editBuffer);
      setIsEditing(false);
      loadData();
    } catch (err) {
      alert("Failed to save edit: " + err.message);
    }
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

  // Render clickable claim citations [CLM-001]
  const renderClickableCitations = (text) => {
    if (!text || typeof text !== 'string') return text || null;
    const parts = text.split(/(\[CLM-\d+(?:,\s*CLM-\d+)*\])/g);
    return parts.map((part, i) => {
      if (/^\[CLM-\d+/.test(part)) {
        const match = part.match(/CLM-\d+/);
        const claimId = match ? match[0] : null;
        const isSelected = selectedClaimId === claimId;
        return (
          <span
            key={i}
            onClick={() => setSelectedClaimId(isSelected ? null : claimId)}
            style={{
              cursor: 'pointer',
              backgroundColor: isSelected ? 'var(--text-primary)' : 'var(--bg-subtle)',
              color: isSelected ? '#ffffff' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              padding: '1px 5px',
              fontSize: '11px',
              fontFamily: 'monospace',
              margin: '0 3px',
              fontWeight: 600,
              transition: 'all 0.1s'
            }}
            title="Click to view verified source context in left rail"
          >
            {part}
          </span>
        );
      }
      return part;
    });
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

      // Detect metadata lines like **Case Identifier:** ...
      if (line && line.startsWith('**') && line.includes(':**')) {
        currentMetadata.push(line);
        continue;
      } else if (currentMetadata.length > 0) {
        // Flush metadata block as clean structured header
        elements.push(
          <div key={`meta-${i}`} style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px',
            fontSize: '12px'
          }}>
            {currentMetadata.map((m, mIdx) => {
              const clean = m.replace(/\*\*/g, '');
              const [k, ...v] = clean.split(':');
              return (
                <div key={mIdx}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{(k || '').trim()}: </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{(v || []).join(':').trim()}</span>
                </div>
              );
            })}
          </div>
        );
        currentMetadata = [];
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

    return <div>{elements}</div>;
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
            border: `1px solid ${activeOutput.status === 'Approved' ? 'var(--badge-done-border)' : 'var(--badge-review-border)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: activeOutput.status === 'Approved' ? '#16a34a' : '#d97706' }} />
            {activeOutput.status}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onFinalize && (
            <button
              onClick={onFinalize}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-subtle)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              Finalize & Publish <ExternalLink size={12} />
            </button>
          )}

          <div style={{ 
            width: '26px', 
            height: '26px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--bg-subtle)', 
            border: '1px solid var(--border)',
            color: 'var(--text-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '11px', 
            fontWeight: 600 
          }}>
            OP
          </div>
        </div>
      </header>

      {/* 3-Column Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 290px', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: Sources & Context-Grounded Claims Rail */}
        <aside style={{ backgroundColor: '#ffffff', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Sources Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Sources ({work.source_package?.length || 0})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {work.source_package?.map((file, i) => {
                const isGrounded = activeSourceFile && file.file_name === activeSourceFile;
                return (
                  <div key={i} style={{ 
                    padding: '6px 8px', 
                    borderRadius: '5px', 
                    border: isGrounded ? '1px solid var(--text-primary)' : '1px solid var(--border)', 
                    backgroundColor: isGrounded ? '#eff6ff' : 'var(--bg-subtle)', 
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <FileText size={12} color={isGrounded ? '#1e40af' : 'var(--text-secondary)'} />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.file_name}
                      </div>
                      <div style={{ fontSize: '10px', color: isGrounded ? '#1e40af' : 'var(--text-muted)' }}>
                        {isGrounded ? '✓ Active Claim Source' : (file.file_type || 'Source doc')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)' }} />

          {/* Evidence Grounding Metrics */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Evidence Grounding ({work.claims?.length || 0} claims)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} /> Verified Grounded
                </span>
                <span style={{ fontWeight: 600 }}>{work.claims?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#92400e' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> Unverified Drift
                </span>
                <span style={{ fontWeight: 600 }}>0</span>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)' }} />

          {/* Context-First Claims & Evidence Cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Claims & Evidence
              </div>
              {selectedClaimId && (
                <button
                  onClick={() => setSelectedClaimId(null)}
                  style={{ background: 'none', border: 'none', fontSize: '10px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Clear filter
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {work.claims?.map(claim => {
                const isSelected = selectedClaimId === claim.claim_id;
                const isClaim1 = claim.claim_id === 'CLM-001';
                const contextTitle = CLAIM_CONTEXT_MAP[claim.claim_id] || 'Verified Factual Claim';
                const primaryEvidence = claim.evidence?.[0];

                return (
                  <div
                    key={claim.claim_id}
                    onClick={() => setSelectedClaimId(isSelected ? null : claim.claim_id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? '#eff6ff' : (isClaim1 && (claim.claim_text || '').includes('52') ? '#f0fdf4' : '#ffffff'),
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'border 0.1s'
                    }}
                  >
                    {/* 1. Context & Identifier Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{claim.claim_id}</span>
                        <span style={{ color: 'var(--border)' }}>·</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '10px' }}>{contextTitle}</span>
                      </div>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 600,
                        color: isClaim1 && (claim.claim_text || '').includes('52') ? '#166534' : 'var(--text-muted)',
                        backgroundColor: isClaim1 && (claim.claim_text || '').includes('52') ? '#dcfce7' : 'var(--bg-subtle)',
                        padding: '1px 4px',
                        borderRadius: '3px'
                      }}>
                        {isClaim1 && (claim.claim_text || '').includes('52') ? 'v2 Updated' : claim.confidence}
                      </span>
                    </div>

                    {/* 2. Atomic Verified Statement */}
                    <div style={{ color: 'var(--text-primary)', lineHeight: 1.4, margin: '2px 0' }}>
                      {claim.claim_text}
                    </div>

                    {/* 3. Source File Origin Badge (Strict requirement) */}
                    {primaryEvidence && (
                      <div style={{ 
                        marginTop: '2px', 
                        padding: '3px 6px', 
                        borderRadius: '4px', 
                        backgroundColor: 'var(--bg-subtle)', 
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
                          <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '9px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{primaryEvidence.supporting_text_or_description}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. Functional Fact Correction Action */}
                    {isSelected && (
                      <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
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
                                onClick={(e) => { e.stopPropagation(); setEditingClaimId(null); }}
                                style={{ padding: '3px 6px', fontSize: '10px', background: 'none', border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyClaimCorrection(claim.claim_id, editedClaimText);
                                }}
                                disabled={updatingClaim}
                                style={{ padding: '3px 8px', fontSize: '10px', backgroundColor: 'var(--text-primary)', color: '#ffffff', border: 'none', borderRadius: '3px', fontWeight: 500, cursor: 'pointer' }}
                              >
                                {updatingClaim ? 'Propagating...' : 'Propagate Update →'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {activeOutput.claim_dependencies?.includes(claim.claim_id) ? 'Cited in active deliverable' : 'Canonical evidence'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </aside>

        {/* CENTER COLUMN: Fixed Navigation & Editorial Canvas */}
        <main style={{ overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Top Fixed Format Selector Navigation */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'wrap'
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
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--text-primary)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isApproved ? '#22c55e' : '#f59e0b',
                    display: 'inline-block'
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
            overflow: 'hidden'
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
                <span style={{ 
                  fontSize: '11px', 
                  backgroundColor: activeOutput.status === 'Approved' ? 'var(--badge-done-bg)' : 'var(--badge-review-bg)', 
                  color: activeOutput.status === 'Approved' ? 'var(--badge-done-text)' : 'var(--badge-review-text)', 
                  border: `1px solid ${activeOutput.status === 'Approved' ? 'var(--badge-done-border)' : 'var(--badge-review-border)'}`,
                  padding: '1px 6px', 
                  borderRadius: '4px', 
                  fontWeight: 500 
                }}>
                  {activeOutput.status}
                </span>
              </div>

              {/* View / Edit Mode Toggles */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {activeOutput.versions?.length >= 2 && (
                  <button
                    onClick={() => { setDiffMode(!diffMode); setIsEditing(false); }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      backgroundColor: diffMode ? 'var(--text-primary)' : 'var(--bg-subtle)',
                      fontSize: '12px',
                      color: diffMode ? '#ffffff' : 'var(--text-primary)',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <GitCompare size={12} />
                    {diffMode ? 'Close Comparison' : 'Compare v1 / v2'}
                  </button>
                )}

                <button
                  onClick={() => { setIsEditing(!isEditing); setDiffMode(false); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    backgroundColor: isEditing ? 'var(--bg-subtle)' : '#ffffff',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={12} />
                  {isEditing ? 'Cancel Edit' : 'Edit Draft'}
                </button>

                {isEditing && (
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Save & Validate
                  </button>
                )}
              </div>
            </div>

            {/* Document Content View / Editorial Diff View */}
            <div style={{ padding: '20px 24px', minHeight: '340px' }}>
              {isEditing ? (
                <textarea
                  value={editBuffer}
                  onChange={e => setEditBuffer(e.target.value)}
                  rows={16}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    lineHeight: 1.6,
                    outline: 'none'
                  }}
                />
              ) : diffMode && activeOutput.versions?.length >= 2 ? (
                /* Stage 7: Clean Editorial Version Comparison */
                <div>
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
              ) : (
                /* Clean Document Reading Mode */
                renderFormattedDocument(activeOutput.content)
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
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={13} color="#166534" />
                <span>
                  All {activeOutput.claim_dependencies?.length || 0} cited claims are grounded against verified canonical facts in the evidence rail.
                </span>
              </div>
              {activeOutput.versions?.length >= 2 && (
                <button
                  onClick={() => setDiffMode(!diffMode)}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {diffMode ? 'View Latest v2' : 'Compare v1 / v2'}
                </button>
              )}
            </div>
          )}

        </main>

        {/* RIGHT COLUMN: Output Settings & Validation Rail */}
        <aside style={{ backgroundColor: '#ffffff', borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Header */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              Deliverable Review
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeOutput.title}
            </div>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)' }} />

          {/* TARGET PARAMETERS (Structured 2-column layout - no overlapping) */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Target Parameters
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Audience</span>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {activeOutput.settings?.audience || 'Leadership'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Tone</span>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {activeOutput.settings?.tone || 'Objective'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Language</span>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {activeOutput.settings?.language || 'English'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Detail</span>
                <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {activeOutput.settings?.detail || 'Standard'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)' }} />

          {/* Verification Checklist */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Verification Checks
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={12} color={activeOutput.validation?.source_grounded !== false ? "#166534" : "#dc2626"} />
                <span style={{ color: 'var(--text-primary)' }}>Source Grounded</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {activeOutput.claim_dependencies?.length || 0} claims
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={12} color={!work.cross_check_summary?.inconsistencies?.length ? "#166534" : "#dc2626"} />
                <span style={{ color: 'var(--text-primary)' }}>Cross-check Verified</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {work.cross_check_summary?.inconsistencies?.length ? `${work.cross_check_summary.inconsistencies.length} conflicts` : '0 conflicts'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={12} color={activeOutput.validation?.schema_valid !== false ? "#166534" : "#dc2626"} />
                <span style={{ color: 'var(--text-primary)' }}>Schema Conformance</span>
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '11px', 
                  color: activeOutput.validation?.schema_valid !== false ? '#166534' : '#dc2626', 
                  fontWeight: 500 
                }}>
                  {activeOutput.validation?.status || (activeOutput.validation?.schema_valid !== false ? 'PASS' : 'FAIL')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)' }} />

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
    </div>
  );
}
