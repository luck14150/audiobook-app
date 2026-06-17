import React, { useState, useEffect, useMemo } from 'react'
import { Brain, Search, Plus, Edit2, Trash2, Tag, Folder, X, Save, BookOpen, Clock, AlertTriangle, CheckCircle2, FolderPlus } from 'lucide-react'
import { useChatStore } from '../stores'

type KnowledgeItem = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

// 简单的 toast 提示类型
interface ToastState {
  visible: boolean
  type: 'success' | 'error' | 'info'
  message: string
}

// 格式化时间戳为友好的显示文本
function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 截断内容，最多显示指定行数（按字符粗略估算）
function truncateContent(content: string, maxChars: number = 120): string {
  if (content.length <= maxChars) return content
  return content.substring(0, maxChars).trim() + '…'
}

// 编辑器弹窗表单类型
interface EditorForm {
  title: string
  category: string
  tags: string
  content: string
}

const EMPTY_FORM: EditorForm = {
  title: '',
  category: '',
  tags: '',
  content: '',
}

// 默认分类（引导用户创建自定义分类）
const DEFAULT_CATEGORIES = ['产品介绍', '使用教程', 'FAQ', '客户案例', '内部文档']

export default function KnowledgePage() {
  // 从 store 读取知识库数据
  const knowledge = useChatStore((state) => state.knowledge)
  const addKnowledge = useChatStore((state) => state.addKnowledge)
  const updateKnowledge = useChatStore((state) => state.updateKnowledge)
  const deleteKnowledge = useChatStore((state) => state.deleteKnowledge)

  // 搜索和分类筛选状态
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // 弹窗状态
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [formData, setFormData] = useState<EditorForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  // 删除确认弹窗
  const [deletingItem, setDeletingItem] = useState<KnowledgeItem | null>(null)

  // Toast 提示
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'info', message: '' })

  // 显示 toast 的工具函数
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ visible: true, type, message })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2500)
  }

  // 计算所有出现过的分类及条目数量（包括默认分类，即使没有条目也显示）
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {}
    // 先把默认分类都放进去
    for (const c of DEFAULT_CATEGORIES) counts[c] = 0
    // 再统计实际数据中的分类
    for (const k of knowledge) {
      counts[k.category] = (counts[k.category] || 0) + 1
    }
    // 转换为数组
    const list = Object.entries(counts)
      .filter(([name, count]) => count > 0 || DEFAULT_CATEGORIES.includes(name))
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // 默认分类优先
        const aDefault = DEFAULT_CATEGORIES.indexOf(a.name)
        const bDefault = DEFAULT_CATEGORIES.indexOf(b.name)
        if (aDefault !== -1 && bDefault !== -1) return aDefault - bDefault
        if (aDefault !== -1) return -1
        if (bDefault !== -1) return 1
        return a.name.localeCompare(b.name, 'zh-CN')
      })
    return list
  }, [knowledge])

  // 过滤后的知识列表
  const filteredKnowledge = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return knowledge
      .filter((k) => {
        // 分类过滤
        if (activeCategory !== 'all' && k.category !== activeCategory) return false
        // 搜索过滤：标题、内容、标签、分类
        if (!q) return true
        if (k.title.toLowerCase().includes(q)) return true
        if (k.content.toLowerCase().includes(q)) return true
        if (k.category.toLowerCase().includes(q)) return true
        if (k.tags && k.tags.some((t) => t.toLowerCase().includes(q))) return true
        return false
      })
      .sort((a, b) => b.updatedAt - a.updatedAt) // 按更新时间倒序
  }, [knowledge, searchText, activeCategory])

  // 打开新增弹窗
  const handleAddNew = () => {
    setEditingItem(null)
    setFormData({
      ...EMPTY_FORM,
      // 如果当前选了某个分类，则默认使用该分类
      category: activeCategory === 'all' ? '' : activeCategory,
    })
    setFormError('')
    setEditorOpen(true)
  }

  // 打开编辑弹窗
  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      category: item.category,
      tags: (item.tags || []).join(', '),
      content: item.content,
    })
    setFormError('')
    setEditorOpen(true)
  }

  // 关闭弹窗
  const closeEditor = () => {
    setEditorOpen(false)
    setEditingItem(null)
    setFormData(EMPTY_FORM)
    setFormError('')
  }

  // 保存知识条目
  const handleSave = () => {
    const title = formData.title.trim()
    const category = formData.category.trim()
    const content = formData.content.trim()

    // 简单校验
    if (!title) {
      setFormError('请输入标题')
      return
    }
    if (!category) {
      setFormError('请输入或选择分类')
      return
    }
    if (!content) {
      setFormError('请输入内容')
      return
    }

    // 处理标签：按逗号/中文逗号/空格分割
    const tags = formData.tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    try {
      if (editingItem) {
        // 更新已有条目
        updateKnowledge(editingItem.id, {
          title,
          category,
          content,
          tags,
        })
        showToast('success', '知识条目已更新')
      } else {
        // 新增条目
        addKnowledge({
          title,
          category,
          content,
          tags,
        })
        showToast('success', '知识条目已添加')
      }
      closeEditor()
    } catch (error) {
      // 捕获异常，通过 toast 提示用户
      showToast('error', editingItem ? '更新失败，请重试' : '添加失败，请重试')
    }
  }

  // 触发删除确认
  const handleDeleteClick = (item: KnowledgeItem) => {
    setDeletingItem(item)
  }

  // 确认删除
  const confirmDelete = () => {
    if (!deletingItem) return
    try {
      deleteKnowledge(deletingItem.id)
      showToast('success', '已删除')
    } catch {
      showToast('error', '删除失败，请重试')
    } finally {
      setDeletingItem(null)
    }
  }

  // ESC 键关闭弹窗
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editorOpen) closeEditor()
        if (deletingItem) setDeletingItem(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editorOpen, deletingItem])

  // 当前激活分类的显示名
  const currentCategoryLabel = activeCategory === 'all' ? '全部' : activeCategory

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-3 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 顶部标题 + 添加按钮 */}
        <div className="flex items-start justify-between gap-3 mb-6 md:mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary">📚 知识库</h1>
              <p className="text-xs text-muted">
                共 {knowledge.length} 条知识 · 对话时自动注入相关内容到 AI 上下文
              </p>
            </div>
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            添加知识
          </button>
        </div>

        {/* 搜索框 */}
        <div className="bg-white rounded-2xl shadow-sm border border-theme p-4 mb-6">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索标题、内容、标签或分类..."
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:border-violet-400 focus:bg-white transition-all"
            />
          </div>

          {/* 移动端/通用 分类快捷标签 */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' +
                (activeCategory === 'all'
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md'
                  : 'bg-slate-100 text-secondary hover:bg-slate-200')
              }
            >
              📚 全部 ({knowledge.length})
            </button>
            {categoryStats.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' +
                  (activeCategory === cat.name
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md'
                    : 'bg-slate-100 text-secondary hover:bg-slate-200')
                }
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* 主体内容：左侧分类导航 + 右侧卡片列表（桌面端） */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* 桌面端 左侧分类导航 */}
          <aside className="hidden md:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4 sticky top-4">
              <div className="flex items-center gap-1.5 mb-3 px-2">
                <Folder className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">分类导航</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ' +
                    (activeCategory === 'all'
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md'
                      : 'text-secondary hover:bg-slate-100')
                  }
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    全部
                  </span>
                  <span
                    className={
                      'px-1.5 py-0.5 rounded text-[10px] ' +
                      (activeCategory === 'all' ? 'bg-white/20' : 'bg-slate-200 text-slate-600')
                    }
                  >
                    {knowledge.length}
                  </span>
                </button>
                {categoryStats.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ' +
                      (activeCategory === cat.name
                        ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md'
                        : 'text-secondary hover:bg-slate-100')
                    }
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Folder className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span
                      className={
                        'px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ' +
                        (activeCategory === cat.name ? 'bg-white/20' : 'bg-slate-200 text-slate-600')
                      }
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* 小贴士 */}
              <div className="mt-4 p-3 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
                <div className="flex items-start gap-2">
                  <Brain className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-violet-700 mb-1">💡 小提示</div>
                    <p className="text-[10px] text-violet-600/90 leading-relaxed">
                      对话时 AI 会自动从知识库匹配 3 条最相关内容作为上下文参考，让回答更贴合你的业务场景。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* 右侧内容区 */}
          <main className="flex-1 min-w-0">
            {/* 当前分类标题 */}
            {filteredKnowledge.length > 0 && (
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-bold text-primary">
                  {currentCategoryLabel}
                  <span className="text-muted font-normal ml-2">· {filteredKnowledge.length} 条结果</span>
                </h2>
              </div>
            )}

            {/* 空状态 */}
            {filteredKnowledge.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-theme p-12 text-center">
                {knowledge.length === 0 ? (
                  // 完全无数据的引导空状态
                  <>
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-3xl flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-violet-500" />
                    </div>
                    <h3 className="text-base font-bold text-primary mb-2">还没有知识条目</h3>
                    <p className="text-xs text-muted mb-6 max-w-sm mx-auto leading-relaxed">
                      在这里添加产品介绍、使用教程、FAQ 等内容。下次与 AI 对话时，相关知识会自动注入上下文，让回答更精准。
                    </p>
                    <button
                      onClick={handleAddNew}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-violet-500/20 transition-all text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      添加第一条知识
                    </button>
                  </>
                ) : (
                  // 搜索无结果的空状态
                  <>
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                      <Search className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-primary mb-2">没有匹配的结果</h3>
                    <p className="text-xs text-muted mb-4 max-w-sm mx-auto leading-relaxed">
                      试试换个关键词，或清空筛选条件查看全部内容
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {searchText && (
                        <button
                          onClick={() => setSearchText('')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-secondary text-xs rounded-lg transition-all"
                        >
                          清空搜索
                        </button>
                      )}
                      {activeCategory !== 'all' && (
                        <button
                          onClick={() => setActiveCategory('all')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-secondary text-xs rounded-lg transition-all"
                        >
                          显示全部
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 知识卡片网格 */}
            {filteredKnowledge.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {filteredKnowledge.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl shadow-sm border border-theme p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-violet-200 animate-fade-in flex flex-col"
                  >
                    {/* 顶部：分类 + 操作按钮 */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 rounded-lg font-medium">
                        <Folder className="w-3 h-3" />
                        {item.category}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          title="编辑"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-violet-100 hover:text-violet-600 text-secondary transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          title="删除"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-secondary transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 标题 */}
                    <h3 className="text-sm font-bold text-primary mb-2 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* 内容摘要 */}
                    <p className="text-[11px] text-muted leading-relaxed mb-3 line-clamp-3 flex-1 whitespace-pre-wrap">
                      {truncateContent(item.content, 160)}
                    </p>

                    {/* 标签 */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 4 && (
                          <span className="text-[10px] text-muted px-1.5 py-0.5">
                            +{item.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 底部：时间 */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-[10px] text-muted">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.updatedAt)}
                        {item.updatedAt !== item.createdAt && (
                          <span className="text-slate-400">· 已更新</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted">
                        {item.content.length} 字
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 添加/编辑 弹窗 */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={closeEditor}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  {editingItem ? <Edit2 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                </div>
                <h2 className="text-base font-bold text-primary">
                  {editingItem ? '编辑知识条目' : '添加知识条目'}
                </h2>
              </div>
              <button
                onClick={closeEditor}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-secondary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 标题 */}
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">
                  标题 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="简明扼要地概括这条知识"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-violet-400 focus:bg-white transition-all"
                />
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">
                  分类 <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={
                        'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ' +
                        (formData.category === cat
                          ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md'
                          : 'bg-slate-100 text-secondary hover:bg-slate-200')
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <FolderPlus className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="输入自定义分类（例如：团队知识）"
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-violet-400 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">标签</label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="多个标签用逗号分隔，例如：产品, 使用, 新手入门"
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-violet-400 focus:bg-white transition-all"
                  />
                </div>
                {formData.tags.trim() && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags
                      .split(/[,，\s]+/)
                      .map((t) => t.trim())
                      .filter((t) => t.length > 0)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-md"
                        >
                          <Tag className="w-2.5 h-2.5" /> {tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* 内容 */}
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">
                  内容 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="输入知识的详细内容，越具体越能帮助 AI 给出精准回答..."
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-violet-400 focus:bg-white transition-all resize-none leading-relaxed"
                />
                <div className="text-[10px] text-muted mt-1.5 text-right">{formData.content.length} 字</div>
              </div>

              {/* 错误提示 */}
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700">{formError}</p>
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button
                onClick={closeEditor}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-secondary text-xs font-medium rounded-xl transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white text-xs font-medium rounded-xl shadow-md shadow-violet-500/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {editingItem ? '保存修改' : '添加知识'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setDeletingItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary mb-1">确认删除？</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    确定要删除「<span className="text-slate-700 font-medium">{deletingItem.title}</span>」吗？此操作无法撤销。
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeletingItem(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-secondary text-xs font-medium rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-medium rounded-xl shadow-md shadow-rose-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
          <div
            className={
              'flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ' +
              (toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : toast.type === 'error'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-700 text-white')
            }
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
