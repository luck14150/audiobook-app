import React, { useState } from 'react'
import { useChatStore } from '../stores'
import { Activity, Key, BarChart2, Zap, MessageSquare, Globe, Code, Shield, CheckCircle2, TrendingUp, Users, Clock, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const { apiKeys, messages, conversations, usage, aiSettings } = useChatStore()
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d')

  const totalTokens = typeof usage === 'object' && !Array.isArray(usage) ? (usage as any).tokens || 0 : 0
  const totalRequests = messages.length
  const uptimeHours = Math.floor((Date.now() - (conversations[conversations.length - 1]?.createdAt || Date.now())) / 3600000) + 24

  const stats = [
    { label: 'API 密钥', value: apiKeys.length + ' 个', icon: Key, color: 'from-indigo-500 to-violet-600', trend: '活跃使用中' },
    { label: '对话总数', value: conversations.length + ' 场', icon: MessageSquare, color: 'from-emerald-500 to-teal-600', trend: messages.length + ' 条消息' },
    { label: '令牌用量', value: totalTokens.toLocaleString(), icon: Zap, color: 'from-amber-500 to-orange-600', trend: totalRequests + ' 次请求' },
    { label: '可用模型', value: '6 款', icon: Globe, color: 'from-rose-500 to-pink-600', trend: '豆包 · OpenAI' },
  ]

  const models = [
    { name: 'doubao-pro-250615', desc: '深度推理 · 专业写作', calls: 1247, latency: '2.3s', status: '运行中' },
    { name: 'doubao-seed-1-6-250615', desc: '均衡能力 · 性价比最高', calls: 3891, latency: '0.9s', status: '运行中' },
    { name: 'doubao-lite-32k', desc: '极速响应 · 日常问答', calls: 5621, latency: '0.4s', status: '运行中' },
    { name: 'gpt-4o-mini', desc: '多模态 · 兼容协议', calls: 892, latency: '1.7s', status: '运行中' },
    { name: 'qwen-plus', desc: '通义千问 · 中文优化', calls: 0, latency: '—', status: '待配置' },
  ]

  const features = [
    { title: '智能对话', desc: '多角色上下文对话', icon: MessageSquare, count: conversations.length, color: 'indigo', path: '/chat' },
    { title: '图像生成', desc: '多风格艺术图生成', icon: Zap, count: 0, color: 'rose', path: '/image' },
    { title: '代码解释器', desc: '浏览器内 JavaScript 执行', icon: Code, count: 0, color: 'emerald', path: '/code' },
    { title: '文档分析', desc: '关键词与情感分析', icon: Activity, count: 0, color: 'sky', path: '/doc' },
  ]

  const recentActivity = [...messages].reverse().slice(0, 5)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3 md:p-8 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary">开发者控制台</h1>
              <p className="text-xs md:text-sm text-muted">DataMind 开放平台 · 数据大模型 API</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition shadow-sm">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow-md`}>
                  <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div className="text-xs text-muted mb-1">{s.label}</div>
                <div className="text-lg md:text-xl font-bold text-primary">{s.value}</div>
                <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {s.trend}
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 rounded-2xl p-5 md:p-6 text-white shadow-xl mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="relative">
            <div className="text-xs md:text-sm opacity-90 mb-1">快速开始</div>
            <h2 className="text-lg md:text-2xl font-bold mb-2">接入 DataMind 大模型，只需 3 步</h2>
            <p className="text-xs md:text-sm opacity-85 mb-4 max-w-xl">
              获取 API Key → 选择模型 → 发起请求。兼容 OpenAI 协议，零改动接入豆包、GPT、通义千问。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {[
                { step: '1', title: '创建 API 密钥', desc: '在控制台生成专属密钥', icon: Key },
                { step: '2', title: '选择模型', desc: '根据场景挑选合适的大模型', icon: Globe },
                { step: '3', title: '发起请求', desc: '通过 cURL / Python / JS SDK 调用', icon: Code },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center text-[11px] font-bold">{s.step}</div>
                      <div className="text-xs font-bold">{s.title}</div>
                    </div>
                    <div className="text-[11px] opacity-90">{s.desc}</div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#/api-keys" className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> 创建密钥
              </a>
              <a href="#/docs" className="px-4 py-2 bg-white/15 text-white rounded-xl text-xs font-bold hover:bg-white/25 transition border border-white/30 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> 查看文档
              </a>
            </div>
          </div>
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
          {/* Models list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-primary">可用模型</h3>
                <p className="text-xs text-muted">选择合适的模型以获得最佳性价比</p>
              </div>
              <div className="text-[10px] text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" /> 实时延迟
              </div>
            </div>
            <div className="space-y-2">
              {models.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-primary font-mono truncate">{m.name}</div>
                    <div className="text-[11px] text-muted">{m.desc}</div>
                  </div>
                  <div className="hidden sm:block text-right mr-3">
                    <div className="text-[10px] text-muted">调用次数</div>
                    <div className="text-xs font-bold text-primary">{m.calls.toLocaleString()}</div>
                  </div>
                  <div className="hidden sm:block text-right mr-3">
                    <div className="text-[10px] text-muted">平均延迟</div>
                    <div className="text-xs font-bold text-emerald-600">{m.latency}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    m.status === '运行中' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-primary mb-1">功能模块</h3>
            <p className="text-xs text-muted mb-4">平台内置工具集</p>
            <div className="space-y-2">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <a
                    key={i}
                    href={'#' + f.path}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                  >
                    <div className={`w-9 h-9 bg-${f.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 text-${f.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-bold text-primary">{f.title}</div>
                      <div className="text-[10px] text-muted">{f.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent activity + API Config */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-6">
          {/* Recent activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-primary mb-1">最近消息</h3>
            <p className="text-xs text-muted mb-3">你的最近对话记录</p>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">暂无消息，开始你的第一次对话吧。</div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                    <div className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-xs ${
                      m.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {m.role === 'user' ? '我' : <Zap className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-primary truncate">{m.content}</div>
                      <div className="text-[10px] text-muted">{new Date(m.timestamp).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Config status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-primary mb-1">API 接入状态</h3>
            <p className="text-xs text-muted mb-4">当前配置信息</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
                <Globe className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted">服务端点 Endpoint</div>
                  <div className="text-xs font-bold text-primary font-mono truncate">{aiSettings.endpoint || '(未配置)'}</div>
                </div>
                {aiSettings.endpoint && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
                <Key className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted">API Key</div>
                  <div className="text-xs font-bold text-primary font-mono truncate">
                    {aiSettings.apiKey ? aiSettings.apiKey.slice(0, 8) + '••••••••••' + aiSettings.apiKey.slice(-4) : '(未配置)'}
                  </div>
                </div>
                {aiSettings.apiKey && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted">默认模型 Model</div>
                  <div className="text-xs font-bold text-primary font-mono">{aiSettings.modelName || '(未配置)'}</div>
                </div>
                {aiSettings.modelName && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
            </div>
            <a
              href="#/settings"
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              <Shield className="w-3.5 h-3.5" /> 前往设置页配置
            </a>
          </div>
        </div>

        {/* Footer stats */}
        <div className="bg-white/60 border border-slate-200 rounded-2xl p-4 text-center text-[10px] text-muted">
          DataMind 开放平台 · 为开发者提供企业级数据大模型 API · v1.0.0
        </div>
      </div>
    </div>
  )
}
