// Export utilities for institutional deliverables: DOCX, PDF, PPTX, and SRT
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import pptxgen from 'pptxgenjs';

/**
 * Cleanly strip HTML tags for plain text operations
 */
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Cleanly strip raw [CLM-xxx] citation tokens and normalize spaces for published exports
 */
export function cleanCitations(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/\s*\[CLM-\d+(?:\s*,\s*CLM-\d+)*\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([.,;:!?])/g, '$1')
    .trim();
}

/**
 * 1. Export Document content to real Microsoft Word .docx
 */
export async function exportDocumentToDocx({ title, contentHtml, metadata = {} }) {
  try {
    const docChildren = [];

    // Document Title
    docChildren.push(
      new Paragraph({
        text: title || 'Institutional Document',
        heading: HeadingLevel.TITLE,
        spacing: { after: 300 }
      })
    );

    // Parse HTML content into structured Word paragraphs
    const parser = new DOMParser();
    const docDom = parser.parseFromString(contentHtml || '', 'text/html');
    const nodes = docDom.body.childNodes;

    nodes.forEach(node => {
      const tag = node.nodeName.toLowerCase();
      const text = cleanCitations(node.textContent || '');
      if (!text) return;

      if (tag === 'h1') {
        docChildren.push(
          new Paragraph({
            text,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 }
          })
        );
      } else if (tag === 'h2') {
        docChildren.push(
          new Paragraph({
            text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );
      } else if (tag === 'h3') {
        docChildren.push(
          new Paragraph({
            text,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 }
          })
        );
      } else if (tag === 'ul' || tag === 'ol') {
        node.childNodes.forEach(li => {
          const itemText = cleanCitations(li.textContent || '');
          if (itemText) {
            docChildren.push(
              new Paragraph({
                text: itemText,
                bullet: { level: 0 },
                spacing: { after: 80 }
              })
            );
          }
        });
      } else if (tag === 'blockquote') {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text, italics: true, color: '4B5563' })],
            spacing: { before: 120, after: 120 },
            indent: { left: 720 }
          })
        );
      } else {
        // Standard paragraph
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text, size: 22 })],
            spacing: { after: 160 }
          })
        );
      }
    });

    // Institutional Audit Trail Footer
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `\nInstitutional Record · Document ID: DOC-${metadata.workId || '2026-0417'} · Status: ${metadata.status || 'Verified'} · Generated: ${new Date().toLocaleDateString('en-GB')}`,
            size: 18,
            color: '6B7280',
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 }
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren
      }]
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `${(title || 'Document').replace(/\s+/g, '_')}.docx`;
    saveAs(blob, fileName);
    return true;
  } catch (err) {
    console.error('Failed to export DOCX:', err);
    throw err;
  }
}

/**
 * 2. Export Document to high-fidelity PDF via isolated printable iframe
 */
export function exportDocumentToPdf({ title, contentHtml, metadata = {} }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download or print PDF.');
    return;
  }

  const styles = `
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      line-height: 1.6;
      font-size: 13px;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 20px; font-weight: 700; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 16px; }
    h2 { font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    h3 { font-size: 13px; font-weight: 600; color: #374151; margin-top: 14px; margin-bottom: 6px; }
    p { margin-bottom: 10px; }
    ul, ol { margin-bottom: 12px; padding-left: 20px; }
    li { margin-bottom: 4px; }
    blockquote { border-left: 3px solid #3b82f6; background-color: #f8fafc; padding: 8px 12px; margin: 12px 0; font-style: italic; color: #334155; }
    .citation { font-family: monospace; font-size: 11px; background: #f3f4f6; border: 1px solid #d1d5db; padding: 1px 4px; border-radius: 3px; font-weight: 600; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; display: flex; justify-content: space-between; }
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Institutional Document'}</title>
        <style>${styles}</style>
      </head>
      <body>
        <h1>${title || 'Institutional Incident Document'}</h1>
        <div class="content">${cleanCitations(contentHtml || '')}</div>
        <div class="footer">
          <span>Document ID: DOC-${metadata.workId || '2026-0417'} · Status: ${metadata.status || 'Verified'}</span>
          <span>Official Record · Printed on ${new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * 3. Export Presentation to Microsoft PowerPoint .pptx via PptxGenJS
 */
export async function exportPresentationToPptx({ deckTitle, slides = [] }) {
  try {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Content Transformation Platform (CT)';
    pptx.company = 'Government / Enterprise Transformation Engine';
    pptx.title = deckTitle || 'Briefing Deck';

    slides.forEach((slideData, idx) => {
      const slide = pptx.addSlide();
      slide.bkgd = 'F8FAFC';

      // Header Bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.8,
        fill: { color: '0F172A' }
      });

      // Deck & Slide Title
      slide.addText(slideData.title || `Slide ${idx + 1}`, {
        x: 0.6,
        y: 0.15,
        w: '85%',
        h: 0.5,
        fontSize: 18,
        fontFace: 'Arial',
        color: 'FFFFFF',
        bold: true
      });

      // Slide number badge
      slide.addText(`${idx + 1} / ${slides.length}`, {
        x: '88%',
        y: 0.2,
        w: '10%',
        h: 0.4,
        fontSize: 11,
        fontFace: 'Arial',
        color: '94A3B8',
        align: 'right'
      });

      // Content Layout
      if (slideData.layout === 'title') {
        // Large Center Title Slide
        slide.addText(cleanCitations(slideData.title), {
          x: 1.0,
          y: 2.2,
          w: 8.0,
          h: 1.2,
          fontSize: 28,
          fontFace: 'Arial',
          bold: true,
          color: '0F172A'
        });

        if (slideData.subtitle) {
          slide.addText(cleanCitations(slideData.subtitle), {
            x: 1.0,
            y: 3.5,
            w: 8.0,
            h: 0.8,
            fontSize: 16,
            fontFace: 'Arial',
            color: '475569'
          });
        }
      } else if (slideData.left_column && slideData.right_column) {
        // Two-column split layout
        const leftItems = Array.isArray(slideData.left_column) ? slideData.left_column : [slideData.left_column];
        const rightItems = Array.isArray(slideData.right_column) ? slideData.right_column : [slideData.right_column];

        slide.addText(leftItems.map(item => ({ text: `• ${cleanCitations(item)}\n`, options: { fontSize: 13, color: '1E293B', bullet: false } })), {
          x: 0.8,
          y: 1.3,
          w: 4.0,
          h: 3.6,
          fill: { color: 'FFFFFF' },
          line: { color: 'E2E8F0', width: 1 }
        });

        slide.addText(rightItems.map(item => ({ text: `• ${cleanCitations(item)}\n`, options: { fontSize: 13, color: '1E293B', bullet: false } })), {
          x: 5.2,
          y: 1.3,
          w: 4.0,
          h: 3.6,
          fill: { color: 'FFFFFF' },
          line: { color: 'E2E8F0', width: 1 }
        });
      } else {
        // Standard Key Points Slide
        const points = slideData.key_points || slideData.points || [];
        const bulletText = points.map(pt => ({
          text: `• ${cleanCitations(pt)}\n\n`,
          options: { fontSize: 14, color: '1E293B', fontFace: 'Arial' }
        }));

        slide.addText(bulletText.length ? bulletText : [{ text: 'No content specified.', options: { fontSize: 12, color: '64748B' } }], {
          x: 0.8,
          y: 1.2,
          w: 8.4,
          h: 3.8,
          fill: { color: 'FFFFFF' },
          line: { color: 'E2E8F0', width: 1 },
          valign: 'top',
          margin: 0.2
        });
      }

      // Speaker Notes
      if (slideData.speaker_notes) {
        slide.addNotes(slideData.speaker_notes);
      }

      // Grounding Claims Tag
      if (slideData.claims_cited && slideData.claims_cited.length) {
        slide.addText(`Grounded Claims: ${slideData.claims_cited.join(', ')}`, {
          x: 0.8,
          y: 5.1,
          w: 8.4,
          h: 0.3,
          fontSize: 9,
          color: '64748B',
          fontFace: 'Courier New'
        });
      }
    });

    const fileName = `${(deckTitle || 'Presentation_Briefing').replace(/\s+/g, '_')}.pptx`;
    await pptx.writeFile({ fileName });
    return true;
  } catch (err) {
    console.error('Failed to export PPTX:', err);
    throw err;
  }
}

/**
 * 4. Export Video Package Narration Scenes to standard .srt Subtitles
 */
export function exportScenesToSrt({ title, scenes = [] }) {
  try {
    let srtOutput = '';
    let runningSeconds = 0;

    function formatTime(totalSec) {
      const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const secs = String(Math.floor(totalSec % 60)).padStart(2, '0');
      return `${hrs}:${mins}:${secs},000`;
    }

    scenes.forEach((sc, i) => {
      const duration = sc.duration_seconds || 15;
      const startTime = formatTime(runningSeconds);
      runningSeconds += duration;
      const endTime = formatTime(runningSeconds);

      const text = sc.narration || sc.script || sc.on_screen_text || `Scene ${i + 1}`;

      srtOutput += `${i + 1}\n`;
      srtOutput += `${startTime} --> ${endTime}\n`;
      srtOutput += `${text.trim()}\n\n`;
    });

    const blob = new Blob([srtOutput], { type: 'text/plain;charset=utf-8' });
    const fileName = `${(title || 'Video_Subtitles').replace(/\s+/g, '_')}.srt`;
    saveAs(blob, fileName);
    return true;
  } catch (err) {
    console.error('Failed to export SRT:', err);
    throw err;
  }
}
