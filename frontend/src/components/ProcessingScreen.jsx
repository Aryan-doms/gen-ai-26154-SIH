// Screen: Processing Screen
// Formal, understandable stage progression with automatic transition to editorial workspace
import React, { useEffect, useState } from 'react';
import { 
  Check, 
  Loader2, 
  Shield, 
  Layers, 
  FileCheck, 
  Cpu, 
  Lock 
} from 'lucide-react';

export default function ProcessingScreen({ workTitle, workId, isReady, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const stages = [
    {
      id: 'ingest',
      number: '01',
      title: 'Reading Source Documents',
      desc: 'Validating uploaded files and extracting text, timeline entries, and figures.',
      badge: 'Verified',
      icon: Lock
    },
    {
      id: 'scope',
      number: '02',
      title: 'Analyzing Context & Scope',
      desc: 'Structuring source materials and establishing communication parameters.',
      badge: 'Prepared',
      icon: Cpu
    },
    {
      id: 'facts',
      number: '03',
      title: 'Extracting Key Facts & Citations',
      desc: 'Identifying verified facts, timestamps, and supporting evidence.',
      badge: 'Grounded',
      icon: Shield
    },
    {
      id: 'drafts',
      number: '04',
      title: 'Drafting Deliverables',
      desc: 'Generating tailored content for each requested format and target audience.',
      badge: 'Drafted',
      icon: Layers
    },
    {
      id: 'verify',
      number: '05',
      title: 'Verifying Accuracy & Consistency',
      desc: 'Cross-auditing deliverables to ensure numbers, facts, and dates align without contradiction.',
      badge: 'Aligned',
      icon: FileCheck
    }
  ];

  // Advance steps smoothly (450ms per step for snappy, responsive feel)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < 4) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    return () => clearInterval(timer);
  }, []);

  // When all steps are done AND backend has completed, immediately transition to the editorial workspace
  useEffect(() => {
    if (currentStep === 4 && isReady && !isFinishing) {
      setIsFinishing(true);
      const timer = setTimeout(() => {
        onComplete();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isReady, isFinishing, onComplete]);

  // Safety fallback
  useEffect(() => {
    const safety = setTimeout(() => {
      if (!isFinishing) {
        setIsFinishing(true);
        onComplete();
      }
    }, 20000);
    return () => clearTimeout(safety);
  }, [isFinishing, onComplete]);

  const allComplete = currentStep === 4 && isReady;
  const progressPercent = Math.min(100, Math.round(((currentStep + (allComplete ? 1 : 0.5)) / stages.length) * 100));

  return (
    <div style={{ maxWidth: '640px', margin: '48px auto', padding: '0 24px' }}>
      
      {/* Header Container */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
          {workTitle || 'Processing Transformation'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          Preparing source materials, extracting verified facts, and compiling deliverables.
        </p>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '3px',
          backgroundColor: 'var(--border)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '16px'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: 'var(--text-primary)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Stage Progression List */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {stages.map((stage, idx) => {
          const isDone = idx < currentStep || (idx === 4 && allComplete);
          const isCurrent = idx === currentStep && !(idx === 4 && allComplete);

          return (
            <div 
              key={stage.id}
              style={{
                padding: '14px 18px',
                borderBottom: idx < stages.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: isCurrent ? 'var(--bg-subtle)' : '#ffffff',
                transition: 'background-color 0.2s'
              }}
            >
              {/* Step indicator circle */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: isDone ? 'var(--badge-done-bg)' : (isCurrent ? 'var(--text-primary)' : '#ffffff'),
                color: isDone ? 'var(--badge-done-text)' : (isCurrent ? '#ffffff' : 'var(--text-muted)'),
                border: isDone ? '1px solid var(--badge-done-border)' : (isCurrent ? '1px solid var(--text-primary)' : '1px solid var(--border)'),
                marginTop: '1px',
                flexShrink: 0
              }}>
                {isDone ? (
                  <Check size={12} strokeWidth={2.5} />
                ) : isCurrent ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  stage.number
                )}
              </div>

              {/* Stage description */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '13px',
                    color: isDone || isCurrent ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}>
                    {stage.title}
                  </div>

                  {(isDone || isCurrent) && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: isDone ? '#ecfdf5' : '#eff6ff',
                      color: isDone ? '#065f46' : '#1d4ed8',
                      border: isDone ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
                    }}>
                      {isDone ? stage.badge : 'In Progress'}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {stage.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
