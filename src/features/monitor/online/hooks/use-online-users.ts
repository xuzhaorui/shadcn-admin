import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { onlineApi, type OnlineUserListParams } from '../api/online-api'

export function useOnlineUsers(params: OnlineUserListParams) {
  return useQuery({
    queryKey: ['monitor', 'online-users', params],
    queryFn: () => onlineApi.getOnlineUserList(params),
    staleTime: 30 * 1000,
  })
}

export function useForceLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: onlineApi.forceLogout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor', 'online-users'] })
    },
  })
}
