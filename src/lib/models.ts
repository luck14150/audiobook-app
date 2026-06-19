/**
 * 模型配置中心
 *
 * 只保留**真实可用**的模型：
 *   1. Agnes AI（已内置 API Key，打开即用，无限免费）
 *   2. 本地智能引擎（完全免费，本地规则匹配，无需 Key）
 *   3. 各平台带免费额度的官方模型（注册即可获得免费额度）
 */

export type ModelProvider = 'agnes' | 'local' | 'doubao' | 'deepseek' | 'kimi' | 'glm' | 'qwen' | 'siliconflow'
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
  /** 是否免费（注册即有免费额度也算） */
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
  /** 排序权重（越小越靠前） */
  sortOrder: number
}

// ============================================================
// 基础 URL 常量
// ============================================================

const AG = 'https://apihub.agnes-ai.com/v1'                 // Agnes AI（新加坡 Sapiens AI，无限免费，已内置 Key）
const DB = 'https://ark.cn-beijing.volces.com/api/v3'       // 豆包（字节跳动 ARK）
const DS = 'https://api.deepseek.com/v1'                     // DeepSeek 官方
const KM = 'https://api.moonshot.cn/v1'                      // Kimi 月之暗面
const GL = 'https://open.bigmodel.cn/api/paas/v4'            // 智谱 GLM
const QW = 'https://dashscope.aliyuncs.com/compatible-mode/v1' // 通义千问
const SF = 'https://api.siliconflow.cn/v1'                   // 硅基流动（国产聚合，新用户免费额度）

// ============================================================
// 模型列表（按 sortOrder 升序）
// ============================================================

export const MODELS: ModelInfo[] = [

  // ──────────────────────────────────────────
  // ⭐ 首推（当前默认）：Qwen Plus — 阿里通义千问增强版
  // ──────────────────────────────────────────

  {
    id: 'qw-plus',
    name: '⭐ Qwen-Plus（通义千问增强版·免费额度·已配置）',
    provider: 'qwen',
    modelName: 'qwen-plus',
    baseUrl: QW,
    description: '阿里通义千问 Plus 增强版，中文理解深度更强，支持长文档推理和代码生成。国内直连，速度快，新用户免费额度充足。',
    tags: ['国产', '已配置', '免费额度', '中文最强', '推理'],
    isFree: true,
    freeQuota: '新用户免费额度，可持续领取',
    contextWindow: 128000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://dashscope.console.aliyun.com/',
    sortOrder: 1,
  },

  // ──────────────────────────────────────────
  // 🌟 备选：Agnes AI — 无限免费，随时切换
  // ──────────────────────────────────────────

  {
    id: 'agnes-2.0-flash',
    name: '🌟 Agnes-2.0-Flash（无限免费·已配置）',
    provider: 'agnes',
    modelName: 'agnes-2.0-flash',
    baseUrl: AG,
    description: '新加坡 Sapiens AI 旗舰模型，文本/图像/视频三大模型 API 无限期免费，不绑卡不充值，国内直连',
    tags: ['免费', '无限用', '快速', '已配置'],
    isFree: true,
    freeQuota: '无限期免费，无总 Token 限制',
    contextWindow: 128000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://agnes-ai.com/',
    sortOrder: 2,
  },

  // ──────────────────────────────────────────
  // 🌐 纯本地：完全免费，无需网络和 Key
  // ──────────────────────────────────────────

  {
    id: 'local-smart',
    name: '🌐 本地智能引擎（完全免费·无需 Key）',
    provider: 'local',
    modelName: 'local-smart',
    baseUrl: '/local',
    description: '基于本地规则引擎的智能助手，完全免费，响应快。适合日常闲聊、离线场景、或无法访问外部 API 时使用。',
    tags: ['完全免费', '离线可用', '无需 Key'],
    isFree: true,
    freeQuota: '无限制使用',
    contextWindow: 0,
    capabilities: ['chat'],
    requiresKey: false,
    sortOrder: 3,
  },

  // ──────────────────────────────────────────
  // 🧠 豆包（字节跳动 ARK）
  //  注册即有免费额度，国内直连速度快
  // ──────────────────────────────────────────

  {
    id: 'db-seed-lite',
    name: '🧠 豆包 Seed-Lite（字节跳动·免费额度）',
    provider: 'doubao',
    modelName: 'doubao-seed-2.0-lite',
    baseUrl: DB,
    description: '字节跳动豆包轻量版，日常对话/长文整理表现优秀，注册即有免费额度',
    tags: ['国产', '免费额度', '轻量', '中文'],
    isFree: true,
    freeQuota: '注册即有免费额度，可持续领取',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://console.volcengine.com/ark',
    sortOrder: 10,
  },
  {
    id: 'db-seed-code',
    name: '🧠 豆包 Seed-Code（字节跳动·编程专用·免费额度）',
    provider: 'doubao',
    modelName: 'doubao-seed-2.0-code',
    baseUrl: DB,
    description: '豆包编程专用版，代码生成、调试、补全表现优秀',
    tags: ['国产', '免费额度', '编程'],
    isFree: true,
    freeQuota: '注册即有免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://console.volcengine.com/ark',
    sortOrder: 11,
  },

  // ──────────────────────────────────────────
  // ⚡ DeepSeek（国产最强开源模型，官方）
  //  实名送 50 万次/月免费额度
  // ──────────────────────────────────────────

  {
    id: 'ds-v3-flash',
    name: '⚡ DeepSeek-V3-Flash（官方·极速·免费额度）',
    provider: 'deepseek',
    modelName: 'deepseek-chat',
    baseUrl: DS,
    description: 'DeepSeek 官方轻量版，响应极速，日常对话/编程性价比极高',
    tags: ['国产', '免费额度', '极速', '编程'],
    isFree: true,
    freeQuota: '实名认证送 50 万次/月免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://platform.deepseek.com/',
    sortOrder: 20,
  },
  {
    id: 'ds-v3-reasoner',
    name: '⚡ DeepSeek-R1（官方·深度推理·免费额度）',
    provider: 'deepseek',
    modelName: 'deepseek-reasoner',
    baseUrl: DS,
    description: 'DeepSeek 推理版，全球开源顶级推理能力，适合数学/逻辑/代码深度分析',
    tags: ['国产', '免费额度', '推理', '编程最强'],
    isFree: true,
    freeQuota: '实名认证送免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://platform.deepseek.com/',
    sortOrder: 21,
  },

  // ──────────────────────────────────────────
  // 📚 Kimi（月之暗面，超长上下文）
  //  新用户有免费额度
  // ──────────────────────────────────────────

  {
    id: 'km-k25',
    name: '📚 Kimi-K2.5（官方·超长上下文·免费额度）',
    provider: 'kimi',
    modelName: 'kimi-k2.5',
    baseUrl: KM,
    description: '月之暗面 Kimi，256K 超长上下文，适合整本书/长文档分析',
    tags: ['国产', '免费额度', '超长上下文', '分析'],
    isFree: true,
    freeQuota: '新用户即有免费额度',
    contextWindow: 256000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://platform.moonshot.cn/',
    sortOrder: 30,
  },

  // ──────────────────────────────────────────
  // 🧩 智谱 GLM
  //  新用户 100 万 Token + 实名额外 400 万
  // ──────────────────────────────────────────

  {
    id: 'gl-5-flash',
    name: '🧩 GLM-5-Flash（官方·轻量·免费额度）',
    provider: 'glm',
    modelName: 'glm-5-flash',
    baseUrl: GL,
    description: '智谱 GLM-5 轻量版，免费额度高，中文理解能力强',
    tags: ['国产', '免费额度', '轻量', '中文'],
    isFree: true,
    freeQuota: '新用户 100 万 Token + 实名额外 400 万',
    contextWindow: 128000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://open.bigmodel.cn/',
    sortOrder: 40,
  },

  // ──────────────────────────────────────────
  // 🌀 通义千问 Qwen
  //  开源版永久免费
  // ──────────────────────────────────────────

  {
    id: 'qw-25-7b',
    name: '🌀 Qwen2.5-7B（通义千问·开源·永久免费）',
    provider: 'qwen',
    modelName: 'qwen2.5-7b-instruct',
    baseUrl: QW,
    description: '阿里通义千问开源 7B 版，中文能力极强，永久免费调用',
    tags: ['国产', '免费', '开源', '中文'],
    isFree: true,
    freeQuota: '永久免费调用（需注册通义千问账号）',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://dashscope.console.aliyun.com/',
    sortOrder: 50,
  },
  {
    id: 'qw-25-14b',
    name: '🌀 Qwen2.5-14B（通义千问·开源·永久免费）',
    provider: 'qwen',
    modelName: 'qwen2.5-14b-instruct',
    baseUrl: QW,
    description: '阿里通义千问开源 14B 版，能力更强，永久免费调用',
    tags: ['国产', '免费', '开源', '更强'],
    isFree: true,
    freeQuota: '每月 100 万 Token 免费额度',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://dashscope.console.aliyun.com/',
    sortOrder: 51,
  },

  // ──────────────────────────────────────────
  // 🔬 硅基流动（国产聚合平台）
  //  新用户免费额度
  // ──────────────────────────────────────────

  {
    id: 'sf-qwen25-7b',
    name: '🔬 Qwen2.5-7B（硅基流动·开源·免费额度）',
    provider: 'siliconflow',
    modelName: 'Qwen/Qwen2.5-7B-Instruct',
    baseUrl: SF,
    description: '通义千问开源版，硅基流动平台调用，新用户即有免费额度',
    tags: ['国产', '免费额度', '开源'],
    isFree: true,
    freeQuota: '新用户免费额度',
    contextWindow: 32000,
    capabilities: ['chat'],
    requiresKey: true,
    signupUrl: 'https://siliconflow.cn/',
    sortOrder: 60,
  },
  {
    id: 'sf-deepseek-v3',
    name: '🔬 DeepSeek-V3（硅基流动·国产最强·免费额度）',
    provider: 'siliconflow',
    modelName: 'deepseek-ai/DeepSeek-V3',
    baseUrl: SF,
    description: 'DeepSeek 国产最强开源模型，硅基流动平台调用',
    tags: ['国产', '免费额度', '推理', '编程'],
    isFree: true,
    freeQuota: '新用户免费额度',
    contextWindow: 64000,
    capabilities: ['chat', 'code'],
    requiresKey: true,
    signupUrl: 'https://siliconflow.cn/',
    sortOrder: 61,
  },

]

// ============================================================
// 工具函数
// ============================================================

/** 按 sortOrder 排序的模型列表（用于下拉选择） */
export const SORTED_MODELS = [...MODELS].sort((a, b) => a.sortOrder - b.sortOrder)

/** 免费模型列表（包含 Agnes + 本地引擎 + 各平台带免费额度的模型） */
export const FREE_MODELS = SORTED_MODELS.filter(m => m.isFree)

/** 按平台分组 */
export function getModelsByProvider(provider: ModelProvider): ModelInfo[] {
  return SORTED_MODELS.filter(m => m.provider === provider)
}

/** 根据 ID 查找模型 */
export function getModelById(id: string): ModelInfo | undefined {
  return MODELS.find(m => m.id === id)
}

/** 默认启用的模型（Qwen Plus） */
export const DEFAULT_ACTIVE_MODEL_ID = 'qw-plus'

/** 各平台基础 URL（方便其他文件引用） */
export const AGNES_API_URL = AG
export const DOUBAO_API_URL = DB
export const DEEPSEEK_API_URL = DS
export const KIMI_API_URL = KM
export const GLM_API_URL = GL
export const QWEN_API_URL = QW
export const SILICONFLOW_API_URL = SF

/** 获取某平台的默认 Key 存储键名 */
export function getPlatformKeyName(provider: ModelProvider): string {
  const names: Record<ModelProvider, string> = {
    agnes: 'api_key_agnes',
    doubao: 'api_key_doubao',
    deepseek: 'api_key_deepseek',
    kimi: 'api_key_kimi',
    glm: 'api_key_glm',
    qwen: 'api_key_qwen',
    siliconflow: 'api_key_siliconflow',
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
