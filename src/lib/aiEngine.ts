// ============================================================
// AI Engine - 豆包 / OpenAI 兼容的统一 AI 引擎
// ============================================================
//
// 本模块提供：
//  1. hasValidApiConfig()       ：判断 API 配置是否可用
//  2. chatCompletionStream()    ：真实流式调用（SSE 解析）
//  3. createLocalResponse()     ：本地回退智能回复
//  4. buildContext()            ：构造发送给 AI 的上下文消息
//  5. sendMessageStream()       ：统一入口（自动选择真实 / 本地）
//  6. tokenCount()              ：估算 token 数
//  7. trimHistory()             ：按 token 截断历史
//  8. extractCodeBlocks()       ：从文本提取代码块
//  9. detectLanguage()          ：语言检测
//
// 设计原则：
//  - 严格 TypeScript 模式：noImplicitAny、strictNullChecks
//  - 无外部依赖：纯 Web 标准 API（fetch、ReadableStream、TextDecoder）
//  - 自动降级：任何网络 / 鉴权失败自动回退本地引擎并通过 onError 通知
//  - 可中断：支持 AbortSignal，可随时取消
// ============================================================

import type {
  APIConfig,
  ChatMessage,
  CodeBlock,
  DetectLanguage,
  EnginePersona,
  HistoryMessage,
  KnowledgeSnippet,
  StreamingCallbacks,
} from './engineTypes'

// ============================================================
// 一、配置校验与工具
// ============================================================

/** 默认采样参数（供 chatCompletionStream 使用） */
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 2048
const DEFAULT_TOP_P = 0.9
/** 默认保留的历史消息条数（buildContext 使用） */
const DEFAULT_HISTORY_WINDOW = 10

/**
 * 判断 APIConfig 是否看起来是一份有效的配置
 * - endpoint 非空
 * - apiKey 非空且至少 8 字符
 * - modelName 非空
 */
export function hasValidApiConfig(config: Partial<APIConfig>): boolean {
  const endpoint = config.endpoint?.trim() ?? ''
  const apiKey = config.apiKey?.trim() ?? ''
  const modelName = config.modelName?.trim() ?? ''
  return endpoint !== '' && apiKey.length >= 8 && modelName !== ''
}

/**
 * 规范化聊天完成 URL：
 *   https://ark.cn-beijing.volces.com/api/v3     -> /api/v3/chat/completions
 *   https://xxx/api/v3/chat/completions          -> 原样保留
 */
function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim()
  if (trimmed.endsWith('/chat/completions')) return trimmed
  return trimmed.replace(/\/?$/, '/chat/completions')
}

// ============================================================
// 二、SSE 流式响应解析
// ============================================================

/**
 * 基于 ReadableStream 逐行解析 SSE，并通过 callbacks 回传增量文本
 *
 * 处理协议：
 *   - 事件以 \n\n 分隔
 *   - 每个事件可能有多行 data: xxx，最终合并为一个 JSON 字符串
 *   - data: [DONE] 视为流结束标志
 *   - 从 JSON 中读取 choices[0].delta.content 作为增量文本
 */
async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: StreamingCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullText = ''

  // 若用户中途取消，read() 会抛 AbortError，由外层 try-catch 处理
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    // stream: true 确保多字节字符跨分片时不被截断
    buffer += decoder.decode(value, { stream: true })

    // 按 \n\n 切分成事件
    const rawEvents = buffer.split('\n\n')
    // 最后一段可能是不完整事件，放回 buffer
    buffer = rawEvents.pop() ?? ''

    for (const rawEvent of rawEvents) {
      if (signal?.aborted) return
      const eventData = extractEventData(rawEvent)
      if (eventData === null) continue // 忽略空 / 注释 / 非 data 行
      if (eventData.trim() === '[DONE]') {
        callbacks.onDone(fullText)
        return
      }
      const delta = parseDeltaFromJSON(eventData)
      if (delta !== '') {
        fullText += delta
        callbacks.onDelta(delta)
      }
    }
  }

  // 流正常结束（部分实现不发 [DONE]）
  callbacks.onDone(fullText)
}

/**
 * 从一段 SSE 事件中提取 data 行（可能多行，需要以 \n 连接）
 * 忽略 event: / id: / retry: / : 注释 等其他字段
 */
function extractEventData(rawEvent: string): string | null {
  const lines = rawEvent.split('\n')
  const dataParts: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith(':')) continue
    if (trimmed.startsWith('data:')) {
      dataParts.push(trimmed.slice(5).trim())
    }
    // 其他字段（event / id / retry）当前版本不处理
  }
  if (dataParts.length === 0) return null
  return dataParts.join('\n')
}

/**
 * 从 data JSON 中提取增量文本。兼容三种返回：
 *   1. 标准 SSE：choices[0].delta.content
 *   2. 某些实现首包返回 message：choices[0].message.content
 *   3. 某些实现只在 content 字段：response.content / content
 */
function parseDeltaFromJSON(dataStr: string): string {
  try {
    const payload = JSON.parse(dataStr) as unknown
    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>
      const choices = obj.choices as unknown[] | undefined
      if (Array.isArray(choices) && choices.length > 0) {
        const first = choices[0] as Record<string, unknown> | undefined
        if (first) {
          const delta = first.delta as Record<string, unknown> | undefined
          const message = first.message as Record<string, unknown> | undefined
          const content = (delta?.content ?? message?.content) as unknown
          if (typeof content === 'string' && content !== '') return content
        }
      }
      // 兼容部分自定义实现
      const topContent = (obj as Record<string, unknown>).content
      if (typeof topContent === 'string' && topContent !== '') return topContent
    }
  } catch {
    // 忽略非法 JSON 片段（某些服务在错误情况下会返回纯文本）
  }
  return ''
}

// ============================================================
// 三、真实 API 流式调用
// ============================================================

/**
 * 调用真实 API 流式生成回复。
 * - 兼容：豆包火山方舟 / OpenAI / 任何 OpenAI 兼容接口
 * - 网络失败 / HTTP 非 2xx / 解析错误：都会调用 onError
 */
export async function chatCompletionStream(
  messages: ChatMessage[],
  config: APIConfig,
  callbacks: StreamingCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const url = normalizeEndpoint(config.endpoint)
  const body = {
    model: config.modelName,
    messages,
    temperature: config.temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
    top_p: config.topP ?? DEFAULT_TOP_P,
    stream: true,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      callbacks.onError(
        new Error(`API ${res.status} ${res.statusText}: ${text || '无详细信息'}`),
      )
      return
    }

    if (!res.body) {
      callbacks.onError(new Error('浏览器不支持流式响应 (ReadableStream)'))
      return
    }

    const reader = res.body.getReader()
    await parseSSEStream(reader, callbacks, signal)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // 用户主动取消：不算错误，直接结束（不把空串写为完成文本，避免覆盖已有内容）
      callbacks.onDone('')
      return
    }
    const message = err instanceof Error ? err.message : String(err)
    callbacks.onError(new Error(message || '未知网络错误'))
  }
}

// ============================================================
// 四、上下文构建
// ============================================================

/**
 * 根据角色 + 历史 + 知识库片段构造发送给 AI 的完整消息列表
 *
 * 结构：
 *   [0] system : <全局 systemPrompt> + \n\n + <persona.systemPrompt> + (可选 知识库)
 *   [1..N]      : 最近 N 条用户/助手历史（按时间正序）
 *   [N+1]       : 最新用户消息（由调用方通过 history 传入或在外部追加）
 *
 * @param persona           角色
 * @param history           对话历史（按时间正序，取末尾 N 条）
 * @param knowledge         可选的知识库片段（拼在 system prompt 末尾）
 * @param globalSystemPrompt  可选的全局 system prompt（拼在角色提示之前）
 * @param historyWindow     保留的历史消息条数（默认 10）
 */
export function buildContext(
  persona: EnginePersona,
  history: readonly HistoryMessage[],
  knowledge: readonly KnowledgeSnippet[] = [],
  globalSystemPrompt: string = '',
  historyWindow: number = DEFAULT_HISTORY_WINDOW,
): ChatMessage[] {
  const messages: ChatMessage[] = []

  // —— System 提示 ——
  const parts: string[] = []
  const globalTrim = globalSystemPrompt.trim()
  if (globalTrim !== '') parts.push(globalTrim)
  const personaTrim = persona.systemPrompt.trim()
  if (personaTrim !== '') parts.push(personaTrim)

  if (knowledge.length > 0) {
    const knowledgeText =
      '【知识库参考】\n' +
      knowledge
        .map(
          (snippet, idx) =>
            `  ${idx + 1}.${snippet.source ? ` [${snippet.source}]` : ''} ${snippet.content}`,
        )
        .join('\n') +
      '\n请在回答时优先参考上述知识片段内容。'
    parts.push(knowledgeText)
  }

  const systemContent = parts.join('\n\n').trim()
  if (systemContent !== '') {
    messages.push({ role: 'system', content: systemContent })
  }

  // —— 历史对话（取最近 historyWindow 条）——
  const start = Math.max(0, history.length - historyWindow)
  for (let i = start; i < history.length; i++) {
    const h = history[i]
    if (h && h.content && h.content.trim() !== '') {
      messages.push({ role: h.role, content: h.content })
    }
  }

  return messages
}

// ============================================================
// 五、本地回退引擎
// ============================================================

/**
 * 本地回退智能回复（无 API Key 或 API 失败时使用）
 *
 * 能力：
 *  - 关键词识别：问候 / 感谢 / 代码(Python/JavaScript/...) / 数学 / 翻译
 *                / 编程 / 写作 / 学习 / 情绪支持
 *  - 角色感知：根据 persona.id 提供不同风格
 *  - 多轮感知：读取 history 中最近一条用户消息，作为"上一题"提示
 *  - 中文内容生成：带有序列表、代码示例、结构化回答
 *  - 代码检测：用户提到 Python / JS 等时，直接给示例代码
 */
export function createLocalResponse(
  userMessage: string,
  persona: EnginePersona,
  history: readonly HistoryMessage[] = [],
): string {
  const msg = userMessage.trim()
  if (msg === '') return `${persona.emoji} 你好，有什么我可以帮你的吗？`

  const lower = msg.toLowerCase()

  // —— 问候 / 感谢 ——
  if (/^(你好|您好|嗨|哈喽|hi|hello|早|早安|晚安|晚上好|下午好)/i.test(msg)) {
    return `${persona.emoji} 你好呀！我是${persona.name}，很高兴和你对话。你想聊什么？`
  }
  if (/^(谢谢|感谢|多谢|thx|thanks)/i.test(msg)) {
    return `不客气 😊 有什么新的问题随时告诉我，我会继续帮你。`
  }

  // —— 多轮感知：提取上一轮用户话题（仅用于引导）——
  const priorUser = [...history].reverse().find((h) => h.role === 'user')
  const priorHint = priorUser
    ? `\n\n（提示：上一次你提到"${priorUser.content.slice(0, 24)}${
        priorUser.content.length > 24 ? '…' : ''
      }"，可以继续深入这个话题）`
    : ''

  // —— 按角色分发 ——
  switch (persona.id) {
    case 'coder':
      return localReplyCoder(msg, lower) + priorHint
    case 'writer':
      return localReplyWriter(msg) + priorHint
    case 'analyst':
      return localReplyAnalyst(msg) + priorHint
    case 'teacher':
      return localReplyTeacher(msg) + priorHint
    case 'translator':
      return localReplyTranslator(msg, lower) + priorHint
    case 'counselor':
      return localReplyCounselor(msg) + priorHint
    case 'marketer':
      return localReplyMarketer(msg) + priorHint
    case 'poet':
      return localReplyPoet(msg) + priorHint
    case 'chef':
      return localReplyChef(msg) + priorHint
    case 'coach':
      return localReplyCoach(msg) + priorHint
    case 'traveler':
      return localReplyTraveler(msg) + priorHint
    default:
      return localReplyGeneral(msg, lower) + priorHint
  }
}

// —— 各角色的本地回复 ——

function localReplyGeneral(msg: string, lower: string): string {
  if (lower.includes('时间') || lower.includes('日期') || lower.includes('今天')) {
    const d = new Date()
    return `现在是 **${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日**。\n\n你想规划些什么？我可以帮你列清单、安排日程 🌟`
  }
  if (/怎么|如何|为什么|怎么办|是否|是不是|有没有/.test(msg) || /[?？]/.test(msg)) {
    return `关于"${truncate(msg, 32)}"，我的思考思路：\n\n**一、先明确目标**\n- 你想得到什么结果？\n- 有没有约束条件（时间、成本、资源）？\n\n**二、拆解问题**\n- 把大问题拆成若干小问题\n- 先回答能回答的，再探索未知的\n\n**三、可执行的下一步**\n- 告诉我更多上下文（你的行业 / 目标 / 当前状态）\n- 我可以给你更具体的建议\n\n（这是本地回退模式的演示回复，配置真实 API 可获得更强的推理能力 🔑）`
  }
  return `我收到了你说的："${truncate(msg, 40)}"。\n\n作为通用助手，我可以帮你：\n\n- 📝 整理思路 / 起草文案\n- 🔍 解释概念 / 收集信息\n- 💡 头脑风暴 / 提出建议\n- ✅ 制定清单 / 规划任务\n\n告诉我你更希望我怎么帮你，我给出更具体的内容 😊`
}

function localReplyCoder(msg: string, lower: string): string {
  // —— Python ——
  if (lower.includes('python')) {
    return `好的，关于 **Python**。\n\n这里给你一个实用示例（读取 CSV 并做简单统计）：\n\n\`\`\`python\nimport csv\nfrom collections import Counter\n\nwith open('data.csv', newline='', encoding='utf-8') as f:\n    rows = list(csv.DictReader(f))\n\nprint(f'共 {len(rows)} 条记录')\ncities = Counter(r.get('city') for r in rows if r.get('city'))\nprint('城市分布:', cities.most_common(5))\n\`\`\`\n\n**学习路径建议**\n1. 基础语法：变量 / 循环 / 函数 / 类\n2. 常用库：pandas、numpy、requests\n3. 项目练习：爬虫、数据分析、自动化\n\n把你的具体代码贴出来，我帮你调试或优化 👨‍💻`
  }

  // —— JavaScript / TypeScript ——
  if (/javascript|typescript|\bjs\b|\bts\b/.test(lower)) {
    return `好的，关于 **JavaScript / TypeScript**。\n\n示例：使用 async/await 并发请求多个接口：\n\n\`\`\`javascript\nasync function fetchAll(urls) {\n  const responses = await Promise.all(urls.map(u => fetch(u)))\n  return Promise.all(responses.map(r => r.json()))\n}\n\`\`\`\n\n**关键概念清单**\n- Promise / async-await / 事件循环\n- 数组方法：map / filter / reduce\n- TypeScript：泛型、联合类型、类型守卫\n\n把你的代码或需求发给我，我来给出针对性示例 👨‍💻`
  }

  // —— 通用代码/编程关键词 ——
  if (/代码|编程|写程序|实现|开发|debug|bug|算法/.test(msg)) {
    return `好的，关于编程。\n\n**写好代码的四条通用原则**\n1. **先想清楚再写**——用注释或伪代码理清逻辑\n2. **模块化**——拆成小函数，单一职责\n3. **命名清晰**——变量 / 函数名说明用途\n4. **先跑通，再优化**——不要一开始就追求完美\n\n**你可以告诉我**\n- 使用的语言 / 框架\n- 目标功能是什么\n- 已有代码或 bug 现象\n\n我直接给你示例代码和解释 👨‍💻`
  }

  // —— 数学 / 计算 ——
  if (/数学|计算|公式|方程|几何|概率/.test(msg)) {
    return `关于"${truncate(msg, 20)}"的数学问题 🔢\n\n你可以把具体的题目或公式发给我。常见场景：\n\n- 解方程、求导 / 积分\n- 排列组合、概率\n- 几何、三角函数\n- 数值计算、算法\n\n（本地模式下我给出思路和示例，配置真实 API 可获得更强的计算与推导能力）`
  }

  return `收到编程相关问题："${truncate(msg, 40)}"。\n\n作为编程专家，我可以：\n\n- 💻 编写示例代码\n- 🔍 调试 bug / 性能问题\n- 🏗️ 讨论架构与选型\n- 📚 设计学习路径\n\n请告诉我你使用的语言和具体场景，我给出针对性的建议与代码示例 👨‍💻`
}

function localReplyWriter(msg: string): string {
  return `关于"${truncate(msg, 30)}"的写作需求 ✍️\n\n**三种常见风格供你选择**\n\n1. **温暖亲切**——像朋友聊天，适合日常分享、公众号\n2. **专业简洁**——结构清晰、信息密度高，适合正式文案\n3. **故事叙述**——以故事开篇、营造画面感，适合品牌 / 情感内容\n\n**你可以补充告诉我**\n- 目标读者是谁\n- 希望的篇幅与语气\n- 必须包含的核心信息\n\n我会根据这些信息为你量身创作 📝`
}

function localReplyAnalyst(msg: string): string {
  return `关于"${truncate(msg, 30)}"的分析思路 📊\n\n**通用分析框架**\n1. **明确目标**：回答什么问题？指标是什么？\n2. **梳理已知信息**：有哪些数据？缺少什么？\n3. **关键指标**：关注核心 KPI，而非全部数字\n4. **得出结论**：基于数据，而非直觉\n5. **可执行建议**：下一步怎么做\n\n**常用方法**\n- 同比 / 环比：看趋势\n- 漏斗分析：看转化\n- 细分分析：按维度拆分\n- 相关性：变量关系\n\n把你的数据或业务场景发给我，我给出具体分析方案与示例表格 📈`
}

function localReplyTeacher(msg: string): string {
  if (/什么是|是什么|解释|介绍|讲一下|定义|概念/.test(msg)) {
    return `好问题！我会用"三层法"帮你理解：\n\n**第一层：基础概念**\n用生活中的例子打比方，给出核心定义\n\n**第二层：为什么重要**\n- 在哪些场景会用到？\n- 理解它能帮你做什么？\n\n**第三层：进一步延伸**\n- 相关概念 / 知识网络\n- 推荐学习方向\n\n把你想了解的具体概念告诉我，我用这个方法一步步拆解 👨‍🏫`
  }
  return `我们来一起学习"${truncate(msg, 30)}"这个话题 👨‍🏫\n\n**学习三问**\n1. **这是什么**（定义 + 例子）\n2. **为什么学**（价值 + 应用）\n3. **怎么应用**（练习 + 延伸）\n\n告诉我你的基础和目标，我可以：\n- 用简单语言解释复杂概念\n- 给你练习题\n- 推荐学习资源`
}

function localReplyTranslator(msg: string, lower: string): string {
  // 简单语言检测：是否包含英文
  const hasEnglish = /[a-zA-Z]{4,}/.test(msg)
  if (hasEnglish) {
    return `我识别到这段内容包含英文 🌐\n\n**翻译原则**\n- 忠实：保留原文信息\n- 通顺：符合中文表达习惯\n- 传神：保留语气与文化\n\n把完整文本发给我，我会给出地道的中文翻译与必要的注释。`
  }
  if (/翻译|translate|英译中|中译英/.test(lower)) {
    return `好的，翻译官就位 🌐\n\n**支持的场景**\n- 中英文互译（日常 / 商务 / 技术）\n- 文化典故与行业术语注释\n- 校对与润色\n\n请把需要翻译的内容发给我。`
  }
  return `关于"${truncate(msg, 30)}"的翻译需求 🌐\n\n请把完整文本发给我，并告诉我：\n\n- 目标语言（默认：中→英 / 英→中 自动检测）\n- 使用场景（日常 / 商务 / 技术 / 文学）\n\n我会给出地道的翻译与必要的术语注释。`
}

function localReplyCounselor(msg: string): string {
  return `我在听你说 🧠\n\n"${truncate(msg, 60)}"\n\n**我听到的感受**\n你的感受是真实的，不必否定它。很多人在类似情况下也会有类似体验。\n\n**几个可以思考的方向**\n- 这件事让你最在意的是什么？\n- 你通常怎么处理这类情绪？\n- 有没有什么小事现在就能做的，让自己感觉好一点？\n\n**温馨提示**\n情绪没有对错，重要的是我们怎么和它相处。\n如果情况严重或持续困扰你，请联系专业帮助：\n- 北京心理危机研究与干预中心：010-82951332\n- 全国心理援助热线：400-161-9995`
}

function localReplyMarketer(msg: string): string {
  return `收到你的营销需求："${truncate(msg, 30)}" 📈\n\n**营销分析框架（按顺序回答）**\n1. **目标**：想达成什么结果（拉新 / 转化 / 品牌 / 留存）？\n2. **目标用户**：核心受众画像是什么？\n3. **价值主张**：你提供的独特价值是什么？\n4. **渠道策略**：在哪些平台触达用户？\n5. **内容策略**：用什么内容打动用户？\n6. **数据指标**：用什么衡量成功？\n\n把你的产品/服务、目标用户与当前瓶颈告诉我，我给出可执行的建议 🚀`
}

function localReplyPoet(msg: string): string {
  const topic = truncate(msg, 12)
  return `关于"${topic}"，我为你写几句 🎭\n\n**《此刻》**\n\n当${topic}轻轻拂过，\n世界在呼吸的缝隙间低语，\n那是你未曾留意的光，\n藏着整季的温度。\n\n—\n\n**另一版**\n你问${topic}，\n像风吹过麦田，\n留下的，是金色的回响，\n还有你心里那抹温柔。\n\n想要什么风格？古体 / 现代 / 短句？\n告诉我主题，我为你量身创作 ✨`
}

function localReplyChef(msg: string): string {
  return `好的，关于你的美食需求 👨‍🍳\n\n**通用菜谱模板**\n\n**食材准备（按实际调整分量）**\n- 主料：根据你的需求选择\n- 配料：葱姜蒜、辣椒等家常易得\n- 调味：盐 / 糖 / 生抽 / 料酒\n\n**烹饪步骤**\n1. 食材处理（清洗 / 切配 / 腌制）\n2. 热锅起油，爆香调料\n3. 下主料，控制火候\n4. 调味翻炒，出锅装盘\n\n**关键技巧**\n- 热锅冷油，防止粘锅\n- 调料分次加，味道更均匀\n- 火候是灵魂：急火快炒，慢火入味\n\n告诉我你有什么食材、想做什么菜系，我给你完整菜谱 😋`
}

function localReplyCoach(msg: string): string {
  return `好的，关于你的健身需求 💪\n\n**先确认三件事**\n1. **目标**：减脂 / 增肌 / 塑形 / 健康\n2. **时间**：每周能投入多少分钟\n3. **基础**：新手 / 有经验 / 进阶\n\n**通用原则**\n- 饮食：七分吃三分练，蛋白质是关键\n- 训练：循序渐进，给身体恢复时间\n- 休息：睡眠是最好的恢复手段\n- 坚持：21 天养成习惯，3 个月看到变化\n\n**温馨提示**\n- 运动前充分热身 5-10 分钟\n- 动作质量比数量重要\n- 身体不适时停止训练，量力而行\n\n告诉我你的情况，我为你定制计划 ✊`
}

function localReplyTraveler(msg: string): string {
  return `为你规划旅行 ✈️\n\n**规划前先确认**\n1. **目的地**：哪里？偏好文化 / 自然风光？\n2. **天数**：几天几夜？\n3. **预算**：人均预算多少？\n4. **偏好**：休闲 / 深度游 / 美食？\n\n**通用模板（3 天 2 夜）**\n\n**Day 1**：到达 + 经典地标 + 当地小吃\n**Day 2**：核心景点 + 特色活动 + 正餐\n**Day 3**：周边 / 文化体验 + 返程\n\n**预算分配建议**\n- 交通：提前订大交通 + 市内交通\n- 住宿：按位置与价格综合考虑\n- 餐饮：本地特色 + 日常餐饮\n- 门票：景点门票与活动\n\n告诉我目的地与天数，我给你详细的行程 🌟`
}

/** 辅助：截断字符串，用于本地回复中安全展示用户输入 */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '…'
}

// ============================================================
// 六、本地"流式"模拟（为本地回退提供打字机效果）
// ============================================================

/**
 * 将完整文本以"打字机"方式流式输出（用于本地回退的视觉体验）
 * - 每 20~50ms 输出 3~6 个字符
 * - 支持 AbortSignal 中断
 * - 通过 callbacks.onDelta / onDone 通知调用方
 *
 * 返回一个 Promise，"模拟结束"或"被中断"后 resolve
 */
export function simulateLocalStream(
  fullText: string,
  callbacks: StreamingCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let i = 0
    let cancelled = false

    const step = (): void => {
      if (signal?.aborted || cancelled) {
        callbacks.onDone(fullText.slice(0, i))
        resolve()
        return
      }
      // 每次输出 3~6 个字符
      const stepSize = 3 + Math.floor(Math.random() * 4)
      const end = Math.min(fullText.length, i + stepSize)
      const chunk = fullText.slice(i, end)
      i = end
      if (chunk !== '') callbacks.onDelta(chunk)
      if (i >= fullText.length) {
        callbacks.onDone(fullText)
        resolve()
        return
      }
      // 20~50ms 的随机延迟，营造真实打字感
      window.setTimeout(step, 20 + Math.floor(Math.random() * 30))
    }

    // 监听取消信号：避免 setTimeout 继续触发
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          cancelled = true
        },
        { once: true },
      )
    }

    step()
  })
}

// ============================================================
// 七、统一入口：自动选择真实 API 或本地回退
// ============================================================

/**
 * 统一入口函数：发送一条用户消息，并通过 callbacks 流式返回 AI 回复
 *
 * 行为：
 *  - 若 config 有效 → 调用真实 API；失败时自动降级为本地回退并通过 onError 通知
 *  - 若 config 无效 → 直接本地回退
 *
 * @param userMessage 最新一条用户消息（非空字符串）
 * @param persona     当前角色
 * @param history     对话历史（按时间正序，不含本消息）
 * @param knowledge   知识库片段（可选）
 * @param config      API 配置（可能缺字段，内部会通过 hasValidApiConfig 判断）
 * @param callbacks   流式回调
 * @param signal      可选 AbortSignal，用于取消
 */
export function sendMessageStream(
  userMessage: string,
  persona: EnginePersona,
  history: readonly HistoryMessage[],
  knowledge: readonly KnowledgeSnippet[] | undefined,
  config: APIConfig,
  callbacks: StreamingCallbacks,
  signal?: AbortSignal,
): void {
  const trimmed = userMessage.trim()
  if (trimmed === '') {
    callbacks.onError(new Error('消息内容不能为空'))
    return
  }

  // —— 构造消息上下文 ——
  const contextMessages = buildContext(
    persona,
    history,
    knowledge ?? [],
    config.systemPrompt ?? '',
  )
  const allMessages: ChatMessage[] = [...contextMessages, { role: 'user', content: trimmed }]

  const fallback = (errMessage?: string): void => {
    if (errMessage) {
      // 仅通过 onError 传递错误文本，但继续生成本地回复，给用户视觉反馈
      callbacks.onError(new Error(errMessage + '，已切换到本地演示模式'))
    }
    const localText = createLocalResponse(trimmed, persona, history)
    simulateLocalStream(localText, callbacks, signal).catch(() => {
      // simulateLocalStream 内部已消化异常；此处仅保险
      callbacks.onDone(localText)
    })
  }

  // —— 决策：真实 API 或 本地 ——
  if (!hasValidApiConfig(config)) {
    fallback()
    return
  }

  // 使用真实 API；失败时自动降级
  chatCompletionStream(
    allMessages,
    config,
    {
      onDelta: callbacks.onDelta,
      onDone: callbacks.onDone,
      onError: (err) => {
        const message = err instanceof Error ? err.message : String(err)
        fallback(message)
      },
    },
    signal,
  )
}

// ============================================================
// 八、辅助函数：token 估算、历史截断、代码块提取、语言检测
// ============================================================

/**
 * 粗略估算 token 数
 * - 中文：约 1.5 字符 / token
 * - 英文：约 4 字符 / token
 * - 其他：按字符数保守估算
 *
 * 注意：这是工程估算值，并非真实 tokenizer，适合在前端做历史截断
 */
export function tokenCount(text: string): number {
  if (text === '' || text === null || text === undefined) return 0
  let cjk = 0 // 中日韩字符数
  let asciiLetter = 0 // 英文数字符号数
  let other = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x4e00 && code <= 0x9fff) {
      // 常用中日韩统一表意文字
      cjk++
    } else if (code < 128) {
      asciiLetter++
    } else {
      other++
    }
  }
  return Math.ceil(cjk / 1.5) + Math.ceil(asciiLetter / 4) + Math.ceil(other / 2)
}

/**
 * 按 token 预算截断历史消息（从最旧的开始砍）
 * - 保留 system message（若有）的预算 reserveSystemTokens
 * - 按顺序尽量塞入新消息
 *
 * @param history      历史消息（按时间正序）
 * @param maxTokens    总 token 预算（默认 3000）
 * @param reserveTokens 为 system / 当前用户消息预留的 token（默认 500）
 */
export function trimHistory(
  history: readonly HistoryMessage[],
  maxTokens: number = 3000,
  reserveTokens: number = 500,
): HistoryMessage[] {
  const budget = Math.max(0, maxTokens - reserveTokens)
  const result: HistoryMessage[] = []
  let used = 0
  // 从最新的开始往前塞，最后再反转回正序
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i]
    if (!h || !h.content || h.content.trim() === '') continue
    const cost = tokenCount(h.content)
    if (used + cost > budget && result.length > 0) break
    result.push(h)
    used += cost
  }
  return result.reverse()
}

/**
 * 从 Markdown 文本中提取所有代码块
 * 支持：
 *   ```language\n<code>\n```
 *   ```\n<code>\n```
 */
export function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = []
  if (!text) return blocks
  const re = /```([\w+-]*)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const language = (match[1] ?? '').trim().toLowerCase()
    const code = match[2] ?? ''
    if (code !== '') blocks.push({ language, code })
  }
  return blocks
}

/**
 * 简单语言检测：基于 Unicode 范围统计字符占比
 * - zh: 中日韩字符 > 30%
 * - en: ASCII 字母 > 60%
 * - ja: 含平假名 / 片假名（且非中文为主）
 * - ko: 含谚文
 * - other: 其他
 */
export function detectLanguage(text: string): DetectLanguage {
  if (!text) return 'other'
  let cjk = 0
  let ascii = 0
  let hiragana = 0
  let katakana = 0
  let hangul = 0
  let total = 0

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    total++
    if (code >= 0x4e00 && code <= 0x9fff) cjk++
    else if (code < 128 && ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)))
      ascii++
    else if (code >= 0x3040 && code <= 0x309f) hiragana++
    else if (code >= 0x30a0 && code <= 0x30ff) katakana++
    else if (code >= 0xac00 && code <= 0xd7af) hangul++
  }

  if (total === 0) return 'other'
  if (hiragana + katakana > total * 0.15) return 'ja'
  if (hangul > total * 0.1) return 'ko'
  if (cjk > total * 0.3) return 'zh'
  if (ascii > total * 0.6) return 'en'
  return 'other'
}

// ============================================================
// 导出：重新导出类型，方便外部单独使用
// ============================================================

export type {
  APIConfig,
  ChatMessage,
  CodeBlock,
  DetectLanguage,
  EnginePersona,
  HistoryMessage,
  KnowledgeSnippet,
  StreamingCallbacks,
}
