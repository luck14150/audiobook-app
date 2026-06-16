import React, { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { MessageSquarePlus, Send, Trash2, Plus, Menu, X, Brain, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function ChatPage() {
  const { conversations, messages, currentConversationId, createConversation, selectConversation, deleteConversation, sendMessage } = useChatStore()
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentMessages = messages.filter(m => m.conversationId === currentConversationId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages.length, currentConversationId])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    createConversation()
    setSidebarOpen(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-72 flex-col bg-slate-900 text-white">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">DataMind</span>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            新建对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              暂无对话<br />开始新对话吧
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`group p-3 rounded-xl cursor-pointer transition-all ${
                  currentConversationId === conv.id
                    ? 'bg-indigo-500/20 border border-indigo-500/30'
                    : 'hover:bg-slate-800 border border-transparent'
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquarePlus className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 text-white z-50 md:hidden flex flex-col animate-in">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">DataMind</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              <button
                onClick={handleNewChat}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> 新建对话
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-xl ${currentConversationId === conv.id ? 'bg-indigo-500/20' : 'bg-slate-800'}`}
                  onClick={() => { selectConversation(conv.id); setSidebarOpen(false) }}
                >
                  <span className="text-sm truncate block">{conv.title}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600 font-medium">
              {conversations.find(c => c.id === currentConversationId)?.title || '欢迎使用 DataMind AI'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">欢迎使用 DataMind AI</h2>
              <p className="text-slate-500 mb-8 max-w-md">
                我可以帮助你进行智能对话、写作、代码生成、数据分析等。
                <br />有什么想了解的？
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  { title: '写一段代码', prompt: '帮我写一段快速排序的 Python 代码' },
                  { title: '数据分析', prompt: '分析电商用户增长的关键指标' },
                  { title: '内容创作', prompt: '帮我写一封商务邮件' },
                  { title: '学习助手', prompt: '解释什么是机器学习' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => { sendMessage(item.prompt) }}
                    className="p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl text-left transition-all group"
                  >
                    <div className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 mb-1">{item.title}</div>
                    <div className="text-xs text-slate-400 truncate">{item.prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {currentMessages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`chat-bubble p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                      }`}
                    >
                      <ReactMarkdown components={{
                        code: ({ children }) => (
                          <code className="bg-black/10 rounded px-1.5 py-0.5 text-[0.85em]">{children}</code>
                        ),
                      }}>{msg.content}</ReactMarkdown>
                    </div>
                    <div className={`text-xs text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 order-1">
                      <span className="text-white text-xs font-bold">我</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-3 md:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的消息，Enter 发送，Shift+Enter 换行..."
                rows={1}
                className="flex-1 bg-transparent resize-none px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none max-h-32"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:shadow-none transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              DataMind AI 演示版 · 仅供学习演示使用
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
