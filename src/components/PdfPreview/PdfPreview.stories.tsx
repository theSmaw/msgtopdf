import type { Meta, StoryObj } from '@storybook/react';
import { PdfPreview } from './PdfPreview';

// Minimal valid PDF as a data URL so the iframe renders something real.
const SAMPLE_PDF_URL =
  'data:application/pdf;base64,JVBERi0xLjAKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXT4+ZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjE5MAolJUVPRg==';

const meta: Meta<typeof PdfPreview> = {
  title: 'Components/PdfPreview',
  component: PdfPreview,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 416 }}><Story /></div>],
  args: { onReplace: () => {} },
};

export default meta;
type Story = StoryObj<typeof PdfPreview>;

export const PlainPdf: Story = {
  name: 'Plain PDF',
  args: {
    pdfUrl: SAMPLE_PDF_URL,
    wasConverted: false,
    originalFileName: 'quarterly-report.pdf',
    originalFileSize: 204800,
    droppedAttachments: [],
  },
};

export const ConvertedFromMsg: Story = {
  name: 'Converted from .msg',
  args: {
    pdfUrl: SAMPLE_PDF_URL,
    wasConverted: true,
    originalFileName: 'invoice-2024-03.msg',
    originalFileSize: 87040,
    droppedAttachments: [],
  },
};

export const WithOneDroppedAttachment: Story = {
  name: 'With 1 dropped attachment',
  args: {
    pdfUrl: SAMPLE_PDF_URL,
    wasConverted: true,
    originalFileName: 'project-update.msg',
    originalFileSize: 512000,
    droppedAttachments: ['budget-spreadsheet.xlsx'],
  },
};

export const WithMultipleDroppedAttachments: Story = {
  name: 'With multiple dropped attachments',
  args: {
    pdfUrl: SAMPLE_PDF_URL,
    wasConverted: true,
    originalFileName: 'weekly-digest.msg',
    originalFileSize: 1048576,
    droppedAttachments: ['report-q1.xlsx', 'photo.jpg', 'contract.docx'],
  },
};
