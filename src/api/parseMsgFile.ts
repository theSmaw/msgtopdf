import MsgReader from '@kenjiuno/msgreader'
import type { ParsedEmail } from '../domain/emailUpload'
import { escapeHtml } from './htmlUtils'

function decodeHtmlBytes(bytes: Uint8Array): string {
  const ascii = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 2048))
  const match = ascii.match(/charset=["']?\s*([A-Za-z0-9\-_]+)/i)
  const charset = match?.[1] ?? 'utf-8'
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes)
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  }
}

function extractBodyContent(fullHtml: string): string {
  const doc = new DOMParser().parseFromString(fullHtml, 'text/html')
  return doc.body?.innerHTML ?? doc.documentElement.innerHTML
}

function sanitizeBodyHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="#"')
}

const EXT_TO_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

function uint8ArrayToDataUrl(bytes: Uint8Array, ext: string): string {
  const mime = EXT_TO_MIME[ext.toLowerCase()] ?? 'image/png'
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return `data:${mime};base64,${btoa(binary)}`
}

function buildCidMap(
  msgReader: InstanceType<typeof MsgReader>,
  attachments: import('@kenjiuno/msgreader').FieldsData[]
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const att of attachments) {
    if (!att.pidContentId) continue
    try {
      const { content } = msgReader.getAttachment(att)
      const ext = att.extension ?? att.fileName?.match(/\.[^.]+$/)?.[0] ?? '.png'
      map[att.pidContentId] = uint8ArrayToDataUrl(content, ext)
    } catch {
      // skip unreadable attachment
    }
  }
  return map
}

function getDroppedAttachmentNames(
  attachments: import('@kenjiuno/msgreader').FieldsData[]
): string[] {
  return attachments
    .filter(att => !att.pidContentId && att.fileName)
    .map(att => att.fileName as string)
}

export async function parseMsgFile(file: File): Promise<ParsedEmail> {
  const arrayBuffer = await file.arrayBuffer()
  const msgReader = new MsgReader(arrayBuffer)
  const data = msgReader.getFileData()

  const recipients = data.recipients ?? []

  const toList = recipients
    .filter(r => r.recipType === 'to' || !r.recipType)
    .map(r => r.name || r.email || r.smtpAddress || '')
    .filter(Boolean)
    .join(', ')

  const ccList = recipients
    .filter(r => r.recipType === 'cc')
    .map(r => r.name || r.email || r.smtpAddress || '')
    .filter(Boolean)
    .join(', ')

  const fromParts = [
    data.senderName,
    data.senderEmail ? `<${data.senderEmail}>` : '',
  ].filter(Boolean)
  const from = fromParts.length > 0 ? fromParts.join(' ') : 'Unknown Sender'

  let date = 'Unknown Date'
  if (data.messageDeliveryTime) {
    const d = new Date(data.messageDeliveryTime)
    if (!isNaN(d.getTime())) {
      date = d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  let bodyHtml = ''
  if (ArrayBuffer.isView(data.html) && data.html.byteLength > 0) {
    bodyHtml = sanitizeBodyHtml(extractBodyContent(decodeHtmlBytes(data.html as Uint8Array)))
  } else if (data.bodyHtml) {
    bodyHtml = sanitizeBodyHtml(extractBodyContent(data.bodyHtml))
  } else if (data.body) {
    bodyHtml = `<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;margin:0;">${escapeHtml(data.body)}</pre>`
  }

  return {
    subject: data.subject || '(No Subject)',
    from,
    to: toList || '(No Recipients)',
    cc: ccList,
    date,
    bodyHtml,
    cidMap: buildCidMap(msgReader, data.attachments ?? []),
    droppedAttachments: getDroppedAttachmentNames(data.attachments ?? []),
  }
}
