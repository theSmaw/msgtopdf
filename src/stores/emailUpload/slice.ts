import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UploadStatus } from '../../domain/emailUpload'

export interface EmailUploadState {
  status: UploadStatus
  pdfUrl: string | null
  wasConverted: boolean
  originalFileName: string | null
  originalFileSize: number | null
  errorMessage: string | null
  droppedAttachments: string[]
}

interface SetResultPayload {
  pdfUrl: string
  wasConverted: boolean
  originalFileName: string
  originalFileSize: number
  droppedAttachments: string[]
}

const initialState: EmailUploadState = {
  status: 'idle',
  pdfUrl: null,
  wasConverted: false,
  originalFileName: null,
  originalFileSize: null,
  errorMessage: null,
  droppedAttachments: [],
}

export const emailUploadSlice = createSlice({
  name: 'emailUpload',
  initialState,
  reducers: {
    reset: () => initialState,
    setStatus: (state, action: PayloadAction<UploadStatus>) => {
      state.status = action.payload
    },
    setResult: (state, action: PayloadAction<SetResultPayload>) => {
      state.status = 'ready'
      state.pdfUrl = action.payload.pdfUrl
      state.wasConverted = action.payload.wasConverted
      state.originalFileName = action.payload.originalFileName
      state.originalFileSize = action.payload.originalFileSize
      state.droppedAttachments = action.payload.droppedAttachments
      state.errorMessage = null
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = 'error'
      state.errorMessage = action.payload
    },
  },
})
