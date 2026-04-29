import { describe, it, expect, vi, beforeEach } from 'vitest'
import MsgReader from '@kenjiuno/msgreader'
import { parseMsgFile } from '../parseMsgFile'

vi.mock('@kenjiuno/msgreader')

function makeMsgData(overrides: Record<string, unknown> = {}) {
  return {
    subject: 'Test Subject',
    senderName: 'John Doe',
    senderEmail: 'john@example.com',
    recipients: [
      { recipType: 'to', name: 'Jane Smith', email: 'jane@example.com', smtpAddress: 'jane@example.com' },
    ],
    messageDeliveryTime: '2024-01-15T10:30:00.000Z',
    html: new TextEncoder().encode('<html><body><p>Hello World</p></body></html>'),
    bodyHtml: '',
    body: '',
    attachments: [],
    ...overrides,
  }
}

describe('parseMsgFile', () => {
  let mockGetFileData: ReturnType<typeof vi.fn>
  let mockGetAttachment: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGetFileData = vi.fn().mockReturnValue(makeMsgData())
    mockGetAttachment = vi.fn()
    vi.mocked(MsgReader).mockImplementation(
      () => ({ getFileData: mockGetFileData, getAttachment: mockGetAttachment }) as unknown as InstanceType<typeof MsgReader>
    )
  })

  const makeFile = () => new File([new ArrayBuffer(8)], 'test.msg')

  // ── HTML body variants ────────────────────────────────────────────────

  it('decodes HTML body from data.html Uint8Array (UTF-8)', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      html: new TextEncoder().encode('<html><body><p>UTF-8 content éàü</p></body></html>'),
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toContain('<p>UTF-8 content')
  })

  it('detects windows-1252 charset from meta tag and decodes correctly', async () => {
    const html = '<html><head><meta charset="windows-1252"></head><body><p>Charset test</p></body></html>'
    mockGetFileData.mockReturnValue(makeMsgData({ html: new TextEncoder().encode(html) }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toContain('<p>Charset test</p>')
  })

  it('falls back to data.bodyHtml string when data.html is absent', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ html: new Uint8Array(0), bodyHtml: '<p>Fallback HTML</p>' }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toContain('<p>Fallback HTML</p>')
  })

  it('falls back to data.bodyHtml when data.html is undefined', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ html: undefined, bodyHtml: '<p>String body</p>' }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toContain('<p>String body</p>')
  })

  it('falls back to data.body plain text, wrapping in <pre>', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ html: new Uint8Array(0), bodyHtml: '', body: 'Plain text body' }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toContain('Plain text body')
    expect(result.bodyHtml).toContain('<pre')
  })

  it('escapes HTML in plain text body', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ html: new Uint8Array(0), bodyHtml: '', body: '<b>bold</b>' }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toContain('&lt;b&gt;bold&lt;/b&gt;')
  })

  it('returns empty bodyHtml when no body fields are present', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ html: undefined, bodyHtml: '', body: '' }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toBe('')
  })

  it('extracts only body content from a full HTML document (strips <head>)', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      html: new TextEncoder().encode('<html><head><title>Title</title></head><body><p>Body only</p></body></html>'),
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toContain('<p>Body only</p>')
    expect(result.bodyHtml).not.toContain('<html')
    expect(result.bodyHtml).not.toContain('<title')
  })

  // ── Sanitisation ──────────────────────────────────────────────────────

  it('strips <script> tags entirely', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      html: new TextEncoder().encode('<body><script>alert("xss")</script><p>Safe</p></body>'),
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).not.toContain('<script>')
    expect(result.bodyHtml).not.toContain('alert')
    expect(result.bodyHtml).toContain('<p>Safe</p>')
  })

  it('strips inline event handlers (onclick, onload)', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      html: new TextEncoder().encode('<body><a onclick="evil()">click</a><img onload="evil2()"/></body>'),
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).not.toContain('onclick')
    expect(result.bodyHtml).not.toContain('onload')
    expect(result.bodyHtml).toContain('click')
  })

  it('replaces javascript: href with #', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      html: new TextEncoder().encode('<body><a href="javascript:void(0)">click</a></body>'),
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).not.toContain('javascript:')
    expect(result.bodyHtml).toContain('href="#"')
  })

  it('strips <style> blocks', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      html: new TextEncoder().encode('<body><style>.evil{display:none}</style><p>Content</p></body>'),
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).not.toContain('<style>')
    expect(result.bodyHtml).toContain('<p>Content</p>')
  })

  it('strips <link> tags', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      html: new TextEncoder().encode('<body><link rel="stylesheet" href="evil.css"><p>Content</p></body>'),
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).not.toContain('<link')
  })

  it('preserves safe href attributes (https links)', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      html: new TextEncoder().encode('<body><a href="https://example.com">link</a></body>'),
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.bodyHtml).toContain('href="https://example.com"')
  })

  // ── Metadata: subject ─────────────────────────────────────────────────

  it('extracts subject', async () => {
    const result = await parseMsgFile(makeFile())
    expect(result.subject).toBe('Test Subject')
  })

  it('defaults subject to (No Subject) when empty string', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ subject: '' }))
    const result = await parseMsgFile(makeFile())
    expect(result.subject).toBe('(No Subject)')
  })

  it('defaults subject to (No Subject) when undefined', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ subject: undefined }))
    const result = await parseMsgFile(makeFile())
    expect(result.subject).toBe('(No Subject)')
  })

  // ── Metadata: sender ──────────────────────────────────────────────────

  it('formats sender as "Name <email>" when both present', async () => {
    const result = await parseMsgFile(makeFile())
    expect(result.from).toBe('John Doe <john@example.com>')
  })

  it('formats sender as name only when email is absent', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ senderEmail: '' }))
    const result = await parseMsgFile(makeFile())
    expect(result.from).toBe('John Doe')
  })

  it('formats sender as email only when name is absent', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ senderName: '', senderEmail: 'john@example.com' }))
    const result = await parseMsgFile(makeFile())
    expect(result.from).toBe('<john@example.com>')
  })

  it('defaults sender to Unknown Sender when both name and email are missing', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ senderName: '', senderEmail: '' }))
    const result = await parseMsgFile(makeFile())
    expect(result.from).toBe('Unknown Sender')
  })

  // ── Metadata: recipients ──────────────────────────────────────────────

  it('extracts To recipients by name', async () => {
    const result = await parseMsgFile(makeFile())
    expect(result.to).toBe('Jane Smith')
  })

  it('extracts CC recipients separately', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      recipients: [
        { recipType: 'to', name: 'Jane', email: 'jane@example.com', smtpAddress: '' },
        { recipType: 'cc', name: 'Bob', email: 'bob@example.com', smtpAddress: '' },
        { recipType: 'cc', name: 'Carol', email: 'carol@example.com', smtpAddress: '' },
      ],
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.to).toBe('Jane')
    expect(result.cc).toBe('Bob, Carol')
  })

  it('defaults To to (No Recipients) when recipients list is empty', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ recipients: [] }))
    const result = await parseMsgFile(makeFile())
    expect(result.to).toBe('(No Recipients)')
  })

  it('uses smtpAddress as fallback when name and email are empty', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      recipients: [{ recipType: 'to', name: '', email: '', smtpAddress: 'smtp@example.com' }],
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.to).toBe('smtp@example.com')
  })

  it('treats recipient with no recipType as a To recipient', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      recipients: [{ recipType: undefined, name: 'NoType', email: 'notype@example.com', smtpAddress: '' }],
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.to).toContain('NoType')
  })

  it('handles multiple To recipients joined by ", "', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      recipients: [
        { recipType: 'to', name: 'Alice', email: 'a@example.com', smtpAddress: '' },
        { recipType: 'to', name: 'Bob', email: 'b@example.com', smtpAddress: '' },
      ],
    }))
    const result = await parseMsgFile(makeFile())
    expect(result.to).toBe('Alice, Bob')
  })

  // ── Metadata: date ────────────────────────────────────────────────────

  it('formats a valid messageDeliveryTime as a readable date', async () => {
    const result = await parseMsgFile(makeFile())
    expect(result.date).not.toBe('Unknown Date')
    expect(result.date).toContain('2024')
  })

  it('defaults date to Unknown Date when messageDeliveryTime is undefined', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ messageDeliveryTime: undefined }))
    const result = await parseMsgFile(makeFile())
    expect(result.date).toBe('Unknown Date')
  })

  it('defaults date to Unknown Date when messageDeliveryTime is not a valid date string', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({ messageDeliveryTime: 'not-a-date' }))
    const result = await parseMsgFile(makeFile())
    expect(result.date).toBe('Unknown Date')
  })

  // ── CID attachments ───────────────────────────────────────────────────

  it('builds cidMap entry for attachment with pidContentId', async () => {
    const pngHeader = new Uint8Array([137, 80, 78, 71])
    mockGetFileData.mockReturnValue(makeMsgData({
      attachments: [{ pidContentId: 'img001@example.com', extension: '.png', fileName: 'img.png' }],
    }))
    mockGetAttachment.mockReturnValue({ content: pngHeader })
    const result = await parseMsgFile(makeFile())
    expect(result.cidMap['img001@example.com']).toMatch(/^data:image\/png;base64,/)
  })

  it('maps JPEG attachments with the correct MIME type', async () => {
    const jpgHeader = new Uint8Array([0xFF, 0xD8, 0xFF])
    mockGetFileData.mockReturnValue(makeMsgData({
      attachments: [{ pidContentId: 'photo@example.com', extension: '.jpg', fileName: 'photo.jpg' }],
    }))
    mockGetAttachment.mockReturnValue({ content: jpgHeader })
    const result = await parseMsgFile(makeFile())
    expect(result.cidMap['photo@example.com']).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('maps .jpeg extension as image/jpeg', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      attachments: [{ pidContentId: 'photo2@example.com', extension: '.jpeg', fileName: 'photo.jpeg' }],
    }))
    mockGetAttachment.mockReturnValue({ content: new Uint8Array([1]) })
    const result = await parseMsgFile(makeFile())
    expect(result.cidMap['photo2@example.com']).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('defaults to image/png for unknown attachment extensions', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      attachments: [{ pidContentId: 'unknown@example.com', extension: '.xyz', fileName: 'unknown.xyz' }],
    }))
    mockGetAttachment.mockReturnValue({ content: new Uint8Array([1, 2, 3]) })
    const result = await parseMsgFile(makeFile())
    expect(result.cidMap['unknown@example.com']).toMatch(/^data:image\/png;base64,/)
  })

  it('skips attachments without pidContentId', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      attachments: [{ pidContentId: undefined, extension: '.pdf', fileName: 'doc.pdf' }],
    }))
    const result = await parseMsgFile(makeFile())
    expect(Object.keys(result.cidMap)).toHaveLength(0)
  })

  it('skips attachment gracefully when getAttachment throws', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      attachments: [{ pidContentId: 'broken@example.com', extension: '.png', fileName: 'broken.png' }],
    }))
    mockGetAttachment.mockImplementation(() => { throw new Error('read error') })
    const result = await parseMsgFile(makeFile())
    expect(Object.keys(result.cidMap)).toHaveLength(0)
  })

  it('builds cidMap entries for multiple attachments', async () => {
    const png = new Uint8Array([137, 80, 78, 71])
    const jpg = new Uint8Array([0xFF, 0xD8, 0xFF])
    mockGetFileData.mockReturnValue(makeMsgData({
      attachments: [
        { pidContentId: 'img1@example.com', extension: '.png', fileName: 'a.png' },
        { pidContentId: 'img2@example.com', extension: '.jpg', fileName: 'b.jpg' },
      ],
    }))
    mockGetAttachment.mockReturnValueOnce({ content: png }).mockReturnValueOnce({ content: jpg })
    const result = await parseMsgFile(makeFile())
    expect(Object.keys(result.cidMap)).toHaveLength(2)
    expect(result.cidMap['img1@example.com']).toMatch(/png/)
    expect(result.cidMap['img2@example.com']).toMatch(/jpeg/)
  })

  it('derives extension from fileName when extension field is missing', async () => {
    mockGetFileData.mockReturnValue(makeMsgData({
      attachments: [{ pidContentId: 'gif@example.com', extension: undefined, fileName: 'anim.gif' }],
    }))
    mockGetAttachment.mockReturnValue({ content: new Uint8Array([0x47, 0x49, 0x46]) })
    const result = await parseMsgFile(makeFile())
    expect(result.cidMap['gif@example.com']).toMatch(/^data:image\/gif;base64,/)
  })
})
