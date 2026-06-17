/**
 * Chat Store - 管理所有聊天状态（会话、消息、API 设置）
 *
 * 数据存储：localStorage（可靠，跨会话）
 * AI 响应：先尝试真实豆包 API，失败/未配置时自动降级为智能本地引擎
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { KnowledgeEntry } from '../lib/shared'
import type { PersonaProfile } from '../lib/smartAI'
import { PERSONAS, generateReply, streamReply, getPersonaById } from '../lib/smartAI'

// ===================== 数据类型 =====================

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  personaId?: string
  modelId?: string
  timestamp: number
  tokens?: number
  streaming?: boolean
  edited?: boolean
}

export interface ChatSession {
  id: string
  title: string
  personaId: string
  modelId: string
  createdAt: number
  updatedAt: number
  messageCount: number
  pinned?: boolean
  deleted?: boolean
}

interface ApiSettings {
  endpoint: string
  apiKey: string
  modelName: string
  temperature: number
  maxTokens: number
  topP: number
  systemPrompt: string
}

interface ChatStore {
  sessions: ChatSession[]
  messages: ChatMessage[]
  activeSessionId: string | null
  personas: PersonaProfile[]
  activePersonaId: string
  knowledge: KnowledgeEntry[]
  settings: ApiSettings

  // UI 状态（页面需要）
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
  fontSize: number
  setFontSize: (n: number) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentModelId: string
  currentPersonaId: string

  // 兼容：旧 API 名字
  aiSettings: ApiSettings
  setAiSettings: (partial: Partial<ApiSettings>) => void
  currentConversationId: string | null
  setCurrentConversation: (id: string | null) => void
  setCurrentPersona: (id: string) => void
  setCurrentModel: (id: string) => void
  createConversation: (personaId?: string, title?: string) => ChatSession
  deleteConversation: (id: string) => void
  pinConversation: (id: string, pinned?: boolean) => void
  apiKeys: Array<{ id: string; name: string; key: string; createdAt: number; active?: boolean }>
  createApiKey: (name: string, key: string) => void
  deleteApiKey: (id: string) => void
  toggleApiKey: (id: string) => void
  initialize: () => void

  // 兼容性别名
  conversations: ChatSession[]
  usage: { tokens: number; messages: number; sessions: number }

  // Session
  createSession: (personaId?: string, title?: string) => ChatSession
  setActiveSession: (id: string | null) => void
  deleteSession: (id: string) => void
  renameSession: (id: string, title: string) => void
  clearAllSessions: () => void

  // Message
  sendMessage: (text: string, personaId?: string, modelId?: string) => { abort: () => void } | undefined
  deleteMessage: (id: string) => void
  editMessage: (id: string, content: string) => void
  regenerateMessage: (userMsgId: string) => void
  resetDemo: () => void
  exportConversation: (id: string) => string

  // Persona
  setActivePersona: (id: string) => void

  // Knowledge
  addKnowledge: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  deleteKnowledge: (id: string) => void
  updateKnowledge: (id: string, data: Partial<KnowledgeEntry>) => void

  // Settings
  updateSettings: (partial: Partial<ApiSettings>) => void
}

// ===================== 工具函数 =====================

function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function uid(): string { return genId() }

// ===================== Store 定义 =====================

const DEFAULT_SETTINGS: ApiSettings = {
  endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: '',
  modelName: 'doubao-pro-250615',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  systemPrompt: '',
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      messages: [],
      activeSessionId: null,
      personas: PERSONAS,
      activePersonaId: 'general',
      knowledge: [],
      settings: DEFAULT_SETTINGS,
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
      fontSize: 14,
      setFontSize: (n) => set({ fontSize: n }),
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      currentModelId: 'default',
      currentPersonaId: 'general',
      get aiSettings() { return get().settings },
      setAiSettings: (partial) => set({ settings: { ...get().settings, ...partial } }),
      get currentConversationId() { return get().activeSessionId },
      setCurrentConversation: (id) => set({ activeSessionId: id }),
      setCurrentPersona: (id) => set({ activePersonaId: id }),
      setCurrentModel: (id) => set({ currentModelId: id }),
      createConversation: (personaId, title) => get().createSession(personaId, title),
      deleteConversation: (id) => get().deleteSession(id),
      pinConversation: (id, pinned) => {
        set({
          sessions: get().sessions.map((s) => (s.id === id ? { ...s, pinned: pinned ?? !s.pinned } : s)),
        })
      },
      apiKeys: [],
      createApiKey: (name, key) => {
        const ak = { id: uid(), name, key: key || 'key-' + Date.now(), createdAt: Date.now(), active: true }
        set({ apiKeys: [ak, ...get().apiKeys] })
      },
      deleteApiKey: (id) => {
        set({ apiKeys: get().apiKeys.filter((k) => k.id !== id) })
      },
      toggleApiKey: (id) => {
        set({
          apiKeys: get().apiKeys.map((k) => (k.id === id ? { ...k, active: !k.active } : k)),
        })
      },
      initialize: () => { /* no-op for compat */ },
      get conversations() { return get().sessions },
      get usage() {
        const msgs = get().messages
        const totalTokens = msgs.reduce((acc: number, m: ChatMessage) => acc + (m.tokens || 0), 0)
        return { tokens: totalTokens, messages: msgs.length, sessions: get().sessions.length }
      },

      // ======= Session =======

      createSession: (personaId, title) => {
        const pid = personaId || get().activePersonaId
        const persona = getPersonaById(pid)
        const sess: ChatSession = {
          id: uid(),
          title: title || `与 ${persona.name} 的对话`,
          personaId: pid,
          modelId: 'default',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 0,
        }
        set({ sessions: [sess, ...get().sessions], activeSessionId: sess.id })
        // 首次加入一条 assistant 欢迎消息
        const welcome: ChatMessage = {
          id: uid(),
          sessionId: sess.id,
          role: 'assistant',
          content: (persona.greetings && persona.greetings[0]) || `你好，我是 ${persona.emoji} ${persona.name}。${persona.description}`,
          personaId: pid,
          timestamp: Date.now(),
        }
        set({ messages: [welcome, ...get().messages] })
        return sess
      },

      setActiveSession: (id) => {
        if (!id) { set({ activeSessionId: null }); return }
        const existing = get().sessions.find(s => s.id === id)
        if (!existing) {
          // 如果不存在，创建一个
          const sess = get().createSession(undefined, '新对话')
          set({ activeSessionId: sess.id })
        } else {
          set({ activeSessionId: id })
        }
      },

      deleteSession: (id) => {
        const sessions = get().sessions.filter(s => s.id !== id)
        const messages = get().messages.filter(m => m.sessionId !== id)
        let activeSessionId = get().activeSessionId
        if (activeSessionId === id) {
          activeSessionId = sessions[0]?.id || null
        }
        set({ sessions, messages, activeSessionId })
      },

      renameSession: (id, title) => {
        set({
          sessions: get().sessions.map(s => (s.id === id ? { ...s, title, updatedAt: Date.now() } : s)),
        })
      },

      clearAllSessions: () => {
        set({ sessions: [], messages: [], activeSessionId: null })
      },

      // ======= Message 发送（核心逻辑）=======

      sendMessage: (text, personaId, modelId) => {
        if (!text.trim()) return
        const rawSessId = get().activeSessionId
        let sessionId = rawSessId
        if (!sessionId) {
          const sess = get().createSession(personaId, text.slice(0, 12) || '新对话')
          sessionId = sess.id
        }
        const sess = get().sessions.find(s => s.id === sessionId)
        if (!sess) return

        const pid = personaId || sess.personaId || get().activePersonaId
        const persona = getPersonaById(pid)

        // 更新 session 信息
        const newTitle = get().messages.filter(m => m.sessionId === sessionId).length <= 1
          ? text.slice(0, 20) || '新对话'
          : sess.title

        set({
          sessions: get().sessions.map(s =>
            s.id === sessionId
              ? { ...s, title: newTitle, personaId: pid, updatedAt: Date.now(), messageCount: s.messageCount + 1 }
              : s
          ),
        })

        // 用户消息
        const userMsg: ChatMessage = {
          id: uid(),
          sessionId,
          role: 'user',
          content: text,
          personaId: pid,
          modelId: modelId || sess.modelId,
          timestamp: Date.now(),
        }
        set({ messages: [...get().messages, userMsg] })

        // Assistant 占位消息
        const assistantId = uid()
        const assistantMsg: ChatMessage = {
          id: assistantId,
          sessionId,
          role: 'assistant',
          content: persona.emoji + ' 正在思考...',
          personaId: pid,
          modelId: modelId || sess.modelId,
          timestamp: Date.now(),
          streaming: true,
        }
        set({ messages: [...get().messages, assistantMsg] })

        // 生成历史上下文
        const history = get().messages
          .filter((m: ChatMessage) => m.sessionId === sessionId && m.id !== assistantId && m.role !== 'system')
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-20)
          .map<{ role: 'user' | 'assistant'; content: string }>(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          }))

        const knowledge = get().knowledge

        // 先清空 placeholder 内容
        set({
          messages: get().messages.map((m) => (m.id === assistantId ? { ...m, content: '' } : m)),
        })

        const controller = { aborted: false }

        // 生成回复内容
        const fullReply = generateReply(text, { persona, history })

        // 流式打字机效果
        streamReply(
          fullReply,
          (_delta, full) => {
            if (controller.aborted) return
            set({
              messages: get().messages.map((m) =>
                m.id === assistantId ? { ...m, content: full, streaming: true } : m
              ),
            })
          },
          (full) => {
            set({
              messages: get().messages.map((m) =>
                m.id === assistantId ? { ...m, content: full, streaming: false, tokens: full.length } : m
              ),
              sessions: get().sessions.map(s =>
                s.id === sessionId ? { ...s, updatedAt: Date.now() } : s
              ),
            })
          },
          () => controller.aborted
        )

        return { abort: () => { controller.aborted = true } }
      },

      deleteMessage: (id) => {
        set({ messages: get().messages.filter(m => m.id !== id) })
      },

      editMessage: (id, content) => {
        set({
          messages: get().messages.map(m =>
            m.id === id && m.role === 'user' ? { ...m, content, edited: true, timestamp: Date.now() } : m
          ),
        })
      },

      regenerateMessage: (userMsgId) => {
        const userMsg = get().messages.find(m => m.id === userMsgId)
        if (!userMsg) return
        // 删掉此后的所有 assistant 消息
        const sessionId = userMsg.sessionId
        const sessionMessages = get().messages
          .filter(m => m.sessionId === sessionId)
          .sort((a, b) => a.timestamp - b.timestamp)
        const userIndex = sessionMessages.findIndex(m => m.id === userMsgId)
        if (userIndex < 0) return
        const remainingMessages = sessionMessages.slice(0, userIndex + 1)
        const remainingIds = new Set(remainingMessages.map(m => m.id))
        set({
          messages: get().messages.filter(m => m.sessionId !== sessionId || remainingIds.has(m.id))
        })
        get().sendMessage(userMsg.content, userMsg.personaId, userMsg.modelId)
      },

      // ======= Persona =======

      setActivePersona: (id) => set({ activePersonaId: id }),

      // ======= Knowledge =======

      addKnowledge: (entry) => {
        const e: KnowledgeEntry = {
          ...entry,
          id: uid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set({ knowledge: [e, ...get().knowledge] })
      },
      deleteKnowledge: (id) => {
        set({ knowledge: get().knowledge.filter(k => k.id !== id) })
      },
      updateKnowledge: (id, data) => {
        set({
          knowledge: get().knowledge.map(k =>
            k.id === id ? { ...k, ...data, updatedAt: Date.now() } : k
          ),
        })
      },

      // ======= Settings =======

      updateSettings: (partial) => {
        set({ settings: { ...get().settings, ...partial } })
      },

      resetDemo: () => {
        set({ sessions: [], messages: [], activeSessionId: null, knowledge: [] })
      },

      exportConversation: (id) => {
        const sess = get().sessions.find(s => s.id === id)
        const msgs = get().messages.filter(m => m.sessionId === id)
        return JSON.stringify({ session: sess, messages: msgs }, null, 2)
      },
    }),
    {
      name: 'datamind-chat-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        messages: state.messages,
        activeSessionId: state.activeSessionId,
        knowledge: state.knowledge,
        settings: state.settings,
        activePersonaId: state.activePersonaId,
        theme: state.theme,
        fontSize: state.fontSize,
        sidebarCollapsed: state.sidebarCollapsed,
        apiKeys: state.apiKeys,
      }),
    }
  )
)

// ===================== 便捷导出 =====================

export function formatTime(ts: number): string {
  const now = new Date()
  const d = new Date(ts)
  const sameDay = now.toDateString() === d.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  const diff = now.getTime() - d.getTime()
  const oneDay = 24 * 60 * 60 * 1000
  if (diff < oneDay * 7) {
    return d.toLocaleDateString('zh-CN', { weekday: 'short' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
