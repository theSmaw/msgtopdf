import type { Meta, StoryObj } from '@storybook/react';
import { DropZone } from './DropZone';

const meta: Meta<typeof DropZone> = {
  title: 'Components/DropZone',
  component: DropZone,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 416 }}><Story /></div>],
  args: {
    onFilesAccepted: () => {},
    onFilesRejected: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof DropZone>;

export const Default: Story = {
  args: { maxSizeMB: 25 },
};

export const SmallSizeLimit: Story = {
  args: { maxSizeMB: 5 },
};
