import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

// Real sample images from dummy_data/images
import img1x1 from '../../assets/images/infographic_1_1.jpg';
import img16x9 from '../../assets/images/infographic_16_9.jpg';
import img3x4 from '../../assets/images/infographic_3_4.png';
import img9x16 from '../../assets/images/infographic_9_16.jpg';

export default function InfographicEditor({
  title,
  initialContent,
  workId,
  status,
  claims = [],
  config = {},
  aspectRatio: externalAspectRatio,
  onAspectRatioChange,
  openGraphic,
  onOpenGraphicChange,
  onSave,
  onClaimClick,
  selectedClaimId
}) {
  const realGraphicsCatalog = [
    {
      id: 1,
      title: 'Incident Metrics & Response Overview',
      url: img1x1,
      native_aspect_ratio: '1:1'
    },
    {
      id: 2,
      title: 'System Topology & Threat Architecture',
      url: img16x9,
      native_aspect_ratio: '16:9'
    },
    {
      id: 3,
      title: 'Timeline & Ingress Vector Analysis',
      url: img3x4,
      native_aspect_ratio: '3:4'
    },
    {
      id: 4,
      title: 'Security Operations & Telemetry Log',
      url: img9x16,
      native_aspect_ratio: '9:16'
    }
  ];

  // Provide 3-4 real graphics for rich gallery demo
  const [graphics] = useState(realGraphicsCatalog);
  const [hoveredId, setHoveredId] = useState(null);

  // Find index of currently open graphic
  const currentIdx = openGraphic
    ? graphics.findIndex(g => g.id === openGraphic.id)
    : -1;

  const handleSelectPrev = () => {
    if (currentIdx > 0) {
      onOpenGraphicChange(graphics[currentIdx - 1]);
    }
  };

  const handleSelectNext = () => {
    if (currentIdx < graphics.length - 1) {
      onOpenGraphicChange(graphics[currentIdx + 1]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '460px', backgroundColor: '#ffffff' }}>
      
      {/* 1. GALLERY VIEW: Clean, Structured, Pure Images with Dark Gradient Title on Hover */}
      {!openGraphic ? (
        <div style={{
          padding: '24px',
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {graphics.map((g) => {
              const isHovered = hoveredId === g.id;

              return (
                <div
                  key={g.id}
                  onClick={() => {
                    if (onOpenGraphicChange) {
                      onOpenGraphicChange(g);
                    }
                  }}
                  onMouseEnter={() => setHoveredId(g.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 10',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isHovered
                      ? '0 10px 20px rgba(15, 23, 42, 0.1)'
                      : '0 1px 4px rgba(0,0,0,0.05)',
                    border: isHovered ? '1px solid #2563eb' : '1px solid var(--border)',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* The Pure Image centered inside uniform card */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    boxSizing: 'border-box'
                  }}>
                    <img
                      src={g.url}
                      alt={g.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  </div>

                  {/* Clean Dark Gradient Title Overlay on Hover */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.4) 65%, transparent 100%)',
                    padding: '24px 14px 12px 14px',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      lineHeight: 1.35
                    }}>
                      {g.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. OPENED VIEW: Middle Section Displaying Opened Image in its Native Aspect Ratio */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 24px 24px 24px',
          minHeight: '440px',
          maxHeight: 'calc(100vh - 280px)',
          overflow: 'auto',
          boxSizing: 'border-box'
        }}>
          {/* Top Left Clean "← Back to Gallery" Link */}
          <div style={{
            width: '100%',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={() => onOpenGraphicChange(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '11.5px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '2px 0',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <ArrowLeft size={13} />
              <span>Back to Gallery</span>
            </button>
          </div>

          {/* Opened Image Canvas — Native adaptive display to the actual image */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            flex: 1
          }}>
            <img
              src={openGraphic.url}
              alt={openGraphic.title}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 350px)',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                border: '1px solid var(--border)',
                display: 'block'
              }}
            />
          </div>

          {/* Clean Image Navigation Underneath (Replaces Back & Download buttons) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: '16px'
          }}>
            <button
              type="button"
              onClick={handleSelectPrev}
              disabled={currentIdx <= 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: currentIdx <= 0 ? 'var(--bg-subtle)' : '#ffffff',
                color: currentIdx <= 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: currentIdx <= 0 ? 'not-allowed' : 'pointer',
                opacity: currentIdx <= 0 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={13} />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {currentIdx + 1} of {graphics.length}
            </span>

            <button
              type="button"
              onClick={handleSelectNext}
              disabled={currentIdx >= graphics.length - 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: currentIdx >= graphics.length - 1 ? 'var(--bg-subtle)' : '#ffffff',
                color: currentIdx >= graphics.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: currentIdx >= graphics.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentIdx >= graphics.length - 1 ? 0.5 : 1
              }}
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
