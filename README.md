# msgtopdf — EmailFileUploader

A self-contained React component that accepts `.pdf` and `.msg` (Outlook) files. `.msg` files are parsed and converted to PDF entirely in the browser — no server required. The result is surfaced through a compact attachment card with a full-screen modal preview.

## Features

- Drag & drop or click-to-browse for `.pdf` and `.msg` files
- In-browser `.msg` → PDF conversion (html2canvas + jsPDF)
- Compact attachment card: filename, file size, "Converted to PDF" badge
- Modal PDF preview (click **Preview**, close with **✕** or Escape)
- Warning when a `.msg` contained file attachments that cannot be included in the PDF
- Per-instance Redux store — safe to mount multiple times on the same page

---

## Installation

The component is not yet published to npm. To use it, copy the `src/` directory into your project or reference it as a local package.

### Peer dependencies

Your project must already have these installed:

```
react >= 18
react-dom >= 18
```

### Install the component's own dependencies

```bash
npm install \
  @kenjiuno/msgreader \
  @reduxjs/toolkit \
  html2canvas \
  jspdf \
  react-dropzone \
  react-redux
```

### Vite projects — required Node polyfill

`@kenjiuno/msgreader` uses `iconv-lite` internally, which expects a `Buffer` global. Add the polyfill plugin to your `vite.config.ts`:

```bash
npm install -D vite-plugin-node-polyfills
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills()],
})
```

> **Note:** Do not add `nodePolyfills` to your Vitest config — it causes test environment conflicts. Keep a separate `vitest.config.ts` that only uses the React plugin.

---

## Usage

```tsx
import { EmailFileUploader } from './path/to/src/containers/EmailFileUploader/EmailFileUploaderContainer'

function MyForm() {
  return (
    <EmailFileUploader
      onFileReady={(blob, filename) => {
        // blob is always a PDF (either the original or converted from .msg)
        // filename is the display name, e.g. "invoice.pdf" or "email.pdf"
        console.log('Ready to submit:', filename, blob.size)
      }}
      maxSizeMB={25}
    />
  )
}
```

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `onFileReady` | `(blob: Blob, filename: string) => void` | — | Called once a file is ready. The `blob` is always a PDF. |
| `maxSizeMB` | `number` | `25` | Maximum accepted file size in megabytes. |
| `className` | `string` | — | CSS class applied to the root wrapper element. |

---

## State machine

```
idle → parsing → converting → ready
                             ↘ error → idle (retry)
```

| State | Description |
|---|---|
| `idle` | Drop zone shown, waiting for a file |
| `parsing` | Reading the `.msg` file with `@kenjiuno/msgreader` |
| `converting` | Rendering the email to canvas and encoding as PDF |
| `ready` | Attachment card shown with Preview and Replace actions |
| `error` | Inline error with a retry button |

Direct `.pdf` uploads skip straight from `idle` to `ready`.

---

## Attachment handling

Inline images embedded in a `.msg` body (CID attachments) are resolved and rendered in the PDF.

Regular file attachments (e.g. a Word document attached to the email) **cannot** be included in the PDF. If any are present, an amber notice is shown in the attachment card listing the filenames that were dropped:

> ⚠ 2 attachments not included in PDF: report.pdf, invoice.xlsx

---

## Development

```bash
npm install
npm run dev        # Vite dev server — renders the component in a mock modal
npm test           # Vitest unit tests (178 tests)
npm run cy:open    # Cypress component + E2E tests
```

---

## Tech stack

| Concern | Library |
|---|---|
| Bundler | Vite 6 |
| UI | React 18 + TypeScript |
| State | Redux Toolkit (per-instance store) |
| Drag & drop | react-dropzone |
| `.msg` parsing | @kenjiuno/msgreader |
| PDF generation | html2canvas + jsPDF |
| Unit tests | Vitest + Testing Library |
| Component/E2E tests | Cypress |
