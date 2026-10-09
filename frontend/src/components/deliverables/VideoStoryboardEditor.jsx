import React, { useState, useEffect } from 'react';
import {
  Video,
  Clock,
  Plus,
  Trash2,
  FileText,
  Download,
  Image as ImageIcon,
  Edit2,
  PlayCircle
} from 'lucide-react';
import { exportScenesToSrt, exportDocumentToDocx } from '../../utils/exportUtils';
import { renderTextWithCitations } from '../common/ClaimCitationBadge';

export default function VideoStoryboardEditor({
  title,
  initialContent,
  workId,
  status,
  claims = [],
  onSave,
  onClaimClick,
  selectedClaimId,
  isEditing,
  setIsEditing
}) {
  const parseScenesFromContent = (content) => {
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.scenes && Array.isArray(parsed.scenes)) return parsed.scenes;
      } catch (_) {}
    }

    // Default institutional storyboard scenes
    return [
      {
        scene_number: 1,
        duration_seconds: 15,
        visual_description: 'Wide shot of SOC dashboard showing network alert banners transitioning to containment status.',
        image_url: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?w=600&auto=format&fit=crop&q=60',
        on_screen_text: 'INCIDENT CONTAINMENT NOTIFICATION · 17 APR 2026',
        narration: 'At 02:35 UTC, enterprise monitoring detected anomalous access attempts on the peripheral research portal gateway [CLM-001].'
      },
      {
        scene_number: 2,
        duration_seconds: 20,
        visual_description: 'Architectural topology diagram displaying automated isolation of Subnet-B with zero lateral spill.',
        image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60',
        on_screen_text: 'ISOLATION PROTOCOL ENGAGED · SUB-NETWORK B',
        narration: 'Automated defense policies immediately starved compute access to the compromised segment, preventing traversal into primary database clusters [CLM-004].'
      },
      {
        scene_number: 3,
        duration_seconds: 15,
        visual_description: 'Operational metrics graph showing service recovery baseline at 52 minutes and complete key rotation.',
        image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60',
        on_screen_text: 'BASELINE RESTORED · ZERO EXFILTRATION CONFIRMED',
        narration: 'Full baseline restoration was verified across all research services with zero unauthorized exfiltration detected [CLM-007].'
      }
    ];
  };

  const [scenes, setScenes] = useState(() => parseScenesFromContent(initialContent));
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (initialContent) {
      setScenes(parseScenesFromContent(initialContent));
    }
  }, [initialContent]);

  const totalDuration = scenes.reduce((acc, s) => acc + (Number(s.duration_seconds) || 15), 0);

  const handleUpdateScene = (idx, field, value) => {
    const updated = [...scenes];
    updated[idx] = { ...updated[idx], [field]: value };
    setScenes(updated);
  };

  const handleAddScene = () => {
    const newSc = {
      scene_number: scenes.length + 1,
      duration_seconds: 15,
      visual_description: 'Visual description of scene graphics or presenter camera angle.',
      image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60',
      on_screen_text: 'NEW SCENE OVERLAY',
      narration: 'Voiceover narration script explaining key takeaways.'
    };
    setScenes([...scenes, newSc]);
  };

  const handleDeleteScene = (idx) => {
    if (scenes.length <= 1) {
      alert('A video storyboard must contain at least one scene.');
      return;
    }
    setScenes(scenes.filter((_, i) => i !== idx));
  };

  const handleSaveStoryboard = () => {
    if (onSave) {
      onSave(JSON.stringify({ script_title: title, target_duration_seconds: totalDuration, scenes }, null, 2));
    }
    setIsEditing(false);
  };

  const handleExportSrt = () => {
    exportScenesToSrt({ title: title || 'Video_Subtitles', scenes });
  };

  const handleExportDocx = async () => {
    setDownloading(true);
    try {
      let html = `<h1>${title || 'Video Storyboard & Production Brief'}</h1>`;
      html += `<p>Total Duration: <strong>${totalDuration} seconds</strong> | Total Scenes: <strong>${scenes.length}</strong></p>`;
      scenes.forEach((sc, i) => {
        html += `<h2>Scene ${i + 1} (${sc.duration_seconds}s) - ${sc.on_screen_text || 'Overview'}</h2>`;
        html += `<p><strong>Visual Cue:</strong> ${sc.visual_description}</p>`;
        html += `<p><strong>Voiceover Script:</strong> ${sc.narration}</p>`;
      });
      await exportDocumentToDocx({ title: title || 'Video_Storyboard', contentHtml: html, metadata: { workId, status } });
    } catch (err) {
      alert('DOCX export error: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
      {/* Storyboard Header Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            <Clock size={13} color="var(--text-secondary)" />
            <span>Total Runtime: {totalDuration}s</span>
          </div>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {scenes.length} Scenes
          </span>
          {isEditing && (
            <button
              onClick={handleAddScene}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                backgroundColor: '#ffffff',
                fontSize: '11px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                cursor: 'pointer'
              }}
            >
              <Plus size={12} /> Add Scene
            </button>
          )}
        </div>
      </div>

      {/* Storyboard Scene Cards List */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-app)', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
        {scenes.map((scene, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            {/* Left: Keyframe Thumbnail Image & Duration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                width: '100%',
                aspectRatio: '16 / 9',
                backgroundColor: '#0f172a',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--border)'
              }}>
                <img
                  src={scene.image_url || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600'}
                  alt={`Keyframe Scene ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: '3px'
                }}>
                  SCENE {idx + 1}
                </div>
              </div>

              {isEditing && (
                <input
                  type="text"
                  value={scene.image_url || ''}
                  placeholder="Image URL..."
                  onChange={(e) => handleUpdateScene(idx, 'image_url', e.target.value)}
                  style={{ fontSize: '10px', padding: '3px 6px', border: '1px solid var(--border)', borderRadius: '3px' }}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>Duration:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={scene.duration_seconds || 15}
                    onChange={(e) => handleUpdateScene(idx, 'duration_seconds', Number(e.target.value))}
                    style={{ width: '45px', fontSize: '11px', padding: '2px', border: '1px solid var(--border)', borderRadius: '3px' }}
                  />
                ) : (
                  <strong>{scene.duration_seconds || 15}s</strong>
                )}
              </div>
            </div>

            {/* Right: Narration, Visual Directions, and On-Screen Lower-Third */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Lower-third overlay */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    On-Screen Banner:
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={scene.on_screen_text || ''}
                      onChange={(e) => handleUpdateScene(idx, 'on_screen_text', e.target.value)}
                      style={{ flex: 1, fontSize: '11px', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: '3px' }}
                    />
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      "{renderTextWithCitations(scene.on_screen_text, claims, onClaimClick, selectedClaimId)}"
                    </span>
                  )}
                </div>

                {isEditing && (
                  <button
                    onClick={() => handleDeleteScene(idx)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px 4px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* Visual direction */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                🎬 <strong>Visual Direction:</strong>{' '}
                {isEditing ? (
                  <input
                    type="text"
                    value={scene.visual_description || ''}
                    onChange={(e) => handleUpdateScene(idx, 'visual_description', e.target.value)}
                    style={{ width: '100%', marginTop: '4px', fontSize: '11px', padding: '3px 6px', border: '1px solid var(--border)', borderRadius: '3px' }}
                  />
                ) : (
                  <span>{scene.visual_description}</span>
                )}
              </div>

              {/* Voiceover narration */}
              <div style={{ fontSize: '12.5px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                  🎙️ Voiceover Narration Script:
                </div>
                {isEditing ? (
                  <textarea
                    value={scene.narration || ''}
                    onChange={(e) => handleUpdateScene(idx, 'narration', e.target.value)}
                    rows={3}
                    style={{ width: '100%', fontSize: '12px', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', outline: 'none' }}
                  />
                ) : (
                  <div>{renderTextWithCitations(scene.narration, claims, onClaimClick, selectedClaimId)}</div>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
