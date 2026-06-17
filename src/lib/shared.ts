/**
 * 共享类型 - 前后端通用
 */

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
  sampleQuestions?: string[]
  greeting?: string
}

export interface ApiSettings {
  endpoint: string
  apiKey: string
  modelName: string
  temperature: number
  maxTokens: number
  topP: number
  systemPrompt?: string
}
