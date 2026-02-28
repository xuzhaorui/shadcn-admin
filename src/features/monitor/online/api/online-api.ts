import { http, type PaginatedResponse } from '@/lib/http-client'
import { type OnlineUser } from '../data/schema'

export interface OnlineUserListParams {
  page: number
  pageSize: number
  username?: string
  ip?: string
}

interface OnlineUserApiModel {
  id: string
  username: string
  deptName: string
  ip: string
  location: string
  browser: string
  os: string
  loginTime: string
}

const mapOnlineUser = (item: OnlineUserApiModel): OnlineUser => ({
  id: item.id,
  username: item.username,
  deptName: item.deptName,
  ip: item.ip,
  location: item.location,
  browser: item.browser,
  os: item.os,
  loginTime: new Date(item.loginTime),
})

export const onlineApi = {
  getOnlineUserList: async (params: OnlineUserListParams): Promise<PaginatedResponse<OnlineUser>> => {
    const page = await http.get<PaginatedResponse<OnlineUserApiModel>>('/monitor/online/list', { params })
    return {
      ...page,
      list: page.list.map(mapOnlineUser),
    }
  },

  forceLogout: async (sessionId: string): Promise<void> => {
    await http.post<void>('/monitor/online/force-logout', { sessionId })
  },
}
