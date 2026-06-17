import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useChatStore, formatTime } from '../stores'
import {
  Send,
  Plus,
  MessageSquare,
  Bot,
  Sparkles,
  User,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Pin,
  MoreHorizontal,
} from 'lucide-react'

export default function ChatPage(): React.ReactElement {
  const {
    sessions,
    messages,
    activeSessionId,
    createSession,
    setActiveSession: setActiveSessionId,
    deleteSession,
    sendMessage,
    setCurrentPersona,
    setCurrentModel,
    pinConversation,
    activePersonaId,
    personas,
    aiSettings,
    sidebarCollapsed,
    toggleSidebar,
  } = useChatStore()

  const [input, setInput] = useState<string>('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 当前会话
  const currentSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  )

  // 当前会话的消息
  const sessionMessages = useMemo(() => {
    if (!activeSessionId) return []
    return messages
      .filter((m) => m.sessionId === activeSessionId)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [messages, activeSessionId])

  // 当前角色
  const currentPersona = useMemo(
    () => (Array.isArray(personas) ? personas.find((p) => p.id === activePersonaId) || personas[0] : undefined) ?? personas[0],
    [personas, activePersonaId]
  )

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessionMessages.length])

  // 自动调整输入框高度
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [input])

  // 创建新会话
  const handleNewChat = () => {
    const sess = createSession(undefined)
    setActiveSessionId(sess.id)
    setInput('')
  }

  // 发送消息
  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    if (!activeSessionId) {
      const sess = createSession(undefined, text.slice(0, 20))
      setActiveSessionId(sess.id)
    }
    sendMessage(text)
    setInput('')
  }

  // 删除会话
  const handleDeleteSession = (id: string) => {
    deleteSession(id)
    setMenuOpen(null)
  }

  // 快捷键
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isStreaming = sessionMessages.some((m) => m.streaming)

  // 自动创建首次会话
  useEffect(() => {
    if (sessions.length === 0) {
      const sess = createSession(undefined)
      setActiveSessionId(sess.id)
    } else if (!activeSessionId) {
      setActiveSessionId(sessions[0].id)
    }
  }, [])

  return (
    <div className="flex-1 h-full flex bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* 侧边栏 - 会话列表 */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-0 opacity-0' : 'w-64 md:w-72 opacity-100'
        } transition-all duration-300 overflow-hidden border-r border-slate-200 bg-white/80 backdrop-blur flex-shrink-0`}
      >
        <div className="h-full flex flex-col">
          {/* 头部 */}
          <div className="p-3 border-b border-slate-100">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> 新对话
            </button>
          </div>

          {/* 角色选择 */}
          <div className="p-3 border-b border-slate-100">
            <div className="text-[10px] font-bold text-slate-500 mb-2 px-1">选择角色</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Array.isArray(personas) &&
                personas.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentPersona(p.id)
                      setCurrentModel('default')
                    }}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-[11px] transition-all ${
                      p.id === activePersonaId
                        ? 'bg-indigo-100 text-indigo-700 font-bold ring-1 ring-indigo-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            <div className="text-[10px] font-bold text-slate-500 mb-1.5 px-2">
              最近会话 ({sessions.length})
            </div>
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">暂无会话，开始新对话吧！</div>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => {
                  const isActive = s.id === activeSessionId
                  return (
                    <div
                      key={s.id}
                      className={`group relative rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 ring-1 ring-indigo-200'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <button
                        onClick={() => setActiveSessionId(s.id)}
                        className="w-full flex items-start gap-2 px-2.5 py-2 text-left"
                      >
                        <span className="mt-0.5">
                          {s.personaId === 'coder'
                            ? '💻'
                            : s.personaId === 'writer'
                            ? '✍️'
                            : s.personaId === 'analyst'
                            ? '📊'
                            : s.personaId === 'teacher'
                            ? '👨‍🏫'
                            : s.personaId === 'counselor'
                            ? '🧠'
                            : s.personaId === 'chef'
                            ? '👨‍🍳'
                            : s.personaId === 'poet'
                            ? '🌸'
                            : s.personaId === 'coach'
                            ? '💪'
                            : s.personaId === 'traveler'
                            ? '✈️'
                            : s.personaId === 'translator'
                            ? '🌐'
                            : '🤖'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[12px] font-medium truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {s.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatTime(s.updatedAt)}
                          </div>
                        </div>
                        {s.pinned && <Pin className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(menuOpen === s.id ? null : s.id)
                        }}
                        className="absolute right-1 top-1 p-1 rounded hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      {menuOpen === s.id && (
                        <div className="absolute right-2 top-8 z-20 bg-white border border-slate-200 rounded-lg shadow-xl p-1 text-xs min-w-[100px]">
                          <button
                            onClick={() => {
                              pinConversation(s.id)
                              setMenuOpen(null)
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-100 rounded-md text-left text-slate-700"
                          >
                            <Pin className="w-3 h-3" /> {s.pinned ? '取消置顶' : '置顶'}
                          </button>
                          <button
                            onClick={() => handleDeleteSession(s.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-red-50 rounded-md text-left text-red-600"
                          >
                            <Trash2 className="w-3 h-3" /> 删除
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 底部状态 */}
          <div className="p-3 border-t border-slate-100 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${aiSettings?.apiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{aiSettings?.apiKey ? '真实 API 模式' : '本地智能引擎'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* 顶栏 */}
        <header className="flex items-center justify-between gap-2 px-3 md:px-5 py-3 border-b border-slate-200 bg-white/80 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
              title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              )}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{currentPersona?.emoji}</span>
                <h2 className="text-sm md:text-base font-bold text-slate-800 truncate">
                  {currentSession?.title || '新对话'}
                </h2>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {currentPersona?.name} · {aiSettings?.modelName || '本地引擎'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{sessionMessages.length} 条消息</span>
          </div>
        </header>

        {/* 消息流 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 md:px-8 py-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {sessionMessages.length === 0 ? (
              // 空状态 - 欢迎页
              <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-200 mb-5">
                  <span className="text-4xl">{currentPersona?.emoji || '🤖'}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                  与 {currentPersona?.name || 'AI'} 对话
                </h1>
                <p className="text-sm text-slate-500 mb-6 max-w-md">
                  我能理解上下文、回答问题、创作内容。试试下面的提示词或自己提问。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
                  {[
                    '解释一下什么是人工智能？',
                    '帮我写一封请假邮件',
                    '推荐 3 本适合初学者的编程书',
                    '用中文和英文介绍你的能力',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q)
                        setTimeout(() => handleSend(), 50)
                      }}
                      className="flex items-start gap-2 p-3 text-left bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs text-slate-700 hover:text-indigo-700 transition-all hover:shadow-md group"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // 消息列表
              <div className="space-y-5">
                {sessionMessages.map((m) => {
                  const isUser = m.role === 'user'
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end flex-row-reverse' : ''}`}
                    >
                      {/* 头像 */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-br from-sky-400 to-indigo-600 text-white'
                            : 'bg-gradient-to-br from-indigo-400 to-violet-600 text-white'
                        }`}
                      >
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* 消息气泡 */}
                      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                            isUser
                              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-br-md'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
                          }`}
                        >
                          {m.content || (m.streaming ? (
                            <span className="inline-flex gap-0.5">
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </span>
                          ) : '')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 px-1">
                          {formatTime(m.timestamp)}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* 锚点 */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* 输入区 */}
        <div className="border-t border-slate-200 bg-white/90 backdrop-blur px-3 md:px-8 py-3 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`与 ${currentPersona?.name || 'AI'} 对话...（Enter 发送，Shift+Enter 换行）`}
                rows={1}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-slate-800 placeholder:text-slate-400 px-2 py-2 max-h-40"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all ${
                  input.trim() && !isStreaming
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="发送消息（Enter）"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Settings2 className="w-3 h-3" />
                <span>在设置页可配置真实 API Key</span>
              </div>
              <div>{input.length} 字</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
