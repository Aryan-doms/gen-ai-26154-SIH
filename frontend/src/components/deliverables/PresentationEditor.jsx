import React, { useState, useEffect } from 'react';
import {
  Presentation,
  Plus,
  Trash2,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  FileText
} from 'lucide-react';
import { exportPresentationToPptx } from '../../utils/exportUtils';
import { ClaimCitationBadge, renderTextWithCitations } from '../common/ClaimCitationBadge';

export default function PresentationEditor({
  title,
  initialContent,
  workId,
  status,
  claims = [],
  config = {},
  onSave,
  onClaimClick,
  selectedClaimId,
  isEditing,
  setIsEditing
}) {
  // Parse initial slides from content
  const parseSlidesFromContent = (content) => {
    if (Array.isArray(content)) return content;
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.slides && Array.isArray(parsed.slides)) return parsed.slides;
      } catch (_) {}
    }

    // Default institutional briefing slides grounded in canonical context
    return [
      {
        slide_number: 1,
        layout: 'title',
        title: title || 'Executive Briefing: Operational Incident Analysis',
        subtitle: 'Comprehensive Multimodal Triage for Decision-Makers · 17 Apr 2026',
        claims_cited: ['CLM-001'],
        speaker_notes: 'Open by stating that containment is complete and zero secondary breach occurred.'
      },
      {
        slide_number: 2,
        layout: 'split_column',
        title: 'Ingress Vector & Blast Radius Containment',
        left_column: [
          'External ingress via legacy VPN gateway',
          'Privileged credentials exploited at 02:35 UTC',
          'Lateral movement halted within 4 hours'
        ],
        right_column: [
          'Subnet-B isolated prior to database traversal',
          'Core cryptographic keys rotated',
          'Zero exfiltration observed on monitored egress'
        ],
        claims_cited: ['CLM-002', 'CLM-003', 'CLM-004'],
        speaker_notes: 'Highlight that automated network micro-segmentation successfully starved compute resources.'
      },
      {
        slide_number: 3,
        layout: 'key_points',
        title: 'Service Disruption & Baseline Restoration',
        key_points: [
          'Total operational disruption was limited to 52 minutes across research portals [CLM-001].',
          'Failover clusters maintained 100% data integrity during containment.',
          'Full baseline operating capacity re-established at 03:22 UTC.'
        ],
        claims_cited: ['CLM-001', 'CLM-005'],
        speaker_notes: 'Provide assurance on research data integrity; confirm all databases verified uncompromised.'
      },
      {
        slide_number: 4,
        layout: 'key_points',
        title: 'Action Directives & Post-Incident Controls',
        key_points: [
          'Mandatory token revocation across all administrative endpoints.',
          'Enforce hardware FIDO2 MFA for all external network ingress.',
          'Continuous SOC monitoring active on 24/7 high-alert protocol.'
        ],
        claims_cited: ['CLM-005'],
        speaker_notes: 'Close with concrete remediation timelines for the executive board sign-off.'
      }
    ];
  };

  const [slides, setSlides] = useState(() => parseSlidesFromContent(initialContent));
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (initialContent) {
      setSlides(parseSlidesFromContent(initialContent));
    }
  }, [initialContent]);

  const activeSlide = slides[activeSlideIdx] || slides[0] || {};

  const handleUpdateSlideField = (field, value) => {
    const updated = [...slides];
    updated[activeSlideIdx] = {
      ...updated[activeSlideIdx],
      [field]: value
    };
    setSlides(updated);
  };

  const handleUpdateListItem = (listName, index, value) => {
    const updated = [...slides];
    const currentList = [...(updated[activeSlideIdx][listName] || [])];
    currentList[index] = value;
    updated[activeSlideIdx] = {
      ...updated[activeSlideIdx],
      [listName]: currentList
    };
    setSlides(updated);
  };

  const handleAddSlide = () => {
    if (slides.length >= 8) {
      alert('The maximum slide limit is 8 slides per presentation.');
      return;
    }
    const newSlide = {
      slide_number: slides.length + 1,
      layout: 'key_points',
      title: 'New Slide: Remediation & Status',
      key_points: ['Key observation statement [CLM-001]', 'Actionable recommendation'],
      claims_cited: ['CLM-001'],
      speaker_notes: 'Notes for presenter.'
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIdx(slides.length);
  };

  const handleDeleteSlide = (idxToDelete) => {
    if (slides.length <= 1) {
      alert('A presentation must contain at least one slide.');
      return;
    }
    const filtered = slides.filter((_, i) => i !== idxToDelete);
    setSlides(filtered);
    setActiveSlideIdx(Math.max(0, activeSlideIdx - 1));
  };

  const handleSaveDeck = () => {
    if (onSave) {
      onSave(JSON.stringify({ deck_title: title, slides }, null, 2));
    }
    setIsEditing(false);
  };

  const handlePptxExport = async () => {
    setDownloading(true);
    try {
      await exportPresentationToPptx({
        deckTitle: title || 'Executive_Presentation',
        slides
      });
    } catch (err) {
      alert('PPTX export failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* Presentation Top Control Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        backgroundColor: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Left: Slide navigation & count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveSlideIdx(Math.max(0, activeSlideIdx - 1))}
            disabled={activeSlideIdx === 0}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              cursor: activeSlideIdx === 0 ? 'default' : 'pointer',
              opacity: activeSlideIdx === 0 ? 0.4 : 1
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Slide {activeSlideIdx + 1} of {slides.length}
          </span>
          <button
            onClick={() => setActiveSlideIdx(Math.min(slides.length - 1, activeSlideIdx + 1))}
            disabled={activeSlideIdx === slides.length - 1}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              cursor: activeSlideIdx === slides.length - 1 ? 'default' : 'pointer',
              opacity: activeSlideIdx === slides.length - 1 ? 0.4 : 1
            }}
          >
            <ChevronRight size={13} />
          </button>

          {isEditing && (
            <button
              onClick={handleAddSlide}
              disabled={slides.length >= 8}
              title={slides.length >= 8 ? 'Maximum limit of 8 slides reached' : 'Add slide'}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: '#ffffff',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                cursor: slides.length >= 8 ? 'not-allowed' : 'pointer',
                opacity: slides.length >= 8 ? 0.4 : 1
              }}
            >
              <Plus size={12} /> Add Slide ({slides.length}/8)
            </button>
          )}
        </div>
      </div>

      {/* Main 16:9 Slide Canvas Workspace */}
      <div style={{ padding: '24px', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
        
        {/* The 16:9 Slide Container */}
        <div style={{
          width: '100%',
          maxWidth: '780px',
          aspectRatio: '16 / 9',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}>
          
          {/* Slide Top Accent Bar */}
          <div style={{
            height: '38px',
            backgroundColor: '#0f172a',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.02em' }}>
              INCIDENT RESPONSE BRIEFING
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
              SLIDE {activeSlideIdx + 1} / {slides.length}
            </div>
          </div>

          {/* Slide Body */}
          <div style={{ padding: '24px 30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Slide Title */}
            {isEditing ? (
              <input
                type="text"
                value={activeSlide.title || ''}
                onChange={(e) => handleUpdateSlideField('title', e.target.value)}
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0f172a',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  marginBottom: '16px',
                  outline: 'none',
                  width: '100%'
                }}
              />
            ) : (
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                {activeSlide.title}
              </h2>
            )}

            {/* Slide Layout Content */}
            {activeSlide.layout === 'title' ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {isEditing ? (
                  <textarea
                    value={activeSlide.subtitle || ''}
                    onChange={(e) => handleUpdateSlideField('subtitle', e.target.value)}
                    rows={2}
                    style={{
                      fontSize: '14px',
                      color: '#475569',
                      border: '1px solid #94a3b8',
                      borderRadius: '4px',
                      padding: '6px',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6 }}>
                    {activeSlide.subtitle}
                  </p>
                )}
              </div>
            ) : activeSlide.left_column && activeSlide.right_column ? (
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Exposure & Ingress</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', lineHeight: 1.6, color: '#1e293b' }}>
                    {activeSlide.left_column.map((item, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleUpdateListItem('left_column', i, e.target.value)}
                            style={{ width: '100%', fontSize: '12px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          />
                        ) : (
                          renderTextWithCitations(item, claims, onClaimClick, selectedClaimId)
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Containment Baseline</div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', lineHeight: 1.6, color: '#1e293b' }}>
                    {activeSlide.right_column.map((item, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleUpdateListItem('right_column', i, e.target.value)}
                            style={{ width: '100%', fontSize: '12px', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          />
                        ) : (
                          renderTextWithCitations(item, claims, onClaimClick, selectedClaimId)
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: 1.7, color: '#1e293b' }}>
                  {(activeSlide.key_points || []).map((pt, pIdx) => (
                    <li key={pIdx} style={{ marginBottom: '8px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={pt}
                          onChange={(e) => handleUpdateListItem('key_points', pIdx, e.target.value)}
                          style={{ width: '100%', fontSize: '12px', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      ) : (
                        renderTextWithCitations(pt, claims, onClaimClick, selectedClaimId)
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clean Presentation Slide Footer */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '8px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#94a3b8'
            }}>
              <span>TLP:AMBER · Executive Briefing</span>
              <span>Slide {activeSlideIdx + 1} of {slides.length}</span>
            </div>

          </div>
        </div>

        {/* Linked Grounded Claims (Clean metadata bar outside the slide) */}
        <div style={{
          width: '100%',
          maxWidth: '780px',
          marginTop: '10px',
          padding: '8px 14px',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.02em' }}>
              Linked Grounded Claims ({(activeSlide.claims_cited || []).length}):
            </span>
            {(activeSlide.claims_cited || []).length > 0 ? (
              (activeSlide.claims_cited || []).map(cid => (
                <ClaimCitationBadge
                  key={cid}
                  claimId={cid}
                  claims={claims}
                  onClaimClick={onClaimClick}
                  isSelected={selectedClaimId === cid}
                />
              ))
            ) : (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' }}>
                No claim citations linked to this slide
              </span>
            )}
          </div>

          {isEditing && (
            <button
              onClick={() => handleDeleteSlide(activeSlideIdx)}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500 }}
            >
              <Trash2 size={12} /> Delete Slide
            </button>
          )}
        </div>

        {/* Thumbnail Strip */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '16px',
          width: '100%',
          maxWidth: '780px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {slides.map((s, idx) => {
            const isSel = idx === activeSlideIdx;
            return (
              <div
                key={idx}
                onClick={() => setActiveSlideIdx(idx)}
                style={{
                  width: '120px',
                  aspectRatio: '16 / 9',
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  border: isSel ? '2px solid var(--text-primary)' : '1px solid #cbd5e1',
                  padding: '6px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSel ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {idx + 1}. {s.title}
                </div>
                <div style={{ fontSize: '8px', color: '#94a3b8', textAlign: 'right' }}>
                  {s.claims_cited?.length || 0} claims
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
