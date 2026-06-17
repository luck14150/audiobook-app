import React, { useState, useRef } from 'react'
import { useChatStore } from '../stores'
import { Code, Send, Copy, Check, RefreshCw, Zap, Settings, ChevronDown, AlertTriangle, Terminal } from 'lucide-react'

type Method = 'POST' | 'GET'
type TabKey = 'curl' | 'javascript' | 'python' | 'response'

const SAMPLE_BODY = `{
  "model": "doubao-seed-1-6-250615",
  "messages": [
    {"role": "system", "content": "你是一个专业的数据助手"},
    {"role": "user", "content": "介绍一下 DataMind 开放平台"}
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "stream": true
}`

const SAMPLE_RESPONSE = `{
  "id": "datamind-cmpl-8f2a3e1d",
  "object": "chat.completion",
  "created": 1750236789,
  "model": "doubao-seed-1-6-250615",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "DataMind 开放平台是一个企业级数据大模型 API 服务平台，提供：\n\n1. **多模型接入**：豆包、GPT、通义千问等主流模型统一接口\n2. **流式响应**：支持 Server-Sent Events 实时打字机效果\n3. **API 密钥管理**：每个应用独立密钥，配额与权限管理\n4. **实时统计**：调用量、令牌数、延迟监控\n5. **安全合规**：本地或云端部署，数据加密传输\n\n支持 OpenAI 兼容协议，零成本替换现有的 GPT 调用。"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 128,
    "total_tokens": 152
  }
}`

export default function PlaygroundPage() {
  const { aiSettings } = useChatStore()
  const [endpoint, setEndpoint] = useState(aiSettings.endpoint + '/chat/completions')
  const [apiKey, setApiKey] = useState(aiSettings.apiKey)
  const [method, setMethod] = useState<Method>('POST')
  const [body, setBody] = useState(SAMPLE_BODY)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusCode, setStatusCode] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<TabKey>('curl')
  const [showMethodDropdown, setShowMethodDropdown] = useState(false)
  const [useStream, setUseStream] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const curlSnippet = `curl ${endpoint.replace('/chat/completions', '')}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey ? apiKey.slice(0, 10) + '••••••••' : 'YOUR_API_KEY'}" \\
  --data '${body}'`

  const jsSnippet = `const response = await fetch('${endpoint.replace('/chat/completions', '')}/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${apiKey ? apiKey.slice(0, 10) + '••••••••' : 'YOUR_API_KEY'}'
  },
  body: ${body}
});
const data = await response.json();
console.log(data.choices[0].message.content);`

  const pySnippet = `import requests

response = requests.post(
    "${endpoint.replace('/chat/completions', '')}/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer ${apiKey ? apiKey.slice(0, 10) + '••••••••' : 'YOUR_API_KEY'}"
    },
    json=${body}
)
print(response.json()["choices"][0]["message"]["content"])`

  const handleSend = async () => {
    if (!apiKey.trim()) {
      setError('请先在设置页填入有效的 API Key')
      return
    }
    setLoading(true)
    setError('')
    setResponse('')
    setStatusCode(null)
    try {
      let parsed
      try { parsed = JSON.parse(body) } catch { throw new Error('请求体 JSON 格式错误，请检查括号与逗号。') }

      const effectiveUrl = endpoint.endsWith('/chat/completions') ? endpoint : endpoint.replace(/\/?$/, '/chat/completions')
      const res = await fetch(effectiveUrl, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey.trim() },
        body: method === 'POST' ? JSON.stringify(parsed) : undefined,
      })
      setStatusCode(res.status)

      const text = await res.text()
      if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + (text.length > 200 ? text.slice(0, 200) + '...' : text))

      setResponse(text)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (t: string) => {
    navigator.clipboard?.writeText(t)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const activeSnippet = tab === 'curl' ? curlSnippet : tab === 'javascript' ? jsSnippet : tab === 'python' ? pySnippet : response

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-slate-50 p-3 md:p-8 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">API Playground</h1>
            <p className="text-xs md:text-sm text-muted">实时调试你的大模型接口 · 兼容 OpenAI 协议</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Request */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-primary">请求配置</h3>
            </div>

            {/* Method + URL */}
            <div className="flex gap-2 mb-3 relative">
              <div className="relative" onClick={() => setShowMethodDropdown(!showMethodDropdown)}>
                <button className={`px-3 py-2 text-xs font-bold rounded-lg border transition ${
                  method === 'POST' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-amber-500 text-white border-amber-500'
                }`}>
                  {method} <ChevronDown className="w-3 h-3 inline ml-1" />
                </button>
                {showMethodDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    {(['POST', 'GET'] as Method[]).map(m => (
                      <button key={m} onClick={() => { setMethod(m); setShowMethodDropdown(false) }} className={`block w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 ${
                        m === 'POST' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-primary focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* API Key */}
            <div className="mb-3">
              <label className="text-[11px] font-bold text-primary mb-1 block">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="填入你的豆包/OpenAI API Key"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-primary focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Request Body */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-primary">请求体 (JSON)</label>
                <div className="flex items-center gap-1 text-[10px] text-muted">
                  <input id="stream-toggle" type="checkbox" checked={useStream} onChange={e => setUseStream(e.target.checked)} className="mr-1" />
                  <label htmlFor="stream-toggle">流式 stream</label>
                </div>
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={12}
                className="w-full p-3 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                spellCheck={false}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSend}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/20 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> 请求中...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> 发送请求</>
                )}
              </button>
              <button onClick={() => { setBody(SAMPLE_BODY); setError(''); setResponse(''); setStatusCode(null) }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-secondary rounded-xl text-xs font-bold transition flex-shrink-0">
                重置
              </button>
            </div>
          </div>

          {/* Response */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-primary">响应与示例代码</h3>
              {statusCode && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full ${
                  statusCode >= 200 && statusCode < 300 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  HTTP {statusCode}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-3 border-b border-slate-200 -mx-2 px-2">
              {(['curl', 'javascript', 'python', 'response'] as TabKey[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-t-lg transition ${
                    tab === t ? 'bg-slate-100 text-primary' : 'text-muted hover:text-secondary'
                  }`}
                >
                  {t === 'curl' ? 'cURL' : t === 'javascript' ? 'Node.js' : t === 'python' ? 'Python' : '响应'}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-red-700">请求失败</div>
                  <div className="text-[11px] text-red-600 mt-1 break-words">{error}</div>
                </div>
              </div>
            )}

            <div className="flex-1 relative">
              <div ref={scrollRef} className="absolute inset-0 bg-slate-900 rounded-xl p-3 overflow-auto scrollbar-thin">
                <pre className="text-[11px] leading-relaxed text-emerald-300 font-mono whitespace-pre-wrap break-words">
                  {tab === 'response' && !response
                    ? (apiKey ? '点击"发送请求"获取真实 API 响应\n\n或查看左侧代码示例（cURL / JavaScript / Python）' : SAMPLE_RESPONSE)
                    : activeSnippet || SAMPLE_RESPONSE}
                </pre>
              </div>
            </div>

            <button
              onClick={() => handleCopy(activeSnippet || '')}
              className="mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-secondary rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> 已复制</> : <><Copy className="w-3.5 h-3.5" /> 复制代码</>}
            </button>
          </div>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-700 flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">提示：</span>
            Playground 直接从浏览器发出请求，若遇到 CORS 限制，请在后端做转发，或使用豆包官方支持浏览器的接口。生产环境建议将 API Key 保存在服务器端。
          </div>
        </div>
      </div>
    </div>
  )
}
