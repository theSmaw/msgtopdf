import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadError } from '../UploadError'

describe('UploadError', () => {
  it('renders the "Conversion failed" heading', () => {
    render(<UploadError message="Something went wrong." onRetry={vi.fn()} />)
    expect(screen.getByText('Conversion failed')).toBeInTheDocument()
  })

  it('renders the error message text', () => {
    render(<UploadError message="Invalid MSG format. The file may be corrupted." onRetry={vi.fn()} />)
    expect(screen.getByText('Invalid MSG format. The file may be corrupted.')).toBeInTheDocument()
  })

  it('renders a "Try again" button', () => {
    render(<UploadError message="Error." onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls onRetry when the Try again button is clicked', async () => {
    const onRetry = vi.fn()
    render(<UploadError message="Error." onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders the error icon SVG', () => {
    const { container } = render(<UploadError message="Error." onRetry={vi.fn()} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders a long error message without truncation', () => {
    const longMessage = 'A'.repeat(200)
    render(<UploadError message={longMessage} onRetry={vi.fn()} />)
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})
