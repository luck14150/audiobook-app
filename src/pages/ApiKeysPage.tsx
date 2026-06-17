import React, { useState } from 'react'
import { Key, Plus, Copy, Trash2, Check, Eye, EyeOff, Shield, AlertTriangle, Zap, BarChart3, Clock, Globe, RotateCcw } from 'lucide-react'
import { useChatStore } from '../stores'

export default function ApiKeysPage() {
  const { apiKeys, createApiKey, deleteApiKey, toggleApiKey, messages } = useChatStore()
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState('')
  const [showKey, setShowKey] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const totalMessages = messages.length

  const handleCreate = () => {
    if (!newKeyName.trim()) return
    const generatedKey = 'dm-sk-' + Math.random().toString(36).slice(2, 14) + '-' + Math.random().toString(36).slice(2, 10)
    createApiKey(newKeyName.trim(), generatedKey)
    setNewKey(generatedKey)
    setNewKeyName('')
    setTimeout(() => setNewKey(''), 60000)
  }

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard?.writeText(key).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-slate-50">
      <div className="p-3 md:p-8 max-w-5xl mx-auto pb-12">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary">API 密钥管理</h1>
              <p className="text-xs md:text-sm text-muted">创建和管理你的密钥，接入 DataMind 开放平台大模型 API</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-[10px] text-muted">密钥数量</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">{apiKeys.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-[10px] text-muted">累计调用</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">{totalMessages}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="text-[10px] text-muted">可用模型</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary">12+</div>
          </div>
        </div>

        {/* Create New Key */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 mb-5 shadow-sm">
          <h2 className="text-base font-bold text-primary mb-3">创建新密钥</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="密钥名称（如：生产环境、MyApp）"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!newKeyName.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/20 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl transition-all text-sm whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> 创建密钥
            </button>
          </div>
          {newKey && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">密钥已创建，请妥善保存！</p>
                  <p className="text-[11px] text-emerald-600 mt-1">此密钥只显示一次，离开页面后无法再次查看完整密钥</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 p-3 bg-white rounded-lg border border-emerald-200">
                <code className="flex-1 text-xs md:text-sm text-emerald-700 font-mono break-all">{newKey}</code>
                <button onClick={() => handleCopy('new', newKey)} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0">
                  {copiedId === 'new' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
          <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-primary">
              我的密钥 <span className="text-sm text-muted font-normal">({apiKeys.length})</span>
            </h2>
          </div>
          {apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-secondary mb-1 text-sm">暂无 API 密钥</p>
              <p className="text-muted text-xs">创建你的第一个密钥，开始使用 DataMind API</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {apiKeys.map((ak, idx) => (
                <div key={ak.id} className="p-4 md:p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-primary text-sm">{ak.name}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          ak.active ?? true
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {ak.active ?? true ? '已启用' : '已停用'}
                        </span>
                        <span className="text-[10px] text-muted">#{idx + 1}</span>
                      </div>
                      <div className="text-[11px] text-muted mb-2 flex items-center gap-1 flex-wrap">
                        <Clock className="w-3 h-3" /> 创建：{new Date(ak.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleApiKey(ak.id)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title={ak.active ?? true ? '停用' : '启用'}>
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm('确定要删除此密钥吗？删除后无法恢复。')) deleteApiKey(ak.id) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-2.5 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs">
                    <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                    <span className="text-primary min-w-0 truncate flex-1 ml-1">
                      {showKey === ak.id ? ak.key : ak.key.slice(0, 12) + '••••••••••' + ak.key.slice(-6)}
                    </span>
                    <div className="flex gap-0.5 flex-shrink-0 ml-2">
                      <button onClick={() => setShowKey(showKey === ak.id ? null : ak.id)} className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-700 rounded-md transition-colors" title={showKey === ak.id ? '隐藏' : '查看'}>
                        {showKey === ak.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleCopy(ak.id, ak.key)} className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-700 rounded-md transition-colors" title="复制">
                        {copiedId === ak.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-5 md:p-6 text-white shadow-lg mb-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-300" /> 快速开始 · cURL 示例</h3>
          <pre className="text-[11px] md:text-xs leading-relaxed text-emerald-300 bg-slate-900/60 p-3 rounded-xl font-mono overflow-x-auto scrollbar-thin">
{`curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKeys[0] ? apiKeys[0].key.slice(0, 8) + '••••••••••' + apiKeys[0].key.slice(-6) : 'YOUR_API_KEY'}" \\
  --data '{
    "model": "doubao-seed-1-6-250615",
    "messages": [
      {"role": "system", "content": "你是一个专业的 AI 助手"},
      {"role": "user", "content": "介绍一下 DataMind 开放平台"}
    ],
    "temperature": 0.7,
    "stream": true
  }'`}
          </pre>
        </div>

        {/* Security Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5">
          <h3 className="font-bold text-amber-800 mb-2 text-sm flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> 使用说明与安全提示</h3>
          <ul className="text-xs md:text-sm text-amber-700 space-y-1.5">
            <li className="flex items-start gap-2"><span className="text-amber-500 flex-shrink-0">•</span>每个密钥独立计费，可用于不同的应用场景（开发 / 测试 / 生产）</li>
            <li className="flex items-start gap-2"><span className="text-amber-500 flex-shrink-0">•</span>不要将密钥提交到代码仓库，建议使用环境变量或后端代理转发</li>
            <li className="flex items-start gap-2"><span className="text-amber-500 flex-shrink-0">•</span>如怀疑密钥泄露，请立即删除并创建新密钥</li>
            <li className="flex items-start gap-2"><span className="text-amber-500 flex-shrink-0">•</span>在生产环境中始终通过后端转发 API 请求，避免在前端暴露密钥</li>
            <li className="flex items-start gap-2"><span className="text-amber-500 flex-shrink-0">•</span>查看 <a href="#/docs" className="underline font-bold text-amber-900 hover:text-amber-950">完整 API 文档</a> 获取更多接入示例</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

