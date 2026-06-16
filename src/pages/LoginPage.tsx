import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Shield, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { authenticate, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    setTimeout(() => {
      if (authenticate(password)) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('密码错误，请重试')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              DataMind AI
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </h1>
            <p className="text-slate-300 text-sm mt-2">请输入访问密码以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
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
                  placeholder="请输入密码..."
                  autoFocus
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  验证中...
                </span>
              ) : (
                '进入平台'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-slate-400 text-xs text-center leading-relaxed">
              默认密码：<span className="text-slate-300 font-mono">datamind2026</span>
              <br />
              可在 Vercel 环境变量中设置 VITE_ACCESS_PASSWORD 自定义密码
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          DataMind AI · 智能对话平台 v1.0
        </p>
      </div>
    </div>
  )
}
