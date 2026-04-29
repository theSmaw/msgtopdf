describe('Upload flow — E2E', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  // ── PDF upload ────────────────────────────────────────────────────────

  it('shows the drop zone on page load', () => {
    cy.contains('Drop your file here').should('be.visible')
    cy.contains('.PDF').should('be.visible')
    cy.contains('.MSG').should('be.visible')
  })

  it('uploads a PDF and shows the preview with the correct filename', () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from(
          '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]>>endobj\nxref\n0 4\n0000000000 65535 f \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n%%EOF'
        ),
        fileName: 'sample.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    )
    cy.contains('sample.pdf', { timeout: 10000 }).should('be.visible')
    cy.get('iframe').should('exist')
  })

  it('shows a Download button after PDF upload', () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.0\n%%EOF'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    )
    cy.contains('Download', { timeout: 10000 }).should('be.visible')
  })

  it('shows a Replace button that resets back to the drop zone', () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.0\n%%EOF'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    )
    cy.contains('Replace', { timeout: 10000 }).click()
    cy.contains('Drop your file here').should('be.visible')
  })

  // ── MSG upload ────────────────────────────────────────────────────────

  it('shows conversion progress steps when uploading an MSG fixture', () => {
    // This test requires a valid MSG fixture at cypress/fixtures/emails/sample.msg
    // Generate it by running: npm run fixtures:create
    cy.fixture('emails/sample.msg', 'binary').then((msgBinary) => {
      const msgBuffer = Cypress.Buffer.from(msgBinary, 'binary')
      cy.get('input[type="file"]').selectFile(
        { contents: msgBuffer, fileName: 'sample.msg', mimeType: 'application/vnd.ms-outlook' },
        { force: true }
      )
      // Should show either progress or preview (conversion may be fast)
      cy.get('[class*="card"]', { timeout: 15000 }).should('exist')
    })
  })

  it('shows the "Converted to PDF" badge after MSG conversion', () => {
    cy.fixture('emails/sample.msg', 'binary').then((msgBinary) => {
      const msgBuffer = Cypress.Buffer.from(msgBinary, 'binary')
      cy.get('input[type="file"]').selectFile(
        { contents: msgBuffer, fileName: 'newsletter.msg', mimeType: 'application/vnd.ms-outlook' },
        { force: true }
      )
      cy.contains('Converted to PDF', { timeout: 30000 }).should('be.visible')
    })
  })

  // ── Rejection / error states ──────────────────────────────────────────

  it('shows an error when a .docx file is dropped', () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('PK fake docx content'),
        fileName: 'report.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      { force: true }
    )
    // The drop zone validator rejects it and the container dispatches onFilesRejected
    cy.contains('Only .pdf and .msg files are accepted.', { timeout: 5000 }).should('be.visible')
  })

  it('shows the error state with a Try again button on rejection', () => {
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('fake data'),
        fileName: 'image.jpg',
        mimeType: 'image/jpeg',
      },
      { force: true }
    )
    cy.contains('Try again', { timeout: 5000 }).click()
    cy.contains('Drop your file here').should('be.visible')
  })
})
