import React from 'react'
import { BarChart2, TrendingUp, Zap, Clock, Activity, BarChart, Key } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

export default function UsagePage() {
  const { usage, messages, conversations, apiKeys } = useChatStore()

  const totalTokens = usage.reduce((sum, u) => sum + u.tokens, 0)
  const totalRequests = usage.reduce((sum, u) => sum + u.requests, 0)
  const avgTokensPerRequest = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0

  const stats = [
    { label: '总 Token 使用', value: totalTokens.toLocaleString(), icon: Zap, color: 'from-indigo-500 to-violet-600', bg: 'bg-indigo-50' },
    { label: '总请求次数', value: totalRequests.toLocaleString(), icon: Activity, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
    { label: '对话数量', value: String(conversations.length), icon: BarChart2, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
    { label: 'API 密钥', value: String(apiKeys.length), icon: Key, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50' },
  ]

  return (
    <div className="h-full bg-slate-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">使用统计</h1>
          </div>
          <p className="text-slate-500 text-sm">查看你的 API 使用情况和趋势分析</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <div className={`bg-gradient-to-br ${stat.color} p-1.5 rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Token Usage Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800">Token 消耗趋势</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke="url(#colorTokens)"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-800">每日请求次数</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={usage} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Bar dataKey="requests" fill="url(#colorRequests)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800">最近对话记录</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {messages.slice(-5).reverse().map((msg) => (
              <div key={msg.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-slate-600' : 'bg-gradient-to-br from-indigo-500 to-violet-600'
                  }`}>
                    <span className="text-white text-xs font-bold">{msg.role === 'user' ? '我' : 'AI'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{msg.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(msg.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-sm">暂无对话记录</div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-5 bg-slate-900 rounded-2xl text-slate-200">
          <h3 className="font-medium text-white mb-3">本周使用概览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">平均每次请求 Token</p>
              <p className="text-xl font-bold text-white mt-1">{avgTokensPerRequest}</p>
            </div>
            <div>
              <p className="text-slate-500">最高单日 Token</p>
              <p className="text-xl font-bold text-white mt-1">{Math.max(...usage.map(u => u.tokens)).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500">最高单日请求</p>
              <p className="text-xl font-bold text-white mt-1">{Math.max(...usage.map(u => u.requests))}</p>
            </div>
            <div>
              <p className="text-slate-500">消息总数</p>
              <p className="text-xl font-bold text-white mt-1">{messages.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
