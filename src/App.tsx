import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import ApiKeysPage from './pages/ApiKeysPage'
import UsagePage from './pages/UsagePage'
import { MessageSquare, Key, BarChart3, LogOut, Brain, Sparkles } from 'lucide-react'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        navigate('/login', { replace: true })
      }
      setChecking(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [isAuthenticated, navigate])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuthStore()

  const navItems = [
    { path: '/dashboard', label: '智能对话', icon: MessageSquare },
    { path: '/api-keys', label: 'API 管理', icon: Key },
    { path: '/usage', label: '使用统计', icon: BarChart3 },
  ]

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 text-white flex-col">
        <div className="p-5 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-base">DataMind AI</div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 智能对话平台
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && (location.pathname === '/' || location.pathname === ''))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">退出登录</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/dashboard" element={<ChatPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/usage" element={<UsagePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <AuthGate>
            <AppLayout />
          </AuthGate>
        }
      />
    </Routes>
  )
}
