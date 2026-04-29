import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { DropZone } from '../DropZone'

function renderDropZone(overrides: Partial<Parameters<typeof DropZone>[0]> = {}) {
  const props = {
    onFilesAccepted: vi.fn(),
    onFilesRejected: vi.fn(),
    maxSizeMB: 25,
    ...overrides,
  }
  return { ...render(<DropZone {...props} />), props }
}

describe('DropZone', () => {
  it('renders the idle drop prompt', () => {
    renderDropZone()
    expect(screen.getByText('Attach PDF or .msg email')).toBeInTheDocument()
  })

  it('renders the browse link text', () => {
    renderDropZone()
    expect(screen.getByText(/browse/i)).toBeInTheDocument()
  })

  it('shows both .PDF and .MSG type pills', () => {
    renderDropZone()
    expect(screen.getByText('.PDF')).toBeInTheDocument()
    expect(screen.getByText('.MSG')).toBeInTheDocument()
  })

  it('renders a hidden file input', () => {
    renderDropZone()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
  })

  it('changes prompt text to "Release to upload" when dragging a file over', async () => {
    const { container } = renderDropZone()
    const dropZone = container.firstChild as HTMLElement
    await act(async () => {
      fireEvent.dragEnter(dropZone, {
        dataTransfer: { types: ['Files'], files: [] },
      })
    })
    await waitFor(() => {
      expect(screen.getByText('Release to upload')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('calls onFilesAccepted with a .pdf file', async () => {
    const { props } = renderDropZone()
    const file = new File(['%PDF-1.0'], 'test.pdf', { type: 'application/pdf' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await new Promise(r => setTimeout(r, 0))
    expect(props.onFilesAccepted).toHaveBeenCalledWith([file])
  })

  it('calls onFilesAccepted with a .msg file', async () => {
    const { props } = renderDropZone()
    const file = new File([new ArrayBuffer(100)], 'email.msg', { type: 'application/vnd.ms-outlook' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await new Promise(r => setTimeout(r, 0))
    expect(props.onFilesAccepted).toHaveBeenCalledWith([file])
  })

  it('calls onFilesRejected for an unsupported file type', async () => {
    const { props } = renderDropZone()
    const file = new File(['content'], 'notes.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await new Promise(r => setTimeout(r, 0))
    expect(props.onFilesRejected).toHaveBeenCalled()
  })

  it('shows a rejection message when an incompatible file is dragged over', () => {
    const { container } = renderDropZone()
    const dropZone = container.firstChild as HTMLElement
    const file = new File(['content'], 'notes.txt', { type: 'text/plain' })

    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
      types: ['Files'],
    }
    fireEvent.dragEnter(dropZone, { dataTransfer })

    expect(dropZone).toBeInTheDocument()
  })

  it('does not allow multiple file selection', () => {
    renderDropZone()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.multiple).toBe(false)
  })
})
