import { useState, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EmailFileUploaderContainer } from './EmailFileUploaderContainer';

const meta: Meta<typeof EmailFileUploaderContainer> = {
  title: 'EmailFileUploaderContainer',
  component: EmailFileUploaderContainer,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    maxSizeMB: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Maximum file size in megabytes',
    },
    onFileReady: { action: 'fileReady' },
  },
};

export default meta;
type Story = StoryObj<typeof EmailFileUploaderContainer>;

function DefaultWrapper({ maxSizeMB }: { maxSizeMB: number }) {
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);
  const prevUrl = useRef<string | null>(null);

  function handleFileReady(blob: Blob, filename: string) {
    if (prevUrl.current) {
      URL.revokeObjectURL(prevUrl.current);
    }
    const url = URL.createObjectURL(blob);
    prevUrl.current = url;
    setDownload({ url, filename });
  }

  return (
    <div style={{ width: 416, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <EmailFileUploaderContainer maxSizeMB={maxSizeMB} onFileReady={handleFileReady} />
      {download && (
        <a
          href={download.url}
          download={download.filename}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 16px',
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            color: '#334155',
            textDecoration: 'none',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ↓ Download {download.filename}
        </a>
      )}
    </div>
  );
}

export const Default: Story = {
  args: { maxSizeMB: 25 },
  render: (args) => <DefaultWrapper maxSizeMB={args.maxSizeMB ?? 25} />,
};
