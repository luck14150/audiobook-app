import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const getCorrectPassword = () => {
  const envPassword = (import.meta as any).env?.VITE_ACCESS_PASSWORD
  return envPassword || 'datamind2026'
}

interface AuthState {
  isAuthenticated: boolean
  lastAccess: number | null
  checkPassword: (password: string) => boolean
  authenticate: (password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      lastAccess: null,
      checkPassword: (password: string) => {
        const correct = getCorrectPassword()
        return password.trim() === correct
      },
      authenticate: (password: string) => {
        const isCorrect = password.trim() === getCorrectPassword()
        if (isCorrect) {
          set({ isAuthenticated: true, lastAccess: Date.now() })
          return true
        }
        return false
      },
      logout: () => {
        set({ isAuthenticated: false, lastAccess: null })
      },
    }),
    { name: 'datamind-auth' }
  )
)
