export { useChatStore, formatTime } from './chatStore'
export type { ChatMessage, ChatSession } from './chatStore'
export { useAuthStore } from './authStore'

export const PERSONAS: Array<{ id: string; name: string; emoji: string; description: string; systemPrompt: string; sampleQuestions?: string[]; color?: string }> = [
  { id: 'general', name: '通用助手', emoji: '🤖', description: '知识全面', systemPrompt: '你是一个友好的 AI 助手', color: 'indigo' },
]

export const AI_MODELS: Record<string, { name: string; description: string }> = {
  'doubao-pro-250615': { name: '豆包 Pro', description: '高性能通用模型' },
}

export const MODEL_NAME_MAP: Record<string, string> = {
  default: 'doubao-pro-250615',
}

export const chatStoreKnowledge: Array<{ id: string; title: string; content: string; category: string; tags: string[] }> = []

export type Persona = { id: string; name: string; emoji: string; description: string; systemPrompt: string; sampleQuestions?: string[]; color?: string }
export type Message = { id: string; sessionId: string; role: 'user' | 'assistant' | 'system'; content: string; personaId?: string; modelId?: string; timestamp: number; tokens?: number; streaming?: boolean; edited?: boolean; conversationId?: string }
export type Conversation = { id: string; title: string; personaId: string; modelId: string; createdAt: number; updatedAt: number; messageCount: number; pinned?: boolean; deleted?: boolean }
export type ApiKey = { id: string; name: string; key: string; createdAt: number; active?: boolean }
export type AiSettings = { endpoint: string; apiKey: string; modelName: string; temperature: number; maxTokens: number; topP: number; systemPrompt?: string }
export type AIModel = { id: string; name: string; description: string }
export type UsageData = { tokens: number; messages: number; sessions: number }
export type KnowledgeItem = { id: string; title: string; content: string; category: string; tags: string[] }
