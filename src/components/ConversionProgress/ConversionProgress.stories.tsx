import type { Meta, StoryObj } from '@storybook/react';
import { ConversionProgress } from './ConversionProgress';

const meta: Meta<typeof ConversionProgress> = {
  title: 'Components/ConversionProgress',
  component: ConversionProgress,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 416 }}><Story /></div>],
  argTypes: {
    status: { control: 'radio', options: ['parsing', 'converting'] },
  },
};

export default meta;
type Story = StoryObj<typeof ConversionProgress>;

export const Parsing: Story = {
  args: { status: 'parsing' },
};

export const Converting: Story = {
  args: { status: 'converting' },
};
