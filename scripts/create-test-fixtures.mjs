/**
 * Generates test fixture files used by Cypress E2E tests.
 *
 * Run with:  npm run fixtures:create
 *
 * Outputs:
 *   cypress/fixtures/emails/sample.msg      — MSG with HTML body
 *   cypress/fixtures/emails/plain-text.msg  — MSG with plain-text body only
 *   cypress/fixtures/emails/no-subject.msg  — MSG with no subject field
 *   cypress/fixtures/emails/with-cc.msg     — MSG with To and CC recipients
 *   cypress/fixtures/emails/minimal.pdf     — Smallest valid PDF (for PDF upload tests)
 */

import * as CFB from 'cfb'
import { mkdir, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = join(__dirname, '../cypress/fixtures/emails')

// ── Encoding helpers ──────────────────────────────────────────────────────────

function encodeUTF16LE(str) {
  const buf = Buffer.alloc((str.length + 1) * 2)
  for (let i = 0; i < str.length; i++) buf.writeUInt16LE(str.charCodeAt(i), i * 2)
  buf.writeUInt16LE(0, str.length * 2) // null terminator
  return buf
}

function encodeANSI(str) {
  return Buffer.from(str + '\0', 'latin1')
}

/**
 * Converts a JS Date to an 8-byte Windows FILETIME buffer (100ns intervals since 1601).
 */
function toFileTime(date) {
  const ms = BigInt(date.getTime()) + 11644473600000n
  const ft = ms * 10000n
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(ft)
  return buf
}

// ── Properties stream builder ─────────────────────────────────────────────────

/**
 * Builds a minimal __properties_version1.0 stream for a top-level message object.
 *
 * Header (32 bytes): 8 reserved + 4 NextRecipientID + 4 NextAttachmentID +
 *                    4 RecipientCount + 4 AttachmentCount + 8 reserved
 *
 * Each fixed-length property entry (16 bytes):
 *   2 bytes property type + 2 bytes property ID + 4 bytes flags + 8 bytes value
 */
function buildPropertiesStream(props = {}) {
  const {
    recipientCount = 0,
    attachmentCount = 0,
    deliveryTime = new Date('2024-06-15T14:30:00Z'),
  } = props

  const header = Buffer.alloc(32, 0)
  header.writeUInt32LE(recipientCount, 8)
  header.writeUInt32LE(attachmentCount, 16)

  // PT_SYSTIME (0x0040), tag 0x0E06 = messageDeliveryTime
  const timeBuf = toFileTime(deliveryTime)
  const timeEntry = Buffer.alloc(16, 0)
  timeEntry.writeUInt16LE(0x0040, 0) // type PT_SYSTIME
  timeEntry.writeUInt16LE(0x0E06, 2) // property ID
  timeBuf.copy(timeEntry, 8)

  return Buffer.concat([header, timeEntry])
}

// ── MSG creator ───────────────────────────────────────────────────────────────

function addStream(cfb, name, content) {
  try {
    CFB.utils.cfb_add(cfb, name, content, { unsafe: true })
  } catch {
    CFB.utils.cfb_add(cfb, name, content)
  }
}

function createMsg({
  subject = 'Test Email Subject',
  senderName = 'Alice Sender',
  senderEmail = 'alice@example.com',
  toDisplay = 'Bob Recipient',
  ccDisplay = '',
  htmlBody = '',
  textBody = '',
  deliveryTime = new Date('2024-06-15T14:30:00Z'),
  recipientCount = 1,
} = {}) {
  const cfb = CFB.utils.cfb_new({ unsafe: true })

  // Subject — PidTagSubject 0x0037, Unicode (0x001F)
  addStream(cfb, '/__substg1.0_0037001F', encodeUTF16LE(subject))

  // Sender name — PidTagSenderName 0x0C1A, Unicode
  addStream(cfb, '/__substg1.0_0C1A001F', encodeUTF16LE(senderName))

  // Sender email — PidTagSenderSmtpAddress 0x5D01, Unicode
  addStream(cfb, '/__substg1.0_5D01001F', encodeUTF16LE(senderEmail))

  // To display — PidTagDisplayTo 0x0E04, Unicode
  addStream(cfb, '/__substg1.0_0E04001F', encodeUTF16LE(toDisplay))

  if (ccDisplay) {
    // CC display — PidTagDisplayCc 0x0E03, Unicode
    addStream(cfb, '/__substg1.0_0E03001F', encodeUTF16LE(ccDisplay))
  }

  if (htmlBody) {
    // HTML body — PidTagHtml 0x10130102 (binary, UTF-8)
    addStream(cfb, '/__substg1.0_10130102', Buffer.from(htmlBody, 'utf-8'))
  }

  if (textBody) {
    // Plain text body — PidTagBody 0x1000, Unicode
    addStream(cfb, '/__substg1.0_1000001F', encodeUTF16LE(textBody))
  }

  // Properties stream
  addStream(cfb, '/__properties_version1.0', buildPropertiesStream({ recipientCount, deliveryTime }))

  return Buffer.from(CFB.write(cfb, { type: 'buffer' }))
}

// ── Minimal valid PDF ─────────────────────────────────────────────────────────

function createMinimalPdf() {
  return Buffer.from(
    `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Test PDF Document) Tj ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000360 00000 n

trailer
<< /Size 6 /Root 1 0 R >>
startxref
441
%%EOF`,
    'utf-8'
  )
}

// ── Write fixtures ────────────────────────────────────────────────────────────

async function main() {
  await mkdir(FIXTURES_DIR, { recursive: true })

  const fixtures = {
    'sample.msg': createMsg({
      subject: 'Q2 Report — Action Required',
      senderName: 'Alice Smith',
      senderEmail: 'alice@example.com',
      toDisplay: 'Bob Jones',
      htmlBody: `<html><body>
        <p>Hi Bob,</p>
        <p>Please review the attached <strong>Q2 report</strong> before Friday.</p>
        <p>Key highlights:</p>
        <ul>
          <li>Revenue up 12%</li>
          <li>Operating costs reduced by 8%</li>
          <li>Customer satisfaction: 4.7/5</li>
        </ul>
        <p>Let me know if you have any questions.</p>
        <p>Best,<br>Alice</p>
      </body></html>`,
    }),

    'plain-text.msg': createMsg({
      subject: 'Plain Text Only Email',
      senderName: 'Charlie Brown',
      senderEmail: 'charlie@example.com',
      toDisplay: 'Diana Prince',
      textBody: 'Hi Diana,\n\nThis is a plain text email with no HTML body.\n\nRegards,\nCharlie',
    }),

    'no-subject.msg': createMsg({
      subject: '',
      senderName: 'Unknown Sender',
      senderEmail: 'unknown@example.com',
      toDisplay: 'recipient@example.com',
      htmlBody: '<html><body><p>This email has no subject line.</p></body></html>',
    }),

    'with-cc.msg': createMsg({
      subject: 'Team Update',
      senderName: 'Manager Name',
      senderEmail: 'manager@example.com',
      toDisplay: 'Team Lead',
      ccDisplay: 'Director A; Director B',
      htmlBody: '<html><body><p>Team update email with CC recipients.</p></body></html>',
      recipientCount: 3,
    }),

    'long-body.msg': createMsg({
      subject: 'Long Email Body Test',
      senderName: 'Content Bot',
      senderEmail: 'bot@example.com',
      toDisplay: 'Tester',
      htmlBody: `<html><body>
        ${Array.from({ length: 20 }, (_, i) =>
          `<p>Paragraph ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>`
        ).join('\n')}
      </body></html>`,
    }),

    'minimal.pdf': createMinimalPdf(),
  }

  for (const [name, content] of Object.entries(fixtures)) {
    const filePath = join(FIXTURES_DIR, name)
    await writeFile(filePath, content)
    console.log(`✓ ${filePath} (${content.length} bytes)`)
  }

  console.log(`\nGenerated ${Object.keys(fixtures).length} fixtures in ${FIXTURES_DIR}`)
}

main().catch((err) => {
  console.error('Fixture generation failed:', err)
  process.exit(1)
})
