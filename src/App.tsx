import { EmailFileUploader } from './containers/EmailFileUploader/EmailFileUploaderContainer'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.page}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Client instruction</h2>
          <button className={styles.closeBtn} aria-label="Close">✕</button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>Channels</label>
          <div className={styles.selectField}>
            <span>Email</span>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={styles.divider} />

          <EmailFileUploader
            maxSizeMB={25}
            onFileReady={(blob, filename) => {
              console.log('File ready:', filename, `(${(blob.size / 1024).toFixed(1)} KB)`)
            }}
          />

          <div className={styles.divider} />

          <div className={styles.dateRow}>
            <div className={styles.dateField}>
              <label className={styles.fieldLabel}>Evidence date</label>
              <div className={styles.inputField}>
                <span className={styles.placeholder}>DD.MM.YYYY</span>
                <span className={styles.inputIcon}>📅</span>
              </div>
            </div>
            <div className={styles.timeField}>
              <label className={styles.fieldLabel}>Time (optional)</label>
              <div className={styles.inputField}>
                <span className={styles.placeholder}>HH:mm</span>
                <span className={styles.inputIcon}>🕐</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.updateBtn}>Update</button>
          <button className={styles.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
