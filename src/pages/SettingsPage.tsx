import React, { useEffect, useMemo, useState } from 'react'
import { useChatStore } from '../stores'
import {
  Brain,
  Key,
  Globe,
  Zap,
  Sliders,
  Save,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  RefreshCw,
  Download,
  Moon,
  Sun,
  ChevronDown,
  Star,
  Crown,
  ZapOff,
  ExternalLink,
  Sparkles,
  Code,
  BookOpen,
} from 'lucide-react'
import { MODELS, SORTED_MODELS, FREE_MODELS, getModelById, RECOMMENDED_FREE_MODEL } from '../lib/models'
import { DEFAULT_SETTINGS, DEFAULT_ACTIVE_MODEL_ID } from '../stores/chatStore'

// 🔑 Agnes AI 配置——直接在本文件硬编码，确保不依赖任何外部状态
// （本常量在 SettingsPage 初始化本地 state 时直接使用）
const HARDCODED_API_KEY = 'sk-tIQbtS4899pY8zv4mtL7iAf5nBLpD6NY5AWVv8ho4vADZxZb'

interface Preset {
  label: string
  endpoint: string
  model: string
}

const PRESETS: Preset[] = [
  { label: '豆包（火山方舟）', endpoint: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-250615' },
  { label: 'OpenAI 兼容', endpoint: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
]

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 10_000) return (n / 10_000).toFixed(2) + '万'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function downloadJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 模型选项行组件 */
function FreeModelOption({
  model,
  selected,
  onSelect,
}: {
  model: (typeof MODELS)[0]
  selected: boolean
  onSelect: () => void
}) {
  const tagIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    国产: () => <span className="text-[10px] px-1 py-0.5 bg-red-100 text-red-600 rounded">国产</span>,
    免费: () => <span className="text-[10px] px-1 py-0.5 bg-green-100 text-green-600 rounded">免费</span>,
    编程: () => <span className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-600 rounded">编程</span>,
    开源: () => <span className="text-[10px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded">开源</span>,
    旗舰: () => <span className="text-[10px] px-1 py-0.5 bg-amber-100 text-amber-600 rounded">旗舰</span>,
    Flash: () => <span className="text-[10px] px-1 py-0.5 bg-orange-100 text-orange-600 rounded">Flash</span>,
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition text-left border-b border-slate-100 last:border-b-0 ${
        selected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="font-bold text-primary text-sm leading-tight">{model.name}</div>
          {selected && <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
        </div>
        <div className="text-xs text-secondary leading-tight mb-1">{model.description}</div>
        <div className="flex flex-wrap gap-1">
          {model.tags.slice(0, 3).map(tag => {
            const Icon = tagIcons[tag]
            return Icon ? (
              <Icon key={tag} />
            ) : (
              <span key={tag} className="text-[10px] px-1 py-0.5 bg-slate-100 text-slate-500 rounded">{tag}</span>
            )
          })}
          {model.contextWindow && model.contextWindow > 0 && (
            <span className="text-[10px] px-1 py-0.5 bg-slate-100 text-slate-500 rounded">
              {model.contextWindow >= 1000000 ? `${(model.contextWindow / 1000000).toFixed(0)}M ctx` : `${(model.contextWindow / 1000).toFixed(0)}K ctx`}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default function SettingsPage(): React.ReactElement {
  const store = useChatStore()
  const {
    sessions,
    messages,
    settings,
    updateSettings,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    sidebarCollapsed,
    toggleSidebar,
    usage,
    resetDemo,
    exportConversation,
  } = store

  // ⚠️ 直接从代码常量读取默认配置，不依赖 store 的 hydrate 时序
  // 确保：除非代码修改，否则每次打开 API 配置不变
  const [endpoint, setEndpoint] = useState<string>(DEFAULT_SETTINGS.endpoint)
  const [apiKey, setApiKey] = useState<string>(HARDCODED_API_KEY)
  const [modelName, setModelName] = useState<string>(DEFAULT_SETTINGS.modelName)
  const [temperature, setTemperature] = useState<number>(DEFAULT_SETTINGS.temperature)
  const [maxTokens, setMaxTokens] = useState<number>(DEFAULT_SETTINGS.maxTokens)
  const [topP, setTopP] = useState<number>(DEFAULT_SETTINGS.topP)
  const [showApiKey, setShowApiKey] = useState<boolean>(false)
  const [savedMsg, setSavedMsg] = useState<boolean>(false)
  const [confirmClear, setConfirmClear] = useState<boolean>(false)
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_ACTIVE_MODEL_ID)
  const [modelDropdownOpen, setModelDropdownOpen] = useState<boolean>(false)
  const [showFreeGuide, setShowFreeGuide] = useState<boolean>(false)

  const hasApi = useMemo<boolean>(() => Boolean(endpoint.trim() && apiKey.trim() && modelName.trim()), [endpoint, apiKey, modelName])

  // 🚨 页面加载时强制同步 DEFAULT_SETTINGS 到 store + 本地 state
  // 解决 persist rehydrate 时序问题——确保 Agnes AI 配置在 store 层面也生效
  useEffect(() => {
    const settings = DEFAULT_SETTINGS
    updateSettings({
      endpoint: settings.endpoint,
      apiKey: HARDCODED_API_KEY,
      modelName: settings.modelName,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      topP: settings.topP,
    })
    // 同时强制同步本地 React state（作为第二层防御）
    setEndpoint(settings.endpoint)
    setApiKey(HARDCODED_API_KEY)
    setModelName(settings.modelName)
    setTemperature(settings.temperature)
    setMaxTokens(settings.maxTokens)
    setTopP(settings.topP)
    setSelectedModelId(DEFAULT_ACTIVE_MODEL_ID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayKeyMemo = useMemo<string>(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const applyPreset = (p: Preset): void => {
    setEndpoint(p.endpoint)
    setModelName(p.model)
  }

  const handleSave = (): void => {
    const finalEndpoint = endpoint.trim()
    const finalModel = modelName.trim()
    updateSettings({
      endpoint: finalEndpoint,
      apiKey: apiKey.trim(),
      modelName: finalModel,
      temperature: Number(temperature) || 0.7,
      maxTokens: Math.max(200, Math.min(4096, Number(maxTokens) || 2048)),
      topP: Number(topP) || 0.9,
    })
    // 保存模型选择
    store.setCurrentModel(selectedModelId)
    if (selectedModelId !== 'local-smart') {
      store.setModelById(selectedModelId)
    }
    setSavedMsg(true)
    window.setTimeout(() => setSavedMsg(false), 2000)
  }

  const handleClearConfig = (): void => {
    setEndpoint(DEFAULT_SETTINGS.endpoint)
    setApiKey(HARDCODED_API_KEY)
    setModelName(DEFAULT_SETTINGS.modelName)
    setTemperature(DEFAULT_SETTINGS.temperature)
    setMaxTokens(DEFAULT_SETTINGS.maxTokens)
    setTopP(DEFAULT_SETTINGS.topP)
    updateSettings({
      endpoint: DEFAULT_SETTINGS.endpoint,
      apiKey: HARDCODED_API_KEY,
      modelName: DEFAULT_SETTINGS.modelName,
      temperature: DEFAULT_SETTINGS.temperature,
      maxTokens: DEFAULT_SETTINGS.maxTokens,
      topP: DEFAULT_SETTINGS.topP,
    })
    setSavedMsg(true)
    window.setTimeout(() => setSavedMsg(false), 1500)
  }

  const handleExportAll = (): void => {
    const all = sessions.map((c) => {
      const msgs = messages
        .filter((m) => m.sessionId === c.id)
        .sort((a, b) => a.timestamp - b.timestamp)
      return {
        id: c.id,
        title: c.title,
        personaId: c.personaId,
        modelId: c.modelId,
        pinned: c.pinned,
        createdAt: new Date(c.createdAt).toLocaleString('zh-CN'),
        updatedAt: new Date(c.updatedAt).toLocaleString('zh-CN'),
        messages: msgs.map((m) => ({
          role: m.role,
          content: m.content,
          time: new Date(m.timestamp).toLocaleString('zh-CN'),
        })),
      }
    })
    const payload = {
      exportedAt: new Date().toLocaleString('zh-CN'),
      totalConversations: sessions.length,
      totalMessages: messages.length,
      settings: {
        theme,
        fontSize,
      },
      conversations: all,
    }
    if (sessions.length > 0) {
      const single = exportConversation(sessions[0].id)
      void single
    }
    downloadJson(`datamind-ai-export-${todayKeyMemo}.json`, payload)
  }

  const handleClearAll = (): void => {
    if (confirmClear) {
      resetDemo()
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      window.setTimeout(() => setConfirmClear(false), 4000)
    }
  }

  const themeOptions: Array<{ value: 'light' | 'dark'; label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = [
    { value: 'light', label: '浅色', icon: Sun, description: '明亮清爽' },
    { value: 'dark', label: '深色', icon: Moon, description: '护眼夜间' },
  ]

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-slate-50 to-indigo-50/30 px-3 md:px-8 py-5 pb-16">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" /> 设置中心
          </h1>
          <p className="text-xs md:text-sm text-secondary mt-1">自定义 DataMind AI · 让它成为你的专属 AI 助手</p>
        </div>

        {/* ========== 一、AI 模型选择 ========== */}
        <section className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
          <header className="px-4 md:px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex items-center gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-sm md:text-base font-bold">🤖 模型中心</div>
              <div className="text-xs opacity-90">选择一个 AI 模型，即可开始对话。全部模型均支持 OpenAI 兼容接口。</div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-5">

            {/* 模型选择下拉 */}
            <div>
              <label className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" /> 选择 AI 模型
              </label>

              {/* 已选模型展示 */}
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border-2 border-indigo-200 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">
                    {selectedModelId === 'local-smart' ? '🌐' : '🔗'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-primary text-sm">
                      {selectedModelId === 'local-smart'
                        ? '🌐 本地智能引擎'
                        : (getModelById(selectedModelId)?.name ?? selectedModelId)}
                    </div>
                    <div className="text-xs text-secondary truncate">
                      {selectedModelId === 'local-smart'
                        ? '完全免费，无需 API Key'
                        : (getModelById(selectedModelId)?.freeQuota ?? '')}
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-indigo-400 flex-shrink-0 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 模型下拉面板 */}
              {modelDropdownOpen && (
                <div className="mt-2 border border-indigo-200 rounded-xl overflow-hidden shadow-lg bg-white">
                  {/* 免费模型优先展示 */}
                  <div className="px-3 py-2 bg-green-50 border-b border-green-100">
                    <div className="text-xs font-bold text-green-700 flex items-center gap-1">
                      <Star className="w-3 h-3" /> 免费模型（推荐）
                    </div>
                  </div>
                  {/* 本地引擎 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModelId('local-smart')
                      setEndpoint('')
                      setModelName('')
                      setModelDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left border-b border-slate-100 ${selectedModelId === 'local-smart' ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <span className="text-xl flex-shrink-0">🌐</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-primary text-sm">本地智能引擎</div>
                      <div className="text-xs text-secondary">完全免费 · 无需 API Key · 离线可用</div>
                    </div>
                    {selectedModelId === 'local-smart' && <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                  </button>

                  {/* 免费模型列表 */}
                  {FREE_MODELS.filter(m => m.id !== 'local-smart').map(model => (
                    <FreeModelOption
                      key={model.id}
                      model={model}
                      selected={selectedModelId === model.id}
                      onSelect={() => {
                        setSelectedModelId(model.id)
                        setEndpoint(model.baseUrl)
                        setModelName(model.modelName)
                        setModelDropdownOpen(false)
                      }}
                    />
                  ))}

                  {/* 付费模型 */}
                  {SORTED_MODELS.filter(m => !m.isFree).length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 border-b">
                        <div className="text-xs font-bold text-slate-600">付费 / 注册送额度</div>
                      </div>
                      {SORTED_MODELS.filter(m => !m.isFree).slice(0, 15).map(model => (
                        <FreeModelOption
                          key={model.id}
                          model={model}
                          selected={selectedModelId === model.id}
                          onSelect={() => {
                            setSelectedModelId(model.id)
                            setEndpoint(model.baseUrl)
                            setModelName(model.modelName)
                            setModelDropdownOpen(false)
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 免费 Key 申请引导 */}
            {selectedModelId !== 'local-smart' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3">
                <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 如何获取免费 API Key
                </div>
                <div className="space-y-1.5 text-xs text-blue-800">
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                    <span>打开模型官网注册账号（如 <b>openrouter.ai</b> 或各厂商开放平台）</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                    <span>在「API Keys」页面创建新 Key，复制粘贴到下方输入框</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                    <span>点击保存，模型会自动切换，选好后直接开始对话</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-1">
                    OpenRouter <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition flex items-center gap-1">
                    DeepSeek <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="https://platform.moonshot.cn/" target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition flex items-center gap-1">
                    Kimi <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="https://siliconflow.cn/" target="_blank" rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition flex items-center gap-1">
                    硅基流动 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========== 二、API Key 配置卡片 ========== */}
        <section className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
          <header className="px-4 md:px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center gap-3">
            <Key className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-sm md:text-base font-bold">🔑 API Key 配置</div>
              <div className="text-xs opacity-90">配置后即可调用真实 AI 模型，本地存储，不上传</div>
            </div>
            <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${
                hasApi ? 'bg-green-500/20 text-green-50' : 'bg-white/20 text-white/80'
              }`}
            >
              {hasApi ? <><Check className="w-3.5 h-3.5" /> 已配置</> : <><ZapOff className="w-3.5 h-3.5" /> 未配置</>}
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-5">

            {/* 已选模型信息 */}
            <div className="flex items-center justify-between bg-slate-50 border border-theme rounded-xl px-3 py-2.5 text-xs">
              <span className="text-secondary">当前选择</span>
              <div className="text-right">
                <div className="font-bold text-primary font-mono">{modelName || '本地引擎'}</div>
                {endpoint && <div className="text-secondary font-mono text-[10px] truncate max-w-[200px]">{endpoint}</div>}
              </div>
            </div>

            {/* API Key 输入 */}
            <div>
              <label className="text-xs font-bold text-primary mb-1.5 block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-violet-500" /> API Key
                {selectedModelId !== 'local-smart' && (
                  <span className="text-xs font-normal text-slate-400">(必填)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={selectedModelId === 'local-smart'
                    ? '本地引擎无需 Key，可留空'
                    : '粘贴你的 API Key（sk-... 或 apikey-...）'}
                  className="w-full pr-12 px-3 py-2.5 border border-theme rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50 focus:bg-white transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition p-1.5 rounded-lg hover:bg-slate-100"
                  tabIndex={-1}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 模型名称（自动填充） */}
            <div>
              <label className="text-xs font-bold text-primary mb-1.5 block flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-500" /> 模型名称
                <span className="text-xs font-normal text-slate-400">(自动填充，可手动修改)</span>
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="选择模型后自动填入"
                className="w-full px-3 py-2.5 border border-theme rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50 focus:bg-white transition font-mono"
              />
            </div>

            {/* 端点（自动填充） */}
            <div>
              <label className="text-xs font-bold text-primary mb-1.5 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" /> API 端点
                <span className="text-xs font-normal text-slate-400">(自动填充，可手动修改)</span>
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="选择模型后自动填入"
                className="w-full px-3 py-2.5 border border-theme rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50 focus:bg-white transition font-mono"
              />
            </div>

            <div className="border-t border-theme" />

            {/* 高级参数 */}
            <div>
              <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" /> 高级参数
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-secondary">Temperature（创造力）</span>
                    <span className="font-bold text-primary font-mono">{Number(temperature).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.05}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-secondary">Top P（样本阈值）</span>
                    <span className="font-bold text-primary font-mono">{Number(topP).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={topP}
                    onChange={(e) => setTopP(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-secondary">Max Tokens（最大生成长度）</span>
                    <span className="font-bold text-primary font-mono">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={4096}
                    step={100}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-theme" />

            <div className="flex flex-wrap items-center justify-end gap-2">
              {savedMsg && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                  <Check className="w-3.5 h-3.5" /> 已保存
                </div>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> 保存配置
              </button>
            </div>
          </div>
        </section>

        {/* ========== 三、外观与界面 ========== */}
        <section className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
          <header className="px-4 md:px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-900 text-white flex items-center gap-2">
            <Sun className="w-5 h-5" />
            <div>
              <div className="text-sm md:text-base font-bold">🎨 外观与界面</div>
              <div className="text-xs opacity-90">主题与字体大小等显示效果</div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-5">
            <div>
              <div className="text-xs font-bold text-primary mb-2">主题模式</div>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-left transition ${
                      theme === opt.value
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-theme bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <opt.icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-primary">{opt.label}</div>
                      <div className="text-[10px] text-secondary">{opt.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-primary">正文字号（当前 {fontSize}px）</span>
              </div>
              <input
                type="range"
                min={12}
                max={20}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-secondary mt-1">
                <span>12px 紧凑</span>
                <span>16px 推荐</span>
                <span>20px 大</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-primary">折叠侧栏</div>
                  <div className="text-[10px] text-secondary mt-0.5">为小屏幕腾出更多对话空间</div>
                </div>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${sidebarCollapsed ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </label>
            </div>
          </div>
        </section>

        {/* ========== 三、数据与存储 ========== */}
        <section className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
          <header className="px-4 md:px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center gap-2">
            <Download className="w-5 h-5" />
            <div>
              <div className="text-sm md:text-base font-bold">💾 数据与存储</div>
              <div className="text-xs opacity-90">本地存储的对话与统计（数据保存在浏览器中）</div>
            </div>
          </header>

          <div className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 border border-theme rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-primary">{formatNumber(usage.messages)}</div>
                <div className="text-[10px] text-secondary mt-0.5">消息数</div>
              </div>
              <div className="bg-slate-50 border border-theme rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-primary">{formatNumber(usage.sessions)}</div>
                <div className="text-[10px] text-secondary mt-0.5">对话数</div>
              </div>
              <div className="bg-slate-50 border border-theme rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-primary">{formatNumber(usage.tokens)}</div>
                <div className="text-[10px] text-secondary mt-0.5">Token</div>
              </div>
            </div>

            <div className="border-t border-theme" />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportAll}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5" /> 导出所有对话（JSON）
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition ${
                  confirmClear
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-red-50 hover:bg-red-100 text-red-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" /> {confirmClear ? '⚠️ 再次点击确认清空' : '清空全部本地数据'}
              </button>
            </div>

            {confirmClear && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-amber-800">
                  <div className="font-bold mb-0.5">此操作不可恢复！</div>
                  <div>将清空所有对话、消息和本地设置。你可以先导出备份。</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========== 四、关于 ========== */}
        <section className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
          <header className="px-4 md:px-6 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white">
            <div className="text-sm md:text-base font-bold">💝 关于</div>
            <div className="text-xs opacity-90">DataMind AI · 开源可部署的智能对话助手</div>
          </header>
          <div className="p-4 md:p-6 text-xs text-secondary space-y-2">
            <p>本应用完全在浏览器内运行，AI 对话使用<strong className="text-primary">智能本地引擎</strong>或你配置的<strong className="text-primary">真实 API</strong>。</p>
            <p>所有对话与设置都保存在 <code className="font-mono bg-slate-100 px-1 rounded">localStorage</code> 中，刷新页面不会丢失，但更换浏览器/设备需要重新配置。</p>
            <p>支持 12 种角色与多轮上下文对话，可嵌入知识库内容。</p>
          </div>
        </section>
      </div>
    </div>
  )
}
