import type { Meta, StoryObj } from '@storybook/react';
import { UploadError } from './UploadError';

const meta: Meta<typeof UploadError> = {
  title: 'Components/UploadError',
  component: UploadError,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 416 }}><Story /></div>],
  args: { onRetry: () => {} },
};

export default meta;
type Story = StoryObj<typeof UploadError>;

export const UnsupportedFormat: Story = {
  args: {
    message: 'Unsupported file type ".docx". Please upload a .msg or .pdf file.',
  },
};

export const FileTooLarge: Story = {
  args: {
    message: 'File is too large. Maximum allowed size is 25 MB.',
  },
};

export const ConversionFailed: Story = {
  args: {
    message: 'Failed to convert the .msg file. It may be corrupted or in an unsupported format.',
  },
};

export const ShortMessage: Story = {
  args: {
    message: 'An unknown error occurred.',
  },
};
