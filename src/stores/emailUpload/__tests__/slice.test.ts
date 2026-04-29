import { describe, it, expect } from 'vitest'
import { emailUploadSlice, type EmailUploadState } from '../slice'

const { reset, setStatus, setResult, setError } = emailUploadSlice.actions
const reducer = emailUploadSlice.reducer

const initialState: EmailUploadState = {
  status: 'idle',
  pdfUrl: null,
  wasConverted: false,
  originalFileName: null,
  originalFileSize: null,
  errorMessage: null,
  droppedAttachments: [],
}

const readyState: EmailUploadState = {
  status: 'ready',
  pdfUrl: 'blob:http://localhost/test',
  wasConverted: true,
  originalFileName: 'email.msg',
  originalFileSize: 12345,
  errorMessage: null,
  droppedAttachments: [],
}

describe('emailUploadSlice', () => {
  describe('initial state', () => {
    it('has the correct initial state', () => {
      expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState)
    })
  })

  describe('reset', () => {
    it('resets from ready state back to initial', () => {
      expect(reducer(readyState, reset())).toEqual(initialState)
    })

    it('resets from error state back to initial', () => {
      const errorState: EmailUploadState = { ...initialState, status: 'error', errorMessage: 'oops' }
      expect(reducer(errorState, reset())).toEqual(initialState)
    })

    it('resets from parsing state back to initial', () => {
      const parsingState: EmailUploadState = { ...initialState, status: 'parsing' }
      expect(reducer(parsingState, reset())).toEqual(initialState)
    })
  })

  describe('setStatus', () => {
    it('sets status to parsing', () => {
      const result = reducer(initialState, setStatus('parsing'))
      expect(result.status).toBe('parsing')
    })

    it('sets status to converting', () => {
      const result = reducer(initialState, setStatus('converting'))
      expect(result.status).toBe('converting')
    })

    it('sets status to ready', () => {
      const result = reducer(initialState, setStatus('ready'))
      expect(result.status).toBe('ready')
    })

    it('sets status to error', () => {
      const result = reducer(initialState, setStatus('error'))
      expect(result.status).toBe('error')
    })

    it('does not modify other state fields', () => {
      const result = reducer(initialState, setStatus('parsing'))
      const { status: _status, ...rest } = result
      const { status: _initStatus, ...initRest } = initialState
      expect(rest).toEqual(initRest)
    })
  })

  describe('setResult', () => {
    it('sets status to ready', () => {
      const result = reducer(initialState, setResult({
        pdfUrl: 'blob:http://localhost/pdf',
        wasConverted: true,
        originalFileName: 'test.msg',
        originalFileSize: 99999,
        droppedAttachments: [],
      }))
      expect(result.status).toBe('ready')
    })

    it('stores pdfUrl, wasConverted, originalFileName, originalFileSize', () => {
      const result = reducer(initialState, setResult({
        pdfUrl: 'blob:http://localhost/pdf',
        wasConverted: false,
        originalFileName: 'document.pdf',
        originalFileSize: 54321,
        droppedAttachments: [],
      }))
      expect(result.pdfUrl).toBe('blob:http://localhost/pdf')
      expect(result.wasConverted).toBe(false)
      expect(result.originalFileName).toBe('document.pdf')
      expect(result.originalFileSize).toBe(54321)
    })

    it('clears errorMessage when result is set', () => {
      const errorState: EmailUploadState = { ...initialState, status: 'error', errorMessage: 'previous error' }
      const result = reducer(errorState, setResult({
        pdfUrl: 'blob:http://localhost/pdf',
        wasConverted: false,
        originalFileName: 'doc.pdf',
        originalFileSize: 100,
        droppedAttachments: [],
      }))
      expect(result.errorMessage).toBeNull()
    })

    it('sets wasConverted=true for MSG→PDF conversion', () => {
      const result = reducer(initialState, setResult({
        pdfUrl: 'blob:http://localhost/pdf',
        wasConverted: true,
        originalFileName: 'email.msg',
        originalFileSize: 8000,
        droppedAttachments: [],
      }))
      expect(result.wasConverted).toBe(true)
    })

    it('sets wasConverted=false for direct PDF upload', () => {
      const result = reducer(initialState, setResult({
        pdfUrl: 'blob:http://localhost/pdf',
        wasConverted: false,
        originalFileName: 'report.pdf',
        originalFileSize: 200000,
        droppedAttachments: [],
      }))
      expect(result.wasConverted).toBe(false)
    })
  })

  describe('setError', () => {
    it('sets status to error', () => {
      const result = reducer(initialState, setError('something went wrong'))
      expect(result.status).toBe('error')
    })

    it('stores the error message', () => {
      const result = reducer(initialState, setError('Invalid MSG format'))
      expect(result.errorMessage).toBe('Invalid MSG format')
    })

    it('sets error from converting state', () => {
      const convertingState: EmailUploadState = { ...initialState, status: 'converting' }
      const result = reducer(convertingState, setError('html2canvas failed'))
      expect(result.status).toBe('error')
      expect(result.errorMessage).toBe('html2canvas failed')
    })

    it('sets error from parsing state', () => {
      const parsingState: EmailUploadState = { ...initialState, status: 'parsing' }
      const result = reducer(parsingState, setError('Corrupt MSG file'))
      expect(result.status).toBe('error')
      expect(result.errorMessage).toBe('Corrupt MSG file')
    })
  })
})
