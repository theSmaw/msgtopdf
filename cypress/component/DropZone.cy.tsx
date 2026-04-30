import { DropZone } from '../../src/components/DropZone/DropZone'

describe('DropZone', () => {
  it('renders the idle drop prompt', () => {
    cy.mount(<DropZone onFilesAccepted={cy.stub()} onFilesRejected={cy.stub()} maxSizeMB={25} />)
    cy.contains('Attach PDF or .msg email').should('be.visible')
  })

  it('shows "Drag & drop or browse" subtitle', () => {
    cy.mount(<DropZone onFilesAccepted={cy.stub()} onFilesRejected={cy.stub()} maxSizeMB={25} />)
    cy.contains('Drag & drop or').should('be.visible')
    cy.contains('browse').should('be.visible')
  })

  it('shows both .PDF and .MSG type labels', () => {
    cy.mount(<DropZone onFilesAccepted={cy.stub()} onFilesRejected={cy.stub()} maxSizeMB={25} />)
    cy.contains('.PDF').should('be.visible')
    cy.contains('.MSG').should('be.visible')
  })

  it('calls onFilesAccepted when a .pdf file is selected', () => {
    const onFilesAccepted = cy.stub().as('onFilesAccepted')
    cy.mount(<DropZone onFilesAccepted={onFilesAccepted} onFilesRejected={cy.stub()} maxSizeMB={25} />)
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('%PDF-1.0'), fileName: 'test.pdf', mimeType: 'application/pdf' },
      { force: true }
    )
    cy.get('@onFilesAccepted').should('have.been.called')
  })

  it('calls onFilesAccepted when a .msg file is selected', () => {
    const onFilesAccepted = cy.stub().as('onFilesAccepted')
    cy.mount(<DropZone onFilesAccepted={onFilesAccepted} onFilesRejected={cy.stub()} maxSizeMB={25} />)
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('MSG data'), fileName: 'email.msg', mimeType: 'application/vnd.ms-outlook' },
      { force: true }
    )
    cy.get('@onFilesAccepted').should('have.been.called')
  })

  it('calls onFilesRejected when an unsupported file type is selected', () => {
    const onFilesRejected = cy.stub().as('onFilesRejected')
    cy.mount(<DropZone onFilesAccepted={cy.stub()} onFilesRejected={onFilesRejected} maxSizeMB={25} />)
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('text'), fileName: 'notes.txt', mimeType: 'text/plain' },
      { force: true }
    )
    cy.get('@onFilesRejected').should('have.been.called')
  })
})
