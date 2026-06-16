import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  conversationId: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

interface ChatState {
  conversations: Conversation[]
  messages: Message[]
  currentConversationId: string | null
  apiKeys: { id: string; name: string; key: string; createdAt: number }[]
  usage: { date: string; tokens: number; requests: number }[]
  createConversation: () => string
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void
  sendMessage: (content: string) => void
  addApiKey: (name: string) => string
  deleteApiKey: (id: string) => void
  resetDemo: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36)

const simulateAIResponse = (userMessage: string): string => {
  const msg = userMessage.toLowerCase()
  
  if (msg.includes('你好') || msg.includes('hello') || msg.includes('hi')) {
    return `你好！我是 DataMind AI，很高兴与你对话。\n\n我可以帮你：\n- 回答问题\n- 写作辅助\n- 代码生成\n- 数据分析\n\n有什么我可以帮你的吗？`
  }
  
  if (msg.includes('代码') || msg.includes('code')) {
    return `好的，以下是一个简单的 TypeScript 函数示例：\n\n\`\`\`typescript\nfunction greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet('World'));\n\`\`\`\n\n这是一个带类型的问候函数。如果你有具体的编程需求，请告诉我，我可以提供更有针对性的代码示例。`
  }
  
  if (msg.includes('数据') || msg.includes('分析') || msg.includes('data')) {
    return `## 数据分析建议\n\n基于你的问题，这里有一些数据分析思路：\n\n### 1. 数据收集\n- 明确业务指标\n- 确定数据来源\n- 设定采集频率\n\n### 2. 数据清洗\n- 处理缺失值\n- 去除重复数据\n- 修正异常值\n\n### 3. 分析方法\n- 描述性统计\n- 趋势分析\n- 相关性分析\n\n需要更具体的分析方案吗？请告诉我你的数据场景。`
  }
  
  if (msg.includes('api') || msg.includes('密钥') || msg.includes('key')) {
    return `## API Key 使用说明\n\n在 **API 管理** 页面中，你可以：\n\n1. **创建新密钥** - 为不同应用场景创建独立的 API Key\n2. **查看使用量** - 实时监控每个 Key 的调用次数和 token 消耗\n3. **权限管理** - 随时吊销不再使用的密钥\n\n> 安全提示：请勿在客户端代码中硬编码 API Key，建议使用环境变量或服务端代理。`
  }
  
  return `我收到了你的消息：「${userMessage}」\n\n作为一个演示版的 AI 助手，我可以：\n\n1. **智能对话** - 进行多轮自然语言对话\n2. **内容创作** - 帮助写作、翻译、总结\n3. **代码辅助** - 生成、解释和调试代码\n4. **数据分析** - 提供数据洞察和可视化建议\n\n你可以尝试问我：\n- 帮我写一段 Python 代码\n- 分析一下用户增长趋势\n- 写一封商务邮件\n- 解释什么是机器学习\n\n有什么具体想了解的？`
}

const initialUsage = [
  { date: '06-11', tokens: 2450, requests: 45 },
  { date: '06-12', tokens: 3120, requests: 62 },
  { date: '06-13', tokens: 2890, requests: 58 },
  { date: '06-14', tokens: 4210, requests: 84 },
  { date: '06-15', tokens: 3560, requests: 71 },
  { date: '06-16', tokens: 5100, requests: 98 },
  { date: '06-17', tokens: 2840, requests: 52 },
]

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: [],
      currentConversationId: null,
      apiKeys: [
        { id: generateId(), name: '默认演示密钥', key: 'dm-sk-demo-' + generateId().slice(0, 12), createdAt: Date.now() - 86400000 * 3 },
      ],
      usage: initialUsage,
      
      createConversation: () => {
        const id = generateId()
        const conv: Conversation = {
          id,
          title: '新对话',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set({
          conversations: [conv, ...get().conversations],
          currentConversationId: id,
        })
        return id
      },
      
      selectConversation: (id: string) => {
        set({ currentConversationId: id })
      },
      
      deleteConversation: (id: string) => {
        const state = get()
        const newConvs = state.conversations.filter(c => c.id !== id)
        const newMsgs = state.messages.filter(m => m.conversationId !== id)
        const newCurrent = id === state.currentConversationId
          ? (newConvs[0]?.id || null)
          : state.currentConversationId
        set({
          conversations: newConvs,
          messages: newMsgs,
          currentConversationId: newCurrent,
        })
      },
      
      sendMessage: (content: string) => {
        const state = get()
        let convId = state.currentConversationId
        let conversations = state.conversations
        
        if (!convId) {
          convId = generateId()
          const conv: Conversation = {
            id: convId,
            title: content.slice(0, 20),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          conversations = [conv, ...state.conversations]
        } else {
          const conv = conversations.find(c => c.id === convId)
          if (conv && conv.title === '新对话') {
            conversations = conversations.map(c =>
              c.id === convId ? { ...c, title: content.slice(0, 20), updatedAt: Date.now() } : c
            )
          } else {
            conversations = conversations.map(c =>
              c.id === convId ? { ...c, updatedAt: Date.now() } : c
            )
          }
        }
        
        const userMsg: Message = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: Date.now(),
          conversationId: convId,
        }
        
        const aiMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: simulateAIResponse(content),
          timestamp: Date.now() + 1,
          conversationId: convId,
        }
        
        const today = new Date()
        const todayStr = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
        let newUsage = [...state.usage]
        const todayIdx = newUsage.findIndex(u => u.date === todayStr)
        if (todayIdx >= 0) {
          newUsage[todayIdx] = {
            ...newUsage[todayIdx],
            tokens: newUsage[todayIdx].tokens + Math.floor(content.length * 1.5 + 50),
            requests: newUsage[todayIdx].requests + 1,
          }
        } else {
          newUsage.push({ date: todayStr, tokens: Math.floor(content.length * 1.5 + 50), requests: 1 })
        }
        
        set({
          conversations,
          messages: [...state.messages, userMsg, aiMsg],
          currentConversationId: convId,
          usage: newUsage,
        })
      },
      
      addApiKey: (name: string) => {
        const key = 'dm-sk-' + generateId().slice(0, 24)
        const newKey = { id: generateId(), name, key, createdAt: Date.now() }
        set({ apiKeys: [...get().apiKeys, newKey] })
        return key
      },
      
      deleteApiKey: (id: string) => {
        set({ apiKeys: get().apiKeys.filter(k => k.id !== id) })
      },
      
      resetDemo: () => {
        set({
          conversations: [],
          messages: [],
          currentConversationId: null,
          apiKeys: [{ id: generateId(), name: '默认演示密钥', key: 'dm-sk-demo-' + generateId().slice(0, 12), createdAt: Date.now() }],
          usage: initialUsage,
        })
      },
    }),
    { name: 'datamind-chat' }
  )
)
