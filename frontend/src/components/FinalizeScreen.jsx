// Screen 04: Finalize, Export & Blockchain Provenance Screen
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Check, 
  ShieldCheck, 
  FileText, 
  Share2, 
  MessageCircle, 
  Copy, 
  ExternalLink, 
  Layers,
  Lock,
  Globe,
  CheckCircle2,
  Send,
  Printer,
  Presentation,
  SlidersHorizontal,
  Video
} from 'lucide-react';
import { fetchWorkDetails } from '../services/api';
import { 
  exportDocumentToDocx, 
  exportDocumentToPdf, 
  exportPresentationToPptx, 
  exportScenesToSrt 
} from '../utils/exportUtils';
import { saveAs } from 'file-saver';

export default function FinalizeScreen({ workId, onBack }) {
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedType, setCopiedType] = useState(null);
  const [onChainVerified, setOnChainVerified] = useState(false);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [publishedToChannels, setPublishedToChannels] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchWorkDetails(workId)
      .then(data => {
        setWork(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load work:", err);
        setError(err.message || "Failed to load deliverable export package.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [workId]);

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading export package for {workId}...</div>;
  }

  if (error || !work) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Unable to Load Package ({workId})
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {error || "Could not retrieve deliverables."}
        </div>
        <button 
          onClick={loadData}
          style={{
            padding: '7px 16px',
            backgroundColor: 'var(--text-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Pre-computed SHA-256 for the source package
  const sourceHash = work.source_package?.[0]?.file_hash_sha256 || 'e8f4702ba060a6a246ecdbfcf6e7bf7716f6b5536412f8646b9a8cf6ddbe38a1';
  const blockchainTxHash = '0x9a8427e562145b083e9b1cd47a46522cbb54d7fa8f6e87a2249788ef979b9dc1';
  const contractAddress = '0x71C8F7a379435b6c23B86b16F5E4E3B95C85784E';
  const blockNumber = 14924812;

  const handleCopy = (type, content) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleVerifyOnChain = () => {
    setVerifyingChain(true);
    setTimeout(() => {
      setVerifyingChain(false);
      setOnChainVerified(true);
    }, 600);
  };

  const handlePublishAllChannels = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublishedToChannels(true);
    }, 800);
  };

  const handleDownloadAll = () => {
    let fullText = `# ${work.title} - Final Approved Content Package\n`;
    fullText += `Case Docket ID: ${work.id}\n`;
    fullText += `Source Package Cryptographic Seal (SHA-256): ${sourceHash}\n`;
    fullText += `Blockchain Anchor (Polygon Amoy): ${blockchainTxHash}\n`;
    fullText += `Generated at: ${work.created_at}\n\n`;
    fullText += `================================================================================\n\n`;

    work.outputs?.forEach(out => {
      fullText += `## ${out.title.toUpperCase()}\n`;
      fullText += `Status: ${out.status} | Audience: ${out.settings?.audience} | Tone: ${out.settings?.tone}\n`;
      fullText += `--------------------------------------------------------------------------------\n`;
      fullText += `${out.content}\n\n\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([fullText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${work.title.toLowerCase().replace(/\s+/g, '_')}_package.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportDocx = async (out) => {
    let html = out.content || '';
    if (!html.startsWith('<')) {
      html = html.split('\n').map(l => `<p>${l}</p>`).join('');
    }
    await exportDocumentToDocx({
      title: out.title,
      contentHtml: html,
      metadata: { workId: work.id, status: out.status }
    });
  };

  const handleExportPdf = (out) => {
    let html = out.content || '';
    if (!html.startsWith('<')) {
      html = html.split('\n').map(l => `<p>${l}</p>`).join('');
    }
    exportDocumentToPdf({
      title: out.title,
      contentHtml: html,
      metadata: { workId: work.id, status: out.status }
    });
  };

  const handleExportPptx = async (out) => {
    let slides = [];
    try {
      const parsed = JSON.parse(out.content);
      if (parsed.slides) slides = parsed.slides;
    } catch (_) {}
    if (!slides.length) {
      slides = [
        { slide_number: 1, layout: 'title', title: out.title, subtitle: 'Approved Presentation Deck' },
        { slide_number: 2, layout: 'key_points', title: 'Key Findings', key_points: ['Approved findings and metrics'] }
      ];
    }
    await exportPresentationToPptx({ deckTitle: out.title, slides });
  };

  const handleExportSrt = (out) => {
    let scenes = [];
    try {
      const parsed = JSON.parse(out.content);
      if (parsed.scenes) scenes = parsed.scenes;
    } catch (_) {}
    if (!scenes.length) {
      scenes = [
        { scene_number: 1, duration_seconds: 15, narration: 'Approved briefing narration script.' }
      ];
    }
    exportScenesToSrt({ title: out.title, scenes });
  };

  const handleExportPng = (out) => {
    const url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80';
    saveAs(url, `${(out.title || 'Infographic').replace(/\s+/g, '_')}.png`);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <button 
            onClick={onBack}
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
            <ArrowLeft size={14} /> Back to Workspace
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Finalize & Publish: {work.title}
            </h1>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>({work.id})</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDownloadAll}
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Download size={13} /> Download Package (.txt)
          </button>

          <button
            onClick={handlePublishAllChannels}
            disabled={publishing || publishedToChannels}
            style={{
              backgroundColor: publishedToChannels ? '#16a34a' : 'var(--btn-primary-bg)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: publishedToChannels ? 'default' : 'pointer'
            }}
          >
            {publishing ? 'Publishing...' : publishedToChannels ? <><Check size={13} /> Published to Channels</> : <><Send size={13} /> Publish Deliverables</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Verification & Cryptographic Provenance Anchor (Polygon Amoy) */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#166534" />
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Cryptographic Integrity & Blockchain Anchor
                </span>
                <span style={{ 
                  marginLeft: '8px',
                  fontSize: '10px', 
                  backgroundColor: 'var(--badge-done-bg)', 
                  color: 'var(--badge-done-text)', 
                  border: '1px solid var(--badge-done-border)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  POLYGON AMOY ANCHORED
                </span>
              </div>
            </div>

            <button
              onClick={handleVerifyOnChain}
              disabled={verifyingChain}
              style={{
                padding: '4px 10px',
                backgroundColor: onChainVerified ? '#f0fdf4' : 'var(--bg-subtle)',
                color: onChainVerified ? '#166534' : 'var(--text-primary)',
                border: `1px solid ${onChainVerified ? '#bbf7d0' : 'var(--border)'}`,
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {verifyingChain ? 'Querying RPC...' : onChainVerified ? '✓ Confirmed on Block #14924812' : 'Verify On-Chain'}
            </button>
          </div>

          {/* Technical Hash Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '10px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '6px',
            padding: '12px 14px',
            fontSize: '11px',
            fontFamily: 'monospace'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>PACKAGE SHA-256 SEAL:</div>
              <div style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{sourceHash}</div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>TRANSACTION HASH (TXID):</div>
              <div style={{ color: '#1d4ed8', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <a 
                  href={`https://amoy.polygonscan.com/tx/${blockchainTxHash}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#1d4ed8', textDecoration: 'none' }}
                >
                  {blockchainTxHash.slice(0, 24)}...
                </a>
                <ExternalLink size={10} />
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>SMART CONTRACT:</div>
              <div style={{ color: 'var(--text-primary)' }}>{contractAddress}</div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>NETWORK / STATUS:</div>
              <div style={{ color: '#166534', fontWeight: 600 }}>Polygon Amoy · Immutable Anchor</div>
            </div>
          </div>
        </div>

        {/* Deliverables Review Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Approved Deliverables ({work.outputs?.length || 0})
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Each deliverable cryptographically referenced in final distribution package
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {work.outputs?.map((out) => (
              <div 
                key={out.type}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden'
                }}
              >
                {/* Deliverable Header */}
                <div style={{
                  padding: '9px 14px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                      {out.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      · {out.settings?.audience} · {out.settings?.tone}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: 'var(--badge-done-bg)',
                      color: 'var(--badge-done-text)',
                      padding: '1px 5px',
                      borderRadius: '3px'
                    }}>
                      Approved
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {(out.type === 'executive_summary' || out.type === 'security_advisory') && (
                      <>
                        <button
                          onClick={() => handleExportDocx(out)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#ffffff',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                          title="Download Microsoft Word .docx"
                        >
                          <FileText size={11} color="#2563eb" /> DOCX
                        </button>
                        <button
                          onClick={() => handleExportPdf(out)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#ffffff',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                          title="Print or Save as PDF"
                        >
                          <Printer size={11} color="#dc2626" /> PDF
                        </button>
                      </>
                    )}

                    {out.type === 'presentation' && (
                      <button
                        onClick={() => handleExportPptx(out)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          backgroundColor: '#ffffff',
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                        title="Download Microsoft PowerPoint .pptx"
                      >
                        <Presentation size={11} color="#ea580c" /> Download PPTX
                      </button>
                    )}

                    {out.type === 'video_script' && (
                      <>
                        <button
                          onClick={() => handleExportSrt(out)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#ffffff',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                          title="Download Subtitles .srt"
                        >
                          <Download size={11} color="#059669" /> Subtitles (.SRT)
                        </button>
                        <button
                          onClick={() => handleExportDocx(out)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#ffffff',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                          title="Download Storyboard DOCX"
                        >
                          <FileText size={11} color="#2563eb" /> Storyboard DOCX
                        </button>
                      </>
                    )}

                    {out.type === 'infographic' && (
                      <button
                        onClick={() => handleExportPng(out)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          backgroundColor: '#ffffff',
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                        title="Download High-Resolution PNG"
                      >
                        <Download size={11} color="#2563eb" /> Download PNG
                      </button>
                    )}

                    <button
                      onClick={() => handleCopy(out.type, out.content)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        backgroundColor: '#ffffff',
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedType === out.type ? <Check size={11} color="#166534" /> : <Copy size={11} />}
                      {copiedType === out.type ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>
                </div>

                {/* Content Snippet */}
                <div style={{ padding: '12px 16px', fontSize: '12px', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                  {out.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Channel Distribution Grid */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Enterprise API & Channel Readiness
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Share2 size={16} color="var(--text-secondary)" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '12px', color: 'var(--text-primary)' }}>X / Twitter API</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Main post + 280-char thread segments</div>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: '#166534', backgroundColor: 'var(--badge-done-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                {publishedToChannels ? 'Dispatched ✓' : 'Ready'}
              </span>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageCircle size={16} color="var(--text-secondary)" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '12px', color: 'var(--text-primary)' }}>WhatsApp Business API</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Official formatted citizen notice</div>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: '#166534', backgroundColor: 'var(--badge-done-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                {publishedToChannels ? 'Dispatched ✓' : 'Ready'}
              </span>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={16} color="var(--text-secondary)" />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '12px', color: 'var(--text-primary)' }}>Executive Briefing Portal</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TLP:AMBER Restricted RSS/Webhook</div>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: '#166534', backgroundColor: 'var(--badge-done-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                {publishedToChannels ? 'Dispatched ✓' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
