import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '../../stores/emailUpload/storeCreator'
import {
  selectUploadStatus,
  selectPdfUrl,
  selectWasConverted,
  selectOriginalFileName,
  selectOriginalFileSize,
  selectErrorMessage,
  selectDroppedAttachments,
} from '../../stores/emailUpload/selectors'
import { processUploadedFile } from '../../stores/emailUpload/thunks'
import { emailUploadSlice } from '../../stores/emailUpload/slice'
import { DropZone } from '../../components/DropZone/DropZone'
import { ConversionProgress } from '../../components/ConversionProgress/ConversionProgress'
import { PdfPreview } from '../../components/PdfPreview/PdfPreview'
import { UploadError } from '../../components/UploadError/UploadError'

interface Props {
  onFileReady?: (blob: Blob, filename: string) => void
  maxSizeMB: number
  className?: string
}

export function EmailFileUploaderInner({ onFileReady, maxSizeMB, className }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const status = useSelector(selectUploadStatus)
  const pdfUrl = useSelector(selectPdfUrl)
  const wasConverted = useSelector(selectWasConverted)
  const originalFileName = useSelector(selectOriginalFileName)
  const originalFileSize = useSelector(selectOriginalFileSize)
  const errorMessage = useSelector(selectErrorMessage)
  const droppedAttachments = useSelector(selectDroppedAttachments)

  function handleFilesAccepted(files: File[]) {
    dispatch(processUploadedFile({ file: files[0], onFileReady, maxSizeMB }))
  }

  function handleFilesRejected() {
    dispatch(emailUploadSlice.actions.setError('Only .pdf and .msg files are accepted.'))
  }

  function handleReset() {
    dispatch(emailUploadSlice.actions.reset())
  }

  return (
    <div className={className}>
      {status === 'idle' && (
        <DropZone
          onFilesAccepted={handleFilesAccepted}
          onFilesRejected={handleFilesRejected}
          maxSizeMB={maxSizeMB}
        />
      )}
      {(status === 'parsing' || status === 'converting') && (
        <ConversionProgress status={status} />
      )}
      {status === 'ready' && pdfUrl && originalFileName && (
        <PdfPreview
          pdfUrl={pdfUrl}
          wasConverted={wasConverted}
          originalFileName={originalFileName}
          originalFileSize={originalFileSize ?? 0}
          droppedAttachments={droppedAttachments}
          onReplace={handleReset}
        />
      )}
      {status === 'error' && (
        <UploadError
          message={errorMessage ?? 'An unknown error occurred.'}
          onRetry={handleReset}
        />
      )}
    </div>
  )
}
