import { AxiosError } from 'axios'
import { toast } from 'sonner'
import type { ApiResponse, ClientHandledError } from './http-client'

export function handleServerError(error: unknown) {
  if (error && typeof error === 'object' && '__handledByHttpClient' in error) {
    const handled = error as ClientHandledError
    if (handled.__handledByHttpClient) {
      return
    }
  }

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse<unknown> | undefined
    errMsg = data?.message || error.message || errMsg
  } else if (error instanceof Error) {
    errMsg = error.message || errMsg
  }

  toast.error(errMsg)
}
