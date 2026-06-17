import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Shield, Lock, Eye, EyeOff, Sparkles, ExternalLink, ArrowRight, Smartphone } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isWeChat, setIsWeChat] = useState(false)
  const { authenticate, autoLogin, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  // 检测是否在微信中
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    setIsWeChat(ua.includes('micromessenger') || ua.includes('wechat'))
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      if (authenticate(password)) {
        navigate('/chat', { replace: true })
      } else {
        setError('密码错误，请重试')
      }
      setLoading(false)
    }, 400)
  }

  const handleQuickEnter = () => {
    setLoading(true)
    setTimeout(() => {
      autoLogin()
      navigate('/chat', { replace: true })
    }, 300)
  }

  const handleOpenInBrowser = () => {
    // 显示指引
    alert('提示：请点击右上角 "..." → 选择"在浏览器中打开" → 选择系统浏览器即可获得最佳体验')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Logo 和标题 */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">DataMind 开放平台</h1>
            <p className="text-slate-300 text-sm mt-2 text-center">数据大模型 AI · 智能对话 · API 接入</p>
          </div>

          {/* 微信环境提示 */}
          {isWeChat && (
            <div className="mb-5 p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl">
              <div className="flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 leading-relaxed">
                  <div className="font-bold mb-1">检测到微信浏览器</div>
                  <div className="text-amber-100/80 mb-2">微信内打开部分网页链接可能不稳定，建议：</div>
                  <div className="text-amber-100/90">1. 直接点下方"一键进入"开始使用</div>
                  <div className="text-amber-100/90">2. 或点右上角"..."→"在浏览器中打开"</div>
                </div>
              </div>
            </div>
          )}

          {/* 快速进入（推荐） */}
          <button
            onClick={handleQuickEnter}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 text-sm mb-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                进入中...
              </span>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                一键进入（无需密码）
              </>
            )}
          </button>

          {/* 分割线 */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="px-3 text-[11px] text-slate-400">或密码访问</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* 密码登录（备选） */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                访问密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="输入密码..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-xl transition-all text-sm"
            >
              密码登录
            </button>
          </form>

          {/* 底部提示 */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              默认密码：<span className="text-slate-300 font-mono">datamind2026</span>
            </p>
            <p className="text-[10px] text-slate-600 mt-2">
              DataMind 开放平台 · 数据大模型 API · v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
