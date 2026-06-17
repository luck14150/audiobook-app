import React, { useEffect, useState, type ReactNode } from 'react'
import { Routes, Route, Navigate, useNavigate, Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, useChatStore } from './stores'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import ApiKeysPage from './pages/ApiKeysPage'
import UsagePage from './pages/UsagePage'
import SettingsPage from './pages/SettingsPage'
import ImageGenPage from './pages/ImageGenPage'
import PromptLibraryPage from './pages/PromptLibraryPage'
import CodeInterpreterPage from './pages/CodeInterpreterPage'
import DocAnalysisPage from './pages/DocAnalysisPage'
import DashboardPage from './pages/DashboardPage'
import PlaygroundPage from './pages/PlaygroundPage'
import DocsPage from './pages/DocsPage'
import KnowledgePage from './pages/KnowledgePage'
import {
  MessageSquare, Key, BarChart3, Settings as SettingsIcon,
  Brain, Palette, BookOpen, Terminal, FileText, Sparkles,
  Home, Zap, LayoutDashboard, AlertTriangle, RefreshCw, Database,
} from 'lucide-react'

// —— 全局错误边界：避免应用崩溃导致白屏 ——
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class AppErrorBoundary extends React.Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[AppErrorBoundary] 捕获到错误:', error, info)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#eef2ff',
            padding: 24,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              boxShadow: '0 10px 30px rgba(99,102,241,0.15)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 12px',
                background: '#fef3c7',
                color: '#d97706',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
              页面发生了一点小问题
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
              应用在渲染时遇到错误，已为你安全暂停。刷新页面试试看，通常可以恢复。
            </div>
            {this.state.error && (
              <pre
                style={{
                  background: '#f1f5f9',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 12,
                  color: '#334155',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 160,
                  overflow: 'auto',
                  marginBottom: 16,
                }}
              >
                {String(this.state.error.message || this.state.error)}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={16} /> 刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AuthGate() {
  const { isAuthenticated, autoLogin } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      autoLogin()
      navigate('/chat', { replace: true })
    }
  }, [isAuthenticated, navigate, autoLogin])

  if (!isAuthenticated) return null
  return <Outlet />
}

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  group: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: '控制台首页', icon: LayoutDashboard, color: 'from-indigo-500 to-violet-600', group: '开放平台' },
  { path: '/chat', label: '智能对话', icon: MessageSquare, color: 'from-indigo-500 to-violet-600', group: '开放平台' },
  { path: '/knowledge', label: '知识库', icon: BookOpen, color: 'from-teal-500 to-emerald-600', group: '开放平台' },
  { path: '/image', label: '图像生成', icon: Palette, color: 'from-rose-500 to-pink-600', group: '创作工具' },
  { path: '/prompts', label: '提示词库', icon: Sparkles, color: 'from-orange-500 to-amber-500', group: '创作工具' },
  { path: '/code', label: '代码解释器', icon: Terminal, color: 'from-emerald-500 to-teal-600', group: '创作工具' },
  { path: '/doc', label: '文档分析', icon: FileText, color: 'from-sky-500 to-blue-600', group: '创作工具' },
  { path: '/playground', label: 'API Playground', icon: Zap, color: 'from-amber-500 to-orange-600', group: '开发者' },
  { path: '/docs', label: 'API 文档', icon: BookOpen, color: 'from-purple-500 to-fuchsia-600', group: '开发者' },
  { path: '/api-keys', label: 'API 密钥', icon: Key, color: 'from-fuchsia-500 to-purple-600', group: '开发者' },
  { path: '/usage', label: '使用统计', icon: BarChart3, color: 'from-amber-500 to-orange-600', group: '开发者' },
  { path: '/settings', label: '设置', icon: SettingsIcon, color: 'from-slate-500 to-slate-700', group: '开发者' },
]

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { conversations, messages, apiKeys } = useChatStore()
  const { isAuthenticated } = useAuthStore()

  const isActive = (path: string) => location.pathname === path

  if (!isAuthenticated) return null

  const handleLogout = () => {
    useAuthStore.getState().logout()
    navigate('/login', { replace: true })
  }

  const grouped = NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-primary text-primary">
      <aside className="hidden md:flex w-64 bg-secondary border-r border-theme flex-col flex-shrink-0">
        <Link to="/dashboard" className="p-4 flex items-center gap-2 hover:bg-tertiary transition">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-primary">DataMind 开放平台</div>
            <div className="text-[10px] text-muted">数据大模型 API · 12 种能力</div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-2">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-2">
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 py-1.5">{group}</div>
              {items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition mb-0.5 ${
                      active ? `bg-gradient-to-r ${item.color} text-white shadow` : 'text-secondary hover:bg-tertiary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-theme text-[11px] text-muted bg-white/30">
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="bg-tertiary rounded-lg p-2 text-center">
              <div className="text-[9px] text-muted">对话</div>
              <div className="text-sm font-bold text-primary">{conversations.length}</div>
            </div>
            <div className="bg-tertiary rounded-lg p-2 text-center">
              <div className="text-[9px] text-muted">消息</div>
              <div className="text-sm font-bold text-primary">{messages.length}</div>
            </div>
            <div className="bg-tertiary rounded-lg p-2 text-center">
              <div className="text-[9px] text-muted">密钥</div>
              <div className="text-sm font-bold text-primary">{apiKeys.length}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 bg-tertiary hover:bg-red-100 hover:text-red-600 text-secondary rounded-lg text-xs font-bold transition">
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full">
        <header className="md:hidden bg-secondary border-b border-theme px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow flex-shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">DataMind 开放平台</div>
            <div className="text-[10px] text-muted">数据大模型 API · 接入即用</div>
          </div>
          <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        </header>

        <main className="flex-1 flex flex-col min-h-0 min-w-0 w-full overflow-hidden">
          <Outlet />
        </main>

        <nav className="md:hidden bg-secondary border-t border-theme grid grid-cols-5 shadow-lg flex-shrink-0">
          {[
            { path: '/dashboard', label: '首页', icon: Home, color: 'from-indigo-500 to-violet-600' },
            { path: '/chat', label: '对话', icon: MessageSquare, color: 'from-indigo-500 to-violet-600' },
            { path: '/knowledge', label: '知识库', icon: Database, color: 'from-teal-500 to-emerald-600' },
            { path: '/api-keys', label: '密钥', icon: Key, color: 'from-fuchsia-500 to-purple-600' },
            { path: '/settings', label: '设置', icon: SettingsIcon, color: 'from-slate-500 to-slate-700' },
          ].map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`py-2.5 flex flex-col items-center gap-1 ${active ? 'text-indigo-600' : 'text-slate-500'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? `bg-gradient-to-br ${item.color} text-white shadow` : 'bg-transparent'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium truncate max-w-full px-1">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default function App() {
  const [initialized, setInitialized] = useState(false)
  const [initError, setInitError] = useState(false)

  // 根组件最前面调用 initialize：后台异步加载，不阻塞首屏
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await useChatStore.getState().initialize()
        if (!cancelled) setInitialized(true)
      } catch {
        if (!cancelled) {
          setInitError(true)
          setInitialized(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 初始化阶段的简洁加载提示
  if (!initialized) {
    return (
      <div
        style={{
          height: '100vh',
          background: '#eef2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid rgba(99,102,241,0.35)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'app-spin 0.8s linear infinite',
          }}
        />
        <div style={{ marginTop: 12, color: '#475569', fontSize: 13 }}>DataMind AI 正在加载...</div>
        <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <AppErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGate />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/image" element={<ImageGenPage />} />
            <Route path="/prompts" element={<PromptLibraryPage />} />
            <Route path="/code" element={<CodeInterpreterPage />} />
            <Route path="/doc" element={<DocAnalysisPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/usage" element={<UsagePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
      {initError && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fef3c7',
            color: '#92400e',
            padding: '10px 16px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={14} /> 数据初始化出现异常，功能可能受限
        </div>
      )}
    </AppErrorBoundary>
  )
}
