import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon
} from 'lucide-react';
import { renderTextWithCitations, ClaimCitationBadge, stripCitationsFromText } from '../common/ClaimCitationBadge';

/**
 * Convert Markdown-style content to initial HTML for Tiptap
 */
function markdownToHtml(md) {
  if (!md || typeof md !== 'string') return '';
  if (md.trim().startsWith('<')) return md; // Already HTML

  const lines = md.split('\n');
  const htmlLines = [];
  let inList = false;

  for (let line of lines) {
    const trimmed = line.trim();

    // Skip top legacy metadata
    if (trimmed.startsWith('**') && (trimmed.includes('Identifier:') || trimmed.includes('Classification:') || trimmed.includes('Severity:'))) {
      continue;
    }

    if (trimmed.startsWith('# ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h1>${trimmed.slice(2)}</h1>`);
    } else if (trimmed.startsWith('## ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h2>${trimmed.slice(3)}</h2>`);
    } else if (trimmed.startsWith('### ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h3>${trimmed.slice(4)}</h3>`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (!inList) { htmlLines.push('<ul>'); inList = true; }
      const bulletText = trimmed.replace(/^[-•]\s*/, '');
      htmlLines.push(`<li>${bulletText}</li>`);
    } else if (trimmed.startsWith('> ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<blockquote>${trimmed.slice(2)}</blockquote>`);
    } else if (!trimmed) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
    } else {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      // Bold syntax conversion **text** -> <strong>text</strong>
      const parsedLine = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlLines.push(`<p>${parsedLine}</p>`);
    }
  }

  if (inList) htmlLines.push('</ul>');
  return htmlLines.join('');
}

const documentExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] }
  }),
  Image.configure({
    inline: true,
    allowBase64: true
  })
];

export default function DocumentEditor({
  title,
  initialContent,
  workId,
  status,
  versionNumber = 1,
  claims = [],
  config = {},
  onSave,
  onChange,
  onClaimClick,
  selectedClaimId,
  isEditing,
  setIsEditing,
  viewMode = 'audit',
  setViewMode
}) {

  const [createdAt] = useState(() => new Date());
  const [lastEditedAt, setLastEditedAt] = useState(createdAt);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: documentExtensions,
    content: markdownToHtml(initialContent),
    editable: isEditing,
    onUpdate: ({ editor: ed }) => {
      if (onChange) {
        onChange(ed.getText());
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editorial-canvas',
        style: `
          outline: none;
          min-height: 380px;
          line-height: 1.7;
          font-size: 13.5px;
          color: var(--text-primary);
        `
      }
    }
  });

  // Sync editable state when toggled
  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.schema) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // Sync content when initialContent changes from backend or v1/v2 switch
  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.schema && initialContent) {
      try {
        const currentHtml = editor.getHTML();
        const newHtml = markdownToHtml(initialContent);
        if (currentHtml !== newHtml && !isEditing) {
          editor.commands.setContent(newHtml);
        }
      } catch (err) {
        console.warn('Error syncing document content:', err);
      }
    }
  }, [initialContent, editor, isEditing]);

  const handleSaveDocument = () => {
    if (!editor || editor.isDestroyed || !editor.schema) return;
    try {
      const html = editor.getHTML();
      const text = editor.getText();
      if (onSave) {
        onSave(html, text);
      }
      setLastEditedAt(new Date());
    } catch (err) {
      console.warn('Error saving document:', err);
    }
    setIsEditing(false);
  };

  const handleAddImage = () => {
    if (!editor || editor.isDestroyed || !editor.schema) return;
    const url = window.prompt('Enter diagram or reference image URL:', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  /**
   * Helper to format markdown text inline (bold, citations, clean mode)
   */
  const formatRichText = (text, isCleanMode) => {
    if (!text || typeof text !== 'string') return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const innerBold = part.slice(2, -2);
        return (
          <strong key={`bold-${idx}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {isCleanMode
              ? stripCitationsFromText(innerBold)
              : renderTextWithCitations(innerBold, claims, onClaimClick, selectedClaimId)}
          </strong>
        );
      }
      return isCleanMode
        ? stripCitationsFromText(part)
        : renderTextWithCitations(part, claims, onClaimClick, selectedClaimId);
    });
  };

  const renderReadingView = (md) => {
    if (!md || typeof md !== 'string') return null;
    const lines = md.split('\n');
    const elements = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} style={{ margin: '0 0 14px 0', paddingLeft: '20px', lineHeight: 1.65 }}>
            {listItems.map((li, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {formatRichText(li, viewMode === 'clean')}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      // Skip top legacy metadata lines (Severity, Identifier, Classification)
      if (trimmed.startsWith('**') && (trimmed.includes('Identifier:') || trimmed.includes('Classification:') || trimmed.includes('Severity:'))) {
        return;
      }
      // In clean mode, omit internal audit token trail at the bottom
      if (viewMode === 'clean' && trimmed.startsWith('*Grounded Canonical Claim Citations:')) {
        return;
      }
      // Horizontal rules
      if (trimmed === '---' || trimmed === '***') {
        flushList();
        elements.push(
          <hr key={index} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', marginTop: '16px' }}>
            {formatRichText(trimmed.slice(2), viewMode === 'clean')}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', marginTop: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
            {formatRichText(trimmed.slice(3), viewMode === 'clean')}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', marginTop: '14px' }}>
            {formatRichText(trimmed.slice(4), viewMode === 'clean')}
          </h3>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        listItems.push(trimmed.replace(/^[-•]\s*/, ''));
      } else if (trimmed.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={index} style={{ margin: '10px 0', padding: '8px 14px', borderLeft: '3px solid var(--text-primary)', backgroundColor: 'var(--bg-subtle)', fontStyle: 'italic' }}>
            {formatRichText(trimmed.slice(2), viewMode === 'clean')}
          </blockquote>
        );
      } else if (trimmed) {
        flushList();
        elements.push(
          <p key={index} style={{ margin: '0 0 10px 0' }}>
            {formatRichText(trimmed, viewMode === 'clean')}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0 }}>
      

      {/* Editor Formatting Toolbar (Visible ONLY when isEditing is true) */}

      {isEditing && editor && !editor.isDestroyed && editor.schema && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: editor.isActive('bold') ? 'var(--text-primary)' : '#ffffff',
              color: editor.isActive('bold') ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: editor.isActive('italic') ? 'var(--text-primary)' : '#ffffff',
              color: editor.isActive('italic') ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Italic"
          >
            <Italic size={13} />
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: editor.isActive('heading', { level: 1 }) ? 'var(--text-primary)' : '#ffffff',
              color: editor.isActive('heading', { level: 1 }) ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Heading 1"
          >
            <Heading1 size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: editor.isActive('heading', { level: 2 }) ? 'var(--text-primary)' : '#ffffff',
              color: editor.isActive('heading', { level: 2 }) ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Heading 2"
          >
            <Heading2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: editor.isActive('heading', { level: 3 }) ? 'var(--text-primary)' : '#ffffff',
              color: editor.isActive('heading', { level: 3 }) ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Heading 3"
          >
            <Heading3 size={13} />
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: editor.isActive('bulletList') ? 'var(--text-primary)' : '#ffffff',
              color: editor.isActive('bulletList') ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Bullet List"
          >
            <List size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: editor.isActive('orderedList') ? 'var(--text-primary)' : '#ffffff',
              color: editor.isActive('orderedList') ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Numbered List"
          >
            <ListOrdered size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: editor.isActive('blockquote') ? 'var(--text-primary)' : '#ffffff',
              color: editor.isActive('blockquote') ? '#ffffff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Blockquote"
          >
            <Quote size={13} />
          </button>
          <button
            type="button"
            onClick={handleAddImage}
            style={{
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Insert Diagram / Image"
          >
            <ImageIcon size={13} />
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            style={{ padding: '4px 6px', border: 'none', background: 'none', cursor: 'pointer', opacity: editor.can().undo() ? 1 : 0.4 }}
            title="Undo"
          >
            <Undo size={13} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            style={{ padding: '4px 6px', border: 'none', background: 'none', cursor: 'pointer', opacity: editor.can().redo() ? 1 : 0.4 }}
            title="Redo"
          >
            <Redo size={13} />
          </button>
        </div>
      )}

      {/* Main Tiptap Canvas */}
      <div 
        style={{
          padding: '24px 32px',
          minHeight: '440px',
          flex: 1,
          overflowY: 'auto',
          backgroundColor: isEditing ? 'var(--bg-subtle)' : 'var(--bg-card)',
          transition: 'background-color 0.15s ease'
        }}
      >
        <div style={{ flex: 1 }}>
          {isEditing ? (
            editor && !editor.isDestroyed && editor.schema ? (
              <EditorContent editor={editor} />
            ) : (
              <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Initializing rich-text editor...</div>
            )
          ) : (
            <div style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-primary)' }}>
              {renderReadingView(initialContent)}
            </div>
          )}
        </div>

        {/* Document Audit Footer (Only visible at the very end of document) */}
        <div style={{
          marginTop: '40px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span>Document ID:</span><strong style={{ color: 'var(--text-secondary)' }}>DOC-{workId}</strong></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span>Version:</span><strong style={{ color: 'var(--text-secondary)' }}>v{versionNumber}.0 ({status})</strong></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span>Created:</span><strong style={{ color: 'var(--text-secondary)' }}>{createdAt.toLocaleString()}</strong></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span>Last edited:</span><strong style={{ color: 'var(--text-secondary)' }}>{lastEditedAt.toLocaleString()}</strong></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span>Operator:</span><strong style={{ color: 'var(--text-secondary)' }}>Lead Operator</strong></div>
        </div>
      </div>

    </div>
  );
}
