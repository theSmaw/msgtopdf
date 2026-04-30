import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRightIcon } from './ArrowRightIcon';

const meta: Meta<typeof ArrowRightIcon> = {
  title: 'Icons/ArrowRightIcon',
  component: ArrowRightIcon,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof ArrowRightIcon>;

export const Default: Story = {};
