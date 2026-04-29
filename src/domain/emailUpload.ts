export type UploadStatus = 'idle' | 'parsing' | 'converting' | 'ready' | 'error'

export interface ParsedEmail {
  subject: string
  from: string
  to: string
  cc: string
  date: string
  bodyHtml: string
  cidMap: Record<string, string>
  /** Filenames of regular (non-inline) attachments that cannot be included in the PDF. */
  droppedAttachments: string[]
}
