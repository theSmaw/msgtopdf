import { EmailFileUploader } from './containers/EmailFileUploader/EmailFileUploaderContainer'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.page}>
      <EmailFileUploader
        maxSizeMB={25}
        onFileReady={(blob, filename) => {
          console.log('File ready:', filename, `(${(blob.size / 1024).toFixed(1)} KB)`)
        }}
      />
    </div>
  )
}
