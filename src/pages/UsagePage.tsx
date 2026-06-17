import React, { useMemo } from 'react'
import { useChatStore } from '../stores'
import {
  BarChart3,
  MessagesSquare,
  Users,
  Sparkles,
  TrendingUp,
  Calendar,
  Clock,
} from 'lucide-react'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 10_000) return (n / 10_000).toFixed(2) + '万'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function UsagePage(): React.ReactElement {
  const { sessions, messages, usage, personas, activePersonaId } = useChatStore()

  // 按日期分组的消息数
  const dailyStats = useMemo(() => {
    const stats = new Map<string, number>()
    for (const m of messages) {
      const key = new Date(m.timestamp).toISOString().slice(0, 10)
      stats.set(key, (stats.get(key) || 0) + 1)
    }
    const entries = Array.from(stats.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
    const last7 = entries.slice(-7)
    const pad = 7 - last7.length
    const padded: Array<{ date: string; count: number }> = []
    for (let i = 0; i < pad; i++) padded.push({ date: `Day ${i + 1}`, count: 0 })
    for (const [d, c] of last7) padded.push({ date: d.slice(5), count: c })
    return padded
  }, [messages])

  const maxDaily = Math.max(1, ...dailyStats.map((d) => d.count))

  // 角色使用统计
  const personaStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of sessions) {
      const count = messages.filter((m) => m.sessionId === s.id).length
      map.set(s.personaId, (map.get(s.personaId) || 0) + count)
    }
    return Array.from(map.entries())
      .map(([pid, count]) => {
        const p = Array.isArray(personas) ? personas.find((x) => x.id === pid) : undefined
        return {
          pid,
          name: p?.name || pid,
          emoji: p?.emoji || '💬',
          count,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [sessions, messages, personas])

  const maxPersona = Math.max(1, ...personaStats.map((p) => p.count))

  // 最近活跃会话
  const activeSessions = useMemo(
    () => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [sessions]
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-slate-50 to-indigo-50/30 px-3 md:px-8 py-5 pb-16">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* 标题 */}
        <div className="mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" /> 使用统计
          </h1>
          <p className="text-xs md:text-sm text-secondary mt-1">你的 AI 对话使用情况与数据概览</p>
        </div>

        {/* 顶部 4 个关键指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-theme p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center">
                <MessagesSquare className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="text-[10px] md:text-xs text-secondary font-bold">总消息</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">{formatNumber(usage.messages)}</div>
            <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 全部时间
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-theme p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-500" />
              </div>
              <span className="text-[10px] md:text-xs text-secondary font-bold">对话数</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">{formatNumber(usage.sessions)}</div>
            <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 独立会话
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-theme p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[10px] md:text-xs text-secondary font-bold">Token 使用</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">{formatNumber(usage.tokens)}</div>
            <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 本地估算
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-theme p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-[10px] md:text-xs text-secondary font-bold">每日均值</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">
              {dailyStats.length > 0 ? formatNumber(Math.round(usage.messages / Math.max(1, dailyStats.length))) : '0'}
            </div>
            <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 每日
            </div>
          </div>
        </div>

        {/* 消息时间趋势 */}
        <section className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
          <header className="px-4 md:px-6 py-3 border-b border-theme flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <div>
              <div className="text-sm font-bold text-primary">📈 最近 7 天消息量</div>
              <div className="text-[10px] text-secondary">每日对话消息数</div>
            </div>
          </header>
          <div className="p-4 md:p-6">
            <div className="h-40 md:h-48 flex items-end gap-2">
              {dailyStats.map((d) => {
                const h = (d.count / maxDaily) * 100
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition">
                      {d.count}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-violet-400 rounded-t-lg transition-all group-hover:from-indigo-600 group-hover:to-violet-500 shadow-sm"
                      style={{ height: `${Math.max(4, h)}%` }}
                    />
                    <div className="text-[10px] text-secondary font-mono">{d.date}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 角色使用分布 */}
        <section className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
          <header className="px-4 md:px-6 py-3 border-b border-theme flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            <div>
              <div className="text-sm font-bold text-primary">🎭 角色使用分布</div>
              <div className="text-[10px] text-secondary">哪个角色陪你聊得最多</div>
            </div>
          </header>
          <div className="p-4 md:p-6 space-y-3">
            {personaStats.length === 0 ? (
              <div className="text-center text-xs text-secondary py-8">
                还没有使用记录，去和角色们聊聊吧！
              </div>
            ) : (
              personaStats.map((p) => {
                const pct = Math.round((p.count / maxPersona) * 100)
                const isActive = p.pid === activePersonaId
                return (
                  <div key={p.pid} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{p.emoji}</span>
                        <span className={`font-bold ${isActive ? 'text-indigo-600' : 'text-primary'}`}>
                          {p.name}
                          {isActive && <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">当前</span>}
                        </span>
                      </div>
                      <span className="font-mono text-secondary">{p.count} 条消息</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* 最近活跃会话 */}
        <section className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
          <header className="px-4 md:px-6 py-3 border-b border-theme flex items-center gap-2">
            <MessagesSquare className="w-4 h-4 text-emerald-500" />
            <div>
              <div className="text-sm font-bold text-primary">💬 最近活跃会话</div>
              <div className="text-[10px] text-secondary">最近 5 个对话</div>
            </div>
          </header>
          <div className="divide-y divide-theme">
            {activeSessions.length === 0 ? (
              <div className="text-center text-xs text-secondary py-8">还没有对话记录</div>
            ) : (
              activeSessions.map((s) => {
                const msgCount = messages.filter((m) => m.sessionId === s.id).length
                return (
                  <div key={s.id} className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-primary truncate">{s.title}</div>
                      <div className="text-[10px] text-secondary mt-0.5 flex items-center gap-2">
                        <span>{msgCount} 条消息</span>
                        <span>·</span>
                        <span>更新于 {formatDate(s.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-secondary font-mono flex-shrink-0">
                      {s.messageCount || msgCount}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* 总结卡 */}
        <section className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl shadow-sm p-4 md:p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm md:text-base font-bold mb-1">使用小贴士</div>
              <div className="text-[11px] md:text-xs opacity-90 leading-relaxed">
                你已创建 <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded">{sessions.length}</span> 个会话和{' '}
                <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded">{messages.length}</span> 条消息。
                可以在设置页导出数据做备份，或切换到你最喜欢的角色深入探索。
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
