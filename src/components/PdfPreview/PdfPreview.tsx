import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FileIcon } from '../FileIcon/FileIcon'
import { ArrowRightIcon } from '../ArrowRightIcon/ArrowRightIcon'
import styles from './PdfPreview.module.css'

function PreviewIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

interface PdfPreviewModalProps {
  pdfUrl: string
  displayName: string
  onClose: () => void
}

function PdfPreviewModal({ pdfUrl, displayName, onClose }: PdfPreviewModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className={styles.modalBackdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label="PDF preview">
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalFileName}>{displayName}</span>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>
        <iframe
          src={`${pdfUrl}#toolbar=0`}
          title="PDF preview"
          className={styles.modalFrame}
        />
      </div>
    </div>,
    document.body
  )
}

interface PdfPreviewProps {
  pdfUrl: string
  wasConverted: boolean
  originalFileName: string
  originalFileSize: number
  onReplace: () => void
  droppedAttachments: string[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PdfPreview({ pdfUrl, wasConverted, originalFileName, originalFileSize, onReplace, droppedAttachments }: PdfPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const displayName = wasConverted ? originalFileName.replace(/\.msg$/i, '.pdf') : originalFileName

  return (
    <>
      <div className={styles.card}>
        <div className={styles.bar}>
          <div className={styles.fileRow}>
            <span className={styles.fileIconWrap}><FileIcon /></span>
            <span className={styles.fileName}>{displayName}</span>
            {wasConverted && (
              <>
                <span className={styles.arrowWrap}><ArrowRightIcon /></span>
                <span className={styles.convertedBadge}>Converted to PDF</span>
              </>
            )}
            <span className={styles.fileSize}>{formatFileSize(originalFileSize)}</span>
          </div>
          <div className={styles.barActions}>
            <button
              type="button"
              className={styles.previewBtn}
              onClick={() => setPreviewOpen(true)}
            >
              <PreviewIcon />
              Preview
            </button>
            <button type="button" onClick={onReplace} className={styles.replaceBtn} aria-label="Replace file">
              <TrashIcon />
            </button>
          </div>
        </div>
        {droppedAttachments.length > 0 && (
          <div className={styles.attachmentNotice}>
            <span className={styles.noticeIcon}>⚠</span>
            <span className={styles.noticeText}>
              {droppedAttachments.length === 1
                ? `1 attachment not included in PDF: ${droppedAttachments[0]}`
                : `${droppedAttachments.length} attachments not included in PDF: ${droppedAttachments.join(', ')}`}
            </span>
          </div>
        )}
      </div>

      {previewOpen && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          displayName={displayName}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}
