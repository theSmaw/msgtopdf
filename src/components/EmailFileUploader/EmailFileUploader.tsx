import type { EmailUploadState } from '../../containers/EmailFileUploader/emailUploadReducer';
import { DropZone } from '../DropZone/DropZone';
import { ConversionProgress } from '../ConversionProgress/ConversionProgress';
import { PdfPreview } from '../PdfPreview/PdfPreview';
import { UploadError } from '../UploadError/UploadError';

type Props = {
  state: EmailUploadState;
  onFilesAccepted: (files: File[]) => void;
  onFilesRejected: () => void;
  onReset: () => void;
  maxSizeMB: number;
};

export function EmailFileUploader({
  state,
  onFilesAccepted,
  onFilesRejected,
  onReset,
  maxSizeMB,
}: Props) {
  const { status, pdfUrl, wasConverted, originalFileName, originalFileSize, errorMessage, droppedAttachments } =
    state;

  return (
    <div>
      {status === 'idle' && (
        <DropZone onFilesAccepted={onFilesAccepted} onFilesRejected={onFilesRejected} maxSizeMB={maxSizeMB} />
      )}
      {(status === 'parsing' || status === 'converting') && <ConversionProgress status={status} />}
      {status === 'ready' && pdfUrl && originalFileName && (
        <PdfPreview
          pdfUrl={pdfUrl}
          wasConverted={wasConverted}
          originalFileName={originalFileName}
          originalFileSize={originalFileSize ?? 0}
          droppedAttachments={droppedAttachments}
          onReplace={onReset}
        />
      )}
      {status === 'error' && (
        <UploadError message={errorMessage ?? 'An unknown error occurred.'} onRetry={onReset} />
      )}
    </div>
  );
}
