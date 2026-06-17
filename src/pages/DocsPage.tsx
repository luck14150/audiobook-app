import React, { useState } from 'react'
import { useChatStore } from '../stores'
import { BookOpen, Copy, Check, ChevronDown, ChevronRight, Key, Globe, Code, Terminal, Zap, FileJson } from 'lucide-react'

interface DocSection {
  id: string
  title: string
  icon: any
  children: DocItem[]
}

interface DocItem {
  id: string
  title: string
  method?: 'GET' | 'POST' | 'DELETE'
  path?: string
  desc?: string
  request?: string
  response?: string
  params?: { name: string; type: string; required: boolean; desc: string; example?: string }[]
  codeLang?: string
}

const SECTIONS: DocSection[] = [
  {
    id: 'overview',
    title: '平台概览',
    icon: BookOpen,
    children: [
      {
        id: 'intro',
        title: 'DataMind 开放平台介绍',
        desc:
`DataMind 开放平台是一个为开发者与企业打造的数据大模型 API 服务平台。

**核心特点：**

- **兼容 OpenAI 协议**：所有接口与 OpenAI /v1/chat/completions 格式完全一致，可零成本替换
- **多模型接入**：内置豆包、GPT、通义千问等主流模型，同一 API 风格切换
- **流式响应**：Server-Sent Events 实时打字机效果
- **企业级配额**：API Key 权限与限额管理
- **本地部署**：支持私有部署，保障数据安全

**基础信息：**

- **Base URL**：\`https://ark.cn-beijing.volces.com/api/v3\`
- **认证方式**：\`Authorization: Bearer <API_KEY>\`
- **内容类型**：\`Content-Type: application/json\``,
      },
      {
        id: 'quickstart',
        title: '快速开始 · 5 分钟',
        desc:
`**第一步：获取 API Key**

前往 开发者控制台 → API 密钥管理 → 创建新密钥

**第二步：发起你的第一条请求**

\`\`\`bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  --data '{
    "model": "doubao-seed-1-6-250615",
    "messages": [{"role": "user", "content": "你好，DataMind！"}]
  }'
\`\`\`

**第三步：解析响应**

\`\`\`json
{
  "choices": [{ "message": { "content": "你好！我是 DataMind AI 助手..." } }]
}
\`\`\``,
      },
    ],
  },
  {
    id: 'chat',
    title: '对话 API',
    icon: Terminal,
    children: [
      {
        id: 'chat-completions',
        title: '创建对话响应 · POST /chat/completions',
        method: 'POST',
        path: '/chat/completions',
        params: [
          { name: 'model', type: 'string', required: true, desc: '模型 ID，如 doubao-seed-1-6-250615', example: 'doubao-seed-1-6-250615' },
          { name: 'messages', type: 'array', required: true, desc: '消息列表，按时间顺序排列', example: '[{role:"user",content:"..."}]' },
          { name: 'temperature', type: 'number', required: false, desc: '采样温度 0-2，默认 0.7', example: '0.7' },
          { name: 'max_tokens', type: 'number', required: false, desc: '最大生成 Token 数', example: '1024' },
          { name: 'stream', type: 'boolean', required: false, desc: '是否启用流式响应', example: 'true' },
          { name: 'top_p', type: 'number', required: false, desc: '核采样阈值 0-1，默认 1', example: '1' },
        ],
        request: `{
  "model": "doubao-seed-1-6-250615",
  "messages": [
    {"role": "system", "content": "你是专业数据分析师"},
    {"role": "user", "content": "帮我分析这份销售数据"}
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "stream": true
}`,
        response: `{
  "id": "datamind-cmpl-8f2a3e1d",
  "object": "chat.completion",
  "created": 1750236789,
  "model": "doubao-seed-1-6-250615",
  "choices": [{
    "index": 0,
    "message": { "role": "assistant", "content": "好的，我来帮你分析..." },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 120,
    "total_tokens": 165
  }
}`,
        desc: '创建一个对话补全请求。支持 system / user / assistant 多角色消息，可与角色 API 组合使用。',
      },
      {
        id: 'chat-stream',
        title: '流式响应 SSE 格式',
        method: 'POST',
        path: '/chat/completions (stream=true)',
        desc:
`当 \`stream=true\` 时，响应使用 Server-Sent Events (SSE) 格式，逐块返回文本。

**事件流格式：**

\`\`\`
data: {"choices":[{"delta":{"content":"你"},"finish_reason":null}]}

data: {"choices":[{"delta":{"content":"好"},"finish_reason":null}]}

data: [DONE]
\`\`\`

**JavaScript 处理示例：**

\`\`\`javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const lines = decoder.decode(value).split('\\n\\n');
  for (const line of lines) {
    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.choices[0].delta.content);
    }
  }
}
\`\`\``,
      },
    ],
  },
  {
    id: 'models',
    title: '模型与角色',
    icon: Zap,
    children: [
      {
        id: 'models-list',
        title: '支持的模型列表',
        method: 'GET',
        path: '/models',
        desc:
`DataMind 支持主流数据大模型：

| 模型 | 能力定位 | 最大 Token | 典型延迟 |
|------|---------|-----------|---------|
| doubao-seed-1-6-250615 | 均衡能力 | 128K | 0.9s |
| doubao-pro-250615 | 深度推理 | 64K | 2.3s |
| doubao-lite-32k | 快速响应 | 32K | 0.4s |
| gpt-4o-mini | 多模态 | 128K | 1.7s |

在请求体中指定 \`model\` 字段即可切换。`,
      },
      {
        id: 'personas',
        title: '角色与 System Prompt',
        desc:
`平台内置 12 个专业角色，你也可以自定义 system prompt。

**常用角色及 System Prompt：**

- **通用助手**："你是一个友好、专业的 AI 助手，用清晰简洁的方式回答问题。"
- **编程专家**："你是一位资深软件工程师，擅长多种语言与架构设计。"
- **数据分析**："你是一名经验丰富的数据分析师，帮助用户解读数据与趋势。"
- **翻译官**："你是一位专业翻译，忠实于原文语境并提供文化注释。"

**角色切换方式：**

在 messages 数组第一条加入 \`{"role":"system","content":"<角色设定>"}\`。`,
      },
    ],
  },
  {
    id: 'sdk',
    title: 'SDK 与示例',
    icon: Code,
    children: [
      {
        id: 'sdk-python',
        title: 'Python SDK 示例',
        desc:
`使用 requests 直接调用（也可使用 openai 库）：

\`\`\`python
import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

response = requests.post(
    f"{BASE_URL}/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    },
    json={
        "model": "doubao-seed-1-6-250615",
        "messages": [{"role": "user", "content": "你好"}]
    }
)
print(response.json()["choices"][0]["message"]["content"])
\`\`\``,
      },
      {
        id: 'sdk-node',
        title: 'Node.js / 前端 示例',
        desc:
`前端调用（注意：生产环境请走后端转发以免泄露密钥）：

\`\`\`javascript
const API_KEY = "YOUR_API_KEY";
const res = await fetch(
  "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + API_KEY
    },
    body: JSON.stringify({
      model: "doubao-seed-1-6-250615",
      messages: [{ role: "user", content: "你好" }],
      stream: true
    })
  }
);
\`\`\``,
      },
    ],
  },
  {
    id: 'errors',
    title: '错误与排错',
    icon: FileJson,
    children: [
      {
        id: 'error-codes',
        title: 'HTTP 状态码与错误码',
        desc:
`**常见状态码：**

| 状态码 | 含义 | 常见原因 |
|-------|------|---------|
| 400 | 请求格式错误 | JSON 非法、缺少必填字段 |
| 401 | 未授权 | API Key 错误或已过期 |
| 403 | 权限不足 | 当前 Key 无此模型访问权限 |
| 429 | 请求过多 | 已达到速率限制 |
| 500 | 服务端错误 | 上游模型服务异常 |

**错误响应格式：**

\`\`\`json
{
  "error": {
    "code": "invalid_api_key",
    "message": "你的 API Key 无效或已被撤销",
    "type": "authentication_error"
  }
}
\`\`\``,
      },
      {
        id: 'error-rate',
        title: '速率限制与配额',
        desc:
`**默认配额：**

- 免费级：10 次/分钟，1000 次/月
- 标准级：60 次/分钟，10 万次/月
- 企业级：自定义，无上限

**触发限制时的响应：**

HTTP 429 Too Many Requests

\`\`\`json
{
  "error": { "code": "rate_limit_exceeded", "message": "请求过于频繁" }
}
\`\`\`

**建议实现退避：** 遇到 429 使用指数退避重试（2^n 秒）。`,
      },
    ],
  },
]

export default function DocsPage() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ overview: true, chat: true })
  const [activeId, setActiveId] = useState<string>('intro')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const toggleSection = (id: string) => setOpenSections(s => ({ ...s, [id]: !s[id] }))

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const { apiKeys, aiSettings } = useChatStore()

  // 查找当前激活项
  let activeItem: DocItem | undefined
  for (const s of SECTIONS) {
    const found = s.children.find(c => c.id === activeId)
    if (found) { activeItem = found; break }
  }

  // 将 desc 中的 ``` 代码块提取出来渲染
  const renderContent = (text?: string) => {
    if (!text) return null
    const parts: React.ReactNode[] = []
    let remaining = text
    let i = 0
    while (remaining.length > 0) {
      const start = remaining.indexOf('```')
      if (start === -1) {
        parts.push(<div key={i++} className="text-[11px] md:text-xs text-secondary leading-relaxed whitespace-pre-wrap">{remaining}</div>)
        break
      }
      parts.push(<div key={i++} className="text-[11px] md:text-xs text-secondary leading-relaxed whitespace-pre-wrap">{remaining.substring(0, start)}</div>)
      const afterStart = remaining.substring(start + 3)
      const newlineIdx = afterStart.indexOf('\n')
      const langEnd = newlineIdx === -1 ? afterStart.length : newlineIdx
      const lang = afterStart.substring(0, langEnd).trim() || 'text'
      const codeEnd = afterStart.indexOf('```', langEnd)
      if (codeEnd === -1) {
        parts.push(<pre key={i++} className="my-2 p-3 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto scrollbar-thin">{afterStart}</pre>)
        break
      }
      const code = afterStart.substring(langEnd + 1, codeEnd)
      parts.push(
        <div key={i++} className="my-2 relative group">
          <div className="absolute top-2 right-2 text-[9px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{lang}</div>
          <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto scrollbar-thin pr-14">{code}</pre>
          <button onClick={() => handleCopy('code-' + i, code)} className="absolute top-2 right-20 opacity-0 group-hover:opacity-100 transition p-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-[10px]">
            {copiedId === 'code-' + i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )
      remaining = afterStart.substring(codeEnd + 3)
    }
    return <div className="space-y-2">{parts}</div>
  }

  return (
    <div className="flex-1 min-h-0 flex bg-slate-50">
      {/* Sidebar Nav */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 overflow-y-auto scrollbar-thin flex-shrink-0 p-3">
        <div>
          <div className="px-3 py-2 mb-2">
            <div className="font-bold text-sm text-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> API 文档
            </div>
            <div className="text-[10px] text-muted">DataMind 开放平台 v1.0</div>
          </div>
          {SECTIONS.map(s => {
            const Icon = s.icon
            const open = openSections[s.id]
            return (
              <div key={s.id} className="mb-1">
                <button onClick={() => toggleSection(s.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-primary hover:bg-slate-50 rounded-lg transition">
                  <Icon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span className="flex-1 text-left">{s.title}</span>
                  {open ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                </button>
                {open && (
                  <div className="ml-5 pl-2 border-l border-slate-200 mt-0.5 mb-1">
                    {s.children.map(it => (
                      <button
                        key={it.id}
                        onClick={() => setActiveId(it.id)}
                        className={`block w-full text-left px-3 py-1.5 text-[11px] rounded-lg transition mb-0.5 ${
                          activeId === it.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-secondary hover:bg-slate-50'
                        }`}
                      >
                        {it.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          {/* Mobile section nav */}
          <div className="md:hidden mb-4 space-y-1.5">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <details key={s.id} className="bg-white rounded-xl border border-slate-200">
                  <summary className="px-3 py-2.5 text-xs font-bold text-primary cursor-pointer flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-indigo-500" /> {s.title}
                  </summary>
                  <div className="pb-2">
                    {s.children.map(it => (
                      <button
                        key={it.id}
                        onClick={() => setActiveId(it.id)}
                        className={`block w-full text-left px-6 py-2 text-[11px] ${
                          activeId === it.id ? 'text-indigo-700 font-bold bg-indigo-50' : 'text-secondary'
                        }`}
                      >
                        {it.title}
                      </button>
                    ))}
                  </div>
                </details>
              )
            })}
          </div>

          {/* Header */}
          <div className="mb-5 pb-4 border-b border-slate-200">
            <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-2">
              {SECTIONS.find(s => s.children.some(c => c.id === activeId))?.title}
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-primary mb-2">{activeItem?.title}</h1>
            <div className="flex items-center gap-2">
              {activeItem?.method && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                  activeItem.method === 'POST' ? 'bg-emerald-100 text-emerald-700' : activeItem.method === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>{activeItem.method}</span>
              )}
              {activeItem?.path && (
                <code className="text-[11px] text-primary font-mono bg-slate-100 px-2 py-1 rounded-md">{activeItem.path}</code>
              )}
            </div>
          </div>

          {/* Description */}
          {renderContent(activeItem?.desc)}

          {/* Parameters table */}
          {activeItem?.params && (
            <div className="my-5">
              <h3 className="text-sm font-bold text-primary mb-2">请求参数</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-bold text-primary">参数</th>
                      <th className="text-left px-3 py-2 font-bold text-primary">类型</th>
                      <th className="text-left px-3 py-2 font-bold text-primary">必选</th>
                      <th className="text-left px-3 py-2 font-bold text-primary">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeItem.params.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 font-mono text-indigo-700 font-bold align-top">{p.name}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono align-top">{p.type}</td>
                        <td className="px-3 py-2 align-top">{p.required ? <span className="text-red-600 text-[10px] font-bold">必选</span> : <span className="text-slate-400 text-[10px]">可选</span>}</td>
                        <td className="px-3 py-2 text-secondary">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request example */}
          {activeItem?.request && (
            <div className="my-5">
              <h3 className="text-sm font-bold text-primary mb-2">请求示例</h3>
              <div className="relative group">
                <button
                  onClick={() => handleCopy('req-' + activeItem.id, activeItem.request!)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md transition text-white"
                >
                  {copiedId === 'req-' + activeItem.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto scrollbar-thin">{activeItem.request}</pre>
              </div>
            </div>
          )}

          {/* Response example */}
          {activeItem?.response && (
            <div className="my-5">
              <h3 className="text-sm font-bold text-primary mb-2">响应示例</h3>
              <div className="relative group">
                <button
                  onClick={() => handleCopy('res-' + activeItem.id, activeItem.response!)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md transition text-white"
                >
                  {copiedId === 'res-' + activeItem.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="p-4 bg-slate-900 text-amber-300 rounded-xl text-[11px] font-mono overflow-x-auto scrollbar-thin">{activeItem.response}</pre>
              </div>
            </div>
          )}

          {/* Config status bar */}
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" /> 你的当前配置
            </h3>
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-start gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted">Endpoint: </span>
                <span className="text-primary flex-1 min-w-0 break-all">{aiSettings.endpoint || '(未配置)'}</span>
              </div>
              <div className="flex items-start gap-2">
                <Key className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted">API Key: </span>
                <span className="text-primary flex-1 min-w-0">{aiSettings.apiKey ? aiSettings.apiKey.slice(0, 8) + '••••••••' + aiSettings.apiKey.slice(-4) : '(未配置)'}</span>
              </div>
              <div className="text-[10px] text-muted mt-2">密钥：{apiKeys.length} 个 · 前往 <a href="#/settings" className="text-indigo-600 font-bold">设置</a> 或 <a href="#/api-keys" className="text-indigo-600 font-bold">密钥管理</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
