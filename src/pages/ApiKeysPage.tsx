import React, { useState } from 'react'
import { Key, Plus, Copy, Trash2, Check, Eye, EyeOff, Shield } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'

export default function ApiKeysPage() {
  const { apiKeys, addApiKey, deleteApiKey } = useChatStore()
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState('')
  const [showKey, setShowKey] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newKeyName.trim()) return
    const key = addApiKey(newKeyName.trim())
    setNewKey(key)
    setNewKeyName('')
    setTimeout(() => setNewKey(''), 30000)
  }

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard?.writeText(key).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="h-full bg-slate-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">API 密钥管理</h1>
          </div>
          <p className="text-slate-500 text-sm">
            创建和管理你的 API 密钥，用于接入 DataMind AI 的智能对话能力。
          </p>
        </div>

        {/* Create New Key */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">创建新密钥</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="密钥名称（如：我的应用、生产环境）"
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!newKeyName.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-5 h-5 inline mr-1" />
              创建密钥
            </button>
          </div>
          {newKey && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">密钥已创建，请妥善保存！</p>
                  <p className="text-xs text-green-600 mt-1">此密钥只显示一次，离开页面后无法再次查看完整密钥</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 p-3 bg-white rounded-lg border border-green-200">
                <code className="flex-1 text-sm text-green-700 font-mono break-all">{newKey}</code>
                <button
                  onClick={() => handleCopy('new', newKey)}
                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                >
                  {copiedId === 'new' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-green-600" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              我的密钥 <span className="text-sm text-slate-400 font-normal">({apiKeys.length})</span>
            </h2>
          </div>
          {apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">暂无 API 密钥</p>
              <p className="text-slate-400 text-sm mt-1">创建你的第一个密钥，开始使用 DataMind API</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {apiKeys.map((ak) => (
                <div key={ak.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-800">{ak.name}</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">活跃</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 font-mono text-sm">
                        <span className="text-slate-600 min-w-0 truncate">
                          {showKey === ak.id ? ak.key : ak.key.slice(0, 10) + '••••••••••' + ak.key.slice(-6)}
                        </span>
                        <div className="flex gap-1 flex-shrink-0 ml-auto">
                          <button
                            onClick={() => setShowKey(showKey === ak.id ? null : ak.id)}
                            className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-700 rounded-md transition-colors"
                            title={showKey === ak.id ? '隐藏' : '查看'}
                          >
                            {showKey === ak.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleCopy(ak.id, ak.key)}
                            className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-700 rounded-md transition-colors"
                            title="复制"
                          >
                            {copiedId === ak.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        创建时间：{new Date(ak.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('确定要删除此密钥吗？删除后将无法恢复。')) {
                          deleteApiKey(ak.id)
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <h3 className="font-medium text-indigo-800 mb-2">使用说明</h3>
          <ul className="text-sm text-indigo-700 space-y-1.5">
            <li>• 每个密钥独立计费，可用于不同的应用场景</li>
            <li>• 不要将密钥提交到代码仓库，建议使用环境变量</li>
            <li>• 如怀疑密钥泄露，请立即删除并创建新密钥</li>
            <li>• 演示版密钥仅用于学习和功能测试</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
