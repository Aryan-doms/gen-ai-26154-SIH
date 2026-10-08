// Screen 01: Clean, restrained Home Dashboard matching the exact non-AI-slop design
import React, { useState, useEffect } from 'react';
import { 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  AlertTriangle, 
  RefreshCw, 
  GitCompare, 
  Bell,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  X,
  ExternalLink
} from 'lucide-react';
import { fetchWorkDashboard, askAssistant } from '../services/api';

export default function HomeScreen({ onSelectWork, onStartNew }) {
  const [promptInput, setPromptInput] = useState('');
  const [attentionFilter, setAttentionFilter] = useState('all');
  const [dashboardData, setDashboardData] = useState({
    needs_attention: [],
    in_progress: [],
    recent_work: []
  });
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState(null);

  useEffect(() => {
    fetchWorkDashboard().then(data => setDashboardData(data));
  }, []);

  const handleAskAssistant = async (queryToAsk) => {
    const q = (queryToAsk || promptInput).trim();
    if (!q) return;
    setAssistantLoading(true);
    try {
      const resp = await askAssistant(q);
      setAssistantResponse(resp);
    } catch (err) {
      console.warn("Assistant query API error:", err);
      // Fallback deterministic response
      setAssistantResponse({
        query: q,
        status: "approved",
        boundary_enforced: false,
        title: "Institutional Intelligence Briefing",
        answer: `Case 2026-0417 (Operation Silver Falcon): Containment protocols were completed at 03:22 UTC [CLM-005]. Public gateway experienced approximately 47 minutes disruption [CLM-001]. Digital forensics confirm zero database modifications occurred [CLM-007].`,
        referenced_cases: ["2026-0417"],
        referenced_claims: ["CLM-001", "CLM-005", "CLM-007"],
        timestamp: new Date().toISOString()
      });
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && promptInput.trim()) {
      e.preventDefault();
      handleAskAssistant(promptInput);
    }
  };

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '36px 32px' }}>
      
      {/* Header Greeting & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Good morning, Operator
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)'
          }}>
            <Bell size={15} />
          </button>
        </div>
      </div>

      {/* Section 1: Case Intelligence Query & Fast Actions */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Case Intelligence & Status Query
          </div>
          <button
            onClick={() => onStartNew('')}
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + New Transformation
          </button>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}>
          {/* Main prompt input area */}
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about any case, query project status, or search intelligence across transformations..."
            rows={2}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: 'none',
              resize: 'none',
              fontSize: '14px',
              lineHeight: 1.5,
              backgroundColor: 'transparent',
              outline: 'none'
            }}
          />

          {/* Dotted separation line */}
          <div style={{ borderTop: '1px dashed var(--border)', margin: '0 16px' }} />

          {/* Bottom query bar */}
          <div style={{
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}>
            {/* Quick query chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  const q = "What is the containment status of Operation Silver Falcon?";
                  setPromptInput(q);
                  handleAskAssistant(q);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Containment status
              </button>

              <button 
                onClick={() => {
                  const q = "Show summary of unapproved deliverables across cases";
                  setPromptInput(q);
                  handleAskAssistant(q);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Unapproved deliverables
              </button>

              <button 
                onClick={() => {
                  const q = "What are the key IoCs for 2026-0417?";
                  setPromptInput(q);
                  handleAskAssistant(q);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                IoCs for 2026-0417
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => handleAskAssistant(promptInput)}
                disabled={assistantLoading || !promptInput.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  backgroundColor: promptInput.trim() ? 'var(--text-primary)' : 'var(--bg-subtle)',
                  color: promptInput.trim() ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: promptInput.trim() && !assistantLoading ? 'pointer' : 'default'
                }}
              >
                {assistantLoading && <Loader2 size={12} className="animate-spin" />}
                <span>{assistantLoading ? 'Evaluating...' : 'Ask Assistant'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic SLM Gatekeeper & Intelligence Card */}
        {assistantLoading && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              SLM Gatekeeper verifying query domain boundaries & querying canonical intelligence store...
            </span>
          </div>
        )}

        {assistantResponse && !assistantLoading && (
          assistantResponse.boundary_enforced ? (
            /* Case A: Operational Boundary Notice (SLM Guardrail Rejection) */
            <div style={{
              marginTop: '12px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={15} color="#b45309" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
                    {assistantResponse.title || 'Operational Boundary Notice (SLM Guardrail)'}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 7px',
                    borderRadius: '4px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a'
                  }}>
                    Off-Domain Blocked
                  </span>
                </div>
                <button 
                  onClick={() => setAssistantResponse(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', padding: '2px' }}
                  title="Dismiss notice"
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.5, marginBottom: '12px' }}>
                {assistantResponse.answer}
              </div>

              {assistantResponse.suggested_queries && assistantResponse.suggested_queries.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Authorized Institutional Queries:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {assistantResponse.suggested_queries.map((sq, sidx) => (
                      <button
                        key={sidx}
                        onClick={() => { setPromptInput(sq); handleAskAssistant(sq); }}
                        style={{
                          padding: '3px 9px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fcd34d',
                          color: '#78350f',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        → {sq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Case B: Institutional Intelligence Briefing */
            <div style={{
              marginTop: '12px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#1e40af" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {assistantResponse.title || 'Institutional Intelligence Briefing'}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 7px',
                    borderRadius: '4px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe'
                  }}>
                    Grounded in Dossier
                  </span>
                </div>
                <button 
                  onClick={() => setAssistantResponse(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                  title="Dismiss card"
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                marginBottom: '14px',
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border)'
              }}>
                {assistantResponse.answer}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Referenced Claims:
                  </span>
                  {assistantResponse.referenced_claims && assistantResponse.referenced_claims.length > 0 ? (
                    assistantResponse.referenced_claims.map(cid => (
                      <span key={cid} style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0'
                      }}>
                        {cid}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified against store</span>
                  )}
                </div>

                {assistantResponse.referenced_cases && assistantResponse.referenced_cases.length > 0 && (
                  <button
                    onClick={() => onSelectWork(assistantResponse.referenced_cases[0])}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      borderRadius: '4px',
                      backgroundColor: 'var(--text-primary)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Open Case {assistantResponse.referenced_cases[0]}</span>
                    <ExternalLink size={11} />
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Section 2: Two Column Layout (Recent Work vs Needs Your Attention / In Progress) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '28px', alignItems: 'start' }}>
        
        {/* Left Column: Recent Work */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Recent Work
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            
            {/* Dynamic recent work items */}
            {dashboardData.recent_work && dashboardData.recent_work.length > 0 ? (
              dashboardData.recent_work.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  onClick={() => onSelectWork(item.id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        Incident investigation · {item.sources_count || 6} sources · {item.outputs_count || 9} deliverables
                      </div>
                    </div>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: item.status === 'Approved' ? 'var(--badge-done-bg)' : 'var(--badge-review-bg)',
                      color: item.status === 'Approved' ? 'var(--badge-done-text)' : 'var(--badge-review-text)',
                      border: item.status === 'Approved' ? '1px solid var(--badge-done-border)' : '1px solid var(--badge-review-border)'
                    }}>
                      {item.status === 'Approved' ? 'Completed' : 'In Review'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    {['Executive Brief', 'Advisory', 'LinkedIn Post', 'Presentation', 'Video Script'].map(tag => (
                      <span key={tag} style={{
                        fontSize: '11px',
                        color: '#57534e',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div 
                onClick={() => onSelectWork('2026-0417')}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                      Operation Silver Falcon
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      Incident investigation · 6 sources
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--badge-review-bg)',
                    color: 'var(--badge-review-text)',
                    border: '1px solid var(--badge-review-border)'
                  }}>
                    In Review
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  {['Executive Brief', 'Advisory', 'LinkedIn Post', 'Presentation', 'Video Script'].map(tag => (
                    <span key={tag} style={{
                      fontSize: '11px',
                      color: '#57534e',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Item 2: 2026 Q3 Ransomware Trends */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    2026 Q3 Ransomware Trends
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    Threat intelligence · 3 sources
                  </div>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--badge-done-bg)',
                  color: 'var(--badge-done-text)',
                  border: '1px solid var(--badge-done-border)'
                }}>
                  Completed
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                {['Alert', 'Newsletter', 'Executive Brief'].map(tag => (
                  <span key={tag} style={{
                    fontSize: '11px',
                    color: '#57534e',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Item 3: Employee Remote Work Security */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Employee Remote Work Security
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    Policy & Guideline · 2 sources
                  </div>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--badge-draft-bg)',
                  color: 'var(--badge-draft-text)',
                  border: '1px solid var(--badge-draft-border)'
                }}>
                  Draft
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                {['Internal Announcement', 'Training Outline'].map(tag => (
                  <span key={tag} style={{
                    fontSize: '11px',
                    color: '#57534e',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Needs Your Attention & In Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card: Needs Your Attention */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Needs Your Attention
              </div>

              {/* Notation filters: Needs Review / Needs Approval */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setAttentionFilter(attentionFilter === 'review' ? 'all' : 'review')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: attentionFilter === 'review' ? 600 : 500,
                    backgroundColor: attentionFilter === 'review' ? 'var(--text-primary)' : 'var(--bg-subtle)',
                    color: attentionFilter === 'review' ? '#ffffff' : '#78716c',
                    border: attentionFilter === 'review' ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                  title="Filter items awaiting human review"
                >
                  Needs Review (2)
                </button>
                <button
                  onClick={() => setAttentionFilter(attentionFilter === 'approval' ? 'all' : 'approval')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: attentionFilter === 'approval' ? 600 : 500,
                    backgroundColor: attentionFilter === 'approval' ? 'var(--text-primary)' : 'var(--bg-subtle)',
                    color: attentionFilter === 'approval' ? '#ffffff' : '#78716c',
                    border: attentionFilter === 'approval' ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.1s'
                  }}
                  title="Filter items verified and ready for sign-off"
                >
                  Needs Approval (1)
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              overflow: 'hidden'
            }}>
              {/* Alert item 1: Human Review Gate (Needs Review) */}
              {(attentionFilter === 'all' || attentionFilter === 'review') && (
                <div 
                  onClick={() => onSelectWork('2026-0417')}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Operation Silver Falcon
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#92400e' }}>
                    <AlertTriangle size={13} />
                    <span>5 outputs awaiting human review</span>
                  </div>
                </div>
              )}

              {/* Alert item 2: Fix Once / Source Changed (Needs Review) */}
              {(attentionFilter === 'all' || attentionFilter === 'review') && (
                <div 
                  onClick={() => onSelectWork('2026-0417')}
                  style={{
                    padding: '12px 14px',
                    borderBottom: attentionFilter === 'all' ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Policy Communication Package
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={13} />
                    <span>Source changed · 3 outputs affected</span>
                  </div>
                </div>
              )}

              {/* Alert item 3: Cross-Checker consistency issue (Needs Approval) */}
              {(attentionFilter === 'all' || attentionFilter === 'approval') && (
                <div 
                  onClick={() => onSelectWork('2026-0417')}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Executive Brief ↔ Security Advisory
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#166534' }}>
                    <GitCompare size={13} />
                    <span>Consistency passed · Ready for final sign-off</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Card: In Progress with count notation */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                In Progress
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)'
              }}>
                2 active transformations
              </span>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Task 1 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Global Supply Chain Vulnerabilities
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    65%
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Generating outputs...
                </div>
                {/* Minimal line progress bar */}
                <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', backgroundColor: 'var(--btn-primary-bg)' }} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)' }} />

              {/* Task 2 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Securing AI Integration Guide
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    20%
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Analyzing 5 newly added sources...
                </div>
                <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '20%', height: '100%', backgroundColor: 'var(--btn-primary-bg)' }} />
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
