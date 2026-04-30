import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processUploadedFile } from './processUploadedFile';
import {
  emailUploadReducer,
  initialEmailUploadState,
  type EmailUploadState,
  type EmailUploadAction,
} from './emailUploadReducer';
import { parseMsgFile } from '../../parseMsgFile.ts';
import { convertEmailToPdf } from '../../convertEmailToPdf.ts';
import type { ParsedEmail } from '../../typings';

vi.mock('../../api/parseMsgFile');
vi.mock('../../api/convertEmailToPdf');

const MOCK_PDF_URL = 'blob:http://localhost/test-pdf-uuid';

const MOCK_PARSED_EMAIL: ParsedEmail = {
  subject: 'Test Subject',
  from: 'Sender <sender@example.com>',
  to: 'recipient@example.com',
  cc: '',
  date: '15 Jan 2024, 10:30',
  bodyHtml: '<p>Hello</p>',
  cidMap: {},
  droppedAttachments: [],
};

function makeFile(name: string, content: BlobPart = new ArrayBuffer(100)) {
  return new File([content], name);
}

function overrideSize(file: File, bytes: number) {
  Object.defineProperty(file, 'size', { value: bytes, writable: false });
  return file;
}

describe('processUploadedFile', () => {
  let state: EmailUploadState;
  let dispatch: (action: EmailUploadAction) => void;

  beforeEach(() => {
    state = { ...initialEmailUploadState };
    dispatch = vi.fn((action: EmailUploadAction) => {
      state = emailUploadReducer(state, action);
    });
    vi.mocked(URL.createObjectURL).mockReturnValue(MOCK_PDF_URL);
    vi.mocked(parseMsgFile).mockResolvedValue(MOCK_PARSED_EMAIL);
    vi.mocked(convertEmailToPdf).mockResolvedValue(
      new Blob(['%PDF-1.0'], { type: 'application/pdf' })
    );
  });

  // ── PDF upload ────────────────────────────────────────────────────────

  it('sets status to ready with wasConverted=false for a PDF file', async () => {
    await processUploadedFile(dispatch, makeFile('report.pdf', '%PDF-1.0'), 25);
    expect(state.status).toBe('ready');
    expect(state.wasConverted).toBe(false);
  });

  it('stores the original PDF filename', async () => {
    await processUploadedFile(dispatch, makeFile('my-document.pdf', '%PDF-1.0'), 25);
    expect(state.originalFileName).toBe('my-document.pdf');
  });

  it('stores the file size for a PDF', async () => {
    const file = makeFile('doc.pdf', '%PDF-1.0');
    await processUploadedFile(dispatch, file, 25);
    expect(state.originalFileSize).toBe(file.size);
  });

  it('calls onFileReady with the original PDF blob and filename', async () => {
    const file = makeFile('report.pdf', '%PDF-1.0');
    const onFileReady = vi.fn();
    await processUploadedFile(dispatch, file, 25, onFileReady);
    expect(onFileReady).toHaveBeenCalledOnce();
    expect(onFileReady).toHaveBeenCalledWith(file, 'report.pdf');
  });

  it('does not call parseMsgFile or convertEmailToPdf for a PDF', async () => {
    await processUploadedFile(dispatch, makeFile('doc.pdf', '%PDF-1.0'), 25);
    expect(vi.mocked(parseMsgFile)).not.toHaveBeenCalled();
    expect(vi.mocked(convertEmailToPdf)).not.toHaveBeenCalled();
  });

  // ── MSG upload ────────────────────────────────────────────────────────

  it('sets status to ready with wasConverted=true for an MSG file', async () => {
    await processUploadedFile(dispatch, makeFile('email.msg'), 25);
    expect(state.status).toBe('ready');
    expect(state.wasConverted).toBe(true);
  });

  it('stores the original MSG filename', async () => {
    await processUploadedFile(dispatch, makeFile('my-email.msg'), 25);
    expect(state.originalFileName).toBe('my-email.msg');
  });

  it('calls parseMsgFile with the uploaded file', async () => {
    const file = makeFile('email.msg');
    await processUploadedFile(dispatch, file, 25);
    expect(vi.mocked(parseMsgFile)).toHaveBeenCalledWith(file);
  });

  it('calls convertEmailToPdf with the parsed email', async () => {
    await processUploadedFile(dispatch, makeFile('email.msg'), 25);
    expect(vi.mocked(convertEmailToPdf)).toHaveBeenCalledWith(MOCK_PARSED_EMAIL);
  });

  it('calls onFileReady with the PDF blob and a .pdf filename', async () => {
    const pdfBlob = new Blob(['%PDF-1.0'], { type: 'application/pdf' });
    vi.mocked(convertEmailToPdf).mockResolvedValueOnce(pdfBlob);
    const onFileReady = vi.fn();
    await processUploadedFile(dispatch, makeFile('my-email.msg'), 25, onFileReady);
    expect(onFileReady).toHaveBeenCalledWith(pdfBlob, 'my-email.pdf');
  });

  it('does not throw when onFileReady is not provided', async () => {
    await expect(processUploadedFile(dispatch, makeFile('email.msg'), 25)).resolves.not.toThrow();
  });

  // ── File size validation ──────────────────────────────────────────────

  it('dispatches PROCESSING_FAILED when MSG exceeds maxSizeMB', async () => {
    const file = overrideSize(makeFile('big.msg'), 26 * 1024 * 1024);
    await processUploadedFile(dispatch, file, 25);
    expect(state.status).toBe('error');
    expect(state.errorMessage).toContain('25 MB');
  });

  it('dispatches PROCESSING_FAILED when PDF exceeds maxSizeMB', async () => {
    const file = overrideSize(makeFile('huge.pdf', '%PDF-1.0'), 26 * 1024 * 1024);
    await processUploadedFile(dispatch, file, 25);
    expect(state.status).toBe('error');
  });

  it('accepts a file exactly at the maxSizeMB limit', async () => {
    const file = overrideSize(makeFile('exact.pdf', '%PDF-1.0'), 25 * 1024 * 1024);
    await processUploadedFile(dispatch, file, 25);
    expect(state.status).toBe('ready');
  });

  it('respects a custom maxSizeMB of 5', async () => {
    const file = overrideSize(makeFile('medium.msg'), 6 * 1024 * 1024);
    await processUploadedFile(dispatch, file, 5);
    expect(state.status).toBe('error');
    expect(state.errorMessage).toContain('5 MB');
  });

  // ── Extension validation ──────────────────────────────────────────────

  it('dispatches PROCESSING_FAILED for an unsupported extension (.docx)', async () => {
    await processUploadedFile(dispatch, makeFile('document.docx'), 25);
    expect(state.status).toBe('error');
    expect(state.errorMessage).toContain('.docx');
  });

  it('dispatches PROCESSING_FAILED for a .txt file', async () => {
    await processUploadedFile(dispatch, makeFile('notes.txt'), 25);
    expect(state.status).toBe('error');
  });

  it('dispatches PROCESSING_FAILED for a file with no extension', async () => {
    await processUploadedFile(dispatch, makeFile('noextension'), 25);
    expect(state.status).toBe('error');
  });

  it('is case-insensitive for .PDF extension', async () => {
    await processUploadedFile(dispatch, makeFile('REPORT.PDF', '%PDF-1.0'), 25);
    expect(state.status).toBe('ready');
  });

  it('is case-insensitive for .MSG extension', async () => {
    await processUploadedFile(dispatch, makeFile('EMAIL.MSG'), 25);
    expect(state.status).toBe('ready');
  });

  // ── Error handling ────────────────────────────────────────────────────

  it('dispatches PROCESSING_FAILED with the Error message when parseMsgFile throws', async () => {
    vi.mocked(parseMsgFile).mockRejectedValueOnce(new Error('Invalid MSG structure'));
    await processUploadedFile(dispatch, makeFile('bad.msg'), 25);
    expect(state.status).toBe('error');
    expect(state.errorMessage).toContain('Invalid MSG structure');
  });

  it('dispatches PROCESSING_FAILED with a generic message when parseMsgFile throws a non-Error', async () => {
    vi.mocked(parseMsgFile).mockRejectedValueOnce('string error');
    await processUploadedFile(dispatch, makeFile('bad.msg'), 25);
    expect(state.status).toBe('error');
    expect(state.errorMessage).toContain('corrupted or in an unsupported format');
  });

  it('dispatches PROCESSING_FAILED when convertEmailToPdf throws', async () => {
    vi.mocked(convertEmailToPdf).mockRejectedValueOnce(new Error('Canvas rendering failed'));
    await processUploadedFile(dispatch, makeFile('problem.msg'), 25);
    expect(state.status).toBe('error');
    expect(state.errorMessage).toContain('Canvas rendering failed');
  });

  it('does not call onFileReady when an error occurs', async () => {
    vi.mocked(parseMsgFile).mockRejectedValueOnce(new Error('Parse error'));
    const onFileReady = vi.fn();
    await processUploadedFile(dispatch, makeFile('bad.msg'), 25, onFileReady);
    expect(onFileReady).not.toHaveBeenCalled();
  });
});
