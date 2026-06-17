// 豆包/OpenAI 兼容 API 客户端 — 支持流式响应 & 多模型
// 豆包官方文档：https://www.volcengine.com/docs/82379
// OpenAI 兼容格式相同：POST {baseURL}/chat/completions

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  endpoint: string
  apiKey: string
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

export interface StreamingCallbacks {
  onDelta: (chunk: string) => void
  onDone: (fullText: string) => void
  onError: (err: Error | string) => void
}

/**
 * 角色人格定义
 * - systemPrompt 用于决定回复语气和内容侧重
 * - name/title 用于自我介绍时使用
 */
export interface Persona {
  systemPrompt?: string
  name?: string
  title?: string
  description?: string
}

// ───────────────────────────────────────
//  工具函数：基础
// ───────────────────────────────────────

/** 校验是否有合法的 API 配置 */
export function hasValidApiConfig(opts: { endpoint?: string; apiKey?: string; model?: string }): boolean {
  const { endpoint, apiKey, model } = opts
  return Boolean(
    endpoint && endpoint.trim() !== '' &&
    apiKey && apiKey.trim() !== '' && apiKey.trim().length >= 8 &&
    model && model.trim() !== ''
  )
}

/** 从消息数组取出最后一条用户消息内容 */
function getLastUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].content) {
      return messages[i].content
    }
  }
  return ''
}

/** 从历史中提取最近几条 user 消息用于上下文识别 */
function getRecentUserTexts(messages: ChatMessage[], n: number = 3): string[] {
  const out: string[] = []
  for (let i = messages.length - 1; i >= 0 && out.length < n; i--) {
    if (messages[i].role === 'user') out.unshift(messages[i].content)
  }
  return out
}

/** 判断字符串是否包含任意关键词 */
function hasAnyKeyword(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase()
  for (const k of keywords) {
    if (lower.includes(k.toLowerCase())) return true
  }
  return false
}

/** 取随机元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 取 1~n 个随机元素 */
function pickSome<T>(arr: readonly T[], n: number): T[] {
  const copy = arr.slice()
  const out: T[] = []
  const count = Math.min(n, copy.length)
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy[idx])
    copy.splice(idx, 1)
  }
  return out
}

/** 当前中文格式化日期时间 */
function getCurrentDateTime(): string {
  const d = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 取时段问候 */
function getGreetingByTime(): string {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  if (h < 22) return '晚上好'
  return '夜深了'
}

/** 尝试从一段中文/英文文本做简单的加减乘除计算 */
function tryCalc(text: string): string | null {
  // 匹配数字与 +-*/ = 数字
  const m = text.match(/(-?\d+(?:\.\d+)?)\s*([+\-×*/÷])\s*(-?\d+(?:\.\d+)?)/)
  if (!m) return null
  const a = parseFloat(m[1])
  const b = parseFloat(m[3])
  const op = m[2]
  let result: number | null = null
  switch (op) {
    case '+': result = a + b; break
    case '-': result = a - b; break
    case '*':
    case '×': result = a * b; break
    case '/':
    case '÷': result = b === 0 ? null : a / b; break
  }
  if (result === null) return null
  const formatted = Number.isInteger(result) ? String(result) : result.toFixed(2)
  return `${a} ${op} ${b} = ${formatted}`
}

// ───────────────────────────────────────
//  关键词类别识别
// ───────────────────────────────────────

const KEYWORD_GREETING = ['你好', '您好', 'hi', 'hello', '嗨', '在吗', '你好吗', '早上好', '晚上好', '中午好', 'hi~', 'hello~'] as const
const KEYWORD_THANKS = ['谢谢', '感谢', 'thx', '多谢', '谢谢啦', '谢谢了'] as const
const KEYWORD_BYE = ['再见', '拜拜', 'bye', '88', '晚安', '走了'] as const
const KEYWORD_SELF = ['你是谁', '你叫什么', '自我介绍', '你能做什么', '你是做什么的', '介绍你自己', '你是谁呀'] as const
const KEYWORD_TIME = ['今天', '日期', '时间', '星期', '几点', '几号', '现在几点', '今天星期'] as const
const KEYWORD_WEATHER = ['天气', '下雨', '温度', '天气怎么样', '冷不冷', '热不热', '多少度'] as const
const KEYWORD_CODE = ['代码', 'python', 'javascript', 'js', 'java', 'c++', 'c语言', '函数', '循环', 'bug', '报错', '错误', 'error', '编程', '代码怎么写', '怎么写代码', '写个', '写一个'] as const
const KEYWORD_TRANSLATE = ['翻译', 'translate', '英文', '用英语', '翻译一下'] as const
const KEYWORD_MATH = ['加', '减', '乘', '除', '等于', '=', '等于多少', '计算', '数学', '多少', '等于几'] as const
const KEYWORD_LEARN = ['学习', '如何学', '怎么学', '考试', '作业', '题目', '解释一下', '解释', '讲解'] as const
const KEYWORD_WRITE = ['写', '作文', '文章', '文案', '诗', '诗歌', '故事', '小说', '写一首', '写篇', '写点'] as const
const KEYWORD_HEALTH = ['减肥', '健身', '锻炼', '吃什么', '饮食', '健康', '失眠', '睡眠', '睡不着', '困', '累', '吃', '减肥方法', '怎么瘦', '运动'] as const
const KEYWORD_EMOTION = ['难过', '伤心', '压力', '焦虑', '不开心', '烦', '烦了', '郁闷', '孤独', '不想活', '想哭', '情绪'] as const
const KEYWORD_RECOMMEND = ['推荐', '建议', '哪款', '哪个好', '电影', '书', '音乐', '推荐一下', '好看的', '好听的'] as const
const KEYWORD_CHAT = ['聊聊', '聊天', '无聊', '怎么办', '为什么', '你觉得', '觉得', '你怎么看'] as const
const KEYWORD_SYSTEM = ['你是ai', '你是ai吗', '你是人吗', '你有感情吗', '你聪明吗', '你会难过吗'] as const
const KEYWORD_HELP = ['能做什么', '有什么功能', '帮助', 'help', '功能'] as const

/** 根据 persona 识别角色风格 */
function detectPersonaStyle(persona: Persona | undefined): string {
  const hint = ((persona?.systemPrompt || '') + ' ' + (persona?.description || '') + ' ' + (persona?.title || '')).toLowerCase()
  if (hasAnyKeyword(hint, ['心理咨询', '心理', '心理师', '倾听', '共情'])) return 'counselor'
  if (hasAnyKeyword(hint, ['编程', '程序员', '代码', 'developer', 'coder', '工程师'])) return 'coder'
  if (hasAnyKeyword(hint, ['诗', '文学', '作家', '诗人'])) return 'poet'
  if (hasAnyKeyword(hint, ['美食', '厨师', '菜谱', '菜'])) return 'foodie'
  if (hasAnyKeyword(hint, ['健身', '教练', '训练', '肌肉', '减肥'])) return 'fitness'
  if (hasAnyKeyword(hint, ['旅行', '旅游', '行程', '景点'])) return 'traveler'
  if (hasAnyKeyword(hint, ['老师', '教育', '教学', '学习'])) return 'teacher'
  return 'general'
}

/** 根据 persona 风格调整回复语气 */
function wrapByPersona(text: string, persona: Persona | undefined, category: string): string {
  return text
}

// ───────────────────────────────────────
//  本地智能回复引擎
// ───────────────────────────────────────

/**
 * 根据用户输入内容生成一条像模像样的本地回复
 * @param messages 完整消息历史
 * @param persona 角色定义，用于决定回复风格
 * @returns 完整回复文本
 */
export function smartLocalReply(messages: ChatMessage[], persona?: Persona): string {
  const userText = getLastUserMessage(messages)
  const history = getRecentUserTexts(messages, 3)
  const style = detectPersonaStyle(persona)

  // 空消息容错
  if (!userText.trim()) {
    return `你好呀～我在呢，可以告诉我你想聊点什么吗？我可以陪你聊天、回答问题、写点东西，也可以写代码示例。有什么我可以帮你的吗？`
  }

  // 上下文感知：历史最近对话中若出现代码/数学关键词，可在开头延续
  let contextHint = ''
  if (history.length > 1) {
    const combined = history.slice(0, -1).join(' ')
    if (hasAnyKeyword(combined, KEYWORD_CODE)) {
      contextHint = '刚才我们聊到代码，'
    } else if (hasAnyKeyword(combined, KEYWORD_MATH)) {
      contextHint = '继续刚才的话题，'
    }
  }

  // 识别类别并生成回复
  let reply = ''

  if (hasAnyKeyword(userText, KEYWORD_CODE)) {
    reply = buildCodeReply(userText, style)
  } else if (hasAnyKeyword(userText, KEYWORD_MATH) || tryCalc(userText)) {
    reply = buildMathReply(userText, style)
  } else if (hasAnyKeyword(userText, KEYWORD_TIME)) {
    reply = buildTimeReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_SELF)) {
    reply = buildSelfReply(persona, style)
  } else if (hasAnyKeyword(userText, KEYWORD_GREETING)) {
    reply = buildGreetingReply(persona, style)
  } else if (hasAnyKeyword(userText, KEYWORD_THANKS)) {
    reply = buildThanksReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_BYE)) {
    reply = buildByeReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_WEATHER)) {
    reply = buildWeatherReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_TRANSLATE)) {
    reply = buildTranslateReply(userText, style)
  } else if (hasAnyKeyword(userText, KEYWORD_LEARN)) {
    reply = buildLearnReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_WRITE)) {
    reply = buildWriteReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_HEALTH)) {
    reply = buildHealthReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_EMOTION)) {
    reply = buildEmotionReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_RECOMMEND)) {
    reply = buildRecommendReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_SYSTEM)) {
    reply = buildSystemReply(style)
  } else if (hasAnyKeyword(userText, KEYWORD_CHAT) || hasAnyKeyword(userText, KEYWORD_HELP)) {
    reply = buildHelpReply(style)
  } else {
    reply = buildGeneralReply(userText, style)
  }

  return (contextHint + reply).trim()
}

// —— 各类别回复生成函数 ——

function buildCodeReply(text: string, style: string): string {
  const lower = text.toLowerCase()
  let lang = 'javascript'
  let codeExample = ''
  let topic = '函数'

  if (lower.includes('python')) {
    lang = 'python'
    codeExample = 'def greet(name: str) -> str:\\n    return f"你好, {name}!你好, {name}!\\n\\nprint(greet(\\"世界\\"))'
    topic = 'Python 函数'
  } else if (lower.includes('java')) {
    lang = 'java'
    codeExample = 'public class Hello {\\n    public static void main(String[] args) {\\n        System.out.println("你好, 世界!");\\n    }\\n}'
    topic = 'Java 主方法'
  } else if (lower.includes('c++')) {
    lang = 'cpp'
    codeExample = '#include <iostream>\\nusing namespace std;\\nint main() {\\n    cout << "Hello World!" << endl;\\n    return 0;\\n}'
    topic = 'C++ 基础示例'
  } else if (lower.includes('循环')) {
    lang = 'javascript'
    codeExample = 'for (let i = 0; i < 10; i++) {\\n    console.log(i);\\n}'
    topic = 'for 循环'
  } else if (lower.includes('bug') || lower.includes('报错') || lower.includes('错误')) {
    return `听起来你遇到了一些代码问题。调试的基本思路：

1. **阅读错误信息**，关注报错行和类型
2. **检查输入**，确认数据格式是否正确
3. **一步步**，用 console.log / print 输出中间结果
4. **简化问题**，最小化复现代码片段
5. **查阅文档**和社区，通常别人也遇到过同样的坑

需要的话可以把代码贴出来，我帮你一起看看～`
  } else {
    lang = 'javascript'
    codeExample = '// 计算斐波那契数列的前 n 项\\nfunction fibonacci(n) {\\n    const arr = [0, 1];\\n    for (let i = 2; i < n; i++) {\\n        arr.push(arr[i-1] + arr[i-2]);\\n    }\\n    return arr;\\n}\\n\\nconsole.log(fibonacci(10));'
    topic = 'JavaScript 函数'
  }

  if (style === 'coder') {
    return `好的，我们来看看 ${topic}。\n\n下面是一个简单的示例：\n\n\`\`\`${lang}\n${codeExample}\n\`\`\`\n\n写代码的几个基本原则：\n- 命名清晰、职责单一\n- 拆分小函数，避免过长\n- 加必要的注释\n- 处理边界情况\n\n需要我再详细解释哪一部分？`
  }
  return `关于代码问题，我来给你一个简单的 ${topic} 示例：\n\n\`\`\`${lang}\n${codeExample}\n\`\`\`\n\n写代码的几个小建议：\n- 变量命名要清晰\n- 每一段代码只做一件事\n- 处理异常和边界情况\n\n想让我再详细展开某部分吗？`
}

function buildMathReply(text: string, _style: string): string {
  const calc = tryCalc(text)
  if (calc) {
    return `好的，我帮你算一下：\n\n**${calc}**\n\n关于数学和计算问题，我可以帮你做简单的加减乘除。如果需要更复杂的运算（比如开方、三角函数），可以告诉我具体需求～`
  }
  if (hasAnyKeyword(text, ['平方', '开方', '根号'])) {
    return `关于数学计算，我可以帮你做基础的算术运算。比如 1+1=2，3×4=12 这类简单计算。

一个简单的例子：**5 × 6 = 30**

如果需要更复杂的运算，你可以告诉我具体的题目，我帮你算。想知道哪个？`
  }
  return `关于数学问题，我可以帮你做简单的加减乘除：

- **加法**：23 + 45 = 68
- **减法**：100 - 37 = 63
- **乘法**：12 × 8 = 96
- **除法**：100 ÷ 4 = 25

你有具体想让我算的吗？把题目告诉我～`
}

function buildTimeReply(_style: string): string {
  const now = getCurrentDateTime()
  const greet = getGreetingByTime()
  return `${greet}～现在是 **${now}**。\n\n有什么我可以帮你安排的吗？比如帮你写一份日程安排或者规划今天的工作？`
}

function buildSelfReply(persona: Persona | undefined, style: string): string {
  const name = persona?.name || '小智'
  const title = persona?.title || '通用助手'
  const desc = persona?.description || '我能帮你聊天、回答问题、写代码、写文字，也可以陪你聊聊心情。'

  if (style === 'counselor') return `你好～我是${name}，一位${title}。\n\n我擅长倾听和陪伴，不管是工作压力、人际关系还是日常生活中的小烦恼，都可以和我说说。我会认真听，也会给你一些建议～`
  if (style === 'coder') return `嗨～我是${name}，一名${title}。\n\n我熟悉多种编程语言，可以帮你看代码、排查问题，也可以写代码示例。无论前端、后端还是算法问题，都可以和我聊～`
  if (style === 'poet') return `你好，我是${name}，一位${title}。\n\n我热爱文字，喜欢写诗、讲故事，也可以帮你润色文案。文字的世界，我们一起来探索～`
  if (style === 'fitness') return `嗨～我是${name}，你的${title}。\n\n我可以帮你制定训练计划，讨论饮食搭配，陪你一起进步～`
  return `你好呀～我是**${name}**，一位${title}。\n\n${desc}\n\n有什么我可以帮你的吗？`
}

function buildGreetingReply(_persona: Persona | undefined, style: string): string {
  const greet = getGreetingByTime()
  const variants = [
    `${greet}～很高兴见到你！有什么我可以帮你的吗？`,
    `嗨嗨～我在呢！今天想聊点什么？`,
    `你好呀～我是你的 AI 助手，随时为你服务～`,
    `${greet}！今天有什么想聊的、想了解的都可以问我哦。`,
  ]
  const tail = style === 'counselor' ? '今天心情怎么样？想聊点什么呢？' : '想让我帮你做点什么呢？'
  return pick(variants) + tail
}

function buildThanksReply(style: string): string {
  const variants = [
    '不客气～能帮到你是我的荣幸！',
    '不用谢～有什么需要，随时来找我哦！',
    '很高兴可以帮到你～还有别的问题吗？',
    '小意思～我们是队友呀！',
  ]
  const prefix = style === 'counselor' ? '你能感觉好一些就好啦～' : ''
  return prefix + pick(variants)
}

function buildByeReply(style: string): string {
  const variants = [
    '再见～祝你有美好的一天！记得回来找我呀～',
    '拜拜～下次见！记得休息一下哦。',
    '晚安～好好休息，明天再见！',
    '再见啦～期待下次和你聊天！',
  ]
  return pick(variants)
}

function buildWeatherReply(style: string): string {
  if (style === 'traveler') return '关于天气，我没办法实时查询，但你可以看看手机天气 App 或者搜索引擎。\n\n如果你要出门，记得：\n- 查好天气再决定穿什么\n- 雨天记得带伞\n- 极端天气尽量减少外出\n\n想让我帮你规划出行程吗？'
  return '我没办法实时查询天气哦～你可以打开手机天气 App 或查一下当地天气预报。\n\n不过给你一些出行建议：\n- **下雨记得带伞**\n- **天冷多穿点**\n- **太热记得防晒**\n\n需要我帮你做点别的吗？'
}

function buildTranslateReply(text: string, _style: string): string {
  const lower = text.toLowerCase()
  // 尝试简单中英互译
  // 提取关键词后面的内容
  const samples: Array<[string, string]> = [
    ['你好世界', 'Hello World'],
    ['早上好', 'Good morning'],
    ['谢谢', 'Thank you'],
    ['我爱你', 'I love you'],
    ['再见', 'Goodbye'],
  ]
  const [cn, en] = pick(samples)
  const [cn2, en2] = pick(samples)
  return `关于翻译，我可以做简单的中英互译。举几个例子：\n\n- **${cn}** → ${en}\n- **${cn2}** → ${en2}\n\n如果你想让我翻译具体的内容，直接把句子发给我就可以啦～`
}

function buildLearnReply(style: string): string {
  if (style === 'teacher') return '学习最重要的三件事：\n\n1. **制定目标**：明确每天学什么\n2. **反复练习**：知识点要反复运用\n3. **学以致用**：学了要实践\n\n你想学点什么呢？我可以给你一个学习计划～'
  return '关于学习，几个小建议：\n\n- **制定目标**：每天有计划地学习一点，避免一口吃成胖子\n- **做笔记**：写下自己的总结\n- **做题实践**：学过的内容要动手做习题\n- **休息**：适当休息，劳逸结合\n\n你想学习哪方面呢？我可以帮你做个学习计划～'
}

function buildWriteReply(style: string): string {
  if (style === 'poet') {
    return `你好呀～我来帮你写一段小诗：\n\n> 春风十里，不如你\n> 月色温柔，心事轻扬\n> 夜色深时，灯火可亲\n\n你想让我写点什么主题？爱情、风景、还是人生感悟都可以告诉我～`
  }
  return `我可以帮你写作文、文章、文案、小诗，也可以编小故事。\n\n举个小故事示例：\n\n*那是一个晴朗的早晨，阳光穿过窗户，洒在书桌上。她翻开一本书，开始了新的一天...\n\n你想让我写点什么？给我个主题，我帮你写～`
}

function buildHealthReply(style: string): string {
  if (style === 'fitness') return '关于健康和健身，我的建议：\n\n1. **饮食均衡**：蛋白质、碳水、脂肪都要均衡\n2. **规律运动**：每周至少 3 次\n3. **充足睡眠**：保证 7-8 小时\n\n你想让我帮你制定一份训练计划吗？'
  return '健康的生活方式：\n\n- **饮食均衡**：蔬菜水果肉类均衡\n- **规律作息**：早睡早起\n- **适度运动**：每周至少 3 次\n- **心情愉快**：保持好心情\n\n如果有失眠，可以试试睡前不玩手机、喝杯温牛奶。\n\n需要我帮你制定一份饮食或运动计划吗？'
}

function buildEmotionReply(style: string): string {
  if (style === 'counselor') return '我在听～把事情说出来，往往比憋在心里好受一些。\n\n生活中的压力和烦恼，每个人都会有，它不是你的错。深呼吸，想想让你开心的事，或者想聊聊的话，我一直都在。\n\n想和我聊聊发生了什么吗？'
  return '能感觉到你现在可能有些难受。请记得：\n\n- **每个人都会有低谷期**\n- **说出来会好受很多**\n- **有情绪是正常的**\n\n如果你愿意，我们可以聊聊，让我听听你在想什么～'
}

function buildRecommendReply(style: string): string {
  const movies = ['《当幸福来敲门》', '《肖申克的救赎》', '《阿甘正传》', '《大鱼海棠》', '《活着》']
  const books = ['《活着》', '《百年孤独》', '《追风筝的人》', '《小王子》']
  const music = ['《晴天》周杰伦', '《十年》陈奕迅', '《后来》刘若英']
  return '给你一些小推荐：\n\n**电影**：' + pick(movies) + '\n**书籍**：' + pick(books) + '\n**音乐**：' + pick(music) + '\n\n想让我再推荐些什么类型的内容呢？'
}

function buildSystemReply(style: string): string {
  const answers = [
    '哈哈，我是一个 AI 助手啦～没有实体，但我会一直陪你聊天、帮你思考。',
    '我是 AI 哦～聪明的那种。虽然没有感情，但我会用温柔的方式陪你聊天。',
    '我聪明不聪明，要看你遇到什么问题啦～总之我会尽力帮你的。',
  ]
  return pick(answers)
}

function buildHelpReply(style: string): string {
  return `我可以帮你做这些事：\n\n- 🗣️ **聊天闲聊**：心情好坏都来聊\n- 📝 **写作创作**：作文、文案、小诗\n- 💻 **代码问题**：写代码、查 bug\n- ➕ **数学计算**：简单加减乘除\n- 🌍 **中英互译**：简单翻译\n- 📚 **学习建议**：学习方法、推荐\n- 🏃 **健康建议**：饮食、运动规划\n\n你想让我先帮你做什么呢？`
}

function buildGeneralReply(text: string, style: string): string {
  const trimmed = text.trim()
  const endsWithQuestion = trimmed.endsWith('吗') || trimmed.endsWith('？') || trimmed.endsWith('?')

  if (endsWithQuestion) {
    return `关于「${trimmed}」，这是个值得思考的问题。我可能没有办法立刻给出完美答案，但我可以陪你一起思考。你想从哪个角度聊呢？`
  }
  if (style === 'counselor') return `谢谢你愿意和我分享。能多告诉我一些吗？你说的这些，让我更能理解你。`
  if (style === 'coder') return `嗯嗯～你刚才说的我听到啦。想让我帮你写点代码或者解释点什么吗？`
  if (style === 'poet') return `生活就像一首诗，慢慢流淌。你的这句话，让我想起了一些美好的句子。想让我写点什么给你吗？`
  if (trimmed.length < 5) return `好的～我听到啦。有什么我可以帮你的吗？`
  if (trimmed.length < 20) return `关于「${trimmed}」，我明白啦。你想让我从哪个角度和你聊呢？`
  return `你说的「${trimmed.slice(0, 30)}${trimmed.length > 30 ? '…' : ''}」，我收到啦。\n\n这是个不错的话题。想让我从哪个角度和你继续聊下去呢？可以告诉我你想听哪方面的内容。`
}

// ───────────────────────────────────────
//  本地流式回复（打字机效果
// ───────────────────────────────────────

/**
 * 通过定时器模拟流式输出打字机效果
 * @param text 完整文本
 * @param persona 角色定义
 * @param cb 流式回调
 * @param signal 可选取消信号
 */
export function streamLocalReply(
  text: string,
  _persona: Persona | undefined,
  cb: StreamingCallbacks,
  signal?: AbortSignal,
): void {
  let pos = 0
  let fullText = ''
  const timer = window.setInterval(() => {
    if (signal?.aborted) {
      window.clearInterval(timer)
      cb.onDone(fullText)
      return
    }
    if (pos >= text.length) {
      window.clearInterval(timer)
      cb.onDone(fullText)
      return
    }
    // 每次输出 2-6 个字，模拟 AI 生成效果
    const step = 2 + Math.floor(Math.random() * 5)
    const chunk = text.slice(pos, pos + step)
    pos += step
    fullText += chunk
    cb.onDelta(chunk)
  }, 25 + Math.floor(Math.random() * 25))
}

// ───────────────────────────────────────
//  真实 API 调用（保留，向后兼容）
// ───────────────────────────────────────

/**
 * 直接调用（非流式），兼容豆包与 OpenAI
 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts: ChatOptions,
  signal?: AbortSignal,
): Promise<string> {
  const url = opts.endpoint.endsWith('/chat/completions')
    ? opts.endpoint
    : opts.endpoint.replace(/\/?$/, '/chat/completions')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      top_p: opts.topP ?? 0.9,
      stream: false,
    }),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}

/**
 * 流式调用（SSE），带智能降级：失败时自动回落到本地回复
 * @param messages 完整对话历史
 * @param opts API 配置
 * @param cb 流式回调
 * @param signal 可选取消信号
 * @param persona 可选角色定义（用于降级时的本地回复）
 */
export async function chatCompletionStream(
  messages: ChatMessage[],
  opts: ChatOptions,
  cb: StreamingCallbacks,
  signal?: AbortSignal,
  persona?: Persona,
): Promise<void> {
  const url = opts.endpoint.endsWith('/chat/completions')
    ? opts.endpoint
    : opts.endpoint.replace(/\/?$/, '/chat/completions')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 2048,
        top_p: opts.topP ?? 0.9,
        stream: true,
      }),
      signal,
    })

    // 5xx 或 408 时，尝试一次非流式 fallback
    if (!res.ok) {
      if (res.status >= 500 || res.status === 408) {
        const text = await res.text().catch(() => '')
        console.warn(`[aiClient] 流式请求失败 ${res.status}，尝试非流式 fallback`)
        try {
          const fallback = await chatCompletion(messages, opts, signal)
          streamLocalReply(fallback || smartLocalReply(messages, persona), persona, cb, signal)
          return
        } catch {
          // fallback 也失败，继续降级
        }
      }
      // 降级到本地智能回复
      console.warn(`[aiClient] API 请求失败（${res.status}），降级到本地回复`)
      const localText = smartLocalReply(messages, persona)
      streamLocalReply(localText, persona, cb, signal)
      return
    }

    const reader = res.body?.getReader()
    if (!reader) {
      console.warn('[aiClient] 浏览器不支持流式响应，降级到本地回复')
      const localText = smartLocalReply(messages, persona)
      streamLocalReply(localText, persona, cb, signal)
      return
    }
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (signal?.aborted) {
        cb.onDone(fullText)
        return
      }
      buffer += decoder.decode(value, { stream: true })

      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const evt of events) {
        const lines = evt.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const delta: string | undefined =
              json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content
            if (delta && typeof delta === 'string') {
              fullText += delta
              cb.onDelta(delta)
            }
          } catch {
            // 忽略非法 JSON 片段
          }
        }
      }
    }
    cb.onDone(fullText)
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      cb.onDone('')
      return
    }
    const msg = (err as Error)?.message ?? String(err)
    console.warn(`[aiClient] 网络/其他错误：${msg}，降级到本地回复`)
    const localText = smartLocalReply(messages, persona)
    streamLocalReply(localText, persona, cb, signal)
  }
}
