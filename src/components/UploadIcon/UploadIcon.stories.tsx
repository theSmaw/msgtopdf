import type { Meta, StoryObj } from '@storybook/react';
import { UploadIcon } from './UploadIcon';

const meta: Meta<typeof UploadIcon> = {
  title: 'Icons/UploadIcon',
  component: UploadIcon,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof UploadIcon>;

export const Default: Story = {};
