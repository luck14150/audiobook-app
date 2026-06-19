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
import { getModelById, type ModelInfo } from '../lib/models'
import { chatCompletionStream, type ChatMessage as AChatMessage, type StreamingCallbacks } from '../lib/aiClient'

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
  // ⭐ 扩展知识库（10 万条，按需加载）
  externalKnowledgeLoaded: boolean
  externalKnowledgeLoading: boolean
  externalKnowledgeError: string | null
  loadExternalKnowledge: () => Promise<void>
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
  setModelById: (modelId: string) => void
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

// 默认使用 Qwen Plus（通义千问增强版，国内直连速度快）
export const DEFAULT_ACTIVE_MODEL_ID = 'qw-plus'

export const DEFAULT_SETTINGS: ApiSettings = {
  endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: 'sk-tIQbtS4899pY8zv4mtL7iAf5nBLpD6NY5AWVv8ho4vADZxZb',
  modelName: 'qwen-plus',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  systemPrompt: '',
}

// ============================================================
// 默认知识库（首次打开 APP 即有这些内容，可随时删除）
// 整理自：阿里通义千问官方文档 + 提示工程公开资料
// ============================================================

function k(id: string, title: string, content: string, category: string, tags: string[]): KnowledgeEntry {
  const now = Date.now()
  return { id, title, content, category, tags, createdAt: now, updatedAt: now }
}

export const DEFAULT_KNOWLEDGE: KnowledgeEntry[] = [
  k(
    'k-qwen-plus',
    '通义千问 Qwen Plus · 能力与使用场景',
    `【模型简介】
Qwen Plus 是阿里巴巴通义千问推出的增强版大语言模型，经过超万亿参数规模预训练，具备中文理解深度、逻辑推理、代码生成、长文档理解等能力。

【核心能力】
1. 自然语言理解与生成：对话、摘要、翻译、改写、创作
2. 代码开发：Python/JavaScript/TypeScript/Java 等多语言
3. 逻辑推理：数学运算、数据分析、多步骤推理
4. 长文档处理：支持长上下文输入，可阅读整份报告或多篇文档
5. 角色扮演：可设定角色属性，做 AI Agent 交互

【推荐使用场景】
- 日常办公：邮件撰写、会议纪要、报告整理
- 内容创作：文章、推文、故事、营销文案
- 编程辅助：代码生成、错误排查、函数解释
- 学习辅导：知识点讲解、习题解答、学习规划

【调用端点】
- API 地址：https://dashscope.aliyuncs.com/compatible-mode/v1
- 兼容格式：OpenAI Chat Completions 标准
- 模型名：qwen-plus`,
    '大模型介绍',
    ['Qwen', '通义千问', '阿里', '中文模型', '默认']
  ),
  k(
    'k-prompt-basics',
    '提示词（Prompt）基础 · 写出高质量回复',
    `【什么是提示工程】
提示工程（Prompt Engineering）是一门通过设计输入文本来引导 AI 输出高质量内容的方法。同一个问题，换一种问法，回答质量可能天差地别。

【六段式结构 · 通用模板】
1. 角色：设定 AI 要扮演的身份（如"你是一名资深前端工程师"）
2. 任务：清晰描述要完成的任务
3. 背景/上下文：补充必要信息，避免 AI 自由发挥
4. 要求/约束：输出长度、格式、语气等限制
5. 示例（可选）：给出"输入→输出"样例，提升一致性
6. 输出格式：规定最终形式（如 Markdown 列表、JSON）

【实战提示词示例】
> 你是一名资深前端工程师。请帮我将下面这段 React 代码重构为 TypeScript，并解释主要改动点。要求：保持功能不变、类型定义完善、代码风格与原文件一致。
> 代码如下：
> ...

【核心原则】
- 明确 > 模糊："写一段 150 字关于 XX 的介绍" > "写点东西"
- 有示例 > 无示例：给出期望的输出格式大幅提升质量
- 分步推理（CoT）：遇到数学/复杂问题，加一句"请先列出步骤，再给出答案"显著提升准确度

【常见误区】
- ❌ 一句话塞十几条要求，AI 很难全部满足
- ❌ 把"你很聪明"当成万能药，而不给具体信息
- ❌ 没有上下文就直接问问题，指望 AI 猜你想要什么`,
    '提示词技巧',
    ['Prompt', '提示工程', '模板', '入门']
  ),
  k(
    'k-deepseek',
    'DeepSeek · 国产开源大模型',
    `【模型简介】
DeepSeek 是深度求索推出的开源大模型，以推理能力和编程能力见长。V3 版本以更强的逻辑推理、代码理解和更低的调用成本著称，全球开源社区广泛使用。

【核心优势】
1. 推理能力顶尖：擅长数学、逻辑分析、多步骤推导
2. 代码能力强：Agentic Coding，适合复杂代码任务
3. 响应速度快：Flash 版本极速响应，适合日常问答
4. 完全开源：可本地部署，数据安全可控

【推荐使用场景】
- 数学题求解与推导步骤展示
- 复杂编程任务：调试、重构、系统设计
- 逻辑推理类问题：数据分析、方案评估
- 本地部署：需要隐私保护或离线环境

【API 使用】
- 端点：https://api.deepseek.com/v1
- 常用模型：deepseek-chat（标准版）、deepseek-reasoner（推理版）`,
    '大模型介绍',
    ['DeepSeek', '国产', '开源', '推理', '编程']
  ),
  k(
    'k-agnes',
    'Agnes AI · 无限免费的新加坡 AI 服务',
    `【服务简介】
Agnes AI 由新加坡 Sapiens AI 实验室运营，提供文本/图像/视频三大模型 API，不绑卡、不充值、无功能阉割，支持无限次调用。

【模型矩阵】
1. Agnes-2.0-Flash（文本）：日常对话、写作、代码
2. Agnes-Image-2.1（文生图）：支持多种风格的图像生成
3. Agnes-Video（文生视频）：视频生成与理解

【使用技巧】
- 中文理解表现优秀，可直接用中文提问
- 对于超长文本任务，建议分段输入后让模型整合
- 图像/视频模型与文本模型可组合使用

【API 信息】
- 端点：https://apihub.agnes-ai.com/v1
- 兼容：OpenAI Chat Completions 标准
- 费用：完全免费`,
    '大模型介绍',
    ['Agnes', '免费', '新加坡', '多模态']
  ),
  k(
    'k-kimi',
    'Kimi · 超长上下文专家',
    `【模型简介】
Kimi 由月之暗面（Moonshot）推出，特长在于超长上下文处理，支持一次输入 256K token（约 20 万字）。

【核心优势】
1. 超长上下文：可一次性阅读整本书、数十篇论文
2. 长文档问答：直接对长篇 PDF/网页内容提问，无需切分
3. 中文优化：中文理解深度与输出质量领先

【推荐场景】
- 学术论文阅读：批量阅读、要点提取、跨文对比
- 法律/合同审阅：大段文字的条款分析
- 报告整合：多篇资料合并为结构化报告

【使用建议】
- 输入长文档时，给明确的"阅读目标"，AI 会定向抓取重点
- 输出格式：先要点（3-5 条），再详细展开
- 若涉及敏感/法律内容，务必人工复核`,
    '大模型介绍',
    ['Kimi', '月之暗面', '超长上下文', '文档处理']
  ),
  k(
    'k-chinese-llms',
    '国产大模型 · 生态速览',
    `【主流国产模型一览】
1. 通义千问（阿里）：中文理解强、生态完善，新用户免费额度充足
2. DeepSeek（深度求索）：推理/编程能力顶尖，全球开源标杆
3. Kimi（月之暗面）：超长上下文，适合文档阅读
4. 豆包（字节跳动）：日常对话表现好，国内直连速度快
5. 智谱 GLM（清华系）：开源生态完善，多模态能力强
6. 文心一言（百度）：中文搜索+推理结合

【选型建议】
- 日常对话：Qwen Plus / 豆包
- 编程/推理：DeepSeek
- 长文档/报告：Kimi
- 图像/视频：Agnes Image/Video
- 免费额度优先：Qwen、DeepSeek（新用户均有免费额度）

【国内使用注意】
- 国内模型对中文理解普遍优于纯英文模型
- 不同模型适合的任务差异大，建议多尝试
- API Key 妥善保管，避免泄露`,
    '大模型介绍',
    ['国产', '生态', '对比', '选型']
  ),
  k(
    'k-coding-tips',
    '编程对话 · 让 AI 帮你写更可靠的代码',
    `【通用原则】
写代码时，给 AI 的信息越多越精确越好。

【高质量输入的 4 要素】
1. 语言与框架：明确"React + TypeScript + Tailwind"，而不是"用 JS 写个网页"
2. 上下文：贴出相关的文件片段、类型定义、已有函数
3. 目标：说明要实现什么功能、输入输出长什么样
4. 约束：性能、兼容性、代码风格、已有约定

【示例提示词】
> 你是一名资深前端工程师。我需要修改下面这个 React 组件，让它在数据加载失败时显示友好的错误提示，并提供"重试"按钮。
> 
> 1. 文件使用 TypeScript + Tailwind CSS，风格与组件保持一致
> 2. 保留现有数据流（useEffect + fetch），仅补充错误处理
> 3. 组件内已存在 isLoading，可复用
> 
> 代码：
> ...

【常见提升】
- 直接让 AI "先想清楚，再写代码"，对复杂任务准确率更高
- 涉及错误处理，明确要求"列出所有可能失败点"
- 要解释：让 AI 在输出代码后附上改动说明，便于你 Review

【要避免】
- ❌ "帮我写个网站"：太泛，产出毫无意义
- ❌ 一次塞 20 个要求：AI 会漏掉其中大部分
- ❌ 只贴错误信息，不给上下文/复现方式`,
    '实用技巧',
    ['编程', '代码', 'TypeScript', '调试']
  ),
  k(
    'k-local-engine',
    '本地智能引擎 · 没有 API Key 时怎么用',
    `【工作原理】
本地智能引擎在浏览器内基于关键词匹配和规则库进行回复，完全离线、零延迟。当你未配置 API Key、网络不可用或只想聊日常话题时，它会自动接管。

【适用场景】
- ✅ 日常闲聊、简单提问
- ✅ 测试界面、演示功能
- ✅ 网络受限的环境
- ✅ 不想消耗 API 额度的场景

【不适用场景】
- ❌ 需要真实推理的数学/逻辑题
- ❌ 需要长上下文记忆的复杂对话
- ❌ 代码开发（规则引擎无法真正理解代码）

【切换到真实模型】
在"设置"页面填入 API Key 并保存，模型会自动切换到在线模型，回复质量显著提升。你随时可以在对话中切换角色或模型，不影响当前会话。

【手动切换模型】
- 点击侧边栏顶部的模型下拉菜单
- 选择不同的模型条目
- 下次发送消息即可使用新模型`,
    '使用指南',
    ['本地', '离线', '免费', '切换模型']
  ),
  k(
    'k-context-tips',
    '上下文记忆 · 让对话更连贯',
    `【什么是上下文记忆】
AI 模型在对话中会记住你之前说过的话，但记忆长度有限（受 token 数量限制）。超出范围的内容会被"遗忘"。

【Qwen Plus 上下文】
- 推荐每段对话保持在数千字以内，避免截断
- 若是长篇内容，分段提问，而不是一次性粘贴

【保持对话质量的技巧】
1. 一个主题开一个对话：不同任务分散到不同 session，避免污染
2. 重要信息重复提：在关键问题里再次强调之前提到的约束
3. 参考资料贴全：如果基于某份文档提问，把文档原文贴进来
4. 发现 AI 忘记了早期内容？重发关键信息，不要让它猜

【何时新建会话】
- 切换到完全不相关的话题
- 当前会话已包含太多历史内容，想让模型重新聚焦
- 想保留一份"干净"的讨论副本

【Token 是什么】
Token 是大模型文本处理的基本单位（大致是 0.75 个汉字 = 1 个 token）。一条对话越长，消耗 token 越多，响应速度可能变慢。`,
    '实用技巧',
    ['上下文', '记忆', '对话', '最佳实践']
  ),
  k(
    'k-api-safe',
    'API Key 安全 · 妥善保管你的 Key',
    `【重要提醒】
API Key 像你的密码，一旦泄露可能被他人盗用产生费用。

【安全习惯】
1. 不要把 Key 贴到公开场合（GitHub、群聊、截图中）
2. 定期到各平台控制台查看使用量，发现异常立即禁用
3. 不同平台使用不同 Key，避免单点风险
4. 本应用 Key 保存在你自己浏览器的 localStorage，不上传服务器

【各平台管理入口】
- 通义千问：dashscope.console.aliyun.com
- DeepSeek：platform.deepseek.com
- Kimi：platform.moonshot.cn
- 智谱 GLM：open.bigmodel.cn
- 硅基流动：cloud.siliconflow.cn

【紧急处理】
发现异常调用：在平台控制台 → API Key 管理 → 删除/禁用可疑 Key，然后重新生成新 Key。

【费用控制】
- 大多数平台支持设置预算上限，建议设置每日限额
- 新用户免费额度消耗完后才会计费
- 日常对话消耗极低：一次问答通常仅数分钱`,
    '使用指南',
    ['安全', 'API Key', '费用', '管理']
  ),
]

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      messages: [],
      activeSessionId: null,
      personas: PERSONAS,
      activePersonaId: 'general',
      // ⭐ 首次打开即带默认知识库（用户可在知识库页面删除）
      knowledge: DEFAULT_KNOWLEDGE,
      // ⭐ 扩展知识库状态
      externalKnowledgeLoaded: false,
      externalKnowledgeLoading: false,
      externalKnowledgeError: null,
      loadExternalKnowledge: async () => {
        const st = get()
        if (st.externalKnowledgeLoading || st.externalKnowledgeLoaded) return
        set({ externalKnowledgeLoading: true, externalKnowledgeError: null })
        try {
          // 保证 GitHub Pages / 开发服务器 / localhost 都可用
          const origin = window.location.origin
          const base = origin + '/'
          const manifest = await fetch(base + 'knowledge/manifest.json').then(r => {
            if (!r.ok) throw new Error('manifest 加载失败: ' + r.status)
            return r.json()
          })
          const files: string[] = manifest.files || []
          // 每 5 个 chunk 合并一次写入 store，减少 React 重渲染
          let batch: any[] = []
          for (let i = 0; i < files.length; i++) {
            const chunk = await fetch(base + 'knowledge/' + files[i]).then(r => {
              if (!r.ok) throw new Error(files[i] + ' 加载失败: ' + r.status)
              return r.json()
            })
            if (Array.isArray(chunk)) {
              for (const e of chunk) {
                if (e && e.t && e.s) {
                  batch.push({
                    id: e.i || `k-ext-${Date.now()}-${Math.random()}`,
                    title: e.t,
                    content: e.s,
                    category: e.c || '其他',
                    tags: Array.isArray(e.g) ? e.g : [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  })
                }
              }
            }
            if ((i + 1) % 5 === 0 || i === files.length - 1) {
              if (batch.length > 0) {
                set({ knowledge: [...get().knowledge, ...batch] })
                batch = []
              }
            }
          }
          set({ externalKnowledgeLoaded: true, externalKnowledgeLoading: false })
        } catch (err: any) {
          console.warn('[知识库] 加载外部知识失败:', err?.message || err)
          set({ externalKnowledgeLoading: false, externalKnowledgeError: err?.message || '加载失败' })
        }
      },
      settings: DEFAULT_SETTINGS,
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
      fontSize: 14,
      setFontSize: (n) => set({ fontSize: n }),
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      currentModelId: DEFAULT_ACTIVE_MODEL_ID,
      currentPersonaId: 'general',
      get aiSettings() { return get().settings },
      setAiSettings: (partial) => get().updateSettings(partial),
      get currentConversationId() { return get().activeSessionId },
      setCurrentConversation: (id) => set({ activeSessionId: id }),
      setCurrentPersona: (id) => set({ activePersonaId: id }),
      setCurrentModel: (id) => set({ currentModelId: id }),

      /** 根据模型 ID 切换模型（自动更新 endpoint + modelName） */
      setModelById: (modelId: string) => {
        if (modelId === 'local-smart') {
          set({ currentModelId: 'local-smart' })
          return
        }
        const model = getModelById(modelId)
        if (model) {
          set({
            currentModelId: model.id,
            settings: {
              ...get().settings,
              endpoint: model.baseUrl,
              modelName: model.modelName,
            },
          })
        }
      },
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

        // 决定使用哪个模型
        const activeModelId = modelId || get().currentModelId

        // 构建系统消息（角色设定 + 知识库内容）
        // - 如果有知识库条目，把它们附加到 system message 的开头
        // - 只有真实模型（非本地引擎）会使用这些内容
        const knowledgePrefix = knowledge && knowledge.length > 0
          ? '\n\n下面是用户提供的知识库参考资料，回答问题时请在相关话题上优先参考这些内容：\n\n' +
            knowledge
              .slice(0, 8) // 最多取 8 条，避免 token 爆掉
              .map((k, idx) => `【资料 ${idx + 1}】${k.title}\n${k.content}`)
              .join('\n\n----------\n\n') +
            '\n'
          : ''

        const personaSystemPrompt = knowledgePrefix
          ? (persona.systemPrompt ? persona.systemPrompt + knowledgePrefix : '你是一名有帮助的助手。' + knowledgePrefix)
          : persona.systemPrompt

        const systemContent = personaSystemPrompt
          ? [{ role: 'system' as const, content: personaSystemPrompt }]
          : []

        // 构建发送给 API 的消息数组
        const apiMessages: AChatMessage[] = [
          ...systemContent,
          ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
          { role: 'user', content: text },
        ]

        // 如果是本地引擎，直接用本地回复
        if (activeModelId === 'local-smart' || activeModelId === 'local') {
          const fullReply = generateReply(text, { persona, history })
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
        }

        // 尝试真实 API 调用
        const settings = get().settings
        const hasKey = settings.apiKey && settings.apiKey.trim().length >= 8
        const hasEndpoint = settings.endpoint && settings.endpoint.trim().length > 0
        const hasModel = settings.modelName && settings.modelName.trim().length > 0

        if (hasKey && hasEndpoint && hasModel) {
          // 有 API Key，使用真实 API
          const streamCb: StreamingCallbacks = {
            onDelta: (delta) => {
              if (controller.aborted) return
              set({
                messages: get().messages.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: (m.content || '') + delta, streaming: true }
                    : m
                ),
              })
            },
            onDone: (full) => {
              set({
                messages: get().messages.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: full, streaming: false, tokens: Math.ceil(full.length * 0.75) }
                    : m
                ),
                sessions: get().sessions.map(s =>
                  s.id === sessionId ? { ...s, updatedAt: Date.now() } : s
                ),
              })
            },
            onError: (err) => {
              console.warn('[API] 调用失败，降级到本地引擎:', err)
              const localReply = generateReply(text, { persona, history })
              set({
                messages: get().messages.map((m) =>
                  m.id === assistantId ? { ...m, content: localReply, streaming: false, tokens: localReply.length } : m
                ),
              })
            },
          }

          chatCompletionStream(
            apiMessages,
            {
              endpoint: settings.endpoint + '/chat/completions',
              apiKey: settings.apiKey,
              model: settings.modelName,
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
              topP: settings.topP,
            },
            streamCb,
            undefined,
            { systemPrompt: persona.systemPrompt, name: persona.name, title: persona.name, description: persona.description }
          )
        } else {
          // 没有 API Key，检查是否有任何平台的免费模型可以尝试
          // 当前没有配置 API Key，显示引导信息
          const noKeyReply = `${persona.emoji} 我想帮你回答，但目前还没有配置 API Key。\n\n**要启用真实 AI 模型，你需要配置 API Key：**\n\n1. 点击左上角「⚙️ 设置」\n2. 在「API Key」输入框中粘贴你的 Key\n3. 推荐申请 **OpenRouter**（一个 Key 用遍 30+ 免费模型）：\n   👉 https://openrouter.ai/\n\n目前我先用本地引擎回复你，虽然也能聊，但真实模型会智能很多哦～\n\n---\n\n**免费 Key 申请顺序（推荐）：**\n1️⃣ **OpenRouter** → 一个 Key + 30+ 免费模型\n2️⃣ **DeepSeek** → 实名送 50 万次/月\n3️⃣ **智谱 GLM** → 注册送 500 万 Token\n4️⃣ **硅基流动** → 注册送大量免费 Token\n`
          const fullReply = generateReply(text, { persona, history })
          const displayReply = hasEndpoint
            ? fullReply // 有端点但无 Key，降级到本地
            : noKeyReply // 完全无配置，显示引导
          streamReply(
            displayReply,
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
        }

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
      name: 'datamind-chat-v4',
      storage: createJSONStorage(() => localStorage),
      // version 5: 彻底确保空/缺失的 knowledge 不覆盖默认知识库
      // - settings：始终使用代码中 DEFAULT_SETTINGS（不持久化、不读取）
      // - knowledge：持久化中为 [] 或 undefined → 使用 DEFAULT_KNOWLEDGE；有自定义内容 → 保留
      version: 5,
      partialize: (state) => ({
        sessions: state.sessions,
        messages: state.messages,
        activeSessionId: state.activeSessionId,
        knowledge: state.knowledge,
        activePersonaId: state.activePersonaId,
        theme: state.theme,
        fontSize: state.fontSize,
        sidebarCollapsed: state.sidebarCollapsed,
        apiKeys: state.apiKeys,
        currentModelId: state.currentModelId,
      }),
      migrate: (persistedState, version) => {
        if (version < 5 && persistedState && typeof persistedState === 'object') {
          const { settings, ...clean } = persistedState as Record<string, any>
          void settings
          return clean
        }
        return persistedState
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Record<string, any> | undefined
        const rest: Record<string, any> = {}
        let persistedKnowledge: any = undefined
        if (persisted && typeof persisted === 'object') {
          for (const key of Object.keys(persisted)) {
            if (key === 'settings') continue
            if (key === 'knowledge') { persistedKnowledge = persisted.knowledge; continue }
            rest[key] = persisted[key]
          }
        }
        const hasUserKnowledge = Array.isArray(persistedKnowledge) && persistedKnowledge.length > 0
        const mergedKnowledge = hasUserKnowledge
          ? persistedKnowledge
          : (currentState.knowledge && currentState.knowledge.length > 0 ? currentState.knowledge : DEFAULT_KNOWLEDGE)
        return {
          ...currentState,
          ...rest,
          knowledge: mergedKnowledge,
          settings: DEFAULT_SETTINGS,
        } as ChatStore
      },
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
