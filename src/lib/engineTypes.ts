// ============================================================
// AI Engine 类型定义
// 提供：模型枚举、API 配置、流式回调、上下文消息等核心类型
// 严格 TypeScript 模式：禁用 implicit any，尽量使用精确类型
// ============================================================

/** 内置支持的模型 ID 枚举（与 chatStore 中 AI_MODELS 一一对应） */
export type AIModelId =
  | 'doubao-seed'
  | 'doubao-pro-250615'
  | 'doubao-lite'
  | 'doubao-code'
  | 'gpt-mini'
  | 'custom'

/** 对话消息角色 */
export type ChatRole = 'system' | 'user' | 'assistant'

/** 标准聊天消息对象（与 OpenAI / 豆包 火山方舟 API 兼容） */
export interface ChatMessage {
  /** 消息角色：系统提示 / 用户 / 助手 */
  role: ChatRole
  /** 消息文本内容 */
  content: string
}

/** API 配置：包含端点、密钥、模型名、采样参数 */
export interface APIConfig {
  /** API 基础 URL（如 https://ark.cn-beijing.volces.com/api/v3），
   *  引擎会自动拼接 /chat/completions */
  endpoint: string
  /** API Key（Bearer 鉴权） */
  apiKey: string
  /** 实际模型名（如 doubao-pro-250615、gpt-4o-mini 等） */
  modelName: string
  /** 采样温度（0 - 2，越大越有创造性） */
  temperature?: number
  /** 单次回复最大 token 数 */
  maxTokens?: number
  /** top_p 核采样（0 - 1） */
  topP?: number
  /** 全局附加的 system prompt（可选，会拼在角色 systemPrompt 之前） */
  systemPrompt?: string
}

/** 流式回调：onDelta 每收到增量文本触发，onDone 完成后触发，onError 出错时触发 */
export interface StreamingCallbacks {
  /** 收到部分文本（可能是一个或多个字符） */
  onDelta: (chunk: string) => void
  /** 流式结束，参数为完整文本 */
  onDone: (fullText: string) => void
  /** 发生错误，参数为 Error 对象或错误消息 */
  onError: (err: Error | string) => void
}

/** 简化的 Persona 类型（供引擎使用，避免与 store 产生强耦合） */
export interface EnginePersona {
  /** 角色唯一 ID（如 'general' / 'coder'），决定回复风格 */
  id: string
  /** 角色显示名（用于本地回退时的文案） */
  name: string
  /** 角色 emoji */
  emoji: string
  /** 角色的 system prompt（写入真实 API 的 system 消息） */
  systemPrompt: string
}

/** 对话历史消息（简化版，仅引擎必需字段） */
export interface HistoryMessage {
  /** 消息角色 */
  role: ChatRole
  /** 消息内容 */
  content: string
  /** 可选的时间戳，用于排序 */
  timestamp?: number
}

/** 知识库注入内容（可选） */
export interface KnowledgeSnippet {
  /** 知识源名称/文档标题 */
  source?: string
  /** 知识文本片段 */
  content: string
}

/** 语言检测结果 */
export type DetectLanguage = 'zh' | 'en' | 'ja' | 'ko' | 'other'

/** 代码块提取结果 */
export interface CodeBlock {
  /** 代码语言标识（可能为空字符串） */
  language: string
  /** 代码内容（不包含 ``` 围栏） */
  code: string
}

/** SSE 流式解析的原始事件 */
export interface SSEEvent {
  /** 事件名（默认为 'message'） */
  event?: string
  /** data 字段（JSON 字符串或 '[DONE]'） */
  data: string
}
