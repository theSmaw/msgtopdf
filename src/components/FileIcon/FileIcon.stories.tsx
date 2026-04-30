import type { Meta, StoryObj } from '@storybook/react';
import { FileIcon } from './FileIcon';

const meta: Meta<typeof FileIcon> = {
  title: 'Icons/FileIcon',
  component: FileIcon,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof FileIcon>;

export const Default: Story = {};
