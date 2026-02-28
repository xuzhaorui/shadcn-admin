import { http } from '@/lib/http-client'

export interface ServerMetrics {
  cpu: {
    usage: number
    cores: number
    model: string
    speedGhz: number
  }
  memory: {
    totalGb: number
    usedGb: number
    freeGb: number
    usage: number
  }
  disk: {
    totalGb: number
    usedGb: number
    freeGb: number
    usage: number
    path: string
  }
  system: {
    os: string
    hostname: string
    arch: string
    uptime: string
  }
  jvm: {
    version: string
    vendor: string
    heapUsedMb: number
    heapMaxMb: number
    heapUsage: number
  }
  sampledAt: string
}

export const serverApi = {
  getMetrics: async (): Promise<ServerMetrics> => {
    return http.get<ServerMetrics>('/monitor/server/info')
  },
}
