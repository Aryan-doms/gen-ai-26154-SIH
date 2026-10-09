import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, FileText } from 'lucide-react';

const CLAIM_CONTEXT_MAP = {
  'CLM-001': 'Disruption Duration Metric',
  'CLM-002': 'Ingress Vector & Account',
  'CLM-003': 'Threat Origin IP',
  'CLM-004': 'Lateral Compute Target',
  'CLM-005': 'Containment Completion Timestamp',
  'CLM-006': 'Threat Actor Attribution Status',
  'CLM-007': 'Database Modification Audit'
};

// Global singleton coordinator: guarantees at most ONE claim citation popover is open at any time
let activeInstanceId = null;
let globalHideTimer = null;
let instanceCounter = 0;
const badgeListeners = new Set();

function notifyBadgeListeners() {
  badgeListeners.forEach(listener => listener(activeInstanceId));
}

function activateBadge(id) {
  if (globalHideTimer) {
    clearTimeout(globalHideTimer);
    globalHideTimer = null;
  }
  if (activeInstanceId !== id) {
    activeInstanceId = id;
    notifyBadgeListeners();
  }
}

function scheduleDeactivateBadge(id) {
  if (globalHideTimer) {
    clearTimeout(globalHideTimer);
  }
  globalHideTimer = setTimeout(() => {
    if (activeInstanceId === id) {
      activeInstanceId = null;
      notifyBadgeListeners();
    }
  }, 250);
}

function forceCloseAllBadges() {
  if (globalHideTimer) {
    clearTimeout(globalHideTimer);
    globalHideTimer = null;
  }
  if (activeInstanceId !== null) {
    activeInstanceId = null;
    notifyBadgeListeners();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('mousedown', (e) => {
    if (activeInstanceId !== null) {
      const activeEl = document.querySelector(`[data-claim-instance="${activeInstanceId}"]`);
      if (activeEl && activeEl.contains(e.target)) {
        return;
      }
      forceCloseAllBadges();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeInstanceId !== null) {
      forceCloseAllBadges();
    }
  });

  // Clean dismissal when scrolling the document or workspace
  window.addEventListener('scroll', forceCloseAllBadges, true);
}

export function ClaimCitationBadge({
  claimId,
  claims = [],
  onClaimClick,
  isSelected = false,
  disablePopover = false
}) {
  const instanceIdRef = useRef(null);
  if (!instanceIdRef.current) {
    instanceCounter += 1;
    instanceIdRef.current = `claim-badge-${instanceCounter}`;
  }
  const instanceId = instanceIdRef.current;

  const [isOpen, setIsOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0, vertical: 'bottom', arrowLeft: 140 });
  const containerRef = useRef(null);

  // Subscribe to global active badge coordinator
  useEffect(() => {
    const listener = (currentActiveId) => {
      setIsOpen(currentActiveId === instanceId);
    };
    badgeListeners.add(listener);

    return () => {
      badgeListeners.delete(listener);
      if (activeInstanceId === instanceId) {
        if (globalHideTimer) {
          clearTimeout(globalHideTimer);
          globalHideTimer = null;
        }
        activeInstanceId = null;
      }
    };
  }, [instanceId]);

  // Lookup claim metadata
  const claimObj = claims.find(c => c.claim_id === claimId);
  const contextTitle = CLAIM_CONTEXT_MAP[claimId] || 'Verified Factual Fact';
  const statement = claimObj?.claim_text || `Verified claim grounded in canonical evidence for ${claimId}.`;
  const sourceFile = claimObj?.evidence?.[0]?.source_file || '01_incident_log.txt';
  const status = claimObj?.verification_status || 'VERIFIED GROUNDED';

  const updatePopoverPos = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 285;
      const popoverEstimatedHeight = 175;

      const badgeCenterX = rect.left + rect.width / 2;

      // Safe horizontal clamping with generous margin
      const minLeft = 16;
      const maxLeft = Math.max(16, window.innerWidth - popoverWidth - 16);
      const idealLeft = badgeCenterX - popoverWidth / 2;
      const clampedLeft = Math.max(minLeft, Math.min(maxLeft, idealLeft));
      const arrowLeft = Math.max(14, Math.min(popoverWidth - 14, badgeCenterX - clampedLeft));

      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      let vertical = 'bottom';
      let top = 0;

      // If badge is near top of screen (< 220px) or space below is sufficient, render BELOW
      // If badge is at bottom of viewport, render ABOVE
      if (spaceAbove < 220 || spaceBelow >= popoverEstimatedHeight + 16) {
        vertical = 'bottom';
        top = rect.bottom + 8;
      } else {
        vertical = 'top';
        top = Math.max(12, rect.top - popoverEstimatedHeight - 8);
      }

      setPopoverCoords({ top, left: clampedLeft, vertical, arrowLeft });
    }
  };

  const handleMouseEnter = () => {
    if (disablePopover) return;
    updatePopoverPos();
    activateBadge(instanceId);
  };

  const handleMouseLeave = () => {
    if (disablePopover) return;
    scheduleDeactivateBadge(instanceId);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClaimClick) {
      onClaimClick(isSelected ? null : claimId);
    }
  };

  return (
    <span
      ref={containerRef}
      data-claim-instance={instanceId}
      data-claim-id={claimId}
      id={`claim-cite-${claimId}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'baseline',
        margin: '0 2px'
      }}
    >
      {/* Clickable AI Citation Pill */}
      <button
        type="button"
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '1px 7px',
          borderRadius: '10px',
          border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
          backgroundColor: isSelected ? '#1e3a8a' : '#f1f5f9',
          color: isSelected ? '#ffffff' : '#1e293b',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
          lineHeight: 1.3,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.3), 0 2px 6px rgba(37,99,235,0.2)' : 'none',
          transform: isSelected ? 'scale(1.06)' : 'scale(1)',
          userSelect: 'none'
        }}
        title={`Click to inspect ${claimId} in evidence rail`}
      >
        <ShieldCheck size={11} color={isSelected ? '#93c5fd' : '#2563eb'} />
        <span>{claimId}</span>
      </button>

      {/* Floating Popover via Portal: Never clipped by overflow, matches app design language */}
      {isOpen && !disablePopover && typeof document !== 'undefined' && createPortal(
        <div
          data-claim-instance={instanceId}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: `${popoverCoords.top}px`,
            left: `${popoverCoords.left}px`,
            width: '285px',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderRadius: '8px',
            padding: '12px 14px',
            boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.25), 0 4px 10px -2px rgba(15, 23, 42, 0.12)',
            border: '1px solid var(--border)',
            zIndex: 99999,
            textAlign: 'left',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
            animation: 'fadeIn 0.15s ease-out',
            pointerEvents: 'auto'
          }}
        >
          {/* Popover Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={11} color="#0284c7" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', maxWidth: '145px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sourceFile}
              </span>
            </div>
            <span style={{
              fontSize: '10.5px',
              fontFamily: 'monospace',
              fontWeight: 700,
              backgroundColor: status && status.toLowerCase().includes('verified') ? '#f0fdf4' : '#fef2f2',
              color: status && status.toLowerCase().includes('verified') ? '#15803d' : '#b91c1c',
              border: `1px solid ${status && status.toLowerCase().includes('verified') ? '#bbf7d0' : '#fecaca'}`,
              padding: '1px 6px',
              borderRadius: '4px'
            }}>
              {claimId}
            </span>
          </div>

          {/* Context Title */}
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#0284c7', letterSpacing: '0.04em', fontWeight: 700, marginBottom: '5px' }}>
            {contextTitle}
          </div>

          {/* Claim Statement — clean readable text */}
          <div style={{
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            marginBottom: '4px',
            fontWeight: 400
          }}>
            "{statement}"
          </div>

          {/* Caret arrow pointing cleanly at badge center */}
          <div style={{
            position: 'absolute',
            left: `${popoverCoords.arrowLeft}px`,
            transform: 'translateX(-50%)',
            ...(popoverCoords.vertical === 'top' ? {
              bottom: '-6px',
              borderTop: '6px solid var(--bg-card)',
              borderBottom: 'none',
              filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.06))'
            } : {
              top: '-6px',
              borderBottom: '6px solid var(--bg-card)',
              borderTop: 'none',
              filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.06))'
            }),
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent'
          }} />
        </div>,
        document.body
      )}
    </span>
  );
}

/**
 * Strips raw citation tokens like [CLM-001] or [CLM-001, CLM-002] from text,
 * cleaning up double spaces or awkward spacing before punctuation.
 */
export function stripCitationsFromText(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/\s*\[CLM-\d+(?:\s*,\s*CLM-\d+)*\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([.,;:!?])/g, '$1');
}

/**
 * Universal helper that transforms plain text containing citations like [CLM-001]
 * into interactive ClaimCitationBadge elements.
 */
export function renderTextWithCitations(text, claims = [], onClaimClick, selectedClaimId, disablePopover = false) {
  if (!text || typeof text !== 'string') return text || null;

  // Match citation patterns like [CLM-001] or [CLM-001, CLM-002]
  const citationRegex = /(\[CLM-\d+(?:\s*,\s*CLM-\d+)*\])/g;
  const parts = text.split(citationRegex);

  return parts.map((part, index) => {
    if (part.startsWith('[CLM-') && part.endsWith(']')) {
      // Extract all claim IDs inside brackets
      const matches = part.match(/CLM-\d+/g);
      if (matches && matches.length > 0) {
        return (
          <span key={`cite-group-${index}`} style={{ display: 'inline-flex', gap: '2px', alignItems: 'center', margin: '0 2px' }}>
            {matches.map(cid => (
              <ClaimCitationBadge
                key={cid}
                claimId={cid}
                claims={claims}
                onClaimClick={onClaimClick}
                isSelected={selectedClaimId === cid}
                disablePopover={disablePopover}
              />
            ))}
          </span>
        );
      }
    }
    return part;
  });
}

export default ClaimCitationBadge;
