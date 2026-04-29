import { createAsyncThunk } from '@reduxjs/toolkit'
import { parseMsgFile } from '../../api/parseMsgFile'
import { convertEmailToPdf } from '../../api/convertEmailToPdf'
import { emailUploadSlice } from './slice'

interface ProcessFileArgs {
  file: File
  onFileReady?: (blob: Blob, filename: string) => void
  maxSizeMB: number
}

export const processUploadedFile = createAsyncThunk(
  'emailUpload/processFile',
  async ({ file, onFileReady, maxSizeMB }: ProcessFileArgs, { dispatch }) => {
    const { setStatus, setResult, setError } = emailUploadSlice.actions

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext !== 'pdf' && ext !== 'msg') {
      dispatch(setError(`Unsupported file type ".${ext ?? 'unknown'}". Please upload a .msg or .pdf file.`))
      return
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      dispatch(setError(`File is too large. Maximum allowed size is ${maxSizeMB} MB.`))
      return
    }

    if (ext === 'pdf') {
      const pdfUrl = URL.createObjectURL(file)
      dispatch(setResult({
        pdfUrl,
        wasConverted: false,
        originalFileName: file.name,
        originalFileSize: file.size,
        droppedAttachments: [],
      }))
      onFileReady?.(file, file.name)
      return
    }

    try {
      dispatch(setStatus('parsing'))
      const email = await parseMsgFile(file)

      dispatch(setStatus('converting'))
      const pdfBlob = await convertEmailToPdf(email)

      const pdfUrl = URL.createObjectURL(pdfBlob)
      const pdfFilename = file.name.replace(/\.msg$/i, '.pdf')

      dispatch(setResult({
        pdfUrl,
        wasConverted: true,
        originalFileName: file.name,
        originalFileSize: file.size,
        droppedAttachments: email.droppedAttachments,
      }))
      onFileReady?.(pdfBlob, pdfFilename)
    } catch (err) {
      dispatch(setError(
        err instanceof Error
          ? err.message
          : 'Failed to convert the .msg file. It may be corrupted or in an unsupported format.'
      ))
    }
  }
)
