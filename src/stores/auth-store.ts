import { create } from 'zustand'

interface AuthUser {
  accountNo: string
  email: string
  role: string[]
  permissions?: string[]
  exp: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    initialized: boolean
    setUser: (user: AuthUser | null) => void
    setInitialized: (initialized: boolean) => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    initialized: false,
    setUser: (user) =>
      set((state) => ({ ...state, auth: { ...state.auth, user } })),
    setInitialized: (initialized) =>
      set((state) => ({ ...state, auth: { ...state.auth, initialized } })),
    reset: () =>
      set((state) => ({
        ...state,
        auth: { ...state.auth, user: null, initialized: true },
      })),
  },
}))
