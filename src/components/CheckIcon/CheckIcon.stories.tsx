import type { Meta, StoryObj } from '@storybook/react';
import { CheckIcon } from './CheckIcon';

const meta: Meta<typeof CheckIcon> = {
  title: 'Icons/CheckIcon',
  component: CheckIcon,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof CheckIcon>;

export const Default: Story = {};
