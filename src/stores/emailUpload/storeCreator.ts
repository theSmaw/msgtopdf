import { configureStore } from '@reduxjs/toolkit'
import { emailUploadSlice } from './slice'

export function createEmailUploadStore() {
  return configureStore({
    reducer: { emailUpload: emailUploadSlice.reducer },
  })
}

export type EmailUploadStore = ReturnType<typeof createEmailUploadStore>
export type RootState = ReturnType<EmailUploadStore['getState']>
export type AppDispatch = EmailUploadStore['dispatch']
