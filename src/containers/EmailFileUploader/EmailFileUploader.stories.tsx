import type { Meta, StoryObj } from '@storybook/react'
import { EmailFileUploader } from './EmailFileUploaderContainer'

const meta: Meta<typeof EmailFileUploader> = {
  title: 'EmailFileUploader',
  component: EmailFileUploader,
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
}

export default meta
type Story = StoryObj<typeof EmailFileUploader>

export const Default: Story = {
  args: {
    maxSizeMB: 25,
  },
}
