import { parseMsgFile } from '../../parseMsgFile.ts';
import { convertEmailToPdf } from '../../convertEmailToPdf.ts';
import type { EmailUploadAction } from './emailUploadReducer';

type Dispatch = (action: EmailUploadAction) => void;

export async function processUploadedFile(
  dispatch: Dispatch,
  file: File,
  maxSizeMB: number,
  onFileReady?: (blob: Blob, filename: string) => void
): Promise<void> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext !== 'pdf' && ext !== 'msg') {
    dispatch({
      type: 'PROCESSING_FAILED',
      payload: `Unsupported file type ".${ext ?? 'unknown'}". Please upload a .msg or .pdf file.`,
    });
    return;
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    dispatch({
      type: 'PROCESSING_FAILED',
      payload: `File is too large. Maximum allowed size is ${maxSizeMB} MB.`,
    });
    return;
  }

  if (ext === 'pdf') {
    const pdfUrl = URL.createObjectURL(file);
    dispatch({
      type: 'FILE_PROCESSED',
      payload: {
        pdfUrl,
        wasConverted: false,
        originalFileName: file.name,
        originalFileSize: file.size,
        droppedAttachments: [],
      },
    });
    onFileReady?.(file, file.name);
    return;
  }

  try {
    dispatch({ type: 'STATUS_CHANGED', payload: 'parsing' });
    const email = await parseMsgFile(file);

    dispatch({ type: 'STATUS_CHANGED', payload: 'converting' });
    const pdfBlob = await convertEmailToPdf(email);

    const pdfUrl = URL.createObjectURL(pdfBlob);
    const pdfFilename = file.name.replace(/\.msg$/i, '.pdf');

    dispatch({
      type: 'FILE_PROCESSED',
      payload: {
        pdfUrl,
        wasConverted: true,
        originalFileName: file.name,
        originalFileSize: file.size,
        droppedAttachments: email.droppedAttachments,
      },
    });
    onFileReady?.(pdfBlob, pdfFilename);
  } catch (err) {
    dispatch({
      type: 'PROCESSING_FAILED',
      payload:
        err instanceof Error
          ? err.message
          : 'Failed to convert the .msg file. It may be corrupted or in an unsupported format.',
    });
  }
}
