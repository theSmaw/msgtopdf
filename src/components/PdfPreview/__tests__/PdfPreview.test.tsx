import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PdfPreview } from '../PdfPreview'

function renderPreview(overrides: Partial<Parameters<typeof PdfPreview>[0]> = {}) {
  const props = {
    pdfUrl: 'blob:http://localhost/test-pdf',
    wasConverted: false,
    originalFileName: 'document.pdf',
    originalFileSize: 102400,
    onReplace: vi.fn(),
    droppedAttachments: [] as string[],
    ...overrides,
  }
  return { ...render(<PdfPreview {...props} />), props }
}

describe('PdfPreview', () => {
  it('renders the PDF filename', () => {
    renderPreview({ originalFileName: 'report.pdf' })
    expect(screen.getByText('report.pdf')).toBeInTheDocument()
  })

  it('renders the converted filename (.msg → .pdf) when wasConverted', () => {
    renderPreview({ wasConverted: true, originalFileName: 'email.msg' })
    expect(screen.getByText('email.pdf')).toBeInTheDocument()
  })

  it('shows "Converted to PDF" badge when wasConverted is true', () => {
    renderPreview({ wasConverted: true, originalFileName: 'email.msg' })
    expect(screen.getByText('Converted to PDF')).toBeInTheDocument()
  })

  it('does not show the converted badge for a direct PDF upload', () => {
    renderPreview({ wasConverted: false, originalFileName: 'report.pdf' })
    expect(screen.queryByText('Converted to PDF')).not.toBeInTheDocument()
  })

  it('shows formatted file size in KB', () => {
    renderPreview({ originalFileSize: 51200 })
    expect(screen.getByText('50.0 KB')).toBeInTheDocument()
  })

  it('shows formatted file size in MB', () => {
    renderPreview({ originalFileSize: 2 * 1024 * 1024 })
    expect(screen.getByText('2.0 MB')).toBeInTheDocument()
  })

  it('shows formatted file size in bytes for very small files', () => {
    renderPreview({ originalFileSize: 512 })
    expect(screen.getByText('512 B')).toBeInTheDocument()
  })

  it('renders no inline iframe (PDF only shown in modal)', () => {
    renderPreview()
    expect(document.querySelector('iframe')).not.toBeInTheDocument()
  })

  it('does not set a sandbox attribute on the iframe (would block Chrome PDF viewer)', async () => {
    renderPreview()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    expect(iframe).not.toHaveAttribute('sandbox')
  })

  it('renders a Preview button', () => {
    renderPreview()
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument()
  })

  it('renders the trash button for replacing the file', () => {
    renderPreview()
    expect(screen.getByRole('button', { name: /replace file/i })).toBeInTheDocument()
  })

  it('calls onReplace when the trash button is clicked', async () => {
    const { props } = renderPreview()
    await userEvent.click(screen.getByRole('button', { name: /replace file/i }))
    expect(props.onReplace).toHaveBeenCalledOnce()
  })

  it('clicking Preview opens the PDF preview modal', async () => {
    renderPreview({ pdfUrl: 'blob:http://localhost/my-pdf' })
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    expect(screen.getByRole('dialog', { name: /pdf preview/i })).toBeInTheDocument()
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    expect(iframe.src).toContain('blob:http://localhost/my-pdf')
  })

  it('the modal iframe uses #toolbar=0 to hide PDF edit controls', async () => {
    renderPreview({ pdfUrl: 'blob:http://localhost/my-pdf' })
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    expect(iframe.src).toBe('blob:http://localhost/my-pdf#toolbar=0')
  })

  it('pressing Escape closes the preview modal', async () => {
    renderPreview()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking the close button dismisses the preview modal', async () => {
    renderPreview()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    await userEvent.click(screen.getByRole('button', { name: /close preview/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking the backdrop dismisses the preview modal', async () => {
    renderPreview()
    await userEvent.click(screen.getByRole('button', { name: /preview/i }))
    const backdrop = screen.getByRole('dialog', { name: /pdf preview/i })
    await userEvent.click(backdrop)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // ── Dropped attachments notice ────────────────────────────────────

  it('shows no attachment notice when droppedAttachments is empty', () => {
    renderPreview({ droppedAttachments: [] })
    expect(screen.queryByText(/not included in PDF/i)).not.toBeInTheDocument()
  })

  it('shows a singular notice for one dropped attachment', () => {
    renderPreview({ droppedAttachments: ['report.pdf'] })
    expect(screen.getByText(/1 attachment not included in PDF: report\.pdf/i)).toBeInTheDocument()
  })

  it('shows a plural notice listing all dropped attachments', () => {
    renderPreview({ droppedAttachments: ['report.pdf', 'invoice.xlsx'] })
    expect(screen.getByText(/2 attachments not included in PDF: report\.pdf, invoice\.xlsx/i)).toBeInTheDocument()
  })

  it('shows an arrow icon when wasConverted', () => {
    const { container } = renderPreview({ wasConverted: true, originalFileName: 'email.msg' })
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })
})
