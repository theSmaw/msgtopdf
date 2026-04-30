export type UploadStatus = 'idle' | 'parsing' | 'converting' | 'ready' | 'error';

export type EmailUploadState = {
  status: UploadStatus;
  pdfUrl: string | null;
  wasConverted: boolean;
  originalFileName: string | null;
  originalFileSize: number | null;
  errorMessage: string | null;
  droppedAttachments: string[];
}

type SetResultPayload = {
  pdfUrl: string;
  wasConverted: boolean;
  originalFileName: string;
  originalFileSize: number;
  droppedAttachments: string[];
}

export type EmailUploadAction =
  | { type: 'STATUS_CHANGED'; payload: 'parsing' | 'converting' }
  | { type: 'FILE_PROCESSED'; payload: SetResultPayload }
  | { type: 'PROCESSING_FAILED'; payload: string }
  | { type: 'FILE_CLEARED' };

export const initialEmailUploadState: EmailUploadState = {
  status: 'idle',
  pdfUrl: null,
  wasConverted: false,
  originalFileName: null,
  originalFileSize: null,
  errorMessage: null,
  droppedAttachments: [],
};

export function emailUploadReducer(
  state: EmailUploadState,
  action: EmailUploadAction,
): EmailUploadState {
  switch (action.type) {
    case 'STATUS_CHANGED':
      return { ...state, status: action.payload };
    case 'FILE_PROCESSED':
      return { ...state, status: 'ready', errorMessage: null, ...action.payload };
    case 'PROCESSING_FAILED':
      return { ...state, status: 'error', errorMessage: action.payload };
    case 'FILE_CLEARED':
      return initialEmailUploadState;
  }
}
