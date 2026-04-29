import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEmailUploadStore } from '../storeCreator'
import { processUploadedFile } from '../thunks'
import { parseMsgFile } from '../../../api/parseMsgFile'
import { convertEmailToPdf } from '../../../api/convertEmailToPdf'
import type { ParsedEmail } from '../../../domain/emailUpload'

vi.mock('../../../api/parseMsgFile')
vi.mock('../../../api/convertEmailToPdf')

const MOCK_PDF_URL = 'blob:http://localhost/test-pdf-uuid'

const MOCK_PARSED_EMAIL: ParsedEmail = {
  subject: 'Test Subject',
  from: 'Sender <sender@example.com>',
  to: 'recipient@example.com',
  cc: '',
  date: '15 Jan 2024, 10:30',
  bodyHtml: '<p>Hello</p>',
  cidMap: {},
  droppedAttachments: [],
}

function makeFile(name: string, content: BlobPart = new ArrayBuffer(100)) {
  return new File([content], name)
}

function overrideSize(file: File, bytes: number) {
  Object.defineProperty(file, 'size', { value: bytes, writable: false })
  return file
}

describe('processUploadedFile thunk', () => {
  let store: ReturnType<typeof createEmailUploadStore>

  beforeEach(() => {
    store = createEmailUploadStore()
    vi.mocked(URL.createObjectURL).mockReturnValue(MOCK_PDF_URL)
    vi.mocked(parseMsgFile).mockResolvedValue(MOCK_PARSED_EMAIL)
    vi.mocked(convertEmailToPdf).mockResolvedValue(
      new Blob(['%PDF-1.0'], { type: 'application/pdf' })
    )
  })

  // ── PDF upload ────────────────────────────────────────────────────────

  it('sets status to ready with wasConverted=false for a PDF file', async () => {
    const file = makeFile('report.pdf', '%PDF-1.0')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    const state = store.getState().emailUpload
    expect(state.status).toBe('ready')
    expect(state.wasConverted).toBe(false)
  })

  it('stores the original PDF filename', async () => {
    const file = makeFile('my-document.pdf', '%PDF-1.0')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.originalFileName).toBe('my-document.pdf')
  })

  it('stores the file size for PDF', async () => {
    const content = '%PDF-1.0'
    const file = makeFile('doc.pdf', content)
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.originalFileSize).toBe(file.size)
  })

  it('calls onFileReady with the original PDF blob and filename', async () => {
    const file = makeFile('report.pdf', '%PDF-1.0')
    const onFileReady = vi.fn()
    await store.dispatch(processUploadedFile({ file, onFileReady, maxSizeMB: 25 }))
    expect(onFileReady).toHaveBeenCalledOnce()
    expect(onFileReady).toHaveBeenCalledWith(file, 'report.pdf')
  })

  it('does not call parseMsgFile or convertEmailToPdf for PDF', async () => {
    const file = makeFile('doc.pdf', '%PDF-1.0')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(vi.mocked(parseMsgFile)).not.toHaveBeenCalled()
    expect(vi.mocked(convertEmailToPdf)).not.toHaveBeenCalled()
  })

  // ── MSG upload ────────────────────────────────────────────────────────

  it('sets status to ready with wasConverted=true for an MSG file', async () => {
    const file = makeFile('email.msg')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    const state = store.getState().emailUpload
    expect(state.status).toBe('ready')
    expect(state.wasConverted).toBe(true)
  })

  it('stores the original MSG filename', async () => {
    const file = makeFile('my-email.msg')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.originalFileName).toBe('my-email.msg')
  })

  it('calls parseMsgFile with the uploaded file', async () => {
    const file = makeFile('email.msg')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(vi.mocked(parseMsgFile)).toHaveBeenCalledWith(file)
  })

  it('calls convertEmailToPdf with the parsed email', async () => {
    const file = makeFile('email.msg')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(vi.mocked(convertEmailToPdf)).toHaveBeenCalledWith(MOCK_PARSED_EMAIL)
  })

  it('calls onFileReady with the PDF blob and a .pdf filename', async () => {
    const pdfBlob = new Blob(['%PDF-1.0'], { type: 'application/pdf' })
    vi.mocked(convertEmailToPdf).mockResolvedValueOnce(pdfBlob)
    const file = makeFile('my-email.msg')
    const onFileReady = vi.fn()
    await store.dispatch(processUploadedFile({ file, onFileReady, maxSizeMB: 25 }))
    expect(onFileReady).toHaveBeenCalledWith(pdfBlob, 'my-email.pdf')
  })

  it('does not call onFileReady when it is not provided', async () => {
    const file = makeFile('email.msg')
    await expect(store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))).resolves.not.toThrow()
  })

  // ── File size validation ──────────────────────────────────────────────

  it('dispatches setError when MSG exceeds maxSizeMB', async () => {
    const file = overrideSize(makeFile('big.msg'), 26 * 1024 * 1024)
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    const state = store.getState().emailUpload
    expect(state.status).toBe('error')
    expect(state.errorMessage).toContain('25 MB')
  })

  it('dispatches setError when PDF exceeds maxSizeMB', async () => {
    const file = overrideSize(makeFile('huge.pdf', '%PDF-1.0'), 26 * 1024 * 1024)
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.status).toBe('error')
  })

  it('accepts a file exactly at the maxSizeMB limit', async () => {
    const file = overrideSize(makeFile('exact.pdf', '%PDF-1.0'), 25 * 1024 * 1024)
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.status).toBe('ready')
  })

  it('respects a custom maxSizeMB of 5', async () => {
    const file = overrideSize(makeFile('medium.msg'), 6 * 1024 * 1024)
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 5 }))
    expect(store.getState().emailUpload.status).toBe('error')
    expect(store.getState().emailUpload.errorMessage).toContain('5 MB')
  })

  // ── Extension validation ──────────────────────────────────────────────

  it('dispatches setError for an unsupported extension (.docx)', async () => {
    const file = makeFile('document.docx')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    const state = store.getState().emailUpload
    expect(state.status).toBe('error')
    expect(state.errorMessage).toContain('.docx')
  })

  it('dispatches setError for a .txt file', async () => {
    const file = makeFile('notes.txt')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.status).toBe('error')
  })

  it('dispatches setError for a file with no extension', async () => {
    const file = makeFile('noextension')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.status).toBe('error')
  })

  it('is case-insensitive for .PDF extension', async () => {
    const file = makeFile('REPORT.PDF', '%PDF-1.0')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.status).toBe('ready')
  })

  it('is case-insensitive for .MSG extension', async () => {
    const file = makeFile('EMAIL.MSG')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    expect(store.getState().emailUpload.status).toBe('ready')
  })

  // ── Error handling ────────────────────────────────────────────────────

  it('dispatches setError with the Error message when parseMsgFile throws', async () => {
    vi.mocked(parseMsgFile).mockRejectedValueOnce(new Error('Invalid MSG structure'))
    const file = makeFile('bad.msg')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    const state = store.getState().emailUpload
    expect(state.status).toBe('error')
    expect(state.errorMessage).toContain('Invalid MSG structure')
  })

  it('dispatches a generic error when parseMsgFile throws a non-Error', async () => {
    vi.mocked(parseMsgFile).mockRejectedValueOnce('string error')
    const file = makeFile('bad.msg')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    const state = store.getState().emailUpload
    expect(state.status).toBe('error')
    expect(state.errorMessage).toContain('corrupted or in an unsupported format')
  })

  it('dispatches setError when convertEmailToPdf throws', async () => {
    vi.mocked(convertEmailToPdf).mockRejectedValueOnce(new Error('Canvas rendering failed'))
    const file = makeFile('problem.msg')
    await store.dispatch(processUploadedFile({ file, maxSizeMB: 25 }))
    const state = store.getState().emailUpload
    expect(state.status).toBe('error')
    expect(state.errorMessage).toContain('Canvas rendering failed')
  })

  it('does not call onFileReady when an error occurs', async () => {
    vi.mocked(parseMsgFile).mockRejectedValueOnce(new Error('Parse error'))
    const file = makeFile('bad.msg')
    const onFileReady = vi.fn()
    await store.dispatch(processUploadedFile({ file, onFileReady, maxSizeMB: 25 }))
    expect(onFileReady).not.toHaveBeenCalled()
  })
})
