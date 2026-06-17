import React, { useState } from 'react'
import { BookOpen, Copy, Search, Check, Tag, Sparkles } from 'lucide-react'

interface Prompt {
  id: string
  title: string
  category: string
  tags: string[]
  content: string
  description: string
  usage: string
}

const CATEGORIES = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'writing', name: '写作创作', icon: '✍️' },
  { id: 'coding', name: '编程开发', icon: '💻' },
  { id: 'analyze', name: '分析研究', icon: '🔍' },
  { id: 'teach', name: '教学讲解', icon: '👨‍🏫' },
  { id: 'translate', name: '翻译润色', icon: '🌐' },
  { id: 'business', name: '商业营销', icon: '📈' },
  { id: 'creative', name: '创意灵感', icon: '🎨' },
]

const PROMPTS: Prompt[] = [
  {
    id: '1', title: '专业产品描述', category: 'business', tags: ['电商', '营销', '文案'],
    description: '生成吸引人的产品描述文案，突出核心卖点和情感价值',
    usage: '替换 [产品名称] 为具体内容',
    content: '请为【产品名称】撰写一段专业的产品描述文案，要求：\n1. 突出核心功能与独特卖点\n2. 用情感化语言打动用户\n3. 结构清晰：标题+卖点列表+行动号召\n4. 200-300字\n\n目标用户：25-40岁的专业人士\n品牌调性：专业、温暖、可信赖',
  },
  {
    id: '2', title: '代码审查助手', category: 'coding', tags: ['Code Review', '优化', '调试'],
    description: '对代码进行系统性审查，识别问题并提供改进建议',
    usage: '粘贴代码到提示词后',
    content: '请作为一名资深代码审查专家，对以下代码进行审查：\n\n【代码片段】\n\n请从以下维度分析：\n1. 🔴 严重问题（潜在 bug、安全漏洞、资源泄漏）\n2. 🟡 可优化点（性能、可读性、代码结构）\n3. 🟢 优秀实践（值得肯定的实现）\n4. 💡 重构建议（提供具体代码片段）\n5. 📊 复杂度评估（时间/空间复杂度）\n\n请以结构化 Markdown 格式输出，每个问题给出具体改进方案。',
  },
  {
    id: '3', title: '学术论文摘要', category: 'analyze', tags: ['研究', '论文', '学术'],
    description: '将长篇研究内容浓缩为结构清晰的学术摘要',
    usage: '粘贴研究内容后使用',
    content: '请将以下研究内容提炼为标准的学术摘要（250-300字）：\n\n【论文/研究内容】\n\n请严格按照以下结构输出：\n\n## 🎯 研究背景与目的\n（说明研究的问题、重要性与目标）\n\n## 🛠️ 方法论\n（研究采用的方法、数据、技术路径）\n\n## 📊 核心发现\n（列出3-5个最重要的实证结果或结论）\n\n## 💡 创新与贡献\n（研究的创新点和学术/实践贡献）\n\n## ⭐ 关键词\n（5-8个核心关键词，用逗号分隔）\n\n要求语言：学术、精炼、客观',
  },
  {
    id: '4', title: '概念讲解专家', category: 'teach', tags: ['教学', '入门', '概念'],
    description: '用多层次、类比的方式解释复杂概念，适合零基础学习',
    usage: '替换【概念名称】',
    content: '请用"费曼学习法"的方式解释【概念名称】。\n\n要求分层次讲解：\n\n## 1️⃣ 一句话定义\n（最简单的表述，给完全外行的人）\n\n## 2️⃣ 生活化类比\n（用生活中事物做比喻，例如："可以把XX想象成..."）\n\n## 3️⃣ 简单例子\n（给一个具体、可感知的例子）\n\n## 4️⃣ 为什么重要\n（这个概念解决什么问题？带来什么价值？）\n\n## 5️⃣ 常见误区\n（新手最容易犯的2-3个理解错误）\n\n## 6️⃣ 延伸学习\n（推荐3个相关概念或下一步学习方向）\n\n请用轻松、有趣的语气，不要用晦涩术语。',
  },
  {
    id: '5', title: '多语言翻译专家', category: 'translate', tags: ['翻译', '多语言', '本地化'],
    description: '高质量多语言翻译，保留原语气和文化细节',
    usage: '粘贴原文后使用',
    content: '请将以下文本翻译为目标语言【目标语言：英语/日语/法语】，并满足：\n\n【原文】\n\n翻译要求：\n1. 🎯 准确传达原意，包括隐含情绪和语气\n2. 📝 保留原文格式（列表、强调等）\n3. 🌍 文化适配：对有文化特殊性的表达进行本地化处理\n4. 📖 术语一致：专业术语使用领域内通用译法\n5. 💬 口语/书面：根据原文风格匹配\n\n请输出格式：\n## 翻译结果\n（译文）\n\n## 📌 翻译说明\n（对关键表达、文化转换点的说明，2-3条即可）',
  },
  {
    id: '6', title: '创意故事开头', category: 'creative', tags: ['小说', '故事', '灵感'],
    description: '生成多种风格的故事开头，激发创作灵感',
    usage: '替换【故事主题】',
    content: '请围绕【故事主题：都市奇幻】创作5个完全不同风格的故事开头，每个150字左右。\n\n要求风格分别是：\n\n1. 🌙 悬疑神秘风 —— 以悬念开场\n2. 💔 情感回忆风 —— 用第一人称叙述\n3. ⚔️ 热血冒险风 —— 动作场景开头\n4. 😂 幽默诙谐风 —— 带讽刺或自嘲\n5. 🎭 诗意文学风 —— 意象丰富的散文式开头\n\n每个开头要包含：时间、地点、人物状态、一个小悬念\n\n请用"### 风格 X："作为每个开头的标题',
  },
  {
    id: '7', title: '品牌 Slogan 生成器', category: 'writing', tags: ['品牌', 'slogan', '文案'],
    description: '为品牌生成多维度口号，附创作思路',
    usage: '填入品牌信息后使用',
    content: '请为【品牌名称：XX】创作10个不同风格的Slogan。\n\n品牌调性：【年轻、专业、有温度】\n核心价值：【便捷、品质、创新】\n\n请按以下分类输出：\n\n## 🔤 4字简洁款\n- slogan 1\n- slogan 2\n\n## 📝 6-8字经典款\n- slogan 3\n- slogan 4\n\n## 💬 双句对仗款\n- slogan 5 / slogan 6\n\n## ✨ 情感共鸣款\n- slogan 7 / slogan 8\n\n## 🎯 行动号召款\n- slogan 9 / slogan 10\n\n每个 slogan 后附：【创作思路：一句话说明为什么这么写，希望用户产生什么感受】',
  },
  {
    id: '8', title: '数据可视化建议', category: 'analyze', tags: ['数据', '图表', '分析'],
    description: '针对数据给出最佳可视化方案建议',
    usage: '描述数据后使用',
    content: '我有以下数据需要可视化，请给出最佳方案：\n\n【数据描述】\n例：我有过去12个月的销售数据，按5个产品类别和3个地区细分，希望展示趋势和占比变化。\n\n请输出：\n\n## 📊 推荐图表类型及理由\n1. 主图表（类型 + 为什么用它）\n2. 辅助图表（类型 + 为什么用它）\n3. 仪表板组合建议\n\n## 🎨 设计建议\n- 颜色方案\n- 关键标注点建议\n- 交互建议（可点击/悬停等）\n\n## ⚠️ 数据洞察可能\n（从可视化中期望发现的3-5个关键洞察方向）\n\n## 🔗 可替代方案\n（如果数据量/场景不同的备选方案）',
  },
  {
    id: '9', title: '项目管理复盘', category: 'business', tags: ['复盘', '项目', '团队'],
    description: '结构化项目复盘模板，帮团队从经验中学习',
    usage: '替换项目详情后使用',
    content: '请帮我做【项目名称：XX】的结构化复盘。\n项目背景：【简要描述项目目标、周期、关键成员】\n最终结果：【达成情况、关键指标、亮点/问题】\n\n请从以下维度展开：\n\n## 🎯 目标回顾\n（原定目标 vs 实际结果，用数据说话）\n\n## ✅ 做得好的\n至少5点，按重要性排序\n\n## 🎯 需要改进的\n至少5点，具体可操作\n\n## 💡 经验教训\n- 关于策略的洞察\n- 关于执行的洞察\n- 关于协作的洞察\n\n## 🚀 下一步行动清单\n（责任人 + 截止日期 + 预期产出格式）\n\n## ⭐ 一句话总结\n（这次项目最核心的经验）',
  },
  {
    id: '10', title: '算法实现助手', category: 'coding', tags: ['算法', '数据结构', '性能'],
    description: '算法学习和实现的系统化模板',
    usage: '替换算法名称',
    content: '请帮我实现和理解【算法名称：快速排序 / 动态规划 / Dijkstra 等】\n\n请分步骤输出：\n\n## 📌 算法简介\n（它是什么、解决什么问题、使用场景）\n\n## 🎯 核心思想\n（用最直觉的方式解释算法逻辑）\n\n## 🔢 复杂度分析\n- 时间复杂度：平均/最坏/最好\n- 空间复杂度\n- 稳定性说明\n\n## 💻 代码实现\n（使用 Python/JavaScript，含详细注释）\n\n## 📝 示例运行\n（演示一组数据，展示关键步骤）\n\n## ⚠️ 常见坑\n- 实现中容易出错的3个点\n- 边界情况（空输入、单元素、已排序等）\n\n## 🔄 变种与优化\n（常见变体或优化思路）',
  },
  {
    id: '11', title: '面试自我介绍', category: 'business', tags: ['求职', '面试', '个人品牌'],
    description: '结构化30秒/1分钟/3分钟自我介绍',
    usage: '填入个人经历后使用',
    content: '请帮我准备一个专业的面试自我介绍，基于以下背景：\n\n姓名：【你的姓名】\n岗位：【应聘岗位】\n核心经历：【1-3段最重要的经历/项目】\n优势特质：【你的3个核心优势】\n\n请输出3个版本：\n\n## ⚡ 30秒版本（电梯演讲）\n（简洁有力，记住核心标签）\n\n## 🎯 1分钟版本（正式面试开场）\n（背景+能力+匹配度）\n\n## 📋 3分钟版本（完整叙事）\n（故事化表达：过去-现在-未来）\n\n另外提供：\n\n## 💡 表达建议\n- 语气和语速建议\n- 肢体语言提示\n- 避免的雷区\n\n## ❓ 可能的追问\n面试官听到后最可能追问的5个问题',
  },
  {
    id: '12', title: '会议纪要生成', category: 'business', tags: ['会议', '效率', '团队'],
    description: '将讨论内容整理为结构化会议纪要',
    usage: '粘贴会议记录后使用',
    content: '请将以下会议讨论整理为结构化纪要：\n\n【会议录音/记录/要点】\n\n请输出：\n\n# 📋 会议纪要\n\n## 基本信息\n- 时间：\n- 参与人：\n- 主题：\n\n## 📌 决策事项（Decision）\n1. 决策内容（已达成共识）\n2. 决策内容\n\n## ✅ 行动项（Action Items）\n| # | 任务 | 负责人 | 截止日期 | 优先级 |\n|---|------|--------|----------|--------|\n| 1 | ... | ... | ... | 高/中/低 |\n\n## 💬 关键讨论（Discussion）\n（按主题汇总讨论要点，正反观点用列表）\n\n## 📊 风险识别\n（本次会议中发现的潜在风险/问题）\n\n## 📝 信息同步\n（不需要行动但应该周知的信息）\n\n## 下一次会议议程\n- 议题1\n- 议题2\n\n要求：简洁、可执行，全文控制在一页A4以内',
  },
]

export default function PromptLibraryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const filtered = PROMPTS.filter(p => {
    const matchCat = category === 'all' || p.category === category
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-amber-50 via-white to-orange-50 p-3 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">提示词模板库</h1>
            <p className="text-xs text-muted">精选 {PROMPTS.length} 个专业提示词，一键复制即用</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-theme p-4 mb-6">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索提示词、标签..."
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:border-orange-400 focus:bg-white transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + (category === c.id ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' : 'bg-slate-100 text-secondary hover:bg-slate-200')}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          {filtered.map((p, idx) => {
            const cat = CATEGORIES.find(c => c.id === p.category)
            const isActive = activeId === p.id
            return (
              <div key={p.id} className={'bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md ' + (isActive ? 'border-orange-300' : 'border-theme')}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-lg font-medium">
                        {cat?.icon} {cat?.name}
                      </span>
                      <span className="text-[10px] text-muted">#{String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(p.content, p.id)}
                      className={'flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded-lg transition-all ' + (copiedId === p.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-secondary')}
                    >
                      {copiedId === p.id ? <><Check className="w-3 h-3" /> 已复制</> : <><Copy className="w-3 h-3" /> 复制提示词</>}
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-primary mb-1.5">{p.title}</h3>
                  <p className="text-[11px] text-muted mb-2.5 leading-relaxed">{p.description}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        <Tag className="w-2 h-2" /> {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveId(isActive ? null : p.id)}
                    className="w-full text-left"
                  >
                    <div className="p-3 bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted mb-1.5">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500" /> 提示词预览
                      </div>
                      <p className={'text-[11px] text-slate-700 leading-relaxed ' + (isActive ? '' : 'line-clamp-3')}>
                        {p.content}
                      </p>
                      <div className="text-[10px] text-amber-600 mt-1.5">💡 {p.usage}</div>
                    </div>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted">
            <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>没有找到匹配的提示词</p>
          </div>
        )}

        <div className="mt-8 p-5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl text-white shadow-lg">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> 如何编写好的提示词？
          </h3>
          <div className="text-[11px] space-y-1 opacity-95 grid sm:grid-cols-2 gap-x-6">
            <div>1️⃣ 明确角色：设定 AI 为某领域专家</div>
            <div>2️⃣ 清晰目标：说明你想要什么产出</div>
            <div>3️⃣ 结构化输出：告诉 AI 输出的格式</div>
            <div>4️⃣ 提供示例：给 AI 一个参考样本</div>
            <div>5️⃣ 上下文充分：提供必要背景信息</div>
            <div>6️⃣ 多轮迭代：第一次不理想？继续追问</div>
          </div>
        </div>
      </div>
    </div>
  )
}
