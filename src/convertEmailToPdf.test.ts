import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { convertEmailToPdf } from './convertEmailToPdf.ts';
import { fetchImageAsDataUrl } from './fetchImageAsDataUrl.ts';
import type { ParsedEmail } from '../domain/emailUpload';

vi.mock('html2canvas');
vi.mock('jspdf');
vi.mock('./fetchImageAsDataUrl');

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const mockAddImage = vi.fn();
const mockAddPage = vi.fn();
const mockOutput = vi.fn(() => new Blob(['%PDF-1.0'], { type: 'application/pdf' }));
const mockGetWidth = vi.fn(() => 210);
const mockGetHeight = vi.fn(() => 297);

// Mock the jsdom slice canvas created by document.createElement('canvas') inside convertEmailToPdf.
// getContext returns a stub so drawImage/getImageData don't throw.
// toDataURL returns a stable data URL so addImage can be called.
// Using beforeAll/afterAll so the prototype is only patched once per file.
const sliceCtxStub = {
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
};
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    sliceCtxStub as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/jpeg;base64,SLICE'
  );
});
afterAll(() => {
  vi.restoreAllMocks();
});

// makeCanvas includes getContext so buildPageCuts can call getImageData on the source canvas.
// Returning an empty Uint8ClampedArray means all pixel accesses are undefined → treated as 0.
// All rows have equal brightness (0), so findSmartCutRow defaults to the natural cut row,
// giving the same page counts as the old fixed-interval approach.
function makeCanvas(width = 1588, height = 2245) {
  return {
    toDataURL: vi.fn(() => 'data:image/jpeg;base64,/9j/AABB'),
    width,
    height,
    getContext: vi.fn(() => ({
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
      drawImage: vi.fn(),
    })),
  };
}

function makeEmail(overrides: Partial<ParsedEmail> = {}): ParsedEmail {
  return {
    subject: 'Test Subject',
    from: 'sender@example.com',
    to: 'to@example.com',
    cc: '',
    date: '15 Jan 2024',
    bodyHtml: '<p>Hello</p>',
    cidMap: {},
    droppedAttachments: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(html2canvas).mockClear();
  vi.mocked(html2canvas).mockResolvedValue(makeCanvas() as unknown as HTMLCanvasElement);
  vi.mocked(jsPDF).mockImplementation(
    () =>
      ({
        internal: { pageSize: { getWidth: mockGetWidth, getHeight: mockGetHeight } },
        addImage: mockAddImage,
        addPage: mockAddPage,
        output: mockOutput,
      }) as unknown as InstanceType<typeof jsPDF>
  );
  vi.mocked(fetchImageAsDataUrl).mockClear();
  vi.mocked(fetchImageAsDataUrl).mockResolvedValue(null);
  mockAddImage.mockClear();
  mockAddPage.mockClear();
  mockOutput.mockClear();
  sliceCtxStub.drawImage.mockClear();
  sliceCtxStub.getImageData.mockClear();
});

describe('convertEmailToPdf', () => {
  it('returns a Blob with type application/pdf', async () => {
    const result = await convertEmailToPdf(makeEmail());
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });

  it('calls html2canvas once', async () => {
    await convertEmailToPdf(makeEmail());
    expect(vi.mocked(html2canvas)).toHaveBeenCalledOnce();
  });

  it('appends the render container to document.body during conversion', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    await convertEmailToPdf(makeEmail());
    expect(appendSpy).toHaveBeenCalledOnce();
  });

  it('always removes the render container from body, even on error', async () => {
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error('canvas failure'));
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    await expect(convertEmailToPdf(makeEmail())).rejects.toThrow('canvas failure');
    expect(removeSpy).toHaveBeenCalledOnce();
  });

  it('creates a single-page PDF for short content', async () => {
    vi.mocked(html2canvas).mockResolvedValueOnce(
      makeCanvas(1588, 500) as unknown as HTMLCanvasElement
    );
    await convertEmailToPdf(makeEmail());
    expect(mockAddPage).not.toHaveBeenCalled();
    expect(mockAddImage).toHaveBeenCalledOnce();
  });

  it('creates a multi-page PDF for tall content (3 extra pages for 4x height)', async () => {
    vi.mocked(html2canvas).mockResolvedValueOnce(
      makeCanvas(1588, 4 * 2245) as unknown as HTMLCanvasElement
    );
    await convertEmailToPdf(makeEmail());
    expect(mockAddPage).toHaveBeenCalledTimes(3);
    expect(mockAddImage).toHaveBeenCalledTimes(4);
  });

  it('escapes HTML in subject to prevent XSS in rendered content', async () => {
    const email = makeEmail({ subject: '<script>alert("xss")</script>' });
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).toContain('&lt;script&gt;');
  });

  it('includes CC row when cc is non-empty', async () => {
    const email = makeEmail({ cc: 'cc@example.com' });
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    expect(container.innerHTML).toContain('cc@example.com');
  });

  it('omits CC label when cc is empty', async () => {
    const email = makeEmail({ cc: '' });
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    // The CC row label should not be present
    const rows = container.querySelectorAll('td');
    const ccLabel = Array.from(rows).find((td) => td.textContent?.trim() === 'CC');
    expect(ccLabel).toBeUndefined();
  });

  // ── Image inlining ────────────────────────────────────────────────────

  it('substitutes cid: image src with data URL from cidMap', async () => {
    const email = makeEmail({
      bodyHtml: '<img src="cid:img001@example.com">',
      cidMap: { 'img001@example.com': 'data:image/png;base64,ABC' },
    });
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('data:image/png;base64,ABC');
  });

  it('matches CID without domain suffix (@...) as fallback', async () => {
    const email = makeEmail({
      bodyHtml: '<img src="cid:img001@domain.example.com">',
      cidMap: { img001: 'data:image/png;base64,SHORT' },
    });
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('data:image/png;base64,SHORT');
  });

  it('hides cid: images not present in cidMap', async () => {
    const email = makeEmail({
      bodyHtml: '<img src="cid:missing@example.com">',
      cidMap: {},
    });
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    const img = container.querySelector('img');
    expect(img?.style.display).toBe('none');
  });

  it('fetches external image URLs via fetchImageAsDataUrl', async () => {
    const email = makeEmail({ bodyHtml: '<img src="https://cdn.example.com/logo.png">' });
    vi.mocked(fetchImageAsDataUrl).mockResolvedValueOnce('data:image/png;base64,FETCHED');
    await convertEmailToPdf(email);
    expect(vi.mocked(fetchImageAsDataUrl)).toHaveBeenCalledWith('https://cdn.example.com/logo.png');
  });

  it('substitutes fetched external image with data URL', async () => {
    const email = makeEmail({ bodyHtml: '<img src="https://cdn.example.com/logo.png">' });
    vi.mocked(fetchImageAsDataUrl).mockResolvedValueOnce('data:image/png;base64,FETCHED');
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('data:image/png;base64,FETCHED');
  });

  it('hides external images that fail to fetch (CORS blocked)', async () => {
    const email = makeEmail({ bodyHtml: '<img src="https://blocked.example.com/img.png">' });
    vi.mocked(fetchImageAsDataUrl).mockResolvedValueOnce(null);
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    const img = container.querySelector('img');
    expect(img?.style.display).toBe('none');
  });

  it('leaves data: URL images completely unchanged', async () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    const email = makeEmail({ bodyHtml: `<img src="${dataUrl}">` });
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe(dataUrl);
    expect(vi.mocked(fetchImageAsDataUrl)).not.toHaveBeenCalled();
  });

  it('handles emails with no images without error', async () => {
    const email = makeEmail({ bodyHtml: '<p>No images here</p>' });
    await expect(convertEmailToPdf(email)).resolves.toBeInstanceOf(Blob);
  });

  it('handles multiple images in a single email body', async () => {
    const email = makeEmail({
      bodyHtml:
        '<img src="cid:a@e.com"><img src="https://ext.example.com/b.png"><img src="cid:c@e.com">',
      cidMap: {
        'a@e.com': 'data:image/png;base64,A',
        'c@e.com': 'data:image/png;base64,C',
      },
    });
    vi.mocked(fetchImageAsDataUrl).mockResolvedValueOnce('data:image/png;base64,B');
    await convertEmailToPdf(email);
    const container = vi.mocked(html2canvas).mock.calls[0][0] as HTMLElement;
    const imgs = container.querySelectorAll('img');
    expect(imgs[0].getAttribute('src')).toBe('data:image/png;base64,A');
    expect(imgs[1].getAttribute('src')).toBe('data:image/png;base64,B');
    expect(imgs[2].getAttribute('src')).toBe('data:image/png;base64,C');
  });
});
