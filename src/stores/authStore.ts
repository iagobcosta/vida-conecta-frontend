import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MeResponse } from '../types/api'

type AuthState = {
  token: string | null
  user: MeResponse | null
  setSession: (token: string, user: MeResponse) => void
  setUser: (user: MeResponse) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: 'vida-conecta-auth',
      partialize: (state) => ({ token: state.token }),
    },
  ),
)
