import { useReducer, useRef } from 'react';
import { emailUploadReducer, initialEmailUploadState } from './emailUploadReducer';
import { processUploadedFile } from './processUploadedFile';
import { EmailFileUploader } from '../../components/EmailFileUploader/EmailFileUploader';

export type EmailFileUploaderProps = {
  onFileReady?: (blob: Blob, filename: string) => void;
  maxSizeMB?: number;
};

export function EmailFileUploaderContainer({
  onFileReady,
  maxSizeMB = 15,
}: EmailFileUploaderProps) {
  const [state, dispatch] = useReducer(emailUploadReducer, initialEmailUploadState);
  const pdfUrlRef = useRef<string | null>(null);
  pdfUrlRef.current = state.pdfUrl;

  function handleFilesAccepted(files: File[]) {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
    }
    processUploadedFile(dispatch, files[0], maxSizeMB, onFileReady);
  }

  function handleFilesRejected() {
    dispatch({ type: 'PROCESSING_FAILED', payload: 'Only .pdf and .msg files are accepted.' });
  }

  function handleReset() {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
    }
    dispatch({ type: 'FILE_CLEARED' });
  }

  return (
    <EmailFileUploader
      state={state}
      onFilesAccepted={handleFilesAccepted}
      onFilesRejected={handleFilesRejected}
      onReset={handleReset}
      maxSizeMB={maxSizeMB}
    />
  );
}
