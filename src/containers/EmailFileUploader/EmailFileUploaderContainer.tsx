import { useState } from 'react'
import { Provider } from 'react-redux'
import { createEmailUploadStore } from '../../stores/emailUpload/storeCreator'
import { EmailFileUploaderInner } from './EmailFileUploaderInner'

export interface EmailFileUploaderProps {
  onFileReady?: (blob: Blob, filename: string) => void
  maxSizeMB?: number
  className?: string
}

export function EmailFileUploader({ onFileReady, maxSizeMB = 25, className }: EmailFileUploaderProps) {
  const [store] = useState(() => createEmailUploadStore())

  return (
    <Provider store={store}>
      <EmailFileUploaderInner onFileReady={onFileReady} maxSizeMB={maxSizeMB} className={className} />
    </Provider>
  )
}
