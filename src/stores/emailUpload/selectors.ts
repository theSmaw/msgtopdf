import type { RootState } from './storeCreator'

export const selectUploadStatus = (state: RootState) => state.emailUpload.status
export const selectPdfUrl = (state: RootState) => state.emailUpload.pdfUrl
export const selectWasConverted = (state: RootState) => state.emailUpload.wasConverted
export const selectOriginalFileName = (state: RootState) => state.emailUpload.originalFileName
export const selectOriginalFileSize = (state: RootState) => state.emailUpload.originalFileSize
export const selectErrorMessage = (state: RootState) => state.emailUpload.errorMessage
export const selectDroppedAttachments = (state: RootState) => state.emailUpload.droppedAttachments
