/**
 * 云存储层 - 替代浏览器 IndexedDB
 *
 * 设计目标：
 * 1. Vercel KV (Redis 兼容) - 主存储，速度快，免费额度充足
 * 2. 本地文件存储 - fallback（当 KV 不可用时）
 * 3. 内存缓存 - 进程内加速
 *
 * 存储结构：
 * - sessions:{sessionId}    → ChatSession JSON
 * - sessions:list           → [sessionId1, sessionId2, ...]
 * - messages:{sessionId}    → [ChatMessage, ChatMessage, ...]  (按时间排序)
 * - knowledge:{id}          → KnowledgeEntry JSON
 * - knowledge:list          → [knowledgeId1, ...]
 * - settings                → ApiSettings JSON
 * - stats                   → { totalMessages, totalSessions, lastActive }
 */

import type { ChatSession, ChatMessage, KnowledgeEntry, ApiSettings } from '../shared/types'

// ============ 环境检测 ============
const isVercelEdge = typeof process !== 'undefined' && process.env.KV_REST_API_URL
const isNodeServer = typeof process !== 'undefined' && process.versions && process.versions.node

// ============ 存储引擎抽象 ============
interface StorageEngine {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  list(prefix: string): Promise<string[]>
}

// ============ 引擎 1：Vercel KV ============
class VercelKvEngine implements StorageEngine {
  private baseUrl: string
  private token: string
  private cache: Map<string, string> = new Map()

  constructor() {
    this.baseUrl = process.env.KV_REST_API_URL || ''
    this.token = process.env.KV_REST_API_TOKEN || ''
  }

  isAvailable(): boolean {
    return Boolean(this.baseUrl && this.token)
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null
    if (this.cache.has(key)) return this.cache.get(key)!
    try {
      const res = await fetch(`${this.baseUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      if (!res.ok) return null
      const data = await res.json()
      const result = data && data.result
      if (result) this.cache.set(key, result)
      return result || null
    } catch {
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable()) return
    try {
      const url = ttlSeconds
        ? `${this.baseUrl}/set/${encodeURIComponent(key)}?EX=${ttlSeconds}`
        : `${this.baseUrl}/set/${encodeURIComponent(key)}`
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: value,
      })
      this.cache.set(key, value)
    } catch (e) {
      console.error('[KV] set failed:', e)
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable()) return
    try {
      await fetch(`${this.baseUrl}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
      })
      this.cache.delete(key)
    } catch {
      // 忽略
    }
  }

  async list(prefix: string): Promise<string[]> {
    if (!this.isAvailable()) return []
    try {
      // Vercel KV 不直接提供 scan，这里用简化的做法：维护独立的 list
      const list = await this.get(prefix + ':list')
      if (list) {
        try { return JSON.parse(list) as string[] } catch { return [] }
      }
      return []
    } catch {
      return []
    }
  }
}

// ============ 引擎 2：内存 + 文件 (fallback) ============
class MemoryEngine implements StorageEngine {
  private store: Map<string, string> = new Map()
  private persistPath: string | null = null

  constructor() {
    if (typeof process !== 'undefined' && process.env && process.env.STORAGE_PATH) {
      this.persistPath = process.env.STORAGE_PATH
    }
    // 尝试从环境恢复
    if (this.persistPath && typeof require !== 'undefined') {
      try {
        const fs = require('fs') as any
        const path = require('path') as any
        if (fs.existsSync(this.persistPath)) {
          const raw = fs.readFileSync(this.persistPath, 'utf-8')
          const parsed = JSON.parse(raw)
          for (const [k, v] of Object.entries(parsed)) {
            this.store.set(k, String(v))
          }
        }
      } catch {
        // 忽略
      }
    }
  }

  private flush(): void {
    if (!this.persistPath || typeof require === 'undefined') return
    try {
      const fs = require('fs') as any
      const path = require('path') as any
      const dir = path.dirname(this.persistPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      const obj: Record<string, string> = {}
      for (const [k, v] of this.store.entries()) obj[k] = v
      fs.writeFileSync(this.persistPath, JSON.stringify(obj, null, 2), 'utf-8')
    } catch {
      // 忽略
    }
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value)
    this.flush()
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
    this.flush()
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = []
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) keys.push(k)
    }
    return keys
  }
}

// ============ 存储实例 ============
let _engine: StorageEngine | null = null
function getEngine(): StorageEngine {
  if (_engine) return _engine
  const kv = new VercelKvEngine()
  if (kv.isAvailable()) {
    console.log('[Storage] 使用 Vercel KV 引擎')
    _engine = kv
  } else {
    console.log('[Storage] 使用内存/Fallback 引擎')
    _engine = new MemoryEngine()
  }
  return _engine
}

// ============ 列表维护 ============
async function addToList(listKey: string, id: string): Promise<void> {
  const engine = getEngine()
  const currentRaw = await engine.get(listKey)
  let list: string[] = []
  if (currentRaw) {
    try { list = JSON.parse(currentRaw) as string[] } catch { list = [] }
  }
  if (!list.includes(id)) {
    list.unshift(id)
    await engine.set(listKey, JSON.stringify(list.slice(0, 200)))
  }
}

async function removeFromList(listKey: string, id: string): Promise<void> {
  const engine = getEngine()
  const currentRaw = await engine.get(listKey)
  let list: string[] = []
  if (currentRaw) {
    try { list = JSON.parse(currentRaw) as string[] } catch { list = [] }
  }
  const filtered = list.filter(x => x !== id)
  await engine.set(listKey, JSON.stringify(filtered))
}

// ========================================================
//                      公共 API
// ========================================================

// ---------- Session ----------
export async function getSession(id: string): Promise<ChatSession | null> {
  const engine = getEngine()
  const raw = await engine.get(`sessions:${id}`)
  if (!raw) return null
  try { return JSON.parse(raw) as ChatSession } catch { return null }
}

export async function listSessions(): Promise<ChatSession[]> {
  const engine = getEngine()
  const idsRaw = await engine.get('sessions:list')
  const ids: string[] = idsRaw ? (() => { try { return JSON.parse(idsRaw) } catch { return [] } })() : []
  const result: ChatSession[] = []
  for (const id of ids) {
    const s = await getSession(id)
    if (s && !s.deleted) result.push(s)
  }
  return result.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function saveSession(session: ChatSession): Promise<void> {
  const engine = getEngine()
  await engine.set(`sessions:${session.id}`, JSON.stringify(session))
  await addToList('sessions:list', session.id)
  // 更新统计
  await updateStats({ sessions: 1 })
}

export async function deleteSession(id: string): Promise<void> {
  const engine = getEngine()
  const session = await getSession(id)
  if (session) {
    session.deleted = true
    await engine.set(`sessions:${id}`, JSON.stringify(session))
  }
  await engine.del(`messages:${id}`)
  await removeFromList('sessions:list', id)
}

export async function pinSession(id: string, pinned: boolean): Promise<void> {
  const s = await getSession(id)
  if (!s) return
  s.pinned = pinned
  s.updatedAt = Date.now()
  await saveSession(s)
}

export async function renameSession(id: string, title: string): Promise<void> {
  const s = await getSession(id)
  if (!s) return
  s.title = title
  s.updatedAt = Date.now()
  await saveSession(s)
}

// ---------- Messages ----------
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const engine = getEngine()
  const raw = await engine.get(`messages:${sessionId}`)
  if (!raw) return []
  try { return JSON.parse(raw) as ChatMessage[] } catch { return [] }
}

export async function appendMessage(sessionId: string, msg: ChatMessage): Promise<void> {
  const engine = getEngine()
  const current = await getMessages(sessionId)
  current.push(msg)
  await engine.set(`messages:${sessionId}`, JSON.stringify(current.slice(-200))) // 保留最近 200 条
  // 更新 session 的 updatedAt
  const session = await getSession(sessionId)
  if (session) {
    session.updatedAt = msg.timestamp
    session.messageCount = current.length
    await engine.set(`sessions:${sessionId}`, JSON.stringify(session))
  }
  // 更新统计
  await updateStats({ messages: 1 })
}

export async function updateMessageContent(sessionId: string, messageId: string, content: string): Promise<void> {
  const engine = getEngine()
  const messages = await getMessages(sessionId)
  const idx = messages.findIndex(m => m.id === messageId)
  if (idx === -1) return
  messages[idx].content = content
  messages[idx].streaming = false
  messages[idx].timestamp = Date.now()
  await engine.set(`messages:${sessionId}`, JSON.stringify(messages))
}

export async function deleteMessage(sessionId: string, messageId: string): Promise<void> {
  const engine = getEngine()
  const messages = await getMessages(sessionId)
  const filtered = messages.filter(m => m.id !== messageId)
  await engine.set(`messages:${sessionId}`, JSON.stringify(filtered))
  const session = await getSession(sessionId)
  if (session) {
    session.messageCount = filtered.length
    session.updatedAt = Date.now()
    await engine.set(`sessions:${sessionId}`, JSON.stringify(session))
  }
}

// ---------- Knowledge ----------
export async function listKnowledge(): Promise<KnowledgeEntry[]> {
  const engine = getEngine()
  const idsRaw = await engine.get('knowledge:list')
  const ids: string[] = idsRaw ? (() => { try { return JSON.parse(idsRaw) } catch { return [] } })() : []
  const result: KnowledgeEntry[] = []
  for (const id of ids) {
    const k = await getKnowledge(id)
    if (k) result.push(k)
  }
  return result.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getKnowledge(id: string): Promise<KnowledgeEntry | null> {
  const engine = getEngine()
  const raw = await engine.get(`knowledge:${id}`)
  if (!raw) return null
  try { return JSON.parse(raw) as KnowledgeEntry } catch { return null }
}

export async function saveKnowledge(entry: KnowledgeEntry): Promise<void> {
  const engine = getEngine()
  await engine.set(`knowledge:${entry.id}`, JSON.stringify(entry))
  await addToList('knowledge:list', entry.id)
}

export async function deleteKnowledge(id: string): Promise<void> {
  const engine = getEngine()
  await engine.del(`knowledge:${id}`)
  await removeFromList('knowledge:list', id)
}

// ---------- Settings ----------
export async function getSettings(): Promise<ApiSettings> {
  const engine = getEngine()
  const raw = await engine.get('settings')
  const defaults: ApiSettings = {
    endpoint: process.env.DOUBAO_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: process.env.DOUBAO_API_KEY || '',
    modelName: process.env.DOUBAO_MODEL || 'doubao-pro-250615',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
  }
  if (!raw) return defaults
  try {
    const parsed = JSON.parse(raw) as Partial<ApiSettings>
    return { ...defaults, ...parsed }
  } catch {
    return defaults
  }
}

export async function saveSettings(settings: Partial<ApiSettings>): Promise<void> {
  const engine = getEngine()
  const current = await getSettings()
  const merged = { ...current, ...settings }
  await engine.set('settings', JSON.stringify(merged))
}

// ---------- Stats ----------
interface StatsData {
  totalMessages: number
  totalSessions: number
  lastActive: number
}

async function updateStats(delta: { messages?: number; sessions?: number }): Promise<void> {
  const engine = getEngine()
  const raw = await engine.get('stats')
  let stats: StatsData = { totalMessages: 0, totalSessions: 0, lastActive: Date.now() }
  if (raw) {
    try { stats = JSON.parse(raw) as StatsData } catch { /* ignore */ }
  }
  if (delta.messages) stats.totalMessages += delta.messages
  if (delta.sessions) stats.totalSessions += delta.sessions
  stats.lastActive = Date.now()
  await engine.set('stats', JSON.stringify(stats))
}

export async function getStats(): Promise<StatsData> {
  const engine = getEngine()
  const raw = await engine.get('stats')
  if (!raw) return { totalMessages: 0, totalSessions: 0, lastActive: Date.now() }
  try { return JSON.parse(raw) as StatsData } catch { return { totalMessages: 0, totalSessions: 0, lastActive: Date.now() } }
}

// ---------- ID 生成 ----------
export function generateId(prefix?: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return prefix ? `${prefix}_${time}${rand}` : `${time}${rand}`
}

// ========================================================
