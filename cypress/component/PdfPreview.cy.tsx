import { PdfPreview } from '../../src/components/PdfPreview/PdfPreview'

const BLOB_URL = 'blob:http://localhost/preview-test'

describe('PdfPreview', () => {
  it('renders the filename', () => {
    cy.mount(
      <PdfPreview
        pdfUrl={BLOB_URL}
        wasConverted={false}
        originalFileName="report.pdf"
        originalFileSize={102400}
        onReplace={cy.stub()}
      />
    )
    cy.contains('report.pdf').should('be.visible')
  })

  it('shows .pdf filename when file was converted from .msg', () => {
    cy.mount(
      <PdfPreview
        pdfUrl={BLOB_URL}
        wasConverted={true}
        originalFileName="invoice.msg"
        originalFileSize={45000}
        onReplace={cy.stub()}
      />
    )
    cy.contains('invoice.pdf').should('be.visible')
  })

  it('shows "Converted to PDF" badge when wasConverted', () => {
    cy.mount(
      <PdfPreview
        pdfUrl={BLOB_URL}
        wasConverted={true}
        originalFileName="email.msg"
        originalFileSize={12345}
        onReplace={cy.stub()}
      />
    )
    cy.contains('Converted to PDF').should('be.visible')
  })

  it('does not show the badge when wasConverted is false', () => {
    cy.mount(
      <PdfPreview
        pdfUrl={BLOB_URL}
        wasConverted={false}
        originalFileName="document.pdf"
        originalFileSize={99999}
        onReplace={cy.stub()}
      />
    )
    cy.contains('Converted to PDF').should('not.exist')
  })

  it('shows the file size formatted in KB', () => {
    cy.mount(
      <PdfPreview
        pdfUrl={BLOB_URL}
        wasConverted={false}
        originalFileName="doc.pdf"
        originalFileSize={51200}
        onReplace={cy.stub()}
      />
    )
    cy.contains('50.0 KB').should('be.visible')
  })

  it('calls onReplace when Replace button is clicked', () => {
    const onReplace = cy.stub().as('onReplace')
    cy.mount(
      <PdfPreview
        pdfUrl={BLOB_URL}
        wasConverted={false}
        originalFileName="doc.pdf"
        originalFileSize={1024}
        onReplace={onReplace}
      />
    )
    cy.contains('Replace').click()
    cy.get('@onReplace').should('have.been.calledOnce')
  })

  it('renders the Download link pointing to the PDF URL', () => {
    cy.mount(
      <PdfPreview
        pdfUrl={BLOB_URL}
        wasConverted={false}
        originalFileName="doc.pdf"
        originalFileSize={1024}
        onReplace={cy.stub()}
      />
    )
    cy.contains('Download').should('have.attr', 'href', BLOB_URL)
  })

  it('renders an iframe for the PDF preview', () => {
    cy.mount(
      <PdfPreview
        pdfUrl={BLOB_URL}
        wasConverted={false}
        originalFileName="doc.pdf"
        originalFileSize={1024}
        onReplace={cy.stub()}
      />
    )
    cy.get('iframe').should('exist')
  })
})
