/**
 * 智能本地 AI 引擎
 *
 * 当豆包 API 不可用时，提供能理解上下文、能连贯对话的本地 AI
 */

import type { KnowledgeEntry } from '../shared/types'

export type Intent =
  | 'greeting' | 'farewell' | 'question' | 'command' | 'chat'
  | 'emotion' | 'code' | 'learn' | 'write' | 'translate' | 'math'
  | 'help' | 'self' | 'unknown'

export interface PersonaProfile {
  id: string
  name: string
  emoji: string
  description: string
  systemPrompt: string
  sampleQuestions?: string[]
  greeting?: string
  tone: 'formal' | 'casual' | 'friendly' | 'professional' | 'warm' | 'creative'
  expertise: string[]
  style: string[]
}

interface ContextState {
  topic: string | null
  userInfo: string[]
  questionCount: number
  lastIntents: Intent[]
  keywords: Set<string>
  codeMode: boolean
  subTopic: string | null
}

// ===================== 内置 12 角色 =====================

export const BUILTIN_PERSONAS: PersonaProfile[] = [
  {
    id: 'general', name: '通用助手', emoji: '🤖',
    description: '知识全面、逻辑清晰的通用 AI 助手',
    systemPrompt: '你是一个友好专业的 AI 助手。',
    sampleQuestions: ['介绍一下你自己', '帮我写一段介绍', '如何提高工作效率'],
    greeting: '你好！我是你的 AI 助手，很高兴为你服务。请问今天我能帮你做些什么？',
    tone: 'friendly', expertise: ['通用', '信息', '解释', '建议'], style: ['简洁', '清晰', '有条理'],
  },
  {
    id: 'coder', name: '编程专家', emoji: '👨‍💻',
    description: '精通多语言编程，可调试、重构、解释代码',
    systemPrompt: '你是一位资深软件工程师。',
    sampleQuestions: ['写一个 Python 爬虫示例', '解释 JavaScript Promise', '如何优化 SQL 查询'],
    greeting: '你好！我可以帮你编写、调试、优化代码。你有什么编程问题？',
    tone: 'professional', expertise: ['代码', '编程', 'Python', 'JavaScript', 'TypeScript', 'Java', 'SQL', '算法'], style: ['专业', '代码示例', '可运行'],
  },
  {
    id: 'writer', name: '创意写手', emoji: '✍️',
    description: '文案、小说、诗歌、营销内容创作',
    systemPrompt: '你是一位富有创造力的中文作家。',
    sampleQuestions: ['写一首关于夏天的短诗', '帮我写一段产品宣传文案'],
    greeting: '你好！我可以帮你创作文案、故事和诗歌。你想写什么主题？',
    tone: 'creative', expertise: ['写作', '文案', '诗歌', '小说', '营销', '创作'], style: ['有文采', '有创意'],
  },
  {
    id: 'analyst', name: '数据分析', emoji: '📊',
    description: '数据洞察、统计分析、可视化建议',
    systemPrompt: '你是一名经验丰富的数据分析师。',
    sampleQuestions: ['如何分析用户留存', '帮我设计一份周报'],
    greeting: '你好！把你的数据或业务问题告诉我，我帮你分析关键信息和趋势。',
    tone: 'formal', expertise: ['数据分析', '统计', '指标', '可视化', '报表'], style: ['结构化', '数据驱动'],
  },
  {
    id: 'teacher', name: '学习导师', emoji: '👨‍🏫',
    description: '耐心细致地解释概念，适合学习',
    systemPrompt: '你是一位耐心友好的老师。',
    sampleQuestions: ['什么是量子力学', '帮我理解 HTTP 协议'],
    greeting: '你好！我可以陪你一起学习。你想了解哪个领域？',
    tone: 'friendly', expertise: ['学习', '教育', '解释', '概念', '知识'], style: ['循序渐进', '比喻', '易懂'],
  },
  {
    id: 'translator', name: '翻译官', emoji: '🌐',
    description: '中英互译、多语言翻译',
    systemPrompt: '你是一位专业翻译。',
    sampleQuestions: ['把这段翻译成英文', '翻译一段商务邮件'],
    greeting: '你好！请把需要翻译的内容发给我。',
    tone: 'formal', expertise: ['翻译', '英文', '中文', '语言'], style: ['准确', '地道', '专业'],
  },
  {
    id: 'counselor', name: '心理咨询', emoji: '🧠',
    description: '倾听与陪伴，提供情绪支持',
    systemPrompt: '你是一位温暖富有同理心的倾听者。',
    sampleQuestions: ['工作压力太大怎么办', '如何应对焦虑'],
    greeting: '你好，我在这里倾听你。最近有什么让你烦恼或开心的事吗？',
    tone: 'warm', expertise: ['情绪', '压力', '心理', '倾听', '陪伴', '焦虑', '失眠', '疲惫'], style: ['温暖', '共情', '耐心'],
  },
  {
    id: 'marketer', name: '营销顾问', emoji: '📈',
    description: '品牌、增长、用户运营、内容策略',
    systemPrompt: '你是一位资深市场营销顾问。',
    sampleQuestions: ['新品牌如何做冷启动', '怎么写好公众号文章'],
    greeting: '你好！告诉我你的产品和目标用户，我帮你梳理营销策略。',
    tone: 'professional', expertise: ['营销', '品牌', '增长', '用户', '运营', '策略'], style: ['实用', '可执行'],
  },
  {
    id: 'poet', name: '诗人', emoji: '🌸',
    description: '用诗意的语言创作',
    systemPrompt: '你是一位热爱中文韵律和意象的诗人。',
    sampleQuestions: ['以雨后为题写一首', '写一首思念', '写一段给朋友的祝福'],
    greeting: '你好！告诉我主题或情感，我为你写一首诗。',
    tone: 'creative', expertise: ['诗歌', '情感', '意象', '文学', '艺术'], style: ['优美', '有韵律', '有画面感'],
  },
  {
    id: 'chef', name: '美食家', emoji: '👨‍🍳',
    description: '菜谱、搭配、烹饪技巧',
    systemPrompt: '你是一位专业厨师。',
    sampleQuestions: ['3 人份番茄牛腩', '家常快手菜 5 道'],
    greeting: '你好！你有什么食材，或想做什么菜系？我给你一份详细菜谱。',
    tone: 'casual', expertise: ['菜谱', '食材', '烹饪', '家常菜', '美食'], style: ['实用', '详细', '分量清楚'],
  },
  {
    id: 'coach', name: '健身教练', emoji: '💪',
    description: '训练计划、饮食建议与习惯养成',
    systemPrompt: '你是一位专业健身教练。',
    sampleQuestions: ['为上班族设计 30 分钟训练', '减脂期应该怎么吃'],
    greeting: '你好！告诉我你的目标和每周能投入的时间，我为你定制计划。',
    tone: 'friendly', expertise: ['健身', '训练', '减脂', '增肌', '饮食', '运动'], style: ['科学', '实用', '鼓励'],
  },
  {
    id: 'traveler', name: '旅行规划师', emoji: '✈️',
    description: '行程设计、景点推荐、预算与打包',
    systemPrompt: '你是一位资深旅行规划师。',
    sampleQuestions: ['3 天 2 夜东京自由行', '东南亚 1 万预算海岛'],
    greeting: '你好！想去哪里、什么时候、预算多少？我帮你规划行程。',
    tone: 'casual', expertise: ['旅行', '行程', '景点', '预算', '目的地'], style: ['详细', '有亮点', '实用'],
  },
]

// ===================== 1. 意图分析 =====================

function analyzeIntent(text: string): Intent {
  const t = text.trim().toLowerCase()
  if (!t) return 'unknown'
  if (/^(你好|您好|嗨|hi|hello|在吗|在不在|嘿|哈喽|早|早上好|晚上好|下午好)/i.test(t)) return 'greeting'
  if (/^(再见|拜拜|bye|88|晚安|先这样|回聊|回头聊)/i.test(t)) return 'farewell'
  if (/你是(谁|什么)|你(叫|是)?谁|你叫什么|你有什么(能力|用|功能)|你能做什么|你的(名字|能力|功能)/.test(text)) return 'self'
  if (/^怎么(用|办)|帮助|help|使用|说明|有什么(用|功能)/.test(t)) return 'help'
  if (/(代码|编程|python|javascript|typescript|java|c\+\+|sql|mysql|react|node|函数|算法|bug|报错|调试|写个|写一段|写一个|实现|接口)/i.test(text)) return 'code'
  if (/[\d+\-*/×÷=％%]/.test(text) && /(多少|等于|计算|算|结果)/.test(text)) return 'math'
  if (/(翻译|translate|翻成|用英语|用英文|用中文|英文怎么说|中文怎么说)/i.test(text)) return 'translate'
  if (/(难过|伤心|不开心|郁闷|烦|焦虑|压力(大|大)|累|疲惫|好累|崩溃|绝望|孤独|寂寞|空虚|迷茫|无助|抑郁|心情不好|心烦|烦躁|失眠)/.test(text)) return 'emotion'
  if (/(写|创作|诗歌|诗|故事|小说|文案|文章|公众号|广告词|标题|润色|改写)/.test(text)) return 'write'
  if (/(解释|什么是|什么叫|原理|如何(学习|理解|做)|怎么(理解|学习|做)|教教我|解释一下|讲一下|告诉我|说明)/.test(text)) return 'learn'
  if (/[?？]/.test(text) || /^(什么|为什么|怎么|如何|哪|哪个|哪里|何时|多少|是不是|有没有|能不能|可不可以)/.test(t)) return 'question'
  if (/^(帮|请|给|提供|推荐|告诉我|给我|列出|对比|比较)/.test(t)) return 'command'
  if (/(开心|高兴|快乐|兴奋|幸福|激动|感激|感谢|谢谢)/.test(text)) return 'emotion'
  return 'chat'
}

// ===================== 2. 关键词 & 上下文记忆 =====================

function extractKeywords(text: string): string[] {
  const kws: string[] = []
  const codeKws = ['python', 'javascript', 'typescript', 'java', 'sql', 'react', 'vue', 'node', '函数', '算法', '接口', '数据库', '爬虫', 'http', 'api']
  for (const kw of codeKws) if (text.toLowerCase().includes(kw)) kws.push(kw)
  const learnKws = ['机器学习', '深度学习', '量子', '物理', '数学', '化学', '生物', '历史', '经济', '哲学', '心理学']
  for (const kw of learnKws) if (text.toLowerCase().includes(kw)) kws.push(kw)
  const emotionKws = ['压力', '焦虑', '失眠', '疲惫', '难过', '伤心', '开心', '迷茫']
  for (const kw of emotionKws) if (text.includes(kw)) kws.push(kw)
  return kws
}

function extractMainTopic(text: string, keywords: string[]): string | null {
  if (keywords.length > 0) return keywords[0]
  const clean = text.replace(/[?？!！。，,\s]/g, '').slice(0, 12)
  return clean || null
}

function extractUserInfo(text: string): string[] {
  const info: string[] = []
  const nameMatch = text.match(/我(是|叫)([\u4e00-\u9fa5a-zA-Z]{1,8})/)
  if (nameMatch) info.push('姓名:' + nameMatch[2])
  const wantMatch = text.match(/想(学习|了解|知道|学)([\u4e00-\u9fa5a-zA-Z0-9]{2,20})/)
  if (wantMatch) info.push('兴趣:' + wantMatch[2])
  return info
}

class ContextMemory {
  private state: ContextState
  constructor() {
    this.state = { topic: null, userInfo: [], questionCount: 0, lastIntents: [], keywords: new Set(), codeMode: false, subTopic: null }
  }
  update(text: string, intent: Intent): void {
    this.state.questionCount++
    this.state.lastIntents.push(intent)
    if (this.state.lastIntents.length > 5) this.state.lastIntents.shift()
    const kws = extractKeywords(text)
    for (const k of kws) this.state.keywords.add(k)
    if (!this.state.topic || this.state.questionCount % 5 === 0) this.state.topic = extractMainTopic(text, kws)
    if (intent === 'code') this.state.codeMode = true
    extractUserInfo(text).forEach(info => { if (!this.state.userInfo.includes(info)) this.state.userInfo.push(info) })
  }
  getState(): ContextState { return { ...this.state, keywords: new Set(this.state.keywords) } }
  getTopic(): string | null { return this.state.topic }
}

// ===================== 3. 知识库匹配 =====================

function findKnowledge(userText: string, knowledge: KnowledgeEntry[]): KnowledgeEntry | null {
  if (!knowledge || knowledge.length === 0) return null
  const t = userText.toLowerCase()
  let bestMatch: KnowledgeEntry | null = null
  let bestScore = 0
  for (const k of knowledge) {
    let score = 0
    const haystack = (k.title + ' ' + k.content + ' ' + (k.tags ? k.tags.join(' ') : '')).toLowerCase()
    for (const word of t.split(/[\s，,。.!！?？]+/)) {
      if (word.length >= 2 && haystack.includes(word)) score += word.length
    }
    if (score > bestScore) { bestScore = score; bestMatch = k }
  }
  return bestScore >= 4 ? bestMatch : null
}

// ===================== 4. 主入口函数 =====================

export function generateIntelligentReply(
  userText: string,
  persona: PersonaProfile,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  knowledge: KnowledgeEntry[] = [],
): string {
  const intent = analyzeIntent(userText)
  const ctx = new ContextMemory()
  const recentHistory = history.slice(-6)
  for (const h of recentHistory) if (h.role === 'user') ctx.update(h.content, analyzeIntent(h.content))
  ctx.update(userText, intent)
  const state = ctx.getState()
  const relevantKb = findKnowledge(userText, knowledge)

  switch (intent) {
    case 'greeting': return genGreeting(persona, userText)
    case 'farewell': return genFarewell(persona)
    case 'self': return genSelfIntro(persona, userText)
    case 'help': return genHelp(persona)
    case 'emotion': return genEmotion(persona, userText)
    case 'code': return genCode(persona, userText, state)
    case 'math': return genMath(userText)
    case 'translate': return genTranslate(userText)
    case 'learn': return genLearn(persona, userText, relevantKb)
    case 'write': return genWrite(persona, userText)
    case 'question': return genQuestion(persona, userText, relevantKb)
    case 'command': return genCommand(persona, userText, relevantKb)
    case 'chat': return genChat(persona, userText, state, recentHistory)
    default: return genDefault(persona, userText, relevantKb)
  }
}

// ===================== 各意图回复生成 =====================

function genGreeting(p: PersonaProfile, text: string): string {
  const prefix = p.greeting || `你好！我是${p.emoji} ${p.name}。`
  const hour = new Date().getHours()
  let time = ''
  if (hour < 6) time = '夜深了，还没休息吗？'
  else if (hour < 12) time = '早上好！新的一天开始啦 ☀️'
  else if (hour < 14) time = '中午好！有没有好好吃饭呀 🍚'
  else if (hour < 18) time = '下午好！今天过得怎么样？ 🌤️'
  else if (hour < 22) time = '晚上好！辛苦了一天 🌙'
  else time = '夜深了，辛苦啦 🌃'
  const prompts = p.sampleQuestions?.slice(0, 2) || ['你想聊点什么？']
  return `${prefix}\n\n${time}\n\n💭 **试试问我**：\n${prompts.map(p2 => `- ${p2}`).join('\n')}`
}

function genFarewell(p: PersonaProfile): string {
  const msgs = [`${p.emoji} 好的，期待下次和你聊天！`, `再见啦👋 有问题随时来找我～`, `${p.emoji} 回见！祝你今天剩下的时间一切顺利✨`]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

function genSelfIntro(p: PersonaProfile, text: string): string {
  const lines: string[] = [`我是 **${p.emoji} ${p.name}** —— ${p.description}。`, '']
  if (/(能力|功能|能做什么|会什么)/.test(text)) {
    lines.push(`我的能力主要包括：`)
    for (const e of p.expertise.slice(0, 6)) lines.push(`- ${e}`)
    lines.push('')
  }
  if (p.id === 'coder') lines.push('💻 我擅长：写代码、调 bug、讲原理、做优化建议。')
  else if (p.id === 'teacher') lines.push('👨‍🏫 我的教学风格：循序渐进、比喻解释、举例说明、配套练习。')
  else if (p.id === 'counselor') lines.push('🧠 我是你的倾听者：不评判、认真听、给陪伴。\n\n*如遇严重困扰请寻求专业心理咨询。*')
  else lines.push(`我擅长：${p.expertise.slice(0, 5).join('、')}。`)
  lines.push('')
  lines.push(`💭 现在你想聊什么？`)
  return lines.join('\n')
}

function genHelp(p: PersonaProfile): string {
  return `**我能帮你做什么？**\n\n1. **自然对话**：直接聊任何话题\n2. **解释概念**：问我"什么是 XX"\n3. **写作创作**：文案、诗歌、文章\n${p.id === 'coder' ? '4. **编程帮助**：写代码、调 bug、讲原理\n' : ''}4. **多轮对话**：我记得刚刚聊的话题\n5. **情感陪伴**：想聊天或发泄都可以\n\n💡 **小技巧**：问题越具体，回答越准确。顶部切换角色可体验不同风格。`
}

function genEmotion(p: PersonaProfile, text: string): string {
  const negKw = ['难过', '伤心', '不开心', '郁闷', '烦', '焦虑', '压力', '累', '疲惫', '崩溃', '绝望', '孤独', '寂寞', '迷茫', '无助', '抑郁', '心情不好', '心烦', '烦躁', '失眠']
  const posKw = ['开心', '高兴', '快乐', '兴奋', '幸福', '激动', '感激', '感谢', '谢谢']
  if (posKw.some(kw => text.includes(kw))) {
    const r = [`听起来你今天心情不错！真替你高兴😊 是什么好事呢？`, `哇，能感受到你的好心情！分享一下吧～`, '你的好心情也感染我了～ 继续保持这份开心！']
    return r[Math.floor(Math.random() * r.length)]
  }
  if (negKw.some(kw => text.includes(kw))) {
    const lines: string[] = ['我在听。能告诉我更多一点吗？你愿意说的话，我陪你聊聊。', '']
    if (/失眠|睡不着/.test(text)) {
      lines.push('🌙 睡不着很辛苦。可以试试：')
      lines.push('- 放下手机，让眼睛休息 20 分钟')
      lines.push('- 做几次缓慢深呼吸（吸气 4 秒 → 屏息 4 秒 → 呼气 6 秒）')
      lines.push('- 听一点舒缓音乐或白噪音')
      lines.push('- 如果失眠超过两周，建议就医')
    } else if (/压力|焦虑|累|疲惫|好累/.test(text)) {
      lines.push('🫂 压力大的时候，先停下来。试试这些方法：')
      lines.push('- **5-4-3-2-1 感官练习**：说出你看到的 5 件、听到的 4 件、摸到的 3 件、闻到的 2 件、尝到的 1 件')
      lines.push('- **短暂休息**：离开当前环境 10 分钟')
      lines.push('- **写下来**：把焦虑的事写在纸上，释放出来')
      lines.push('- **说出来**：找一个信任的人，或继续在这里和我说')
    } else if (/难过|伤心|不开心/.test(text)) {
      lines.push('难过是正常的，不必急着"变好"。')
      lines.push('')
      lines.push('可以试着：')
      lines.push('1. 允许自己难过，不要急着否认感受')
      lines.push('2. 做一件照顾自己的小事——泡杯热饮、听喜欢的歌、出门走走')
      lines.push('3. 如果你愿意，可以告诉我发生了什么，我陪你梳理')
    } else {
      lines.push('每个人都会有情绪起伏，不用急着让自己好起来。')
    }
    lines.push('')
    lines.push('💙 你愿意多说说发生了什么吗？')
    return lines.join('\n')
  }
  return `${p.emoji} 嗯，我听到了。你愿意多告诉我一点吗？我在这儿陪你。`
}

function genCode(p: PersonaProfile, text: string, _state: ContextState): string {
  const t = text.toLowerCase()
  let lang = 'javascript'
  if (/python|def\s|print\(/.test(text) || /python/.test(t)) lang = 'python'
  else if (/sql|mysql|select|from|where|数据库/.test(t)) lang = 'sql'
  else if (/typescript|typescript|\bts\b/.test(t)) lang = 'typescript'
  else if (/java(?!script)/.test(t)) lang = 'java'
  else if (/rust/.test(t)) lang = 'rust'
  else if (/c\+\+|cpp/.test(t)) lang = 'cpp'
  else if (/html|css|样式/.test(t)) lang = 'html'

  const lines: string[] = ['好的，我来帮你解决这个问题。', '']

  if (/(爬虫|爬取|抓取|requests|http|fetch|axios)/.test(text)) {
    lines.push('**📦 网络请求 / 爬虫示例**')
    lines.push('')
    if (lang === 'python') {
      lines.push('```python')
      lines.push('import requests')
      lines.push('from bs4 import BeautifulSoup')
      lines.push('')
      lines.push('def fetch_url(url: str) -> str:')
      lines.push('    """抓取网页内容"""')
      lines.push('    headers = {"User-Agent": "Mozilla/5.0 (compatible; MyBot/1.0)"}')
      lines.push('    response = requests.get(url, headers=headers, timeout=10)')
      lines.push('    response.raise_for_status()')
      lines.push('    response.encoding = response.apparent_encoding')
      lines.push('    return response.text')
      lines.push('')
      lines.push('html = fetch_url("https://example.com")')
      lines.push('soup = BeautifulSoup(html, "html.parser")')
      lines.push('print(soup.title.string if soup.title else "无标题")')
      lines.push('```')
    } else {
      lines.push('```javascript')
      lines.push('async function fetchData(url) {')
      lines.push('  const response = await fetch(url);')
      lines.push('  if (!response.ok) throw new Error(`HTTP ${response.status}`);')
      lines.push('  return response.json();')
      lines.push('}')
      lines.push('')
      lines.push('fetchData("https://api.example.com/data").then(console.log);')
      lines.push('```')
    }
  } else if (/(函数|写一个|实现|给我一个|代码示例)/.test(text)) {
    lines.push(`**📝 ${lang.toUpperCase()} 代码示例**`)
    lines.push('')
    if (lang === 'python') {
      lines.push('```python')
      lines.push('from typing import List, Dict')
      lines.push('from dataclasses import dataclass')
      lines.push('')
      lines.push('@dataclass')
      lines.push('class DataItem:')
      lines.push('    id: int')
      lines.push('    name: str')
      lines.push('    value: float')
      lines.push('')
      lines.push('def process_items(items: List[DataItem]) -> Dict[str, float]:')
      lines.push('    """处理数据并返回统计结果"""')
      lines.push('    n = len(items)')
      lines.push('    total = sum(i.value for i in items)')
      lines.push('    return {"count": float(n), "total": total, "avg": total / n if n else 0.0}')
      lines.push('')
      lines.push('data = [DataItem(i, f"item{i}", i * 1.5) for i in range(5)]')
      lines.push('print(process_items(data))')
      lines.push('```')
    } else {
      lines.push('```javascript')
      lines.push('const users = [')
      lines.push('  { id: 1, name: "Alice", age: 25, score: 85 },')
      lines.push('  { id: 2, name: "Bob",   age: 30, score: 92 },')
      lines.push('  { id: 3, name: "Carol", age: 22, score: 78 },')
      lines.push('];')
      lines.push('')
      lines.push('const qualified = users.filter(u => u.score >= 80);')
      lines.push('const names = qualified.map(u => ({ name: u.name, age: u.age }));')
      lines.push('const avgAge = qualified.reduce((s, u) => s + u.age, 0) / qualified.length;')
      lines.push('')
      lines.push('console.log("合格的用户:", names);')
      lines.push('console.log("平均年龄:", avgAge.toFixed(1));')
      lines.push('```')
    }
  } else if (/(错误|报错|bug|error|exception)/i.test(text)) {
    lines.push('**🔍 排错思路**')
    lines.push('')
    lines.push('1. **看错误信息**：错误类型 + 消息 + 栈追踪')
    lines.push('2. **最小复现**：把问题简化成最小可运行示例')
    lines.push('3. **调试输出**：用 console.log / print 检查关键变量')
    lines.push('4. **搜索错误**：把关键错误信息复制到搜索引擎')
    lines.push('')
    lines.push('把具体的错误信息发给我，我可以帮你一起分析。')
  } else if (/(解释|什么是|原理|讲一下)/.test(text)) {
    lines.push('让我用**三层理解法**帮你解释这个概念：')
    lines.push('')
    lines.push('**📖 第 1 层 —— 直觉理解（用生活比喻）**')
    lines.push('**🔧 第 2 层 —— 核心原理（技术视角）**')
    lines.push('**💡 第 3 层 —— 实际应用（什么时候用）**')
    lines.push('')
    lines.push('告诉我具体是什么概念，我就按这个结构给你详细解释。')
  } else {
    lines.push('我为你准备了一个**编程问答框架**：')
    lines.push('')
    lines.push('```' + lang)
    lines.push('// 告诉我具体问题，我会给你：')
    lines.push('// 代码 + 解释 + 使用示例 + 注意事项')
    lines.push('function solve(problem) { return solution; }')
    lines.push('```')
    lines.push('')
    lines.push('试试："用 Python 写一个快速排序" 或 "解释一下数据库索引"')
  }
  lines.push('')
  lines.push(`---`)
  lines.push(`${p.emoji} 告诉我具体问题，我给你写完整的代码和解释。`)
  return lines.join('\n')
}

function genMath(text: string): string {
  const lines: string[] = ['🧮 我来帮你算一下～', '']
  const exprMatch = text.match(/([\d\s+\-*/×÷()%％.]+)\s*(=|等于|结果是)?/)
  if (exprMatch) {
    try {
      const expr = exprMatch[1].replace(/×/g, '*').replace(/÷/g, '/').replace(/％/g, '%').trim()
      if (/^[\d\s+\-*/().%]+$/.test(expr) && expr.length > 0) {
        const raw = Function('"use strict"; return (' + expr + ')')() as number
        const result = Number.isInteger(raw) ? raw : Number(raw.toFixed(8))
        lines.push('**计算过程**')
        lines.push('`' + expr + ' = ' + result + '`')
        lines.push('')
        lines.push('✅ 结果是 **' + result + '**')
        if (Math.abs(result) > 1000000) lines.push('（约 ' + (result / 10000).toFixed(2) + ' 万 / ' + (result / 100000000).toFixed(2) + ' 亿）')
        return lines.join('\n')
      }
    } catch { /* 继续 */ }
  }
  lines.push('我可以帮你做：基本计算、打折/利率换算、应用题解读')
  lines.push('')
  lines.push('试试问：')
  lines.push('- "原价 399，打 8 折是多少？"')
  lines.push('- "100 万存 3 年，年利率 2.5%，利息多少？"')
  lines.push('- "圆的面积公式是什么？"')
  return lines.join('\n')
}

function genTranslate(text: string): string {
  const toEnglish = /(英文|英语|english|in english|翻译成英文)/i.test(text)
  const toChinese = /(中文|翻译成中文|汉语)/.test(text)
  if (toEnglish) {
    return `**翻译成 English**\n\n请把需要翻译的中文内容发给我，我会：\n- 翻译为自然地道的英文\n- 保持原文语气和风格\n- 标注关键词和特殊表达\n\n也可以告诉我具体场景（商务邮件/日常对话/技术文档），我会相应调整。`
  }
  if (toChinese) {
    return `**翻译成中文**\n\n请把需要翻译的英文内容发给我，我会：\n- 翻译成流畅自然的中文\n- 保留原文风格和语气\n- 必要时补充文化说明`
  }
  const englishRatio = (text.match(/[a-zA-Z]/g) || []).length / Math.max(text.length, 1)
  if (englishRatio > 0.5) return `**English → 中文**\n\n（检测到这是英文，请把完整内容发给我）`
  return `**中文 → English**\n\n（检测到这是中文，请把完整内容发给我）`
}

function genLearn(p: PersonaProfile, text: string, relevantKb: KnowledgeEntry | null): string {
  let topic = text.replace(/(什么是|什么叫|请解释|解释一下|解释|帮我理解|怎么理解|原理|讲一讲|讲一下|告诉我|说明|学习|什么)/g, '').replace(/[?？!！。，,\s]/g, ' ').trim().slice(0, 20)
  if (!topic) topic = '这个概念'
  const lines: string[] = [`${p.emoji} 好问题！用**三层理解法**帮你理解「${topic}」：`, '', '---', '']
  lines.push('**📖 第一层 —— 直觉理解（用生活比喻）**')
  lines.push('> 想象一下一个具体场景，核心就是「' + topic + '」。它帮你把复杂事情变得有条理。')
  lines.push('')
  lines.push('**🔧 第二层 —— 核心要点**')
  lines.push('1. **定义**：' + topic + '是用于...的概念')
  lines.push('2. **为什么需要它**：解决了哪些具体问题')
  lines.push('3. **关键特性**：3-5 个核心特征')
  lines.push('4. **常见用法**：最典型应用场景')
  lines.push('')
  lines.push('**💡 第三层 —— 实际应用（什么时候用）**')
  lines.push('> 在什么场景下用到它？常见误区和注意事项？')
  lines.push('')
  if (relevantKb) {
    lines.push('---')
    lines.push('**📚 知识库找到相关内容：' + relevantKb.title + '**')
    lines.push('')
    lines.push(relevantKb.content.slice(0, 300) + (relevantKb.content.length > 300 ? '...' : ''))
    lines.push('')
  }
  lines.push('---')
  lines.push(`${p.emoji} 告诉我**具体的${topic}是什么**，我会给你完整的三层深入解释和例子！`)
  return lines.join('\n')
}

function genWrite(p: PersonaProfile, text: string): string {
  if (/诗|诗歌/.test(text)) {
    return `${p.emoji} 为你写一首中文短诗：\n\n**四时之歌**\n\n春来花自知，\n夏至树荫时。\n秋深叶落处，\n冬近人归迟。\n\n---\n💡 告诉我你想要什么主题/情感/长度？我可以写几首不同风格让你选。`
  }
  if (/文案|广告|宣传|介绍|营销/.test(text)) {
    return `${p.emoji} 好的，我来帮你写一段产品宣传文案：\n\n**📝 文案框架**\n\n**标题**（8-15 字，有钩子）\n\`\`\`\n一句话说出用户的核心利益\n\`\`\`\n\n**副标题**（建立信任）\n\`\`\`\n已帮助 X 用户实现 Y 效果 | 数据支撑 | 权威背书\n\`\`\`\n\n**正文三段式**：1.痛点唤醒 2.方案呈现 3.行动号召\n\n💡 把你的**产品名称**和**目标用户**告诉我，我给你写完整的文案，并给出 3 个不同风格版本选择。`
  }
  return `${p.emoji} 我来帮你创作：\n\n告诉我：\n1. **主题**：你想写什么？\n2. **目标读者**：给谁看？\n3. **语气风格**：正式/轻松/专业/感性？\n4. **篇幅**：短文/中篇/长篇？\n\n你也可以直接给我具体要求，例如"写一段 100 字的产品介绍"。`
}

function genQuestion(p: PersonaProfile, text: string, relevantKb: KnowledgeEntry | null): string {
  if (/时间|日期|几点|今天/.test(text)) {
    const now = new Date()
    const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
    return `${p.emoji} 现在的时间信息：\n\n- **日期**：${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日\n- **星期**：${wd}\n- **时间**：${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}\n- **时区**：${Intl.DateTimeFormat().resolvedOptions().timeZone || '本地时间'}`
  }
  if (/天气|下雨|温度/.test(text)) {
    return `${p.emoji} 我暂时不能获取实时天气。\n\n你可以：\n- 打开手机天气 App\n- 搜索"天气 + 城市名"\n- 告诉我你所在城市，我给你一些穿搭和出行建议`
  }
  if (relevantKb) {
    return `${p.emoji} 从知识库找到相关信息：\n\n**${relevantKb.title}**\n\n${relevantKb.content}\n\n想了解更多相关问题吗？`
  }
  const cleanText = text.replace(/[?？]+$/, '')
  return `${p.emoji} 你的问题是："${cleanText}"\n\n让我给出初步思考框架：\n\n**① 理解问题核心**\n你想了解的是...\n\n**② 分析角度**\n- 从 A 角度看：...\n- 从 B 角度看：...\n\n**③ 实用建议**\n- 可做的第一步\n- 需要避免的常见误区\n\n---\n${p.emoji} 告诉我你问题中的**具体关键词**，我会给出更精准的回答！`
}

function genCommand(p: PersonaProfile, text: string, relevantKb: KnowledgeEntry | null): string {
  if (/推荐|给我推荐|哪款|哪个好|选哪个/.test(text)) {
    return `${p.emoji} 好的，推荐之前我需要了解：\n\n| 问题 | 为什么需要 |\n|---|---|\n| **预算范围** | 避免推荐不合适价位 |\n| **使用场景** | 家里/办公/户外/移动 |\n| **核心需求** | 最看重的 1-2 个特性 |\n| **已有经验** | 新手/进阶/专业 |\n\n告诉我这 4 条信息，我会给你列出 **3 个不同价位** 的推荐方案，并对比每款优缺点。`
  }
  if (/列出|列一下|总结|整理/.test(text)) {
    return `${p.emoji} 好的，我来帮你整理：\n\n| 类别 | 要点 |\n|---|---|\n| **核心概念** | 3 个最关键定义 |\n| **使用场景** | 3 个实际应用 |\n| **常见误区** | 3 个容易踩的坑 |\n| **下一步** | 从哪里开始行动 |\n\n把具体主题告诉我，我会按这个框架输出完整内容。`
  }
  if (relevantKb) {
    return `${p.emoji} 从知识库找到参考：\n\n**${relevantKb.title}**\n\n${relevantKb.content.slice(0, 500)}${relevantKb.content.length > 500 ? '...' : ''}\n\n需要我整理成要点清单，或扩展成完整说明吗？`
  }
  return `${p.emoji} 好的！\n\n为了给你最准确的结果，请补充：\n- **具体目标**：想要什么结果？\n- **上下文**：有什么背景信息？\n- **格式偏好**：列表？段落？表格？代码？\n\n告诉我更详细要求，我会给出精准回应。`
}

function genChat(p: PersonaProfile, text: string, state: ContextState, history: Array<{ role: 'user' | 'assistant'; content: string }>): string {
  if (state.topic && history.length > 0) {
    return `${p.emoji} 嗯，我懂你的意思。关于「${state.topic}」，我补充几点：\n\n1. **深入探讨**：我们可以继续聊这个话题的具体方面\n2. **举实例**：用真实例子帮助理解\n3. **换视角**：从不同角度思考这个问题\n\n你想从哪个角度继续聊？或者你有什么新想法想分享？`
  }
  const r = [`${p.emoji} 嗯，我在听。你想聊点什么？`, `${p.emoji} 好的！你对什么话题比较感兴趣？`, `${p.emoji} 我在这儿。你想聊点轻松的话题，还是有具体问题？`, `${p.emoji} 很高兴和你聊天～ 你想从哪里开始？`]
  return r[Math.floor(Math.random() * r.length)] + '\n\n💭 提示：问题越具体，回答越有针对性。也可以切换顶部角色体验不同风格。'
}

function genDefault(p: PersonaProfile, text: string, relevantKb: KnowledgeEntry | null): string {
  if (relevantKb) return `${p.emoji} 在知识库中找到了「${relevantKb.title}」：\n\n${relevantKb.content.slice(0, 400)}${relevantKb.content.length > 400 ? '...' : ''}\n\n想了解更多？告诉我你想深入哪个方面。`
  return `${p.emoji} 我认真读完了你的消息："${text.slice(0, 40)}${text.length > 40 ? '...' : ''}"\n\n让我从几个角度帮你思考：\n\n**① 核心问题**\n你想解决的关键是...\n\n**② 可能思路**\n- 方向 A\n- 方向 B\n- 方向 C\n\n**③ 可立即做的小事**\n一个小行动，开启改变...\n\n---\n${p.emoji} 你可以把问题描述得**更具体一点**——时间、场景、遇到的困难——这样我能给你更精准的帮助。或者你想让我从哪个方向开始分析？`
}

// ===================== 5. 流式打字机 =====================

export function streamLocalReply(
  text: string,
  onDelta: (delta: string, full: string) => void,
  onDone: (full: string) => void,
  signal?: { aborted: boolean } | null,
): void {
  let full = ''
  let idx = 0
  const totalLen = text.length
  const tick = () => {
    if (signal && signal.aborted) { onDone(full); return }
    const r = Math.random()
    let chunkSize: number
    if (r < 0.3) chunkSize = 1
    else if (r < 0.7) chunkSize = 2
    else if (r < 0.9) chunkSize = 3
    else chunkSize = 4
    const remaining = text.slice(idx, idx + chunkSize + 2)
    const match = remaining.match(/[，。！？!？,\.\s]/)
    if (match && match.index !== undefined && match.index <= chunkSize) chunkSize = match.index + 1
    const end = Math.min(idx + chunkSize, totalLen)
    const delta = text.slice(idx, end)
    full += delta
    idx = end
    onDelta(delta, full)
    if (idx >= totalLen) { onDone(full); return }
    const progress = idx / totalLen
    let baseDelay = 18
    if (progress < 0.1) baseDelay = 25
    if (progress > 0.85) baseDelay = 22
    setTimeout(tick, baseDelay + Math.random() * 20 - 10)
  }
  setTimeout(tick, 50)
}

export function getPersonaById(id: string): PersonaProfile {
  return BUILTIN_PERSONAS.find(p => p.id === id) || BUILTIN_PERSONAS[0]
}
