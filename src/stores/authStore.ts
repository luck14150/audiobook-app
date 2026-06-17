import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const getCorrectPassword = () => {
  const envPassword = (import.meta as any).env?.VITE_ACCESS_PASSWORD
  return envPassword || 'datamind2026'
}

interface AuthState {
  isAuthenticated: boolean
  lastAccess: number | null
  skipLogin: boolean            // 新增：允许跳过登录
  checkPassword: (password: string) => boolean
  authenticate: (password: string) => boolean
  autoLogin: () => void         // 新增：一键进入
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      lastAccess: null,
      skipLogin: false,
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
      autoLogin: () => {
        // 允许跳过密码直接进入，方便手机用户使用
        set({ isAuthenticated: true, skipLogin: true, lastAccess: Date.now() })
      },
      logout: () => {
        set({ isAuthenticated: false, lastAccess: null, skipLogin: false })
      },
    }),
    { name: 'datamind-auth' }
  )
)
