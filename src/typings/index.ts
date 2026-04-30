export type ParsedEmail = {
  subject: string;
  from: string;
  to: string;
  cc: string;
  date: string;
  bodyHtml: string;
  /** Maps CID (Content-ID) values from inline image attachments to their base64 data URLs, used to resolve `src="cid:..."` references when rendering the email body. */
  cidMap: Record<string, string>;
  /** Filenames of regular (non-inline) attachments that cannot be included in the PDF. */
  droppedAttachments: string[];
}
