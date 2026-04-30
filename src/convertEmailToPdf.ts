import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ParsedEmail } from './typings';
import { escapeHtml } from './htmlUtils.ts';
import { fetchImageAsDataUrl } from './fetchImageAsDataUrl.ts';

function buildRenderHtml(email: ParsedEmail): string {
  const ccRow = email.cc
    ? `<tr>
        <td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;vertical-align:top;">CC</td>
        <td style="padding:4px 0;color:#334155;font-size:13.5px;word-break:break-all;">${escapeHtml(email.cc)}</td>
      </tr>`
    : '';

  return `
    <div style="padding:0 0 24px;border-bottom:2px solid #e2e8f0;margin-bottom:28px;">
      <div style="font-size:22px;font-weight:700;color:#0f172a;margin-bottom:18px;line-height:1.3;word-wrap:break-word;">${escapeHtml(email.subject)}</div>
      <table style="border-collapse:collapse;">
        <tbody>
          <tr>
            <td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;vertical-align:top;">From</td>
            <td style="padding:4px 0;color:#334155;font-size:13.5px;word-break:break-all;">${escapeHtml(email.from)}</td>
          </tr>
          <tr>
            <td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;vertical-align:top;">To</td>
            <td style="padding:4px 0;color:#334155;font-size:13.5px;word-break:break-all;">${escapeHtml(email.to)}</td>
          </tr>
          ${ccRow}
          <tr>
            <td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;vertical-align:top;">Date</td>
            <td style="padding:4px 0;color:#334155;font-size:13.5px;">${escapeHtml(email.date)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="word-wrap:break-word;overflow-wrap:break-word;max-width:100%;color:#1e293b;font-size:14px;line-height:1.65;">
      ${email.bodyHtml}
    </div>
  `;
}

/**
 * Replaces all <img src="..."> references in the HTML fragment with inline base64
 * data URLs so that html2canvas can render them without making cross-origin requests.
 *
 * Three src formats are handled:
 *  - `cid:<id>` — inline attachment referenced by Content-ID. Resolved from cidMap,
 *    which is built by the MSG parser. Falls back to the local-part of the CID
 *    (before the `@`) to handle clients that omit the domain suffix.
 *  - `data:...` — already a data URL; left untouched.
 *  - Any other URL — fetched via fetchImageAsDataUrl (8 s timeout, CORS).
 *
 * Images that cannot be resolved are hidden (src removed, display:none) rather
 * than left as broken references that could cause html2canvas to stall or error.
 * All images are resolved concurrently via Promise.allSettled so a single failure
 * does not block the rest.
 */
async function inlineImages(htmlFragment: string, cidMap: Record<string, string>): Promise<string> {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = htmlFragment;

  const imgs = Array.from(wrapper.querySelectorAll<HTMLImageElement>('img[src]'));
  await Promise.allSettled(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') ?? '';

      if (src.startsWith('cid:')) {
        const cid = src.slice(4).trim();
        const dataUrl = cidMap[cid] ?? cidMap[cid.split('@')[0]];
        if (dataUrl) {
          img.setAttribute('src', dataUrl);
        } else {
          img.removeAttribute('src');
          img.style.display = 'none';
        }
        return;
      }

      if (src.startsWith('data:')) {
        return;
      }

      const dataUrl = await fetchImageAsDataUrl(src);
      if (dataUrl) {
        img.setAttribute('src', dataUrl);
      } else {
        img.removeAttribute('src');
        img.style.display = 'none';
      }
    })
  );

  return wrapper.innerHTML;
}

// How far above each natural page boundary to search for a clean cut (canvas pixels at scale 2).
// At scale 2, 80px ≈ 40 real CSS pixels ≈ 2 lines of body text — enough to find inter-paragraph gaps.
const PAGE_BREAK_SEARCH_PX = 80;

/**
 * Given a natural cut row, scan backwards within PAGE_BREAK_SEARCH_PX rows and return the
 * row whose pixels are brightest (most whitespace). Scanning from the natural cut backwards
 * means ties default to the natural cut — so dense text is unaffected.
 */
function findSmartCutRow(
  pixelData: Uint8ClampedArray,
  canvasWidth: number,
  canvasHeight: number,
  naturalCutRow: number
): number {
  const start = Math.max(0, naturalCutRow - PAGE_BREAK_SEARCH_PX);
  const end = Math.min(canvasHeight - 1, naturalCutRow);
  let bestRow = naturalCutRow;
  let bestBrightness = -1;

  for (let row = end; row >= start; row--) {
    let brightness = 0;
    const offset = row * canvasWidth * 4;
    for (let col = 0; col < canvasWidth; col++) {
      const i = offset + col * 4;
      brightness += (pixelData[i] ?? 0) + (pixelData[i + 1] ?? 0) + (pixelData[i + 2] ?? 0);
    }
    if (brightness > bestBrightness) {
      bestBrightness = brightness;
      bestRow = row;
    }
  }

  return bestRow;
}

/**
 * Build the list of pixel-row cut points for page breaks.
 * Returns [0, cut1, cut2, ..., canvas.height].
 */
function buildPageCuts(canvas: HTMLCanvasElement, pageHeightPx: number): number[] {
  const cuts: number[] = [0];
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let naturalCut = pageHeightPx;
    while (naturalCut < canvas.height) {
      const cut = findSmartCutRow(data, canvas.width, canvas.height, Math.round(naturalCut));
      cuts.push(cut);
      naturalCut = cut + pageHeightPx;
    }
  } else {
    // Fallback: natural fixed cuts (no pixel data available)
    let offset = pageHeightPx;
    while (offset < canvas.height) {
      cuts.push(offset);
      offset += pageHeightPx;
    }
  }

  cuts.push(canvas.height);
  return cuts;
}

export async function convertEmailToPdf(email: ParsedEmail): Promise<Blob> {
  const resolvedBodyHtml = await inlineImages(email.bodyHtml, email.cidMap);

  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'absolute',
    left: '-9999px',
    top: '0',
    width: '794px',
    minHeight: '50px',
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '14px',
    lineHeight: '1.65',
    color: '#1e293b',
    padding: '40px 48px',
    boxSizing: 'border-box',
    overflow: 'visible',
  });
  container.innerHTML = buildRenderHtml({ ...email, bodyHtml: resolvedBodyHtml });
  document.body.appendChild(container);

  try {
    await new Promise((r) => setTimeout(r, 150));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: false,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageHeightPx = Math.round(pdf.internal.pageSize.getHeight() * (canvas.width / pageW));

    const cuts = buildPageCuts(canvas, pageHeightPx);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    const sliceCtx = sliceCanvas.getContext('2d');

    for (let i = 0; i < cuts.length - 1; i++) {
      const startRow = cuts[i];
      const endRow = cuts[i + 1];
      const sliceHeight = endRow - startRow;

      let sliceData: string;
      if (sliceCtx) {
        sliceCanvas.height = sliceHeight;
        sliceCtx.drawImage(
          canvas as unknown as CanvasImageSource,
          0,
          startRow,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
        sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
      } else {
        // Fallback: use full canvas image positioned so this slice is visible
        sliceData = canvas.toDataURL('image/jpeg', 0.92);
      }

      const sliceHeightMM = (sliceHeight / canvas.width) * pageW;
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(sliceData, 'JPEG', 0, 0, pageW, sliceHeightMM, '', 'FAST');
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}
