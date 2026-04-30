import { EmailFileUploaderInner } from '../../src/containers/EmailFileUploader/EmailFileUploaderInner';
import {
  initialEmailUploadState,
  type EmailUploadState,
} from '../../src/containers/EmailFileUploader/emailUploadReducer';
import { EmailFileUploaderContainer } from '../../src/containers/EmailFileUploader/EmailFileUploaderContainer';

function mountWithState(overrides: Partial<EmailUploadState> = {}) {
  const state = { ...initialEmailUploadState, ...overrides };
  cy.mount(
    <EmailFileUploaderInner
      state={state}
      onFilesAccepted={cy.stub()}
      onFilesRejected={cy.stub()}
      onReset={cy.stub()}
      maxSizeMB={25}
    />
  );
}

describe('EmailFileUploader state rendering', () => {
  it('renders the DropZone in the initial idle state', () => {
    mountWithState();
    cy.contains('Attach PDF or .msg email').should('be.visible');
  });

  it('renders ConversionProgress in the parsing state', () => {
    mountWithState({ status: 'parsing' });
    cy.contains('Reading email…').should('be.visible');
  });

  it('renders ConversionProgress in the converting state', () => {
    mountWithState({ status: 'converting' });
    cy.contains('Converting to PDF…').should('be.visible');
  });

  it('renders PdfPreview in the ready state for a direct PDF upload', () => {
    mountWithState({
      status: 'ready',
      pdfUrl: 'blob:http://localhost/test',
      wasConverted: false,
      originalFileName: 'report.pdf',
      originalFileSize: 102400,
    });
    cy.contains('report.pdf').should('be.visible');
    cy.contains('Converted to PDF').should('not.exist');
  });

  it('renders PdfPreview with "Converted to PDF" badge for a converted MSG file', () => {
    mountWithState({
      status: 'ready',
      pdfUrl: 'blob:http://localhost/test',
      wasConverted: true,
      originalFileName: 'email.msg',
      originalFileSize: 45000,
    });
    cy.contains('Converted to PDF').should('be.visible');
    cy.contains('email.pdf').should('be.visible');
  });

  it('renders UploadError in the error state', () => {
    mountWithState({ status: 'error', errorMessage: 'Invalid file format detected.' });
    cy.contains('Conversion failed').should('be.visible');
    cy.contains('Invalid file format detected.').should('be.visible');
  });

  it('shows the correct file size for MB-range files', () => {
    mountWithState({
      status: 'ready',
      pdfUrl: 'blob:http://localhost/test',
      wasConverted: false,
      originalFileName: 'large.pdf',
      originalFileSize: 3 * 1024 * 1024,
    });
    cy.contains('3.0 MB').should('be.visible');
  });
});

describe('EmailFileUploader file interaction', () => {
  it('transitions to ready state after a real PDF file is selected', () => {
    cy.mount(<EmailFileUploaderContainer maxSizeMB={25} />);
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.0\n%%EOF'),
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
    cy.contains('document.pdf', { timeout: 5000 }).should('be.visible');
  });

  it('shows the Download button after a PDF file is selected', () => {
    cy.mount(<EmailFileUploaderContainer maxSizeMB={25} />);
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.0\n%%EOF'),
        fileName: 'invoice.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
    cy.contains('Download', { timeout: 5000 }).should('be.visible');
  });

  it('shows the Preview button after a PDF file is selected', () => {
    cy.mount(<EmailFileUploaderContainer maxSizeMB={25} />);
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.0\n%%EOF'),
        fileName: 'invoice.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
    cy.contains('Preview', { timeout: 5000 }).should('be.visible');
  });

  it('shows the rejection error when an unsupported file type is dropped', () => {
    cy.mount(<EmailFileUploaderContainer maxSizeMB={25} />);
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('fake data'),
        fileName: 'report.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      { force: true }
    );
    cy.contains('Only .pdf and .msg files are accepted.', { timeout: 5000 }).should('be.visible');
  });

  it('resets to idle when the trash icon is clicked after a PDF upload', () => {
    cy.mount(<EmailFileUploaderContainer maxSizeMB={25} />);
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.0\n%%EOF'),
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
    cy.get('[aria-label="Replace file"]', { timeout: 5000 }).click();
    cy.contains('Attach PDF or .msg email').should('be.visible');
  });

  it('resets to idle when Try again is clicked after a rejection', () => {
    cy.mount(<EmailFileUploaderContainer maxSizeMB={25} />);
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('fake data'), fileName: 'image.jpg', mimeType: 'image/jpeg' },
      { force: true }
    );
    cy.contains('Try again', { timeout: 5000 }).click();
    cy.contains('Attach PDF or .msg email').should('be.visible');
  });

  it('can replace a file by clicking trash and selecting a new one', () => {
    cy.mount(<EmailFileUploaderContainer maxSizeMB={25} />);
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.0\n%%EOF'),
        fileName: 'old.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
    cy.get('[aria-label="Replace file"]', { timeout: 5000 }).click();
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.0\n%%EOF'),
        fileName: 'new.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
    cy.contains('new.pdf', { timeout: 5000 }).should('be.visible');
  });
});
