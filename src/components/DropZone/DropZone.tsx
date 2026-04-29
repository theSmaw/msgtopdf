import { useDropzone } from 'react-dropzone'
import { UploadIcon } from '../UploadIcon/UploadIcon'
import styles from './DropZone.module.css'

interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void
  onFilesRejected: () => void
  maxSizeMB: number
}

export function DropZone({ onFilesAccepted, onFilesRejected }: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop(acceptedFiles, fileRejections) {
      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles)
      } else if (fileRejections.length > 0) {
        onFilesRejected()
      }
    },
    validator(file) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      return ext === 'pdf' || ext === 'msg'
        ? null
        : { code: 'invalid-extension', message: 'Only .pdf and .msg files are accepted' }
    },
    maxFiles: 1,
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={`${styles.dropZone} ${isDragActive ? styles.dropZoneActive : ''} ${isDragReject ? styles.dropZoneReject : ''}`}
    >
      <input {...getInputProps()} />

      <div className={`${styles.iconWrap} ${isDragActive ? styles.iconWrapActive : ''}`}>
        <UploadIcon />
      </div>

      <p className={styles.dropTitle}>
        {isDragActive ? 'Release to upload' : 'Attach PDF or .msg email'}
      </p>
      <p className={styles.dropSub}>
        Drag & drop or <span className={styles.browseLink}>browse</span>
      </p>

      <div className={styles.typePill}>
        <span className={styles.typeLabel}>.PDF</span>
        <span className={styles.typeSep}>·</span>
        <span className={styles.typeLabel}>.MSG</span>
      </div>

      {isDragReject && (
        <p className={styles.rejectNote}>Only .pdf and .msg files are accepted</p>
      )}
    </div>
  )
}
