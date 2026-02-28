import { useSyncExternalStore } from 'react'

export type ApiMode = 'api'

const DEFAULT_API_MODE: ApiMode = 'api'

export function useApiMode(): ApiMode {
  return useSyncExternalStore(
    () => () => undefined,
    () => DEFAULT_API_MODE,
    () => DEFAULT_API_MODE
  )
}
