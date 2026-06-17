/**
 * 共享类型定义 - 前后端通用
 * 说明：所有 API 请求/响应类型统一在这里定义
 */

// ======================= 基础数据结构 =======================

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

export interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface Persona {
  id: string
  name: string
  emoji: string
  description: string
  systemPrompt: string
}

// ======================= 配置 =======================

export interface ApiSettings {
  endpoint: string
  apiKey: string
  modelName: string
  temperature: number
  maxTokens: number
  topP: number
  systemPrompt?: string
}

// ======================= API 请求 =======================

export interface ChatRequest {
  sessionId?: string
  message: string
  personaId: string
  modelId: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  knowledge?: KnowledgeEntry[]
  settings?: Partial<ApiSettings>
  stream?: boolean
}

export interface SessionCreateRequest {
  title: string
  personaId: string
  modelId: string
}

export interface KnowledgeCreateRequest {
  title: string
  content: string
  category?: string
  tags?: string[]
}

// ======================= API 响应 =======================

export interface ApiError {
  code: string
  message: string
}

// ========================================================
