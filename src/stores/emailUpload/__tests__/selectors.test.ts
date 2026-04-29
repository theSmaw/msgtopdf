import { describe, it, expect } from 'vitest'
import {
  selectUploadStatus,
  selectPdfUrl,
  selectWasConverted,
  selectOriginalFileName,
  selectOriginalFileSize,
  selectErrorMessage,
  selectDroppedAttachments,
} from '../selectors'
import type { RootState } from '../storeCreator'

function makeState(overrides: Partial<RootState['emailUpload']> = {}): RootState {
  return {
    emailUpload: {
      status: 'idle',
      pdfUrl: null,
      wasConverted: false,
      originalFileName: null,
      originalFileSize: null,
      errorMessage: null,
      droppedAttachments: [],
      ...overrides,
    },
  }
}

describe('emailUpload selectors', () => {
  describe('selectUploadStatus', () => {
    it('returns idle', () => {
      expect(selectUploadStatus(makeState({ status: 'idle' }))).toBe('idle')
    })

    it('returns parsing', () => {
      expect(selectUploadStatus(makeState({ status: 'parsing' }))).toBe('parsing')
    })

    it('returns converting', () => {
      expect(selectUploadStatus(makeState({ status: 'converting' }))).toBe('converting')
    })

    it('returns ready', () => {
      expect(selectUploadStatus(makeState({ status: 'ready' }))).toBe('ready')
    })

    it('returns error', () => {
      expect(selectUploadStatus(makeState({ status: 'error' }))).toBe('error')
    })
  })

  describe('selectPdfUrl', () => {
    it('returns null when not set', () => {
      expect(selectPdfUrl(makeState())).toBeNull()
    })

    it('returns the blob URL when set', () => {
      expect(selectPdfUrl(makeState({ pdfUrl: 'blob:http://localhost/test' }))).toBe('blob:http://localhost/test')
    })
  })

  describe('selectWasConverted', () => {
    it('returns false by default', () => {
      expect(selectWasConverted(makeState())).toBe(false)
    })

    it('returns true when set', () => {
      expect(selectWasConverted(makeState({ wasConverted: true }))).toBe(true)
    })
  })

  describe('selectOriginalFileName', () => {
    it('returns null when not set', () => {
      expect(selectOriginalFileName(makeState())).toBeNull()
    })

    it('returns the file name when set', () => {
      expect(selectOriginalFileName(makeState({ originalFileName: 'email.msg' }))).toBe('email.msg')
    })
  })

  describe('selectOriginalFileSize', () => {
    it('returns null when not set', () => {
      expect(selectOriginalFileSize(makeState())).toBeNull()
    })

    it('returns the file size in bytes', () => {
      expect(selectOriginalFileSize(makeState({ originalFileSize: 98765 }))).toBe(98765)
    })
  })

  describe('selectErrorMessage', () => {
    it('returns null when not set', () => {
      expect(selectErrorMessage(makeState())).toBeNull()
    })

    it('returns the error message when set', () => {
      expect(selectErrorMessage(makeState({ errorMessage: 'Something went wrong' }))).toBe('Something went wrong')
    })
  })

  describe('selectDroppedAttachments', () => {
    it('returns empty array by default', () => {
      expect(selectDroppedAttachments(makeState())).toEqual([])
    })

    it('returns the list of dropped attachment filenames', () => {
      expect(selectDroppedAttachments(makeState({ droppedAttachments: ['report.pdf', 'invoice.xlsx'] }))).toEqual(['report.pdf', 'invoice.xlsx'])
    })
  })
})
