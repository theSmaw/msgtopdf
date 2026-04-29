import styles from './UploadError.module.css'

interface UploadErrorProps {
  message: string
  onRetry: () => void
}

export function UploadError({ message, onRetry }: UploadErrorProps) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className={styles.body}>
        <p className={styles.title}>Conversion failed</p>
        <p className={styles.message}>{message}</p>
      </div>
      <button type="button" onClick={onRetry} className={styles.retryBtn}>
        Try again
      </button>
    </div>
  )
}
