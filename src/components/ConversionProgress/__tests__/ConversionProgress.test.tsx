import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConversionProgress } from '../ConversionProgress'

describe('ConversionProgress', () => {
  it('shows "Reading email…" while parsing', () => {
    render(<ConversionProgress status="parsing" />)
    expect(screen.getByText('Reading email…')).toBeInTheDocument()
  })

  it('shows "Converting to PDF…" while converting', () => {
    render(<ConversionProgress status="converting" />)
    expect(screen.getByText('Converting to PDF…')).toBeInTheDocument()
  })

  it('renders the spinner ring and dot', () => {
    const { container } = render(<ConversionProgress status="parsing" />)
    expect(container.querySelector('.spinnerRing')).toBeInTheDocument()
    expect(container.querySelector('.spinnerDot')).toBeInTheDocument()
  })
})
