import type { Meta, StoryObj } from '@storybook/react';
import { EmailFileUploader } from './EmailFileUploader';
import { initialEmailUploadState } from '../../containers/EmailFileUploader/emailUploadReducer';

const SAMPLE_PDF_URL =
  'data:application/pdf;base64,JVBERi0xLjAKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqIDIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iaiAzIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXT4+ZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNC9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjE5MAolJUVPRg==';

const meta: Meta<typeof EmailFileUploader> = {
  title: 'Components/EmailFileUploader',
  component: EmailFileUploader,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 416 }}><Story /></div>],
  args: {
    onFilesAccepted: () => {},
    onFilesRejected: () => {},
    onReset: () => {},
    maxSizeMB: 25,
  },
};

export default meta;
type Story = StoryObj<typeof EmailFileUploader>;

export const Idle: Story = {
  args: {
    state: { ...initialEmailUploadState },
  },
};

export const Parsing: Story = {
  args: {
    state: { ...initialEmailUploadState, status: 'parsing' },
  },
};

export const Converting: Story = {
  args: {
    state: { ...initialEmailUploadState, status: 'converting' },
  },
};

export const ReadyPlainPdf: Story = {
  name: 'Ready — plain PDF',
  args: {
    state: {
      ...initialEmailUploadState,
      status: 'ready',
      pdfUrl: SAMPLE_PDF_URL,
      wasConverted: false,
      originalFileName: 'quarterly-report.pdf',
      originalFileSize: 204800,
      droppedAttachments: [],
    },
  },
};

export const ReadyConvertedFromMsg: Story = {
  name: 'Ready — converted from .msg',
  args: {
    state: {
      ...initialEmailUploadState,
      status: 'ready',
      pdfUrl: SAMPLE_PDF_URL,
      wasConverted: true,
      originalFileName: 'invoice-2024-03.msg',
      originalFileSize: 87040,
      droppedAttachments: [],
    },
  },
};

export const ReadyWithDroppedAttachments: Story = {
  name: 'Ready — with dropped attachments',
  args: {
    state: {
      ...initialEmailUploadState,
      status: 'ready',
      pdfUrl: SAMPLE_PDF_URL,
      wasConverted: true,
      originalFileName: 'project-update.msg',
      originalFileSize: 512000,
      droppedAttachments: ['budget-spreadsheet.xlsx', 'photo.jpg'],
    },
  },
};

export const ErrorUnsupportedFormat: Story = {
  name: 'Error — unsupported format',
  args: {
    state: {
      ...initialEmailUploadState,
      status: 'error',
      errorMessage: 'Unsupported file type ".docx". Please upload a .msg or .pdf file.',
    },
  },
};

export const ErrorFileTooLarge: Story = {
  name: 'Error — file too large',
  args: {
    state: {
      ...initialEmailUploadState,
      status: 'error',
      errorMessage: 'File is too large. Maximum allowed size is 25 MB.',
    },
  },
};

export const ErrorConversionFailed: Story = {
  name: 'Error — conversion failed',
  args: {
    state: {
      ...initialEmailUploadState,
      status: 'error',
      errorMessage:
        'Failed to convert the .msg file. It may be corrupted or in an unsupported format.',
    },
  },
};
