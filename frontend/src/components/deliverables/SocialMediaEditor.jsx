import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Share2,
  Copy,
  Check,
  Send,
  Image as ImageIcon,
  Heart,
  MessageSquare,
  Repeat2,
  Bookmark,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { renderTextWithCitations, ClaimCitationBadge } from '../common/ClaimCitationBadge';

export default function SocialMediaEditor({
  channelType = 'whatsapp_message',
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
  const [content, setContent] = useState(initialContent || '');
  const [copied, setCopied] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charCount = (content || '').length;

  const renderClickableCitations = (text) => {
    return renderTextWithCitations(text, claims, onClaimClick, selectedClaimId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* Header bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Channel Preview:
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {channelType === 'whatsapp_message' ? 'WhatsApp Urgent Dispatch' :
             channelType === 'twitter_post' ? 'X / Twitter Official Thread' :
             channelType === 'linkedin_post' ? 'LinkedIn Executive Advisory' : 'Instagram Visual Carousel'}
          </span>
          {channelType === 'twitter_post' && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: charCount > 280 ? '#dc2626' : '#166534',
              backgroundColor: charCount > 280 ? '#fee2e2' : '#dcfce7',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>
              {charCount} / 280 characters
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            backgroundColor: '#ffffff',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          {copied ? <Check size={12} color="#166534" /> : <Copy size={12} />}
          <span>{copied ? 'Copied to Clipboard' : 'Copy Dispatch Text'}</span>
        </button>
      </div>

      {/* Main Canvas Area */}
      <div style={{
        padding: '24px 20px',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '480px',
        maxHeight: 'calc(100vh - 220px)',
        overflowY: 'auto'
      }}>
        
        {/* WHATSAPP MOCK PREVIEW */}
        {channelType === 'whatsapp_message' && (
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#efeae2',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid #d1d5db'
          }}>
            {/* WhatsApp Header */}
            <div style={{
              backgroundColor: '#075e54',
              color: '#ffffff',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                GOV
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Emergency Operations Command</div>
                <div style={{ fontSize: '10px', opacity: 0.85 }}>Official Notification Broadcast</div>
              </div>
            </div>

            {/* Chat Area with scrollable message */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '12px 14px',
                borderRadius: '8px',
                borderTopLeftRadius: '2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                fontSize: '13px',
                lineHeight: 1.5,
                color: '#111827',
                maxHeight: '420px',
                overflowY: 'auto'
              }}>
                {isEditing ? (
                  <textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      if (onSave) onSave(e.target.value);
                    }}
                    rows={8}
                    style={{
                      width: '100%',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '12.5px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{renderClickableCitations(content)}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
                  <span>03:22 UTC</span>
                  <span style={{ color: '#3b82f6', fontWeight: 700 }}>✓✓</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* X / TWITTER MOCK PREVIEW (Scrollable for threads and long dispatches) */}
        {channelType === 'twitter_post' && (
          <div style={{
            width: '100%',
            maxWidth: '540px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '16px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                GOV
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Official Technical Dispatch</span>
                    <span style={{ color: '#2563eb', fontSize: '12px' }}>✓</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@GovOpsIndia</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>𝕏</span>
                </div>

                {/* Scrollable Tweet Body */}
                <div style={{
                  maxHeight: '380px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                  marginBottom: '10px'
                }}>
                  {isEditing ? (
                    <textarea
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        if (onSave) onSave(e.target.value);
                      }}
                      rows={6}
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        maxHeight: '320px',
                        overflowY: 'auto'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {renderClickableCitations(content)}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '380px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={13} /> 24</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Repeat2 size={13} /> 89</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={13} /> 312</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bookmark size={13} /> 45</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LINKEDIN MOCK PREVIEW (Scrollable for Long Institutional Posts) */}
        {channelType === 'linkedin_post' && (
          <div style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '4px', backgroundColor: '#0a66c2', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700 }}>
                in
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Institutional Operations & Policy Command</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Official Institutional Advisory · Published Bulletin</div>
              </div>
            </div>

            {/* Scrollable Post Body for Long Posts */}
            <div style={{
              maxHeight: '480px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (onSave) onSave(e.target.value);
                  }}
                  rows={12}
                  style={{
                    width: '100%',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '10px',
                    fontSize: '13px',
                    outline: 'none',
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    minHeight: '260px',
                    maxHeight: '420px',
                    overflowY: 'auto'
                  }}
                />
              ) : (
                <div style={{ fontSize: '13.5px', lineHeight: 1.65, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {renderClickableCitations(content)}
                </div>
              )}
            </div>

            {/* Attached Visual Asset(s) for LinkedIn if image_count > 0 */}
            {(() => {
              const linkedinImages = config?.image_count !== undefined ? config.image_count : 1;
              if (linkedinImages <= 0) return null;
              return (
                <div style={{
                  marginTop: '12px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '16px 20px',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 600 }}>
                    Official Institutional Visual Asset
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, lineHeight: 1.4 }}>
                    {title || 'Incident Response & Technical Blueprint'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '6px' }}>
                    {linkedinImages > 1 ? `Multi-Image Document Carousel (1 of ${linkedinImages})` : 'High-Resolution Grounded Overview'}
                  </div>
                  <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {linkedinImages} {linkedinImages === 1 ? 'Image' : 'Images'}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', marginTop: '14px', paddingTop: '10px', color: 'var(--text-secondary)', fontSize: '12px', flexShrink: 0 }}>
              <span>👍 Like · 42</span>
              <span>💬 Comment · 12</span>
              <span>🔁 Repost · 8</span>
              <span>🚀 Send</span>
            </div>
          </div>
        )}

        {/* INSTAGRAM MOCK PREVIEW (Fixed Dimension Card with Compact Banner) */}
        {channelType === 'instagram_post' && (
          <div style={{
            width: '380px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}>
            {/* Fixed Header */}
            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#bc1888' }}>
                    GOV
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>gov_institutional_advisory</span>
              </div>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>•••</span>
            </div>

            {/* Fixed Visual Banner Frame (220px fixed height) with Carousel Navigation */}
            {(() => {
              const totalCards = Math.max(1, Math.min(5, config?.image_count || 1));
              const cardData = [
                {
                  badge: 'Verified Official Bulletin',
                  title: title || 'Institutional Incident & Transformation Advisory',
                  sub: totalCards > 1 ? 'Swipe for Telemetry & Action Directives ➔' : 'Official Grounded Dispatch'
                },
                {
                  badge: 'Telemetry & Evidence',
                  title: 'Disruption & Containment Telemetry',
                  sub: '52-minute containment verified against source incident logs.'
                },
                {
                  badge: 'Action Directives',
                  title: 'Immediate Operational Directives',
                  sub: 'Credential revocation & network boundary verification enforced.'
                },
                {
                  badge: 'Timeline Audit',
                  title: 'Chronological Response Sequence',
                  sub: '02:30 UTC Initial Detection to 03:22 UTC System Restoration.'
                },
                {
                  badge: 'Institutional Contact',
                  title: 'Official Advisory & Inquiries',
                  sub: 'National Technical Research Organisation · Technical Directorate.'
                }
              ];

              const currentCard = cardData[activeCardIndex % totalCards];

              return (
                <div style={{
                  height: '220px',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  padding: '20px 32px',
                  textAlign: 'center',
                  position: 'relative',
                  userSelect: 'none'
                }}>
                  {/* Left / Right Carousel Navigation Controls */}
                  {totalCards > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveCardIndex(prev => (prev > 0 ? prev - 1 : totalCards - 1))}
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCardIndex(prev => (prev < totalCards - 1 ? prev + 1 : 0))}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}

                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontWeight: 600 }}>
                    {currentCard.badge}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.4, maxWidth: '280px' }}>
                    {currentCard.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '12px', fontWeight: 500 }}>
                    {currentCard.sub}
                  </div>

                  {/* Card Indicator Badge */}
                  {totalCards > 1 ? (
                    <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {(activeCardIndex % totalCards) + 1} / {totalCards}
                    </div>
                  ) : (
                    <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                      1 / 1
                    </div>
                  )}

                  {/* Dot Indicators */}
                  {totalCards > 1 && (
                    <div style={{ position: 'absolute', bottom: '10px', display: 'flex', gap: '4px' }}>
                      {Array.from({ length: totalCards }).map((_, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveCardIndex(i)}
                          style={{
                            width: i === (activeCardIndex % totalCards) ? '12px' : '5px',
                            height: '5px',
                            borderRadius: '3px',
                            backgroundColor: i === (activeCardIndex % totalCards) ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Action Buttons Row */}
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                <Heart size={18} style={{ cursor: 'pointer' }} />
                <MessageSquare size={18} style={{ cursor: 'pointer' }} />
                <Send size={18} style={{ cursor: 'pointer' }} />
              </div>
              <Bookmark size={18} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
            </div>

            {/* Fixed Caption Container with internal scroll */}
            <div style={{
              padding: '10px 14px',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (onSave) onSave(e.target.value);
                  }}
                  rows={4}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  <strong style={{ marginRight: '4px' }}>gov_institutional_advisory</strong>
                  {renderClickableCitations(content)}
                </div>
              )}
            </div>

            {/* Footer Metadata */}
            <div style={{ padding: '6px 14px 10px 14px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              2 Hours Ago · Official Dispatch
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
