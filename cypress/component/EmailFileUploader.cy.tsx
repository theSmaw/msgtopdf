import { Provider } from 'react-redux'
import { createEmailUploadStore } from '../../src/stores/emailUpload/storeCreator'
import { emailUploadSlice } from '../../src/stores/emailUpload/slice'
import { EmailFileUploaderInner } from '../../src/containers/EmailFileUploader/EmailFileUploaderInner'

function mountWithStore(state?: Parameters<typeof emailUploadSlice.actions.setResult>[0]) {
  const store = createEmailUploadStore()
  if (state) store.dispatch(emailUploadSlice.actions.setResult(state))
  cy.mount(
    <Provider store={store}>
      <EmailFileUploaderInner maxSizeMB={25} />
    </Provider>
  )
  return store
}

describe('EmailFileUploader state machine', () => {
  it('renders the DropZone in the initial idle state', () => {
    const store = createEmailUploadStore()
    cy.mount(
      <Provider store={store}>
        <EmailFileUploaderInner maxSizeMB={25} />
      </Provider>
    )
    cy.contains('Drop your file here').should('be.visible')
  })

  it('renders ConversionProgress in the parsing state', () => {
    const store = createEmailUploadStore()
    store.dispatch(emailUploadSlice.actions.setStatus('parsing'))
    cy.mount(
      <Provider store={store}>
        <EmailFileUploaderInner maxSizeMB={25} />
      </Provider>
    )
    cy.contains('Reading email…').should('be.visible')
  })

  it('renders ConversionProgress in the converting state', () => {
    const store = createEmailUploadStore()
    store.dispatch(emailUploadSlice.actions.setStatus('converting'))
    cy.mount(
      <Provider store={store}>
        <EmailFileUploaderInner maxSizeMB={25} />
      </Provider>
    )
    cy.contains('Converting to PDF…').should('be.visible')
  })

  it('renders PdfPreview in the ready state (direct PDF upload)', () => {
    mountWithStore({
      pdfUrl: 'blob:http://localhost/test',
      wasConverted: false,
      originalFileName: 'report.pdf',
      originalFileSize: 102400,
    })
    cy.contains('report.pdf').should('be.visible')
    cy.contains('Converted to PDF').should('not.exist')
  })

  it('renders PdfPreview with "Converted to PDF" badge for MSG files', () => {
    mountWithStore({
      pdfUrl: 'blob:http://localhost/test',
      wasConverted: true,
      originalFileName: 'email.msg',
      originalFileSize: 45000,
    })
    cy.contains('Converted to PDF').should('be.visible')
    cy.contains('email.pdf').should('be.visible')
  })

  it('renders UploadError in the error state', () => {
    const store = createEmailUploadStore()
    store.dispatch(emailUploadSlice.actions.setError('Invalid file format detected.'))
    cy.mount(
      <Provider store={store}>
        <EmailFileUploaderInner maxSizeMB={25} />
      </Provider>
    )
    cy.contains('Conversion failed').should('be.visible')
    cy.contains('Invalid file format detected.').should('be.visible')
  })

  it('resets to idle when Replace is clicked in the ready state', () => {
    mountWithStore({
      pdfUrl: 'blob:http://localhost/test',
      wasConverted: false,
      originalFileName: 'doc.pdf',
      originalFileSize: 1024,
    })
    cy.contains('Replace').click()
    cy.contains('Drop your file here').should('be.visible')
  })

  it('resets to idle when Try again is clicked in the error state', () => {
    const store = createEmailUploadStore()
    store.dispatch(emailUploadSlice.actions.setError('Parse error'))
    cy.mount(
      <Provider store={store}>
        <EmailFileUploaderInner maxSizeMB={25} />
      </Provider>
    )
    cy.contains('Try again').click()
    cy.contains('Drop your file here').should('be.visible')
  })

  it('shows the correct file size for MB-range files', () => {
    mountWithStore({
      pdfUrl: 'blob:http://localhost/test',
      wasConverted: false,
      originalFileName: 'large.pdf',
      originalFileSize: 3 * 1024 * 1024,
    })
    cy.contains('3.0 MB').should('be.visible')
  })
})
