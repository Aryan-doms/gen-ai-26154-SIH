// Screen 02: Universal Configuration Screen
// Linear-style toggle tiles, compact communication settings, and summary action bar
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Check, 
  SlidersHorizontal,
  Share2,
  Video,
  Presentation,
  Shield,
  FileCheck,
  MessageCircle,
  Image,
  Briefcase,
  Upload,
  X,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Classic mid-truncation helper (preserves start, middle ellipsis, and extension)
function formatMiddleTruncate(fileName, maxLength = 19) {
  if (!fileName || fileName.length <= maxLength) return fileName;
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot !== -1 ? fileName.slice(lastDot) : '';
  const nameWithoutExt = lastDot !== -1 ? fileName.slice(0, lastDot) : fileName;
  
  const targetChars = maxLength - ext.length - 3;
  if (targetChars <= 2) {
    return fileName.slice(0, Math.max(3, maxLength - 3)) + '...';
  }
  const frontChars = Math.ceil(targetChars * 0.55);
  const backChars = Math.floor(targetChars * 0.45);
  
  return `${nameWithoutExt.slice(0, frontChars)}...${nameWithoutExt.slice(-backChars)}${ext}`;
}

export default function ConfigureScreen({ initialPrompt, onStartTransformation, onCancel }) {
  // Global defaults
  const [title, setTitle] = useState(initialPrompt || 'Operation Silver Falcon');
  const [audience, setAudience] = useState('Leadership');
  const [tone, setTone] = useState('Objective');
  const [detail, setDetail] = useState('Standard');
  const [objective, setObjective] = useState('Information Sharing');
  const [classification, setClassification] = useState('Public Release');
  const [languages, setLanguages] = useState(['English']);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // 9 Supported Deliverables (strictly clean names)
  const availableOutputs = [
    { id: 'executive_summary', title: 'Executive Summary', icon: FileCheck },
    { id: 'advisory', title: 'Advisory', icon: Shield },
    { id: 'presentation', title: 'Presentation', icon: Presentation },
    { id: 'infographic', title: 'Infographic', icon: SlidersHorizontal },
    { id: 'video_package', title: 'Video Package', icon: Video },
    { id: 'linkedin_post', title: 'LinkedIn Post', icon: Briefcase },
    { id: 'twitter_post', title: 'Twitter / X Post', icon: Share2 },
    { id: 'whatsapp_message', title: 'WhatsApp', icon: MessageCircle },
    { id: 'instagram_post', title: 'Instagram Post', icon: Image }
  ];

  // Selected state for deliverables
  const [selectedOutputs, setSelectedOutputs] = useState({
    executive_summary: true,
    advisory: true,
    presentation: true,
    video_package: true,
    twitter_post: true,
    whatsapp_message: true,
    linkedin_post: false,
    infographic: false,
    instagram_post: false
  });

  // Per-deliverable custom overrides state
  const [customOverrides, setCustomOverrides] = useState({
    twitter_post: {
      account_type: 'standard', // 'standard' (main + reply thread < 280) vs 'premium' (long-form)
      detail: 'Brief'
    },
    whatsapp_message: {
      detail: 'Brief',
      objective: 'Actionable Guidance'
    }
  });

  // Which deliverable is currently expanded for customization
  const [expandedDeliverable, setExpandedDeliverable] = useState(null);

  // Source files
  const initialSourceFiles = [
    { name: '01_incident_report.pdf', size: '2.4 KB' },
    { name: '02_incident_timeline.pdf', size: '1.4 KB' },
    { name: '03_threat_intel.png', size: '1.0 KB' },
    { name: '04_affected_system.png', size: '1.1 KB' },
    { name: '05_incident_context.txt', size: '0.9 KB' },
    { name: '06_reference_advisory.pdf', size: '1.0 KB' }
  ];

  const [sourceFiles, setSourceFiles] = useState(initialSourceFiles);
  const [hoveredFileIdx, setHoveredFileIdx] = useState(null);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`
      }));
      setSourceFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (idxToRemove) => {
    setSourceFiles(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Universal enum options
  const audienceOptions = [
    'Leadership',
    'Technical Specialists',
    'General Public',
    'Internal Staff',
    'Regulators and Partners'
  ];

  const toneOptions = [
    'Authoritative',
    'Formal',
    'Urgent',
    'Objective',
    'Accessible',
    'Cautionary'
  ];

  const detailOptions = [
    'Brief',
    'Standard',
    'Detailed',
    'Technical'
  ];

  const objectiveOptions = [
    'Information Sharing',
    'Actionable Guidance',
    'Executive Briefing',
    'Public Announcement',
    'Compliance Update'
  ];

  const classificationOptions = [
    'Public Release',
    'Internal Use Only',
    'Confidential'
  ];

  const allSupportedLanguages = [
    'English',
    'Hindi',
    'Bengali',
    'Tamil',
    'Telugu',
    'Marathi',
    'Gujarati',
    'Kannada'
  ];

  // Toggle deliverable selection
  const handleToggleOutput = (id) => {
    setSelectedOutputs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    if (expandedDeliverable === id) {
      setExpandedDeliverable(null);
    }
  };

  // Toggle language selection (max 3)
  const handleToggleLanguage = (lang) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter(l => l !== lang));
      }
    } else {
      if (languages.length < 3) {
        setLanguages([...languages, lang]);
      }
    }
  };

  // Update a specific override for a deliverable
  const handleUpdateOverride = (deliverableId, field, value) => {
    setCustomOverrides(prev => ({
      ...prev,
      [deliverableId]: {
        ...(prev[deliverableId] || {}),
        [field]: value
      }
    }));
  };

  // Reset a deliverable's overrides back to global defaults
  const handleResetToGlobal = (deliverableId) => {
    setCustomOverrides(prev => {
      const copy = { ...prev };
      delete copy[deliverableId];
      return copy;
    });
  };

  const selectedCount = Object.values(selectedOutputs).filter(Boolean).length;

  const handleSubmit = () => {
    if (selectedCount === 0) return;
    const requested = Object.keys(selectedOutputs).filter(k => selectedOutputs[k]);
    onStartTransformation({
      title: title.trim() || 'New Transformation',
      audience,
      tone,
      detail,
      objective,
      classification,
      languages,
      additional_instructions: additionalInstructions,
      requested_outputs: requested,
      output_overrides: customOverrides
    });
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 32px 72px 32px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <button 
            onClick={onCancel}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              fontSize: '13px', 
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            New Transformation
          </h1>
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedCount === 0}
          style={{
            backgroundColor: selectedCount > 0 ? 'var(--btn-primary-bg)' : 'var(--bg-subtle)',
            color: selectedCount > 0 ? 'var(--btn-primary-text)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 18px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s'
          }}
        >
          Start Transformation
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Project Name */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Project Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Operation Silver Falcon, Incident 2026-0417, Quarterly Intelligence Brief..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Source Files */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Source Files ({sourceFiles.length})
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}>
              <Upload size={12} />
              + Add Files
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Uploaded files chips with consistent size & mid-truncation */}
            {sourceFiles.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: '8px'
              }}>
                {sourceFiles.map((file, idx) => (
                  <div 
                    key={idx}
                    onMouseEnter={() => setHoveredFileIdx(idx)}
                    onMouseLeave={() => setHoveredFileIdx(null)}
                    style={{ 
                      position: 'relative',
                      height: '36px',
                      padding: '0 8px 0 10px',
                      borderRadius: '6px', 
                      border: hoveredFileIdx === idx ? '1px solid var(--text-primary)' : '1px solid var(--border)', 
                      backgroundColor: hoveredFileIdx === idx ? '#ffffff' : 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      fontSize: '12px',
                      cursor: 'default',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.1s, background-color 0.1s'
                    }}
                  >
                    {/* Instant Tooltip (0ms delay) */}
                    {hoveredFileIdx === idx && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 7px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1c1917',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 60,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
                      }}>
                        <span>{file.name}</span>
                        {/* Downward triangle pointer */}
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderTop: '4px solid #1c1917'
                        }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                      <FileText size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                      <span style={{ 
                        fontWeight: 500, 
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {formatMiddleTruncate(file.name, 18)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {file.size}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0 2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={`Remove ${file.name}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '14px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '12px',
                border: '1px dashed var(--border)',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-subtle)'
              }}>
                No source documents attached. Use "+ Add Files" to upload files.
              </div>
            )}

            {/* Quiet format indicator */}
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              borderTop: '1px dashed var(--border)',
              paddingTop: '8px'
            }}>
              Supported file formats: PDF, TXT, DOCX, PNG, JPG, MP4. Files undergo SHA-256 seal extraction and grounding checks.
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Deliverables ({selectedCount} selected)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click tile to toggle · Click badge to customize
            </div>
          </div>

          {/* Compact Toggle Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '8px'
          }}>
            {availableOutputs.map(out => {
              const isSelected = !!selectedOutputs[out.id];
              const isCustom = !!customOverrides[out.id];
              const isExpanded = expandedDeliverable === out.id;

              return (
                <div
                  key={out.id}
                  onClick={() => handleToggleOutput(out.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? '#ffffff' : 'var(--bg-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '40px',
                    transition: 'all 0.12s ease',
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.03)' : 'none',
                    opacity: isSelected ? 1 : 0.65
                  }}
                >
                  {/* Left: Checkbox & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--text-primary)' : '#ffffff',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {out.title}
                    </span>
                  </div>

                  {/* Right: Custom / Global arrow pill */}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDeliverable(isExpanded ? null : out.id);
                      }}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        border: isCustom ? '1px solid #fed7aa' : '1px solid var(--border)',
                        backgroundColor: isCustom ? '#fff7ed' : 'var(--bg-subtle)',
                        color: isCustom ? '#c2410c' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0,
                        lineHeight: 1.2
                      }}
                      title={isCustom ? 'Custom parameters applied (click to edit)' : 'Inheriting global defaults (click to customize)'}
                    >
                      <span>{isCustom ? 'Custom' : 'Global'}</span>
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Deliverable Customization Drawer */}
          {expandedDeliverable && selectedOutputs[expandedDeliverable] && (
            <div style={{
              marginTop: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              padding: '16px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Custom Settings for {availableOutputs.find(o => o.id === expandedDeliverable)?.title}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    (Overrides take precedence over Global Defaults)
                  </span>
                </div>

                <button
                  onClick={() => handleResetToGlobal(expandedDeliverable)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Reset to Global Defaults
                </button>
              </div>

              {/* Specific Twitter / X Format Toggle */}
              {expandedDeliverable === 'twitter_post' && (
                <div style={{ marginBottom: '14px', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    X (Twitter) Account Limit Format
                  </label>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="twitter_type" 
                        checked={customOverrides.twitter_post?.account_type !== 'premium'}
                        onChange={() => handleUpdateOverride('twitter_post', 'account_type', 'standard')}
                      />
                      <span>Standard Account (Main post + reply thread within 280 chars)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="twitter_type" 
                        checked={customOverrides.twitter_post?.account_type === 'premium'}
                        onChange={() => handleUpdateOverride('twitter_post', 'account_type', 'premium')}
                      />
                      <span>X Premium (Long-form post / article format)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Specific WhatsApp Message Format */}
              {expandedDeliverable === 'whatsapp_message' && (
                <div style={{ marginBottom: '14px', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    WhatsApp Broadcast Purpose
                  </label>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="whatsapp_purpose" 
                        checked={customOverrides.whatsapp_message?.purpose !== 'community'}
                        onChange={() => handleUpdateOverride('whatsapp_message', 'purpose', 'alert')}
                      />
                      <span>Community  Message</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="whatsapp_purpose" 
                        checked={customOverrides.whatsapp_message?.purpose === 'community'}
                        onChange={() => handleUpdateOverride('whatsapp_message', 'purpose', 'community')}
                      />
                      <span>Direct Message</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Grid of Parameter Overrides */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Audience Override
                  </label>
                  <select
                    value={customOverrides[expandedDeliverable]?.audience || ''}
                    onChange={(e) => handleUpdateOverride(expandedDeliverable, 'audience', e.target.value || undefined)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border)', fontSize: '12px', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Global ({audience})</option>
                    {audienceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Tone Override
                  </label>
                  <select
                    value={customOverrides[expandedDeliverable]?.tone || ''}
                    onChange={(e) => handleUpdateOverride(expandedDeliverable, 'tone', e.target.value || undefined)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border)', fontSize: '12px', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Global ({tone})</option>
                    {toneOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Detail Override
                  </label>
                  <select
                    value={customOverrides[expandedDeliverable]?.detail || ''}
                    onChange={(e) => handleUpdateOverride(expandedDeliverable, 'detail', e.target.value || undefined)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border)', fontSize: '12px', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Global ({detail})</option>
                    {detailOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Objective Override
                  </label>
                  <select
                    value={customOverrides[expandedDeliverable]?.objective || ''}
                    onChange={(e) => handleUpdateOverride(expandedDeliverable, 'objective', e.target.value || undefined)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid var(--border)', fontSize: '12px', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Global ({objective})</option>
                    {objectiveOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Optional Output-Specific Additional Instructions */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Specific Constraints for this Deliverable (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Do not mention specific internal server hostnames; emphasize helpline 1930."
                  value={customOverrides[expandedDeliverable]?.additional_instructions || ''}
                  onChange={(e) => handleUpdateOverride(expandedDeliverable, 'additional_instructions', e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '5px', border: '1px solid var(--border)', fontSize: '12px' }}
                />
              </div>

            </div>
          )}
        </div>

        {/* Communication Settings */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Communication Settings
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            
            {/* 4 Core Parameters in a neat compact grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: '#ffffff' }}
                >
                  {audienceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: '#ffffff' }}
                >
                  {toneOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Detail
                </label>
                <select
                  value={detail}
                  onChange={e => setDetail(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: '#ffffff' }}
                >
                  {detailOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Communication Objective
                </label>
                <select
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: '#ffffff' }}
                >
                  {objectiveOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* Classification & Multi-Language row */}
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'flex-start' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Handling Classification
                </label>
                <select
                  value={classification}
                  onChange={e => setClassification(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', backgroundColor: '#ffffff' }}
                >
                  {classificationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Languages ({languages.length}/3 selected)
                  </label>
                  {languages.length === 3 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Maximum 3 reached
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {allSupportedLanguages.map(lang => {
                    const isSelected = languages.includes(lang);
                    const isDisabled = !isSelected && languages.length >= 3;

                    return (
                      <button
                        key={lang}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleToggleLanguage(lang)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '5px',
                          border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--btn-primary-bg)' : (isDisabled ? 'var(--bg-subtle)' : '#ffffff'),
                          color: isSelected ? 'var(--btn-primary-text)' : (isDisabled ? 'var(--text-muted)' : 'var(--text-primary)'),
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.1s'
                        }}
                      >
                        {isSelected && <Check size={11} strokeWidth={2.5} />}
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Additional Instructions (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Additional Instructions (Optional operator constraints)
              </label>
              <input
                type="text"
                placeholder="e.g. Do not speculate on nation-state attribution; reference incident response helpline 1930."
                value={additionalInstructions}
                onChange={e => setAdditionalInstructions(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
            </div>

          </div>
        </div>

        {/* Bottom Summary Bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <span>{selectedCount} deliverables</span>
            <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>·</span>
            <span>{languages.length} {languages.length === 1 ? 'language' : 'languages'} ({languages.join(', ')})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedCount === 0}
              style={{
                backgroundColor: selectedCount > 0 ? 'var(--btn-primary-bg)' : 'var(--bg-subtle)',
                color: selectedCount > 0 ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Start Transformation</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
