/**
 * 模型配置中心
 *
 * 包含 20+ 模型，分为三大类：
 * 1. OpenRouter 聚合（一个 key 调用 30+ 免费模型，最推荐）
 * 2. 各大厂商官方（独立 key，独立端点）
 * 3. 本地引擎（完全免费，离线可用）
 */

export type ModelProvider = 'openrouter' | 'siliconflow' | 'doubao' | 'deepseek' | 'kimi' | 'glm' | 'qwen' | 'local'
export type ModelCapability = 'chat' | 'code' | 'vision' | 'embedding'

export interface ModelInfo {
  id: string
  name: string
  provider: ModelProvider
  /** OpenAI-compatible model name */
  modelName: string
  /** OpenAI-compatible base URL */
  baseUrl: string
  /** 显示描述 */
  description: string
  /** 擅长领域标签 */
  tags: string[]
  /** 是否免费 */
  isFree: boolean
  /** 免费额度说明 */
  freeQuota?: string
  /** 上下文窗口（token） */
  contextWindow?: number
  /** 能力标志 */
  capabilities: ModelCapability[]
  /** API Key 是否必填 */
  requiresKey: boolean
  /** 官方申请地址 */
  signupUrl?: string
  /** 排序权重（越大越靠前） */
  sortOrder: number
}

// ============================================================
// 基础 URL 常量
// ============================================================

const OR = 'https://openrouter.ai/api/v1'          // OpenRouter
const SF = 'https://api.siliconflow.cn/v1'         // 硅基流动 SiliconFlow
const DB = 'https://ark.cn-beijing.volces.com/api/v3' // 豆包（字节ARK）
const DS = 'https://api.deepseek.com/v1'            // DeepSeek
const KM = 'https://api.moonshot.cn/v1'             // 月之暗面 Kimi
const GL = 'https://open.bigmodel.cn/api/paas/v4'   // 智谱 GLM
const QW = 'https://dashscope.aliyuncs.com/compatible-mode/v1' // 通义千问

// ============================================================
// 模型列表（按 sortOrder 升序）
// ============================================================

export const MODELS: ModelInfo[] = [

  // ──────────────────────────────────────────
  // 🔥 OpenRouter 聚合平台（一个 Key，免费模型最多）
  // ──────────────────────────────────────────

  {
    id: 'or-free-001',
    name: 'Step-3.5-Flash（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'stepfun/step-step-3.5-flash',
    baseUrl: OR,
    description: '阶跃星辰 Step-3.5，国产之光，速度极快，完全免费',
    tags: ['国产', '免费', '快速', '日常'],
    isFree: true,
    freeQuota: '每日免费调用（free 标签）',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 10,
  },
  {
    id: 'or-deepseek-r1',
    name: 'DeepSeek-R1-Distill（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'deepseek/deepseek-r1-distill-qwen-32b',
    baseUrl: OR,
    description: 'DeepSeek 蒸馏版，逻辑推理能力强，免费使用',
    tags: ['推理', '免费', '数学', '代码'],
    isFree: true,
    freeQuota: '免费（free 标签）',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 11,
  },
  {
    id: 'or-qwen25-7b',
    name: 'Qwen2.5-7B（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'qwen/qwen-2.5-7b-instruct',
    baseUrl: OR,
    description: '阿里通义千问开源版，中文能力极强，免费调用',
    tags: ['国产', '免费', '中文', '对话'],
    isFree: true,
    freeQuota: '免费（free 标签）',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 12,
  },
  {
    id: 'or-glm4-9b',
    name: 'GLM-4-9B-Chat（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'thudm/glm-4-9b-chat',
    baseUrl: OR,
    description: '智谱 GLM 开源版，长文本理解能力强，免费',
    tags: ['国产', '免费', '长文本', '分析'],
    isFree: true,
    freeQuota: '免费（free 标签）',
    contextWindow: 128000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 13,
  },
  {
    id: 'or-llama31-8b',
    name: 'Llama-3.1-8B（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'meta-llama/llama-3.1-8b-instruct',
    baseUrl: OR,
    description: 'Meta 开源 LLM，通用能力强，免费',
    tags: ['免费', '开源', '通用', '英文'],
    isFree: true,
    freeQuota: '免费（free 标签）',
    contextWindow: 128000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 14,
  },
  {
    id: 'or-kimi-k25',
    name: 'Kimi-K2.5（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'moonshot/kimi-k2.5',
    baseUrl: OR,
    description: '月之暗面 Kimi K2.5，完全开源免费，中文优化',
    tags: ['国产', '免费', '开源', '长文本'],
    isFree: true,
    freeQuota: '免费（free 标签）',
    contextWindow: 256000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 15,
  },
  {
    id: 'or-gpt4o-mini',
    name: 'GPT-4o-mini（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'openai/gpt-4o-mini',
    baseUrl: OR,
    description: 'OpenAI 最新小模型，能力均衡，免费调用',
    tags: ['免费', '快速', '均衡'],
    isFree: true,
    freeQuota: '免费（free 标签）',
    contextWindow: 128000,
    capabilities: ['chat', 'vision'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 16,
  },
  {
    id: 'or-grok-beta',
    name: 'Grok-2-Beta（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'x-ai/grok-2-beta',
    baseUrl: OR,
    description: 'xAI Grok 系列，实时信息能力强，免费',
    tags: ['免费', '实时', '前沿'],
    isFree: true,
    freeQuota: '免费（free 标签）',
    contextWindow: 131000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 17,
  },
  {
    id: 'or-perplexity',
    name: 'Sonar（OpenRouter免费）',
    provider: 'openrouter',
    modelName: 'perplexity/sonar',
    baseUrl: OR,
    description: 'Perplexity 开源版，擅长搜索和实时问答，免费',
    tags: ['免费', '搜索', '实时'],
    isFree: true,
    freeQuota: '免费（free 标签）',
    contextWindow: 127000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://openrouter.ai/',
    sortOrder: 18,
  },

  // ──────────────────────────────────────────
  // 硅基流动 SiliconFlow（国产聚合平台，DeepSeek/GLM/Qwen）
  // ──────────────────────────────────────────

  {
    id: 'sf-deepseek-v4-flash',
    name: 'DeepSeek-V4-Flash（硅基流动）',
    provider: 'siliconflow',
    modelName: 'deepseek-ai/DeepSeek-V4-Flash',
    baseUrl: SF,
    description: 'DeepSeek 最新 Flash 版，284B 参数，超长上下文，支持 1M token',
    tags: ['国产', 'Flash', '超长上下文', '极速'],
    isFree: false,
    freeQuota: '注册送大量免费 Token（持续领取）',
    contextWindow: 1024000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://siliconflow.cn/',
    sortOrder: 20,
  },
  {
    id: 'sf-deepseek-v4-pro',
    name: 'DeepSeek-V4-Pro（硅基流动）',
    provider: 'siliconflow',
    modelName: 'deepseek-ai/DeepSeek-V4-Pro',
    baseUrl: SF,
    description: 'DeepSeek 旗舰版，1.6T 总参数，49B 激活参数，顶尖编程能力',
    tags: ['旗舰', '超强编程', 'Agent'],
    isFree: false,
    freeQuota: '注册送大量免费 Token',
    contextWindow: 1024000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://siliconflow.cn/',
    sortOrder: 21,
  },
  {
    id: 'sf-glm-5',
    name: 'GLM-5（硅基流动）',
    provider: 'siliconflow',
    modelName: 'zhipuai/glm-5',
    baseUrl: SF,
    description: '智谱 GLM-5，集成了 DeepSeek Sparse Attention，开源最强',
    tags: ['国产', '开源', '分析'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 128000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://siliconflow.cn/',
    sortOrder: 22,
  },
  {
    id: 'sf-glm-5v',
    name: 'GLM-5V-Turbo（硅基流动）',
    provider: 'siliconflow',
    modelName: 'zhipuai/glm-5v-turbo',
    baseUrl: SF,
    description: '智谱 GLM-5 多模态版，支持图片理解和分析',
    tags: ['国产', '多模态', '图片'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 64000,
    capabilities: ['chat', 'vision'],
    requiresKey: true,
    signupUrl: 'https://siliconflow.cn/',
    sortOrder: 23,
  },
  {
    id: 'sf-kimi-k26',
    name: 'Kimi-K2.6（硅基流动）',
    provider: 'siliconflow',
    modelName: 'moonshotai/Kimi-K2.6',
    baseUrl: SF,
    description: '月之暗面 Kimi K2.6，超长上下文 256K，MoE 万亿参数',
    tags: ['国产', '超长上下文', 'Agent'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 256000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://siliconflow.cn/',
    sortOrder: 24,
  },
  {
    id: 'sf-minimax-m25',
    name: 'MiniMax-M2.5（硅基流动）',
    provider: 'siliconflow',
    modelName: 'minimax/MiniMax-M2.5',
    baseUrl: SF,
    description: 'MiniMax 最新 MoE 模型，2290 亿参数，顶级编程能力',
    tags: ['国产', '顶级编程', 'Agent'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 1000000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://siliconflow.cn/',
    sortOrder: 25,
  },

  // ──────────────────────────────────────────
  // 豆包（字节跳动）
  // ──────────────────────────────────────────

  {
    id: 'db-seed-20-lite',
    name: 'Doubao-Seed-2.0-Lite（豆包官方）',
    provider: 'doubao',
    modelName: 'doubao-seed-2.0-lite',
    baseUrl: DB,
    description: '豆包 Seed 2.0 轻量版，免费额度充足，适合日常聊天和长文整理',
    tags: ['国产', '免费', '轻量', '日常'],
    isFree: true,
    freeQuota: '新用户免费额度（持续领取）',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://console.volcengine.com/ark',
    sortOrder: 30,
  },
  {
    id: 'db-seed-20-code',
    name: 'Doubao-Seed-2.0-Code（豆包官方）',
    provider: 'doubao',
    modelName: 'doubao-seed-2.0-code',
    baseUrl: DB,
    description: '豆包 Seed 2.0 编程版，专为代码生成和调试优化，字节自研',
    tags: ['国产', '编程', '代码'],
    isFree: true,
    freeQuota: '新用户免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://console.volcengine.com/ark',
    sortOrder: 31,
  },
  {
    id: 'db-seed-20-pro',
    name: 'Doubao-Seed-2.0-Pro（豆包官方）',
    provider: 'doubao',
    modelName: 'doubao-seed-2.0-pro',
    baseUrl: DB,
    description: '豆包 Seed 2.0 专业版，适合复杂推理和分析任务',
    tags: ['国产', '专业', '推理'],
    isFree: false,
    freeQuota: '新用户免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://console.volcengine.com/ark',
    sortOrder: 32,
  },

  // ──────────────────────────────────────────
  // DeepSeek 官方
  // ──────────────────────────────────────────

  {
    id: 'ds-v4-flash',
    name: 'DeepSeek-V4-Flash（官方）',
    provider: 'deepseek',
    modelName: 'deepseek-chat',
    baseUrl: DS,
    description: 'DeepSeek 官方 Flash 版，响应极速，284B 参数，性价比极高',
    tags: ['极速', '编程', '推理'],
    isFree: false,
    freeQuota: '实名认证送 50 万次/月免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://platform.deepseek.com/',
    sortOrder: 40,
  },
  {
    id: 'ds-v4-pro',
    name: 'DeepSeek-V4-Pro（官方）',
    provider: 'deepseek',
    modelName: 'deepseek-reasoner',
    baseUrl: DS,
    description: 'DeepSeek 官方 Pro 版，深度推理能力登顶，1.6T 总参数',
    tags: ['旗舰', '深度推理', '编程最强'],
    isFree: false,
    freeQuota: '实名认证送 50 万次/月免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://platform.deepseek.com/',
    sortOrder: 41,
  },
  {
    id: 'ds-coder',
    name: 'DeepSeek-Coder-V2.5（官方）',
    provider: 'deepseek',
    modelName: 'deepseek-coder',
    baseUrl: DS,
    description: 'DeepSeek 专用编程模型，代码生成和补全能力极强',
    tags: ['编程', '代码', '极速'],
    isFree: false,
    freeQuota: '实名认证送免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://platform.deepseek.com/',
    sortOrder: 42,
  },

  // ──────────────────────────────────────────
  // Kimi 月之暗面
  // ──────────────────────────────────────────

  {
    id: 'km-k25-open',
    name: 'Kimi-K2.5（官方开源版）',
    provider: 'kimi',
    modelName: 'kimi-k2.5',
    baseUrl: KM,
    description: '月之暗面 Kimi K2.5 开源版，MoE 万亿参数，上下文 256K，免费使用',
    tags: ['国产', '开源', '超长上下文'],
    isFree: true,
    freeQuota: '完全免费，直接使用',
    contextWindow: 256000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://platform.moonshot.cn/',
    sortOrder: 50,
  },
  {
    id: 'km-k27-code',
    name: 'Kimi-K2.7-Code（官方）',
    provider: 'kimi',
    modelName: 'kimi-k2.7-code',
    baseUrl: KM,
    description: '月之暗面 Kimi K2.7 Code 编程版，1.1 万亿参数，256K 上下文，解决长程任务',
    tags: ['国产', '编程', '超长任务'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 256000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://platform.moonshot.cn/',
    sortOrder: 51,
  },
  {
    id: 'km-k26',
    name: 'Kimi-K2.6（官方）',
    provider: 'kimi',
    modelName: 'kimi-k2.6',
    baseUrl: KM,
    description: '月之暗面 Kimi K2.6，MoE 万亿参数，超长上下文 256K',
    tags: ['国产', '超长上下文', 'Agent'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 256000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://platform.moonshot.cn/',
    sortOrder: 52,
  },
  {
    id: 'km-k25-pro',
    name: 'Kimi-K2.5-Pro（官方）',
    provider: 'kimi',
    modelName: 'kimi-k2.5-pro',
    baseUrl: KM,
    description: '月之暗面 Kimi K2.5 专业版，全面增强的中文理解和推理能力',
    tags: ['国产', '专业', '推理'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 256000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://platform.moonshot.cn/',
    sortOrder: 53,
  },

  // ──────────────────────────────────────────
  // 智谱 GLM
  // ──────────────────────────────────────────

  {
    id: 'gl-5-flash',
    name: 'GLM-5-Flash（官方）',
    provider: 'glm',
    modelName: 'glm-5-flash',
    baseUrl: GL,
    description: '智谱 GLM-5 Flash 版，免费额度高，中文理解能力强',
    tags: ['国产', '免费', '中文'],
    isFree: true,
    freeQuota: '新用户 100 万 Token + 实名额外 400 万',
    contextWindow: 128000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://open.bigmodel.cn/',
    sortOrder: 60,
  },
  {
    id: 'gl-5',
    name: 'GLM-5（官方）',
    provider: 'glm',
    modelName: 'glm-5',
    baseUrl: GL,
    description: '智谱 GLM-5 完整版，集成了 DeepSeek Sparse Attention，开源最强',
    tags: ['国产', '开源', '分析'],
    isFree: false,
    freeQuota: '新用户 100 万 Token + 实名额外 400 万',
    contextWindow: 128000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://open.bigmodel.cn/',
    sortOrder: 61,
  },
  {
    id: 'gl-5v-turbo',
    name: 'GLM-5V-Turbo（官方）',
    provider: 'glm',
    modelName: 'glm-5v-turbo',
    baseUrl: GL,
    description: '智谱 GLM-5V 多模态版，支持图片理解和对话',
    tags: ['国产', '多模态', '图片'],
    isFree: false,
    freeQuota: '新用户免费 Token',
    contextWindow: 64000,
    capabilities: ['chat', 'vision'],
    requiresKey: true,
    signupUrl: 'https://open.bigmodel.cn/',
    sortOrder: 62,
  },

  // ──────────────────────────────────────────
  // 通义千问 Qwen
  // ──────────────────────────────────────────

  {
    id: 'qw-25-7b',
    name: 'Qwen2.5-7B（官方免费）',
    provider: 'qwen',
    modelName: 'qwen2.5-7b-instruct',
    baseUrl: QW,
    description: '阿里通义千问开源 7B 版，中文能力极强，永久免费',
    tags: ['国产', '免费', '开源', '中文'],
    isFree: true,
    freeQuota: '永久免费，无限制',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://dashscope.console.aliyun.com/',
    sortOrder: 70,
  },
  {
    id: 'qw-25-14b',
    name: 'Qwen2.5-14B（官方免费）',
    provider: 'qwen',
    modelName: 'qwen2.5-14b-instruct',
    baseUrl: QW,
    description: '阿里通义千问开源 14B 版，能力更强，永久免费',
    tags: ['国产', '免费', '开源', '更强'],
    isFree: true,
    freeQuota: '每月 100 万 Token 免费额度',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://dashscope.console.aliyun.com/',
    sortOrder: 71,
  },
  {
    id: 'qw-25-72b',
    name: 'Qwen2.5-72B（官方）',
    provider: 'qwen',
    modelName: 'qwen2.5-72b-instruct',
    baseUrl: QW,
    description: '阿里通义千问开源 72B 版，千亿参数，中文顶尖',
    tags: ['国产', '开源', '千亿参数'],
    isFree: false,
    freeQuota: '每月 50 万 Token 免费额度',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://dashscope.console.aliyun.com/',
    sortOrder: 72,
  },
  {
    id: 'qw-36-plus',
    name: 'Qwen3.6-Plus（官方）',
    provider: 'qwen',
    modelName: 'qwen3-6-plus',
    baseUrl: QW,
    description: '阿里通义千问 Qwen3 系列增强版，中文理解大幅提升',
    tags: ['国产', '最新', '增强'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 64000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://dashscope.console.aliyun.com/',
    sortOrder: 73,
  },
  {
    id: 'qw-37-plus',
    name: 'Qwen3.7-Plus（官方）',
    provider: 'qwen',
    modelName: 'qwen3-7-plus',
    baseUrl: QW,
    description: '阿里通义千问 Qwen3 系列旗舰版，最新最强中文模型',
    tags: ['国产', '旗舰', '最强中文'],
    isFree: false,
    freeQuota: '注册送免费 Token',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://dashscope.console.aliyun.com/',
    sortOrder: 74,
  },

  // ──────────────────────────────────────────
  // TRAE（字节 Auto）
  // ──────────────────────────────────────────

  {
    id: 'trae-auto',
    name: 'TRAE-Auto（字节官方免费）',
    provider: 'doubao',
    modelName: 'auto',
    baseUrl: DB,
    description: 'TRAE 内置 Auto 模型，字节跳动全模型套件，2026年6月宣布全量免费开放，永久免费',
    tags: ['国产', '免费', 'Auto', '全模型'],
    isFree: true,
    freeQuota: '永久免费，无总 Token 限制（仅限请求速率限制）',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://trae.cn/',
    sortOrder: 5,
  },

  // ──────────────────────────────────────────
  // 本地智能引擎（完全免费，无需 API Key）
  // ──────────────────────────────────────────

  {
    id: 'local-smart',
    name: '🌐 本地智能引擎（完全免费）',
    provider: 'local',
    modelName: 'local-smart',
    baseUrl: '/local',
    description: '基于本地规则引擎的智能助手，无需 API Key，完全免费，响应快。适合不联网的场景或日常闲聊。',
    tags: ['完全免费', '离线可用', '无需 Key'],
    isFree: true,
    freeQuota: '无限制使用',
    contextWindow: 0,
    capabilities: ['chat'],
    requiresKey: false,
    sortOrder: 1,
  },
]

// ============================================================
// 工具函数
// ============================================================

/** 按 sortOrder 排序的模型列表（用于下拉选择） */
export const SORTED_MODELS = [...MODELS].sort((a, b) => a.sortOrder - b.sortOrder)

/** 仅免费模型 */
export const FREE_MODELS = SORTED_MODELS.filter(m => m.isFree)

/** 按平台分组 */
export function getModelsByProvider(provider: ModelProvider): ModelInfo[] {
  return SORTED_MODELS.filter(m => m.provider === provider)
}

/** 根据 ID 查找模型 */
export function getModelById(id: string): ModelInfo | undefined {
  return MODELS.find(m => m.id === id)
}

/** 推荐使用的默认免费模型（sortOrder 最小的免费模型） */
export const RECOMMENDED_FREE_MODEL = FREE_MODELS[0]

/** OpenRouter API URL */
export const OPENROUTER_API_URL = OR
/** SiliconFlow API URL */
export const SILICONFLOW_API_URL = SF
/** 豆包 API URL */
export const DOUBAO_API_URL = DB
/** DeepSeek API URL */
export const DEEPSEEK_API_URL = DS
/** Kimi API URL */
export const KIMI_API_URL = KM
/** GLM API URL */
export const GLM_API_URL = GL
/** 通义千问 API URL */
export const QWEN_API_URL = QW

/** 获取某平台的默认 Key 存储键名 */
export function getPlatformKeyName(provider: ModelProvider): string {
  const names: Record<ModelProvider, string> = {
    openrouter: 'api_key_openrouter',
    siliconflow: 'api_key_siliconflow',
    doubao: 'api_key_doubao',
    deepseek: 'api_key_deepseek',
    kimi: 'api_key_kimi',
    glm: 'api_key_glm',
    qwen: 'api_key_qwen',
    local: '',
  }
  return names[provider]
}

/** 获取模型的 API URL（不带 /chat/completions 后缀） */
export function getModelBaseUrl(modelId: string): string {
  const model = getModelById(modelId)
  return model?.baseUrl ?? ''
}

/** 获取模型的 OpenAI model name */
export function getModelName(modelId: string): string {
  const model = getModelById(modelId)
  return model?.modelName ?? ''
}
