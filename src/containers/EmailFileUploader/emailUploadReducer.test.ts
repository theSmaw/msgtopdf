import { describe, it, expect } from 'vitest';
import {
  emailUploadReducer,
  initialEmailUploadState,
  type EmailUploadState,
} from './emailUploadReducer';

const readyState: EmailUploadState = {
  status: 'ready',
  pdfUrl: 'blob:http://localhost/test',
  wasConverted: true,
  originalFileName: 'email.msg',
  originalFileSize: 12345,
  errorMessage: null,
  droppedAttachments: [],
};

describe('emailUploadReducer', () => {
  describe('FILE_CLEARED', () => {
    it('resets from ready state back to initial', () => {
      expect(emailUploadReducer(readyState, { type: 'FILE_CLEARED' })).toEqual(initialEmailUploadState);
    });

    it('resets from error state back to initial', () => {
      const errorState: EmailUploadState = { ...initialEmailUploadState, status: 'error', errorMessage: 'oops' };
      expect(emailUploadReducer(errorState, { type: 'FILE_CLEARED' })).toEqual(initialEmailUploadState);
    });

    it('resets from parsing state back to initial', () => {
      const parsingState: EmailUploadState = { ...initialEmailUploadState, status: 'parsing' };
      expect(emailUploadReducer(parsingState, { type: 'FILE_CLEARED' })).toEqual(initialEmailUploadState);
    });
  });

  describe('STATUS_CHANGED', () => {
    it('sets status to parsing', () => {
      expect(emailUploadReducer(initialEmailUploadState, { type: 'STATUS_CHANGED', payload: 'parsing' }).status).toBe('parsing');
    });

    it('sets status to converting', () => {
      expect(emailUploadReducer(initialEmailUploadState, { type: 'STATUS_CHANGED', payload: 'converting' }).status).toBe('converting');
    });

    it('does not modify other state fields', () => {
      const result = emailUploadReducer(initialEmailUploadState, { type: 'STATUS_CHANGED', payload: 'parsing' });
      const { status: _s, ...rest } = result;
      const { status: _is, ...initRest } = initialEmailUploadState;
      expect(rest).toEqual(initRest);
    });
  });

  describe('FILE_PROCESSED', () => {
    const payload = {
      pdfUrl: 'blob:http://localhost/pdf',
      wasConverted: false,
      originalFileName: 'document.pdf',
      originalFileSize: 54321,
      droppedAttachments: [],
    };

    it('sets status to ready', () => {
      expect(emailUploadReducer(initialEmailUploadState, { type: 'FILE_PROCESSED', payload }).status).toBe('ready');
    });

    it('stores all result fields', () => {
      const result = emailUploadReducer(initialEmailUploadState, { type: 'FILE_PROCESSED', payload });
      expect(result.pdfUrl).toBe(payload.pdfUrl);
      expect(result.wasConverted).toBe(false);
      expect(result.originalFileName).toBe('document.pdf');
      expect(result.originalFileSize).toBe(54321);
    });

    it('clears errorMessage when result is set', () => {
      const errorState: EmailUploadState = { ...initialEmailUploadState, status: 'error', errorMessage: 'previous error' };
      const result = emailUploadReducer(errorState, { type: 'FILE_PROCESSED', payload });
      expect(result.errorMessage).toBeNull();
    });

    it('sets wasConverted=true for MSG conversion', () => {
      const result = emailUploadReducer(initialEmailUploadState, {
        type: 'FILE_PROCESSED',
        payload: { ...payload, wasConverted: true, originalFileName: 'email.msg' },
      });
      expect(result.wasConverted).toBe(true);
    });
  });

  describe('PROCESSING_FAILED', () => {
    it('sets status to error', () => {
      expect(emailUploadReducer(initialEmailUploadState, { type: 'PROCESSING_FAILED', payload: 'oops' }).status).toBe('error');
    });

    it('stores the error message', () => {
      expect(emailUploadReducer(initialEmailUploadState, { type: 'PROCESSING_FAILED', payload: 'Invalid MSG format' }).errorMessage).toBe('Invalid MSG format');
    });

    it('sets error from converting state', () => {
      const convertingState: EmailUploadState = { ...initialEmailUploadState, status: 'converting' };
      const result = emailUploadReducer(convertingState, { type: 'PROCESSING_FAILED', payload: 'html2canvas failed' });
      expect(result.status).toBe('error');
      expect(result.errorMessage).toBe('html2canvas failed');
    });
  });
});
