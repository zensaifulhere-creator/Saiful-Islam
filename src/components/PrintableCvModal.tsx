import { useEffect, useState } from 'react';
import { Download, FileDown, Printer, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useCms } from '../contexts/CmsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SiteContentData } from '../data/portfolioData';

interface PrintableCvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCvText(content: SiteContentData, objectiveHeading: string, bmdcLabel: string): string {
  const emailLine = content.email?.trim() ? ` | ${content.email.trim()}` : '';
  const lines = [
    `${content.doctorName}`,
    `${content.doctorTitle} | ${bmdcLabel} ${content.bmdcNumber}`,
    `${content.institution}`,
    `${content.phoneDisplay}${emailLine}`,
    '',
    objectiveHeading.toUpperCase(),
    content.cvObjective,
    '',
  ];

  content.credentials.forEach((section) => {
    lines.push(section.label.toUpperCase());
    section.items.forEach((item) => {
      lines.push(`- ${item.title}: ${item.detail}`);
    });
    lines.push('');
  });

  return lines.join('\n');
}

function buildStandalonePrintHtml(
  content: SiteContentData,
  objectiveHeading: string,
  bmdcLabel: string
): string {
  const cleanEmail = content.email?.trim() || '';
  const sectionsHtml = content.credentials
    .map(
      (section) => `
      <section class="cv-section">
        <h3 class="cv-section-title">${escapeHtml(section.index)}. ${escapeHtml(section.label)}</h3>
        <ul class="cv-list">
          ${section.items
            .map(
              (item) => `
            <li class="cv-item">
              <span class="cv-item-title">${escapeHtml(item.title)}</span>
              <span class="cv-item-detail">${escapeHtml(item.detail)}</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </section>
    `
    )
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(content.doctorName)} - Curriculum Vitae</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&family=Lora:wght@600;700&display=swap" rel="stylesheet" />
    <style>
      @page { size: A4 portrait; margin: 16mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: 'DM Sans', 'Hind Siliguri', system-ui, -apple-system, sans-serif;
        font-variant-numeric: tabular-nums;
        color: #13232D;
        background: #FFFFFF;
        line-height: 1.55;
        font-size: 10.5pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .cv-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        border-bottom: 1.5px solid #BBD4E2;
        padding-bottom: 14px;
        margin-bottom: 18px;
      }
      .cv-name {
        font-family: 'Lora', 'Hind Siliguri', Georgia, serif;
        font-size: 20pt;
        font-weight: 700;
        color: #13232D;
        margin: 0 0 4px 0;
        line-height: 1.2;
      }
      .cv-role {
        font-size: 10.5pt;
        font-weight: 600;
        color: #21475B;
        margin: 0;
      }
      .cv-meta {
        text-align: right;
        font-size: 9.5pt;
        color: #13232D;
        line-height: 1.45;
        white-space: nowrap;
      }
      .cv-meta p { margin: 0; }
      .cv-section {
        border-top: 1px solid #D6E6EF;
        padding-top: 12px;
        margin-top: 14px;
        break-inside: avoid;
      }
      .cv-section.first {
        border-top: none;
        padding-top: 0;
        margin-top: 0;
      }
      .cv-section-title {
        font-size: 9pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #21475B;
        margin: 0 0 8px 0;
      }
      .cv-objective {
        margin: 0;
        font-size: 10.2pt;
        color: #13232D;
        line-height: 1.6;
      }
      .cv-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .cv-item {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 16px;
        padding: 3.5px 0;
        font-size: 10pt;
      }
      .cv-item-title {
        font-weight: 600;
        color: #13232D;
      }
      .cv-item-detail {
        color: #253B48;
        text-align: right;
      }
    </style>
  </head>
  <body>
    <header class="cv-header">
      <div>
        <h1 class="cv-name">${escapeHtml(content.doctorName)}</h1>
        <p class="cv-role">${escapeHtml(content.doctorTitle)} · ${escapeHtml(content.institution)}</p>
      </div>
      <div class="cv-meta">
        <p>${escapeHtml(bmdcLabel)} ${escapeHtml(content.bmdcNumber)}</p>
        <p>${escapeHtml(content.phoneDisplay)}</p>
        ${cleanEmail ? `<p>${escapeHtml(cleanEmail)}</p>` : ''}
      </div>
    </header>
    <section class="cv-section first">
      <h3 class="cv-section-title">${escapeHtml(objectiveHeading)}</h3>
      <p class="cv-objective">${escapeHtml(content.cvObjective)}</p>
    </section>
    ${sectionsHtml}
  </body>
</html>`;
}

function containsNonLatinScript(text: string): boolean {
  return /[^\u0000-\u024F\u2000-\u206F]/.test(text);
}

function wrapCanvasLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

async function generateCanvasPdf(
  content: SiteContentData,
  objectiveHeading: string,
  bmdcLabel: string
) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // A4 at 150 DPI (1240 x 1754 px)
  const pageWidth = 1240;
  const pageHeight = 1754;
  const marginX = 96;
  const marginTop = 92;
  const marginBottom = 92;
  const contentWidth = pageWidth - marginX * 2;
  const maxY = pageHeight - marginBottom;

  const pages: HTMLCanvasElement[] = [];
  let canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  let ctx = canvas.getContext('2d')!;

  const initPage = () => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, pageWidth, pageHeight);
    ctx.textBaseline = 'top';
  };
  initPage();
  pages.push(canvas);

  let y = marginTop;

  const ensureSpace = (needed: number) => {
    if (y + needed > maxY) {
      canvas = document.createElement('canvas');
      canvas.width = pageWidth;
      canvas.height = pageHeight;
      ctx = canvas.getContext('2d')!;
      initPage();
      pages.push(canvas);
      y = marginTop;
    }
  };

  // Header
  ctx.fillStyle = '#13232D';
  ctx.font = '700 38px "Lora", "Hind Siliguri", Georgia, serif';
  const nameLines = wrapCanvasLine(ctx, content.doctorName, contentWidth * 0.66);
  let headerLeftY = y;
  nameLines.forEach((line) => {
    ctx.fillText(line, marginX, headerLeftY);
    headerLeftY += 46;
  });

  ctx.fillStyle = '#21475B';
  ctx.font = '600 22px "DM Sans", "Hind Siliguri", sans-serif';
  const roleLines = wrapCanvasLine(
    ctx,
    `${content.doctorTitle} · ${content.institution}`,
    contentWidth * 0.66
  );
  roleLines.forEach((line) => {
    ctx.fillText(line, marginX, headerLeftY + 4);
    headerLeftY += 30;
  });

  // Right header metadata
  const cleanEmail = content.email?.trim() || '';
  ctx.fillStyle = '#13232D';
  ctx.font = '500 20px "DM Sans", "Hind Siliguri", sans-serif';
  ctx.textAlign = 'right';
  const metaLines = [
    `${bmdcLabel} ${content.bmdcNumber}`,
    content.phoneDisplay,
    ...(cleanEmail ? [cleanEmail] : []),
  ];
  let metaY = y + 6;
  metaLines.forEach((mLine) => {
    ctx.fillText(mLine, pageWidth - marginX, metaY);
    metaY += 28;
  });
  ctx.textAlign = 'left';

  y = Math.max(headerLeftY, metaY) + 18;
  ctx.strokeStyle = '#BBD4E2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, y);
  ctx.lineTo(pageWidth - marginX, y);
  ctx.stroke();
  y += 28;

  // Objective
  ctx.fillStyle = '#21475B';
  ctx.font = '700 19px "DM Sans", "Hind Siliguri", sans-serif';
  ctx.fillText(objectiveHeading.toUpperCase(), marginX, y);
  y += 30;

  ctx.fillStyle = '#13232D';
  ctx.font = '400 21px "DM Sans", "Hind Siliguri", sans-serif';
  const objLines = wrapCanvasLine(ctx, content.cvObjective, contentWidth);
  objLines.forEach((line) => {
    ensureSpace(32);
    ctx.fillText(line, marginX, y);
    y += 31;
  });
  y += 18;

  // Credential sections
  content.credentials.forEach((section) => {
    ensureSpace(90);
    ctx.strokeStyle = '#D6E6EF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginX, y);
    ctx.lineTo(pageWidth - marginX, y);
    ctx.stroke();
    y += 22;

    ctx.fillStyle = '#21475B';
    ctx.font = '700 19px "DM Sans", "Hind Siliguri", sans-serif';
    ctx.fillText(`${section.index}. ${section.label}`, marginX, y);
    y += 32;

    section.items.forEach((item) => {
      ctx.font = '600 20px "DM Sans", "Hind Siliguri", sans-serif';
      const titleLines = wrapCanvasLine(ctx, item.title, contentWidth);
      ctx.font = '400 19px "DM Sans", "Hind Siliguri", sans-serif';
      const detailLines = wrapCanvasLine(ctx, item.detail, contentWidth);
      ensureSpace(titleLines.length * 28 + detailLines.length * 26 + 14);

      ctx.fillStyle = '#13232D';
      ctx.font = '600 20px "DM Sans", "Hind Siliguri", sans-serif';
      titleLines.forEach((line) => {
        ctx.fillText(line, marginX, y);
        y += 27;
      });

      ctx.fillStyle = '#2A4352';
      ctx.font = '400 19px "DM Sans", "Hind Siliguri", sans-serif';
      detailLines.forEach((line) => {
        ctx.fillText(line, marginX, y);
        y += 25;
      });
      y += 12;
    });

    y += 10;
  });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  pages.forEach((pCanvas, idx) => {
    if (idx > 0) pdf.addPage();
    pdf.addImage(pCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  });
  pdf.save('Dr_Fariha_Ferdousy_Munia_CV.pdf');
}

function generateVectorPdf(
  content: SiteContentData,
  objectiveHeading: string,
  bmdcLabel: string
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  const maxY = pageHeight - 16;

  let y = 20;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > maxY) {
      doc.addPage();
      y = 20;
    }
  };

  // Header left (serif display)
  doc.setTextColor(19, 35, 45);
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  const nameLines = doc.splitTextToSize(content.doctorName, maxWidth * 0.64) as string[];
  let leftY = y;
  nameLines.forEach((line) => {
    doc.text(line, margin, leftY);
    leftY += 7.5;
  });

  doc.setTextColor(33, 71, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const subLines = doc.splitTextToSize(
    `${content.doctorTitle}  ·  ${content.institution}`,
    maxWidth * 0.64
  ) as string[];
  subLines.forEach((line) => {
    doc.text(line, margin, leftY);
    leftY += 4.8;
  });

  // Header right contact block (email included only when provided)
  const cleanEmail = content.email?.trim() || '';
  const metaLines = [
    `${bmdcLabel} ${content.bmdcNumber}`,
    content.phoneDisplay,
    ...(cleanEmail ? [cleanEmail] : []),
  ];
  doc.setTextColor(19, 35, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  let rightY = y - 1;
  metaLines.forEach((m) => {
    doc.text(m, pageWidth - margin, rightY, { align: 'right' });
    rightY += 4.8;
  });

  y = Math.max(leftY, rightY) + 3;
  doc.setDrawColor(187, 212, 226);
  doc.setLineWidth(0.45);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Clinical Objective
  doc.setTextColor(33, 71, 91);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(objectiveHeading.toUpperCase(), margin, y);
  y += 5.2;

  doc.setTextColor(19, 35, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const objLines = doc.splitTextToSize(content.cvObjective, maxWidth) as string[];
  objLines.forEach((line) => {
    ensureSpace(5.5);
    doc.text(line, margin, y);
    y += 4.8;
  });
  y += 4;

  // Credential Sections
  content.credentials.forEach((section) => {
    ensureSpace(18);
    doc.setDrawColor(214, 230, 239);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setTextColor(33, 71, 91);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${section.index}. ${section.label.toUpperCase()}`, margin, y);
    y += 5.5;

    section.items.forEach((item) => {
      const titleLines = doc.splitTextToSize(item.title, maxWidth * 0.48) as string[];
      const detailLines = doc.splitTextToSize(item.detail, maxWidth * 0.48) as string[];
      const rowHeight = Math.max(titleLines.length, detailLines.length) * 4.5 + 2.5;
      ensureSpace(rowHeight);

      doc.setTextColor(19, 35, 45);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      titleLines.forEach((line, i) => {
        doc.text(line, margin, y + i * 4.5);
      });

      doc.setTextColor(42, 67, 82);
      doc.setFont('helvetica', 'normal');
      detailLines.forEach((line, i) => {
        doc.text(line, pageWidth - margin, y + i * 4.5, { align: 'right' });
      });

      y += rowHeight;
    });

    y += 3;
  });

  doc.save('Dr_Fariha_Ferdousy_Munia_CV.pdf');
}

export function PrintableCvModal({ isOpen, onClose }: PrintableCvModalProps) {
  const { localizedContent } = useCms();
  const { isBn, ui } = useLanguage();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [printHint, setPrintHint] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPrintHint(false);
      return;
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanEmail = localizedContent.email?.trim() || '';

  const handleDownloadTxt = () => {
    const text = buildCvText(localizedContent, ui.cv.clinicalObjective, ui.cv.bmdcRegPrefix);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Dr_Fariha_Ferdousy_Munia_CV.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const sampleText = [
        localizedContent.doctorName,
        localizedContent.doctorTitle,
        localizedContent.institution,
        localizedContent.cvObjective,
        ...localizedContent.credentials.flatMap((c) => [
          c.label,
          ...c.items.flatMap((it) => [it.title, it.detail]),
        ]),
      ].join(' ');

      if (isBn || containsNonLatinScript(sampleText)) {
        await generateCanvasPdf(
          localizedContent,
          ui.cv.clinicalObjective,
          ui.cv.bmdcRegPrefix
        );
      } else {
        generateVectorPdf(
          localizedContent,
          ui.cv.clinicalObjective,
          ui.cv.bmdcRegPrefix
        );
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintCv = () => {
    setPrintHint(false);
    const html = buildStandalonePrintHtml(
      localizedContent,
      ui.cv.clinicalObjective,
      ui.cv.bmdcRegPrefix
    );

    const existing = document.getElementById('cv-isolated-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'cv-isolated-print-frame';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 800);
    };

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframe.contentWindow) {
        cleanup();
        window.print();
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      let printed = false;
      const runPrint = () => {
        if (printed) return;
        printed = true;
        try {
          const win = iframe.contentWindow;
          if (!win) return;
          win.addEventListener('afterprint', cleanup, { once: true });
          const start = performance.now();
          win.focus();
          win.print();
          const elapsed = performance.now() - start;
          if (elapsed < 25) {
            setPrintHint(true);
          }
          setTimeout(cleanup, 3000);
        } catch {
          setPrintHint(true);
          cleanup();
        }
      };

      const fontsReady = iframeDoc.fonts?.ready;
      if (fontsReady) {
        Promise.race([
          fontsReady,
          new Promise((resolve) => setTimeout(resolve, 650)),
        ]).then(runPrint);
      } else {
        setTimeout(runPrint, 250);
      }
    } catch {
      cleanup();
      try {
        window.print();
      } catch {
        setPrintHint(true);
      }
    }
  };

  return (
    <div
      data-lenis-prevent
      className="print-only-cv fixed inset-0 z-[10015] bg-[#13232D]/60 backdrop-blur-sm overflow-y-auto overscroll-contain p-4 sm:p-8 flex justify-center items-start"
      role="dialog"
      aria-modal="true"
      aria-label={ui.cv.title}
      onClick={onClose}
    >
      <div
        className="print-cv-sheet cv-professional-font w-full max-w-3xl bg-white border border-white/90 rounded-[28px] shadow-[0_28px_70px_-14px_rgba(19,35,45,0.38)] overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Professional typography isolated from site display numerals) */}
        <div className="no-print bg-[#F7FBFD] border-b border-[#C4DBE8] px-5 sm:px-6 py-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#21475B]">
              {ui.cv.title}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="liquid-glass tactile-pill inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#13232D] whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-[#21475B]" />
                <span>{ui.cv.downloadTxt}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="liquid-glass tactile-pill inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#13232D] border-[#BBD4E2] whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                <FileDown className="w-3.5 h-3.5 text-[#21475B]" />
                <span>{isDownloadingPdf ? ui.cv.generatingPdf : ui.cv.downloadPdf}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintCv}
                className="liquid-glass-dark tactile-pill inline-flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-[#21475B] text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{ui.cv.printCv}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label={ui.cv.closeAria}
                className="liquid-glass tactile-pill w-9 h-9 rounded-full text-[#13232D] flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {printHint && (
            <p className="text-[11px] font-medium text-[#21475B]">
              {ui.cv.printBlockedHint}
            </p>
          )}
        </div>

        {/* Formal A4 Printable Sheet (Strictly Lora Serif + DM Sans Body/Tabular Numerals) */}
        <div className="p-7 sm:p-10 space-y-7 text-[#13232D]">
          <header className="border-b border-[#C4DBE8] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="cv-serif text-2xl sm:text-3xl font-bold text-[#13232D] leading-snug">
                {localizedContent.doctorName}
              </h2>
              <p className="text-sm font-semibold text-[#21475B] mt-1 leading-snug">
                {localizedContent.doctorTitle} · {localizedContent.institution}
              </p>
            </div>
            <div className="cv-mono text-xs text-[#13232D] font-medium sm:text-right space-y-0.5">
              <p>
                {ui.cv.bmdcRegPrefix} {localizedContent.bmdcNumber}
              </p>
              <p>{localizedContent.phoneDisplay}</p>
              {cleanEmail && <p>{cleanEmail}</p>}
            </div>
          </header>

          <section>
            <h3
              className={`text-xs font-bold uppercase tracking-wider text-[#21475B] mb-2 ${
                isBn ? 'normal-case tracking-normal' : ''
              }`}
            >
              {ui.cv.clinicalObjective}
            </h3>
            <p className="text-sm text-[#13232D] leading-relaxed">
              {localizedContent.cvObjective}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6">
            {localizedContent.credentials.map((section) => (
              <section key={section.id} className="border-t border-[#C4DBE8] pt-4">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider text-[#21475B] mb-3 ${
                    isBn ? 'normal-case tracking-normal' : ''
                  }`}
                >
                  {section.index}. {section.label}
                </h3>
                <ul className="space-y-2.5">
                  {section.items.map((item, idx) => (
                    <li
                      key={`${item.title}-${idx}`}
                      className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm leading-snug"
                    >
                      <span className="font-semibold text-[#13232D]">{item.title}</span>
                      <span className="text-[#13232D]/90 sm:text-right">{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
