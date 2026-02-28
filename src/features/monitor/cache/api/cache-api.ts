import { http } from '@/lib/http-client'

export interface CacheOverview {
  cacheName: string
  ttlSeconds: number
  maxSize: number
  entryCount: number
  hitRate: number
  requestCount: number
  hitCount: number
  missCount: number
  evictionCount: number
  estimatedBytes: number
}

export interface CacheSummary {
  sampledAt: string
  cacheCount: number
  totalEntries: number
  totalEstimatedBytes: number
  caches: CacheOverview[]
}

export const cacheApi = {
  getSummary: async (): Promise<CacheSummary> => {
    return http.get<CacheSummary>('/monitor/cache/summary')
  },

  clearCache: async (cacheName: string): Promise<void> => {
    await http.post<void>('/monitor/cache/clear', undefined, { params: { cacheName } })
  },

  clearAll: async (): Promise<string> => {
    return http.post<string>('/monitor/cache/clear-all')
  },
}
