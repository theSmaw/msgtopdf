import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepItem } from '../StepItem'

describe('StepItem', () => {
  it('renders the label text', () => {
    render(<StepItem label="Parse email" state="pending" />)
    expect(screen.getByText('Parse email')).toBeInTheDocument()
  })

  it('renders a check icon when state is done', () => {
    const { container } = render(<StepItem label="Done step" state="done" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('does not render a check icon when state is pending', () => {
    const { container } = render(<StepItem label="Pending step" state="pending" />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('does not render a check icon when state is active', () => {
    const { container } = render(<StepItem label="Active step" state="active" />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('applies step_done class when state is done', () => {
    const { container } = render(<StepItem label="Done" state="done" />)
    expect(container.firstChild).toHaveClass('step_done')
  })

  it('applies step_active class when state is active', () => {
    const { container } = render(<StepItem label="Active" state="active" />)
    expect(container.firstChild).toHaveClass('step_active')
  })

  it('does not apply done or active class when state is pending', () => {
    const { container } = render(<StepItem label="Pending" state="pending" />)
    expect(container.firstChild).not.toHaveClass('step_done')
    expect(container.firstChild).not.toHaveClass('step_active')
  })
})
