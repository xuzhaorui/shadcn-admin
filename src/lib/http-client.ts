import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import { toast } from 'sonner'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export type ClientHandledError = Error & { __handledByHttpClient?: boolean }
type AxiosHandledError = AxiosError<ApiResponse> & { __handledByHttpClient?: boolean }
type RetryableRequestConfig = AxiosRequestConfig & { __retried?: boolean }

const markHandled = <T extends object>(error: T): T => {
  ;(error as T & { __handledByHttpClient?: boolean }).__handledByHttpClient = true
  return error
}

const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

async function refreshSession() {
  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = httpClient
      .post<ApiResponse<unknown>>('/auth/refresh', null, {
        headers: { 'x-skip-refresh': '1' },
      })
      .then(() => undefined)
      .finally(() => {
        isRefreshing = false
        refreshPromise = null
      })
  }
  return refreshPromise
}

httpClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message } = response.data
    if (code === 200) {
      return response
    }

    const errMsg = message || '操作失败'
    toast.error(errMsg)
    const handledError: ClientHandledError = markHandled(new Error(errMsg))
    return Promise.reject(handledError)
  },
  async (error: AxiosError<ApiResponse>) => {
    const handledError = error as AxiosHandledError
    const status = error.response?.status
    const originalConfig = error.config as RetryableRequestConfig | undefined
    const skipRefresh = originalConfig?.headers?.['x-skip-refresh']

    if (status === 401 && originalConfig && !skipRefresh && !originalConfig.__retried) {
      originalConfig.__retried = true
      try {
        await refreshSession()
        return httpClient(originalConfig)
      } catch {
        // fall through to normal 401 handling
      }
    }

    if (!error.response) {
      toast.error('网络异常，请检查网络连接')
      return Promise.reject(markHandled(handledError))
    }

    const { data } = error.response
    switch (status) {
      case 400:
        toast.error(data?.message || '请求参数错误')
        break
      case 401:
        toast.error('未授权，请重新登录')
        break
      case 403:
        toast.error('权限不足')
        break
      case 404:
        toast.error('请求的资源不存在')
        break
      case 409:
        toast.error(data?.message || '数据冲突')
        break
      case 429:
        toast.error(data?.message || '请求过于频繁，请稍后重试')
        break
      case 500:
        toast.error(data?.message || '服务器错误，请稍后重试')
        break
      default:
        toast.error(data?.message || '操作失败')
        break
    }

    return Promise.reject(markHandled(handledError))
  }
)

export const http = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    httpClient.get<ApiResponse<T>>(url, config).then((res) => res.data.data),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    httpClient.post<ApiResponse<T>>(url, data, config).then((res) => res.data.data),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    httpClient.put<ApiResponse<T>>(url, data, config).then((res) => res.data.data),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    httpClient.patch<ApiResponse<T>>(url, data, config).then((res) => res.data.data),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    httpClient.delete<ApiResponse<T>>(url, config).then((res) => res.data.data),
}

export default httpClient
