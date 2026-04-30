import { PdfPreview } from '../../src/components/PdfPreview/PdfPreview'

const BLOB_URL = 'blob:http://localhost/preview-test'

function mount(overrides: Partial<React.ComponentProps<typeof PdfPreview>> = {}) {
  cy.mount(
    <PdfPreview
      pdfUrl={BLOB_URL}
      wasConverted={false}
      originalFileName="doc.pdf"
      originalFileSize={1024}
      onReplace={cy.stub()}
      droppedAttachments={[]}
      {...overrides}
    />
  )
}

describe('PdfPreview', () => {
  it('renders the filename', () => {
    mount({ originalFileName: 'report.pdf' })
    cy.contains('report.pdf').should('be.visible')
  })

  it('shows .pdf filename when file was converted from .msg', () => {
    mount({ wasConverted: true, originalFileName: 'invoice.msg' })
    cy.contains('invoice.pdf').should('be.visible')
  })

  it('shows "Converted to PDF" badge when wasConverted is true', () => {
    mount({ wasConverted: true, originalFileName: 'email.msg' })
    cy.contains('Converted to PDF').should('be.visible')
  })

  it('does not show the badge when wasConverted is false', () => {
    mount({ wasConverted: false })
    cy.contains('Converted to PDF').should('not.exist')
  })

  it('shows the file size formatted in KB', () => {
    mount({ originalFileSize: 51200 })
    cy.contains('50.0 KB').should('be.visible')
  })

  it('shows the file size formatted in MB for large files', () => {
    mount({ originalFileSize: 3 * 1024 * 1024 })
    cy.contains('3.0 MB').should('be.visible')
  })

  it('calls onReplace when the trash icon button is clicked', () => {
    const onReplace = cy.stub().as('onReplace')
    mount({ onReplace })
    cy.get('[aria-label="Replace file"]').click()
    cy.get('@onReplace').should('have.been.calledOnce')
  })

  it('renders the Download link pointing to the PDF URL', () => {
    mount()
    cy.contains('Download').should('have.attr', 'href', BLOB_URL)
  })

  it('opens the PDF preview modal with an iframe when Preview is clicked', () => {
    mount()
    cy.contains('Preview').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('iframe').should('exist')
  })

  it('closes the preview modal when the close button is clicked', () => {
    mount()
    cy.contains('Preview').click()
    cy.get('[aria-label="Close preview"]').click()
    cy.get('[role="dialog"]').should('not.exist')
  })

  it('closes the preview modal when Escape is pressed', () => {
    mount()
    cy.contains('Preview').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('body').type('{esc}')
    cy.get('[role="dialog"]').should('not.exist')
  })

  it('shows a singular attachment warning when one attachment was dropped', () => {
    mount({ wasConverted: true, originalFileName: 'email.msg', droppedAttachments: ['budget.xlsx'] })
    cy.contains('1 attachment not included in PDF: budget.xlsx').should('be.visible')
  })

  it('shows a plural attachment warning when multiple attachments were dropped', () => {
    mount({ wasConverted: true, originalFileName: 'email.msg', droppedAttachments: ['report.pdf', 'invoice.xlsx'] })
    cy.contains('2 attachments not included in PDF').should('be.visible')
    cy.contains('report.pdf').should('be.visible')
    cy.contains('invoice.xlsx').should('be.visible')
  })

  it('does not show the attachment warning when droppedAttachments is empty', () => {
    mount({ droppedAttachments: [] })
    cy.contains('attachment').should('not.exist')
  })

  it('does not set a sandbox attribute on the iframe (would block Chrome PDF viewer)', () => {
    mount()
    cy.contains('Preview').click()
    cy.get('iframe').should('not.have.attr', 'sandbox')
  })

  it('appends #toolbar=0 to the iframe src to hide PDF controls', () => {
    mount({ pdfUrl: 'blob:http://localhost/my-pdf' })
    cy.contains('Preview').click()
    cy.get('iframe').should('have.attr', 'src', 'blob:http://localhost/my-pdf#toolbar=0')
  })
})
