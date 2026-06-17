/**
 * 智能本地 AI 引擎 v2.0
 *
 * 设计原则：
 * 1. 先理解用户真正想问什么 —— 不要机械匹配第一个关键词
 * 2. 动态生成回复 —— 同一个问题每次有不同回答
 * 3. 诚实：不知道的就说不知道 + 给可行的替代方案
 * 4. 自然对话：像真实聊天一样有语气、有追问、有推进
 */

// ===========================================
// 工具
// ===========================================

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function containsAny(text: string, patterns: RegExp[]): boolean {
  for (const p of patterns) if (p.test(text)) return true
  return false
}

// ===========================================
// 1. 更好的意图识别（按"更具体优先"排序）
// ===========================================

type Intent =
  | 'greeting' | 'farewell' | 'thanks' | 'agree' | 'disagree'
  | 'weather' | 'time_date' | 'calc_math'
  | 'ask_who_you_are' | 'ask_help' | 'ask_how_to_use'
  | 'need_code' | 'need_learn' | 'need_write' | 'need_translate'
  | 'emotion_sad' | 'emotion_happy' | 'emotion_anxious' | 'emotion_tired'
  | 'ask_recommend' | 'ask_opinion' | 'ask_fact'
  | 'small_talk' | 'question_general' | 'command_general' | 'unknown'

function analyzeIntent(text: string): Intent {
  const t = text.trim()
  const low = t.toLowerCase()

  // ---- 礼貌/对话类（最早识别，否则会被误判为"问题"） ----
  if (/^(你好|您好|嗨|hi|hello|在吗|在不在|嘿|哈喽|哈喽|早|早上好|晚安|晚上好|下午好|嘿嘿|哈哈)/i.test(t)) return 'greeting'
  if (/^(再见|拜拜|bye|88|回见|回头见|撤了|走了|先这样)/i.test(t)) return 'farewell'
  if (/^(谢谢|感谢|多谢|thx|thanks|thank you)/i.test(t)) return 'thanks'
  if (/^(对|是的|是|嗯|好|ok|okay|可以|行|没错|正解)/.test(t)) return 'agree'
  if (/^(不对|不行|不要|不是|no|错误|有问题|反对|不)/.test(t)) return 'disagree'

  // ---- 需要实时/外部数据（诚实告诉用户不能获取）----
  if (/天气|下雨|气温|温度|湿度|刮风|预报/.test(t)) return 'weather'
  if (/(股市|股票|股价|大盘|指数|价格|行情|金价|油价|汇率)/.test(t)) return 'unknown'
  if (/(新闻|头条|今日|实时|热点|热搜|赛事|比分|直播)/.test(t)) return 'unknown'
  if (/(地图|地址|在哪|位置|附近|路线|导航)/.test(t)) return 'unknown'
  if (/(快递|物流|订单|外卖|配送)/.test(t)) return 'unknown'

  // ---- 自我认识 / 使用说明 ----
  if (/^(你是谁|你是|你是誰|介绍你|介绍一下你|你叫什么|你能干什么|你有什么用|你能做什么|你的功能|自我介绍)/.test(t)) return 'ask_who_you_are'
  if (/^(怎么用|怎么用你|如何使用|如何|操作|help|说明|使用|不太会|不会用)/.test(t)) return 'ask_help'

  // ---- 时间/日期/数学（精确类）----
  if (/^(几点|现在几点|什么时候|时间|日期|今天是|星期几|几号)/.test(t)) return 'time_date'
  if (/^[\d\s+\-*/×÷=％%.]/i.test(t) && /[+\-*/×÷=]/.test(t)) return 'calc_math'
  if (/(等于|计算|算|等于多少|加|减|乘|除)/.test(t) && /\d/.test(t)) return 'calc_math'

  // ---- 专业/任务类 ----
  if (/(代码|编程|python|javascript|typescript|java|c\+\+|sql|react|vue|函数|算法|bug|报错|错误|接口|编译|写个|实现|写一个|写一段)/i.test(t)) return 'need_code'
  if (/(翻译|translate|翻成|英文|中文|英语|日语)/i.test(t)) return 'need_translate'
  if (/(写|创作|诗歌|诗|文案|文章|标题|公众号|作文|故事|小说)/.test(t)) return 'need_write'
  if (/(解释|什么是|原理|怎么理解|如何理解|讲一下|告诉我|学习|入门|教程|说明白)/.test(t)) return 'need_learn'

  // ---- 情绪/陪伴类 ----
  if (/(难过|伤心|不开心|崩溃|想哭|哭了|委屈|低落|孤独|寂寞|空虚|迷茫)/.test(t)) return 'emotion_sad'
  if (/(焦虑|压力|紧张|担忧|担心|睡不着|失眠|困扰|很烦|很烦|烦躁|崩溃)/.test(t)) return 'emotion_anxious'
  if (/(累|疲惫|累了|好累|不想|没动力|没精神|身心俱疲)/.test(t)) return 'emotion_tired'
  if (/(开心|高兴|快乐|兴奋|幸福|激动|^哈哈|嘿嘿|嘻嘻)/.test(t)) return 'emotion_happy'

  // ---- 推荐/观点类 ----
  if (/(推荐|选哪|哪个好|哪个更|有什么|有啥|给我|推荐一个|给个)/.test(t)) return 'ask_recommend'
  if (/(你觉得|你认为|怎么看|怎么样|好不好|合适吗|可以吗|值不值)/.test(t)) return 'ask_opinion'
  if (/(是什么|是|谁|哪|哪里|哪一个|多少|几|多少钱|多远|多久)/.test(t)) return 'ask_fact'

  // ---- 兜底 ----
  if (/[?？]$/.test(t) || /[?？]/.test(t)) return 'question_general'
  if (/^(帮|给|写|做|告诉我|列出|整理|总结|分|分析)/.test(t)) return 'command_general'
  if (t.length < 5) return 'small_talk'
  return 'question_general'
}

// ===========================================
// 2. 角色定义（不再只有一个问候语）
// ===========================================

export interface PersonaProfile {
  id: string
  name: string
  emoji: string
  description: string
  systemPrompt: string
  greetings: string[]      // 多个问候语，随机选
  strengths: string[]      // 擅长能力
  tone: 'casual' | 'professional' | 'warm' | 'creative'
}

export const PERSONAS: PersonaProfile[] = [
  {
    id: 'general',
    name: '小蓝',
    emoji: '🤖',
    description: '友好全能的对话助手，日常聊天、解答、建议都行',
    systemPrompt: '你是一个名叫"小蓝"的中文对话助手，语气自然、不啰嗦，遇到不知道的就诚实说不知道。',
    greetings: [
      '你好～我是小蓝。今天想聊点什么？😊',
      '嗨！我在，有什么可以帮你的吗？',
      '嘿～我可以陪你聊聊、出主意、写写东西。你需要什么？',
      '你好呀！我是小蓝。可以问我任何事，也可以让我帮你写、整理、出主意。',
    ],
    strengths: ['日常聊天', '解释概念', '整理信息', '出主意'],
    tone: 'casual',
  },
  {
    id: 'coder',
    name: '代码助手',
    emoji: '👨‍💻',
    description: '写代码、调 bug、讲原理、给建议',
    systemPrompt: '你是一位资深全栈工程师，擅长解释、写代码示例和调试思路。',
    greetings: [
      '👨‍💻 你好，我是代码助手。你在写什么语言？或者遇到了什么 bug？',
      '嗨～直接把代码、报错信息或需求发给我，我帮你分析。',
    ],
    strengths: ['Python', 'JavaScript/TS', 'SQL', '前端', '后端', 'API 设计'],
    tone: 'professional',
  },
  {
    id: 'writer',
    name: '写作文案',
    emoji: '✍️',
    description: '文案、标题、文章、故事、诗歌',
    systemPrompt: '你是一位擅长中文写作的创作者，会写多种风格。',
    greetings: [
      '✍️ 嗨，我来帮你写东西。是文案、标题、文章，还是别的？',
    ],
    strengths: ['文案', '标题', '文章', '诗歌', '产品介绍'],
    tone: 'creative',
  },
  {
    id: 'teacher',
    name: '学习导师',
    emoji: '📚',
    description: '用通俗比喻讲清楚复杂概念',
    systemPrompt: '你是一位耐心的老师，总用生活比喻来解释概念。',
    greetings: ['📚 嗨，你想了解哪个领域或概念？我尽量用大白话讲清楚。'],
    strengths: ['概念解释', '学习路径', '答疑解惑'],
    tone: 'warm',
  },
  {
    id: 'counselor',
    name: '倾听者',
    emoji: '💗',
    description: '只倾听、陪你聊天，不做评判',
    systemPrompt: '你是一个温暖的倾听者，不评判用户情绪。',
    greetings: ['💗 嗨，我在。发生了什么让你想聊聊？'],
    strengths: ['倾听', '情绪陪伴', '减压'],
    tone: 'warm',
  },
  {
    id: 'analyst',
    name: '数据分析师',
    emoji: '📊',
    description: '用数据思路分析问题',
    systemPrompt: '你是一位思维清晰的数据分析师。',
    greetings: ['📊 嗨！有什么数据想分析，或者想做个决策？把信息告诉我。'],
    strengths: ['数据思路', '决策框架', '指标设计'],
    tone: 'professional',
  },
]

export function getPersonaById(id: string): PersonaProfile {
  return PERSONAS.find((p) => p.id === id) || PERSONAS[0]
}

// ===========================================
// 3. 回复生成（每个意图有 3-5 个自然表达 + 针对问题的动态内容）
// ===========================================

interface ChatContext {
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  persona: PersonaProfile
}

// ---- 小工具：根据话题给出 2-3 个追问方向 ----
function followUps(topicHint: string): string[] {
  const hint = topicHint.trim() || '你想聊的事'
  return [
    `你具体想了解"${hint || '这个话题'}"的哪方面？`,
    `可以告诉我更多上下文吗？比如你想解决什么实际问题。`,
    `你是想了解原理，还是想知道怎么应用？`,
    `有具体案例或信息的话可以一起发给我，更容易聊到点子上。`,
  ]
}

// ---- 从用户问题中提取"主题词"（非完美，但比关键词好）----
function extractTopic(text: string): string {
  const cleaned = text
    .replace(/[?？!！。,，\s]+/g, ' ')
    .replace(/^(你好|请问|帮我|你|我想问|问一下|能不能|可以|帮|告诉我|解释一下|讲讲|说一下|看一下|介绍|怎么|如何|什么是|什么叫|的|了|吗|呢|呀|啊)/, '')
    .trim()
  if (cleaned.length <= 8) return cleaned.replace(/[的了]/g, '').trim() || '这个话题'
  // 取前面的核心短语
  const short = cleaned.slice(0, 14)
  return short || '这个话题'
}

// 通用的"不知道/无法获取"回复模板
function cannotReply(reason: 'no-live' | 'no-data' | 'too-personal' | 'unclear'): string {
  switch (reason) {
    case 'no-live':
      return pick([
        '抱歉～我目前是纯本地运行，没法获取实时数据（天气、股票、新闻、位置这些都拿不到）。\n\n你可以：\n1) 打开对应 App 查询\n2) 告诉我更具体的需求，比如"我下周去北京出差，应该带什么衣服？"——我可以给建议',
        '我查不了实时数据（比如天气、股价、新闻）。\n\n但如果你把你的场景告诉我——比如你在纠结穿什么、要不要出门——我可以基于你给的信息给建议。',
      ])
    case 'no-data':
      return pick([
        '这个话题我没有可靠的数据或资料。你如果能补充一些信息（比如行业、场景、你已经知道的部分），我可以帮你一起分析。',
        '我没有这方面的准确数据，不乱回答你。\n\n你可以告诉我你为什么想问这个，也许能换个方式帮上忙。',
      ])
    case 'too-personal':
      return '这是一个很个人的问题，最终得由你自己做决定。\n\n你可以告诉我你目前的具体情况和担心的点，我帮你把利弊列出来、或者陪你理一理。'
    case 'unclear':
    default:
      return pick([
        '嗯～我没完全理解你的意思。你可以换个问法，或者把你的背景和目的说一下，我更容易帮到你。',
        '不好意思，你这句话我没完全接收到。能再说详细一点吗？比如：\n- 你在什么场景下遇到这个问题？\n- 你想得到什么结果？',
      ])
  }
}

// ---- 核心入口 ----
export function generateReply(userText: string, ctx: ChatContext): string {
  const intent = analyzeIntent(userText)
  const p = ctx.persona

  // 根据意图分流
  switch (intent) {
    // ---- 礼貌类 ----
    case 'greeting':
      return pick(p.greetings)
    case 'farewell':
      return pick([
        `${p.emoji} 好的～回见！有需要随时再来聊。`,
        `拜拜～祝你今天顺利，下次见！👋`,
        `行，那先到这里。想聊随时回来～`,
      ])
    case 'thanks':
      return pick([`不客气～${p.emoji}`, '应该的，随时找我～', '没什么～能帮上就好！'])
    case 'agree':
      return pick([
        '好的。那你想我接下来做什么？继续展开、写点什么，或者换个话题？',
        '明白，那我们继续推进。你希望下一步怎么做？',
      ])
    case 'disagree':
      return pick([
        '好的，没问题。你说说你的想法？也许我能帮你一起想方案。',
        '没关系～你把你的顾虑说出来，我们可以换个方向聊。',
      ])

    // ---- 需要实时数据：诚实 ----
    case 'weather':
      return cannotReply('no-live')

    case 'unknown':
      return cannotReply('no-data')

    // ---- 自我认识 ----
    case 'ask_who_you_are':
      return `${p.emoji} 我是 **${p.name}** —— ${p.description}。\n\n简单说，我目前的工作方式是：**本地运行、不上传你的对话数据、会诚实说"我不知道"而不瞎编**。\n\n我擅长：${p.strengths.join('、')}。\n\n想聊点什么？`

    case 'ask_help':
      return `${p.emoji} 没问题～我这里给你几个常用用法，你挑一个或直接问：\n\n1) **直接问问题** —— "什么是 XXX？""XXX 怎么做？"\n2) **让我写东西** —— "帮我写一段介绍/标题/邮件"\n3) **让我理思路** —— 把你遇到的事情说出来，我帮你列关键点\n4) **写代码或排查 bug** —— 贴代码/报错信息，我帮你分析\n\n直接发你想问的就行～`

    // ---- 时间/日期 ----
    case 'time_date': {
      const now = new Date()
      const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
      return `${p.emoji} 我这边显示的本地时间是：\n\n${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日（${wd}）\n${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}\n\n注意：这个时间是**你设备的本地时区**，不是服务器时间。`
    }

    // ---- 数学/计算 ----
    case 'calc_math': {
      const expr = userText
        .replace(/[，,？?]/g, '')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/％/g, '%')
        .trim()
      try {
        // 仅允许安全字符（数字 + 运算符 + 空格 + 百分号 + 小数点）
        if (!/^[\d\s+\-*/%.()]+$/.test(expr)) {
          return `我没识别成一个可计算的表达式。\n\n你可以直接发：\n- "1 + 2 * 3"\n- "5000 × 12%"\n- "80 的 30% 是多少"`
        }
        // 使用 Function 求值（仅在纯数字表达式安全场景）
        const evalExpr = expr.replace(/(\d+(\.\d+)?)%/g, '($1/100)')
        const value = Function('"use strict"; return (' + evalExpr + ')')() as number
        if (!isFinite(value)) return '这个结果超出范围了。'
        const formatted = Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
        return `${p.emoji} 我来帮你算一下。\n\n${expr} = **${formatted}**\n\n如果涉及生活场景（比如打折、利率、分成），告诉我你的完整问题，我帮你换算得更清楚。`
      } catch {
        return '我尝试理解成一道计算题，但没算出来。你可以把式子写成更标准的格式，例如：\n\n- "30 + 60 × 2"\n- "1500 元打 8 折是多少？"\n- "年利率 5%，投 1 万，3 年多少？"'
      }
    }

    // ---- 编程/代码 ----
    case 'need_code':
      return `${p.emoji} 好的，我可以帮你写代码、分析错误、或给设计建议。\n\n为了答案更准，最好同时包含：\n\n1) **你在做什么**（场景/目标）\n2) **语言或技术栈**（Python、JavaScript、SQL 等）\n3) **你试过的东西**（或者报错信息原文）\n\n先看看你想做哪一个？我可以先帮你列出方案再写代码。`

    // ---- 翻译 ----
    case 'need_translate':
      return `${p.emoji} 好的，翻译模式。\n\n为了不译错语气，请同时告诉我：\n- **原文内容**（直接粘贴）\n- **目标语言**（英文/中文/日文等）\n- **使用场景**（正式邮件/日常聊天/文案/技术文档）\n\n把原文发给我，我按你要的风格翻译。`

    // ---- 写作/创作 ----
    case 'need_write':
      return `${p.emoji} 好～我可以帮你写。先告诉我 4 点，我就开始：\n\n1) **写什么**（标题/文案/文章/诗歌/小红书/广告语？）\n2) **给谁看**（目标读者或使用场景）\n3) **核心信息**（一句话你想表达什么）\n4) **风格**（正式？活泼？有网感？文艺？）\n\n你先讲一下大概需求，我会先给 2-3 个版本让你挑。`

    // ---- 学习/解释 ----
    case 'need_learn': {
      const topic = extractTopic(userText)
      return `${p.emoji} 好的，我按"**大白话 + 例子**"的方式帮你理解。\n\n你想问的是关于"**${topic}**"的对吗？\n\n为了一次讲到位，你可以再补充：\n1) 你为什么想了解它？（工作/面试/兴趣）\n2) 你目前已经知道了哪些相关知识？\n3) 你希望我重点讲哪一方面？（概念？使用方法？原理？实战注意事项？）\n\n你先发，我再用生活化例子讲给你。`
    }

    // ---- 情绪/陪伴 ----
    case 'emotion_sad':
      return `${p.emoji} 嗯，听到你这样说我也觉得难过。\n\n方便的话告诉我：发生了什么？\n我不会急着给你"建议"或"鸡汤"——你先把想倾诉的说出来，我认真听。`
    case 'emotion_anxious':
      return `${p.emoji} 我懂那种胸口发闷、停不下来想事的感觉。\n\n先别"应该"自己，先给我说说是什么引起的？工作/学习/生活里的哪一块？\n\n说出来就已经在减压了，你随便说。`
    case 'emotion_tired':
      return `${p.emoji} 累了真的别硬撑。\n\n你是身体上的累，还是心理上的疲惫？最近发生了什么事让你变成这样？\n\n有时候光是"把一堆事列出来"就会发现没那么吓人——你愿不愿意试？`
    case 'emotion_happy':
      return `${p.emoji} 哇听你这么说我也开心！\n\n发生了什么好事？快说说！`

    // ---- 推荐 ----
    case 'ask_recommend': {
      const topic = extractTopic(userText)
      return `${p.emoji} 我帮你推荐"${topic}"相关的。\n\n不过推荐这东西很看人——给我几个信息，我给你更准的建议：\n\n1) **你的预算或时间**（越具体越好）\n2) **你的目标**（是想学？是想买？是想尝试？）\n3) **你已经尝试过/知道的**（避免重复推荐）\n4) **偏好**（比如简洁/复杂、保守/激进）\n\n你先把这些信息说一下。`
    }

    // ---- 观点/看法 ----
    case 'ask_opinion': {
      const topic = extractTopic(userText)
      return `${p.emoji} 这个问题我通常会分"不同情况"来看，不喜欢只给一个简单答案。\n\n你在问关于"**${topic}**"的看法，对吗？\n\n我需要一点**上下文**才能给出具体、可用的观点：\n- 这是在什么场景下？（工作/生活/关系/学习）\n- 你自己目前倾向哪一边？\n- 你担心的点或代价是什么？\n\n把这些信息告诉我，我会帮你列利弊 + 具体建议。`
    }

    // ---- 事实类（what/who/where）----
    case 'ask_fact': {
      const topic = extractTopic(userText)
      return `${p.emoji} 你问的是关于"**${topic}**"。\n\n先坦白：我**不联网、没有实时数据**——所以这类问题我不会假装知道正确答案。\n\n但我可以这样帮你：\n1) **用常识帮你拆解/澄清问题**\n2) **把你的疑问转化成更好的搜索关键词**，你再去网上查\n3) **给你一个结构化的思考框架**，即使没有资料也能推演\n\n你想让我走哪条路线？或者你补充具体的上下文，我帮你一起分析。`
    }

    // ---- 闲聊 ----
    case 'small_talk':
      return pick([
        `${p.emoji} 在～说说看，今天想聊什么？`,
        '嗯，我在。你想聊什么都行。',
        `${p.emoji} 我这里很好～你呢？今天有什么事想聊？`,
      ])

    // ---- 通用问题 ----
    case 'question_general':
    case 'command_general': {
      const topic = extractTopic(userText)
      const ups = shuffle([
        `${p.emoji} 好的，我试着帮你分析一下"**${topic}**"这个问题。`,
        `${p.emoji} 收到。我先说说我的理解，然后你指正——这样比较不会走偏。`,
        `${p.emoji} 先让我澄清一下：你问的是关于"**${topic}**"的，对吗？`,
      ])[0]
      return (
        ups +
        '\n\n在我给你长篇大论之前，先告诉我 3 件事，这样回答会准得多：\n\n' +
        '**1)** 具体场景是什么？（你在做什么的时候遇到这个问题？）\n' +
        '**2)** 你想得到什么形式的答案？（解释/步骤/方案/对比/建议）\n' +
        '**3)** 你已经试过了什么，或者已经了解到哪一步？\n\n' +
        '把这 3 点补充一下，我接着给你具体、可用的内容。'
      )
    }

    default:
      return cannotReply('unclear')
  }
}

// ===========================================
// 4. 流式输出（模拟打字机）
// ===========================================

export function streamReply(
  fullText: string,
  onDelta: (delta: string, fullSoFar: string) => void,
  onDone: (full: string) => void,
  abortCheck?: () => boolean,
): void {
  let i = 0
  let buffer = ''
  const totalLen = fullText.length
  let consecutivePauseCount = 0

  const tick = () => {
    if (abortCheck && abortCheck()) {
      onDone(buffer)
      return
    }
    // 每次输出 1-3 个字符，偶尔遇到标点时多停一下
    const rnd = Math.random()
    let step: number
    if (rnd < 0.4) step = 1
    else if (rnd < 0.75) step = 2
    else if (rnd < 0.95) step = 3
    else step = 4

    // 输出到下一个标点（制造"句子级节奏"）
    let j = Math.min(i + step, totalLen)
    // 不要把中英文标点切成一半
    while (j < totalLen && /[，。！？、,.\]!?:：]/.test(fullText[j])) {
      j++
      if (j - i > 6) break
    }

    const delta = fullText.slice(i, j)
    buffer += delta
    i = j
    onDelta(delta, buffer)

    if (i >= totalLen) {
      onDone(buffer)
      return
    }

    // 基础节奏 + 偶尔稍作停顿（模拟思考）
    let delay = 16
    if (/[，。！？!?,;:：\n]/.test(delta)) delay += 30
    if (/[\n]/.test(delta)) delay += 40
    consecutivePauseCount++
    if (consecutivePauseCount > 25 && Math.random() < 0.08) {
      // 偶尔插入一个小停顿（像真人组织语言）
      delay += 180
      consecutivePauseCount = 0
    }
    // 越到后面偶尔加速（避免等待感）
    if (Math.random() < 0.1) delay = Math.max(5, delay - 8)

    setTimeout(tick, delay)
  }
  // 启动
  setTimeout(tick, 120)
}
