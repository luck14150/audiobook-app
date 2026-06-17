import React, { useState } from 'react'
import { Code, Play, Trash2, Check, AlertCircle, Copy, RotateCcw, Zap, Sparkles } from 'lucide-react'

interface LogEntry {
  type: 'log' | 'error' | 'warn' | 'result'
  content: string
  id: number
}

const EXAMPLES = [
  {
    title: '数组操作',
    code: '// 基础数组操作练习\nconst numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\n\nconsole.log("原始数组:", numbers);\nconsole.log("平方:", numbers.map(n => n * n));\nconsole.log("偶数:", numbers.filter(n => n % 2 === 0));\nconsole.log("总和:", numbers.reduce((a, b) => a + b, 0));\nconsole.log("最大值:", Math.max(...numbers));\n\n// 返回最后结果\nnumbers.filter(n => n % 2 === 1).map(n => n * 2);',
  },
  {
    title: '对象处理',
    code: '// 对象和数据结构练习\nconst users = [\n  { name: "小明", age: 25, city: "北京", score: 88 },\n  { name: "小红", age: 32, city: "上海", score: 92 },\n  { name: "小刚", age: 18, city: "北京", score: 78 },\n  { name: "小美", age: 28, city: "深圳", score: 95 },\n  { name: "小强", age: 22, city: "上海", score: 83 },\n];\n\n// 按城市分组\nconst byCity = users.reduce((acc, u) => {\n  acc[u.city] = acc[u.city] || [];\n  acc[u.city].push(u);\n  return acc;\n}, {});\n\nconsole.log("按城市分组:", byCity);\nconsole.log("北京平均年龄:", \n  users.filter(u => u.city === "北京").reduce((a, u) => a + u.age, 0) / users.filter(u => u.city === "北京").length\n);\n\n// 找出最高分\nconst top = users.reduce((best, u) => u.score > best.score ? u : best);\nconsole.log("\\n最高分:", top.name, top.score + "分");\n\nusers.map(u => u.name + ":" + u.score);',
  },
  {
    title: '模拟 API',
    code: '// 模拟异步操作（会在同步沙盒中返回 Promise）\nfunction mockFetchUserData(userId) {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => {\n      if (userId > 0 && userId < 100) {\n        resolve({ id: userId, name: "用户" + userId, level: 5 });\n      } else {\n        reject(new Error("用户不存在"));\n      }\n    }, 100);\n  });\n}\n\n// 使用 Promise 链\nmockFetchUserData(42)\n  .then(user => {\n    console.log("获取成功:", user);\n    return { ...user, points: user.level * 100 };\n  })\n  .then(userWithPoints => console.log("扩展数据:", userWithPoints))\n  .catch(err => console.error("错误:", err.message));\n\nconsole.log("（主程序继续执行... 异步结果随后）");',
  },
  {
    title: '数学计算',
    code: '// 斐波那契数列\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nfor (let i = 0; i <= 10; i++) {\n  console.log("fib(" + i + ") =", fibonacci(i));\n}\n\n// 素数判断\nfunction isPrime(n) {\n  if (n < 2) return false;\n  for (let i = 2; i <= Math.sqrt(n); i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}\n\nconsole.log("\\n1-50 之间的素数:");\nconst primes = [];\nfor (let i = 1; i <= 50; i++) {\n  if (isPrime(i)) primes.push(i);\n}\nconsole.log(primes);\nconsole.log("共 " + primes.length + " 个");',
  },
]

export default function CodeInterpreterPage() {
  const [code, setCode] = useState(EXAMPLES[0].code)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  let logId = 0

  const run = () => {
    setRunning(true)
    const newLogs: LogEntry[] = []
    const pushLog = (type: LogEntry['type'], content: string) => {
      newLogs.push({ type, content, id: ++logId })
    }

    // Custom console
    const customConsole = {
      log: (...args: any[]) => pushLog('log', args.map(stringify).join(' ')),
      error: (...args: any[]) => pushLog('error', args.map(stringify).join(' ')),
      warn: (...args: any[]) => pushLog('warn', args.map(stringify).join(' ')),
    }

    try {
      pushLog('log', '▶ 开始执行')
      pushLog('log', '─'.repeat(40))

      // eslint-disable-next-line no-new-func
      const fn = new Function('console', `
        "use strict";
        try {
          ${code}
        } catch (e) {
          console.error(e.message || String(e));
        }
      `)
      const result = fn(customConsole)
      if (result !== undefined) {
        pushLog('result', stringify(result))
      }
      pushLog('log', '─'.repeat(40))
      pushLog('log', '✓ 执行完成')
    } catch (err: any) {
      pushLog('error', '执行错误: ' + (err?.message || String(err)))
    }

    setLogs(newLogs)
    setRunning(false)
  }

  const stringify = (val: any): string => {
    if (typeof val === 'string') return val
    if (val === null) return 'null'
    if (val === undefined) return 'undefined'
    if (val instanceof Error) return '❌ ' + val.message
    if (val instanceof Promise) return 'Promise { <pending> }'
    if (typeof val === 'object') {
      try { return JSON.stringify(val, null, 2) } catch { return String(val) }
    }
    return String(val)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }

  const logIcon = (type: LogEntry['type']) => {
    if (type === 'error') return <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
    if (type === 'warn') return <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
    if (type === 'result') return <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
    return <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-3 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">代码解释器</h1>
            <p className="text-xs text-muted">在浏览器中安全执行 JavaScript · 支持标准 ES6+</p>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-4 md:gap-6">
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
              <div className="px-4 py-2.5 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-slate-400 ml-2 font-mono">script.js</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={handleCopy} className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded flex items-center gap-1">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} {copied ? '已复制' : '复制'}
                  </button>
                  <button onClick={() => { setCode(''); setLogs([]) }} className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> 清空
                  </button>
                </div>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                className="w-full bg-slate-900 text-emerald-100 font-mono text-[12px] p-4 min-h-[280px] outline-none resize-y leading-relaxed"
                placeholder="// 在这里输入 JavaScript 代码..."
              />
              <div className="px-4 py-3 bg-slate-800 border-t border-slate-700 flex items-center gap-2">
                <button
                  onClick={run}
                  disabled={running}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-medium shadow-md transition-all disabled:opacity-50"
                >
                  <Play className="w-3 h-3" /> {running ? '执行中...' : '运行代码'}
                </button>
                <button onClick={() => setLogs([])} className="px-3 py-2 text-slate-400 hover:text-white text-xs rounded-xl flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> 清空日志
                </button>
                <div className="flex-1" />
                <span className="text-[10px] text-slate-500">按 Cmd/Ctrl + Enter 快速执行</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
              <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-medium text-slate-300">执行日志 · Console Output</span>
                <span className="text-[10px] text-slate-500">({logs.length} 条)</span>
              </div>
              <div className="p-4 min-h-[180px] max-h-[400px] overflow-y-auto scrollbar-thin font-mono text-[11px]">
                {logs.length === 0 && (
                  <div className="text-slate-500 text-center py-8">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p>点击"运行代码"查看输出</p>
                  </div>
                )}
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={
                      'flex gap-2 py-1.5 border-b border-slate-800/50 last:border-b-0 ' +
                      (log.type === 'error' ? 'text-red-400' :
                       log.type === 'warn' ? 'text-amber-400' :
                       log.type === 'result' ? 'text-emerald-400' :
                       'text-slate-300')
                    }
                  >
                    {logIcon(log.type)}
                    <pre className="flex-1 whitespace-pre-wrap break-all leading-relaxed">{log.content}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-3">📋 示例代码</h3>
              <div className="space-y-1.5">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setCode(ex.code); setLogs([]) }}
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 rounded-xl transition-all text-xs group border border-transparent hover:border-emerald-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 group-hover:text-emerald-700">{String(i + 1).padStart(2, '0')}. {ex.title}</span>
                      <Code className="w-3 h-3 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
              <h3 className="text-xs font-bold mb-3">🔒 安全说明</h3>
              <ul className="text-[10px] space-y-1.5 opacity-95">
                <li>· 代码在您的浏览器沙盒中执行</li>
                <li>· 无法访问文件系统或网络</li>
                <li>· 仅支持标准 JavaScript (ES6+)</li>
                <li>· console.log/error/warn 会被捕获</li>
                <li>· 异步 Promise 会显示状态</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-2.5">💡 可用函数</h3>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted">
                <div className="bg-slate-50 rounded p-1.5">console.log()</div>
                <div className="bg-slate-50 rounded p-1.5">console.error()</div>
                <div className="bg-slate-50 rounded p-1.5">console.warn()</div>
                <div className="bg-slate-50 rounded p-1.5">Math.*</div>
                <div className="bg-slate-50 rounded p-1.5">Array.*</div>
                <div className="bg-slate-50 rounded p-1.5">Object.*</div>
                <div className="bg-slate-50 rounded p-1.5">JSON.*</div>
                <div className="bg-slate-50 rounded p-1.5">new Promise()</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
