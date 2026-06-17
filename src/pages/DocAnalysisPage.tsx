import React, { useState, useMemo } from 'react'
import { FileText, Search, Hash, Clock, Sparkles, TrendingUp, BarChart3, Star, AlertTriangle, Zap, Smile, Meh, Frown } from 'lucide-react'

const SAMPLE = `人工智能（AI）是研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统的一门新的技术科学。

人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大。可以设想，未来人工智能带来的科技产品，将会是人类智慧的"容器"。

人工智能可以对人的意识、思维的信息过程的模拟。人工智能不是人的智能，但能像人那样思考、也可能超过人的智能。

在医疗领域，AI 可以辅助医生进行诊断，通过分析大量医疗数据和影像，帮助医生更快地识别疾病。

在教育领域，AI 可以为学生提供个性化的学习体验，根据每个学生的特点推荐最适合的学习内容。

在交通领域，自动驾驶技术正在改变我们的出行方式，使交通更加高效和安全。

在金融领域，AI 被用于风险评估和投资决策，通过分析市场数据和用户行为，提供更精准的金融服务。

展望未来，人工智能将继续在各个领域发挥重要作用，为人类社会的发展做出更大的贡献。但同时，我们也需要关注 AI 的伦理问题，确保技术的发展符合人类的利益和价值观。`

interface AnalysisResult {
  chars: number
  charsNoSpace: number
  words: number
  sentences: number
  paragraphs: number
  chineseChars: number
  avgSentenceLen: number
  avgWordLen: number
  readingTime: number // minutes
  uniqueRatio: number
  topWords: { word: string; count: number }[]
  sentiment: number // -1 to 1
  keywords: { word: string; score: number }[]
}

const POSITIVE_WORDS = ['智能', '成熟', '帮助', '贡献', '高效', '安全', '重要', '发展', '创新', '优秀', '成功', '美好', '强大', '未来', '价值', '精准', '个性化', '符合', '利益']
const NEGATIVE_WORDS = ['问题', '风险', '伦理', '但', '但是', '不过', '可能', '需要', '关注', '疾病']

function analyze(text: string): AnalysisResult {
  const chars = text.length
  const charsNoSpace = text.replace(/\s/g, '').length
  const sentences = text.split(/[。.!?！？]/).filter(s => s.trim().length > 0).length || 1
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length || 1
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length

  // Tokenize for Chinese+English
  const words = text
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)

  const wordFreq: Record<string, number> = {}
  for (const w of words) {
    wordFreq[w] = (wordFreq[w] || 0) + 1
  }
  const uniqueWords = Object.keys(wordFreq).length
  const topWords = Object.entries(wordFreq)
    .filter(([w]) => w.length > 1 && w.length < 12 && !['the', 'and', 'a', 'is', 'to', 'of'].includes(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  // Keyword extraction (frequency * inverse position weighting)
  const allTokens: string[] = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (/[\u4e00-\u9fa5]/.test(ch)) {
      allTokens.push(ch)
      if (i > 0 && /[\u4e00-\u9fa5]/.test(text[i - 1])) {
        allTokens.push(text[i - 1] + ch)
      }
    }
  }
  const tokenFreq: Record<string, number> = {}
  for (const t of allTokens) {
    if (t.length === 2) tokenFreq[t] = (tokenFreq[t] || 0) + 1
  }
  const stopChars = ['的', '了', '和', '是', '在', '也', '为', '与', '或', '人', '这', '那', '有', '不', '及', '等', '将', '能', '会', '可以', '一个', '我们', '他们', '我', '你', '他', '她', '它', '会', '更', '但', '而', '其', '为', '被', '让', '给', '对', '从', '到', '上', '下', '中']
  const keywords = Object.entries(tokenFreq)
    .filter(([word]) => word.length === 2 && !stopChars.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, count]) => ({ word, score: count }))

  // Sentiment analysis (very rough)
  let positiveScore = 0
  let negativeScore = 0
  for (const pw of POSITIVE_WORDS) positiveScore += (text.match(new RegExp(pw, 'g')) || []).length
  for (const nw of NEGATIVE_WORDS) negativeScore += (text.match(new RegExp(nw, 'g')) || []).length
  const total = positiveScore + negativeScore || 1
  const sentiment = (positiveScore - negativeScore) / total

  return {
    chars,
    charsNoSpace,
    words: words.length,
    sentences,
    paragraphs,
    chineseChars,
    avgSentenceLen: Math.round((chars / sentences) * 10) / 10,
    avgWordLen: words.length > 0 ? Math.round((charsNoSpace / words.length) * 10) / 10 : 0,
    readingTime: Math.max(1, Math.round(charsNoSpace / 300)),
    uniqueRatio: words.length > 0 ? Math.round((uniqueWords / words.length) * 100) / 100 : 0,
    topWords,
    sentiment,
    keywords,
  }
}

export default function DocAnalysisPage() {
  const [text, setText] = useState(SAMPLE)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => analyze(text), [text])

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const sentimentLabel = result.sentiment > 0.3 ? '积极' : result.sentiment < -0.1 ? '消极' : '中性'
  const SentimentIcon = result.sentiment > 0.3 ? Smile : result.sentiment < -0.1 ? Frown : Meh

  const maxWordCount = result.topWords.length > 0 ? result.topWords[0].count : 1
  const maxKwScore = result.keywords.length > 0 ? result.keywords[0].score : 1

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-sky-50 via-white to-blue-50 p-3 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">文档分析</h1>
            <p className="text-xs text-muted">文本统计 · 关键词提取 · 情感分析 · 阅读评估</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-4 md:gap-6">
          {/* Text Input */}
          <div className="space-y-4 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-theme overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-theme flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <Search className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-medium">输入文本</span>
                  <span className="text-muted">· {result.chars} 字符</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setText(SAMPLE)} className="text-[10px] text-muted hover:text-sky-600 px-2 py-1 rounded">
                    示例
                  </button>
                  <button onClick={() => setText('')} className="text-[10px] text-muted hover:text-red-500 px-2 py-1 rounded">
                    清空
                  </button>
                  <button onClick={handleCopy} className="text-[10px] text-muted hover:text-sky-600 px-2 py-1 rounded flex items-center gap-1">
                    {copied ? <Sparkles className="w-2.5 h-2.5 text-emerald-500" /> : null} {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="w-full p-4 min-h-[360px] outline-none text-sm text-primary resize-y leading-relaxed"
                placeholder="在此粘贴或输入要分析的文本内容..."
              />
            </div>

            {/* Sentiment */}
            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-sky-500" /> 情感分析
              </h3>
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100 text-center">
                  <Smile className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-emerald-700">{Math.max(0, result.sentiment * 100).toFixed(0)}%</div>
                  <div className="text-[10px] text-muted">积极情感</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-100 text-center">
                  <Meh className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-slate-600">{Math.round((1 - Math.abs(result.sentiment)) * 30)}%</div>
                  <div className="text-[10px] text-muted">中性</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100 text-center">
                  <Frown className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-red-600">{Math.max(0, -result.sentiment * 100).toFixed(0)}%</div>
                  <div className="text-[10px] text-muted">消极情感</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SentimentIcon className="w-6 h-6" />
                    <div>
                      <div className="text-sm font-bold">整体情感：{sentimentLabel}</div>
                      <div className="text-[10px] opacity-80">基于关键词匹配的简化分析</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{result.sentiment > 0 ? '+' : ''}{result.sentiment.toFixed(2)}</div>
                    <div className="text-[9px] opacity-80">情感得分</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-500" /> 关键词提取 (Top {result.keywords.length})
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {result.keywords.map(kw => (
                  <span key={kw.word} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 rounded-lg text-[11px] font-medium border border-sky-100 shadow-sm">
                    {kw.word}
                    <span className="text-[9px] text-sky-500/70">× {kw.score}</span>
                  </span>
                ))}
              </div>
              <div className="space-y-1.5">
                {result.keywords.slice(0, 6).map(kw => (
                  <div key={kw.word} className="flex items-center gap-2">
                    <span className="text-[11px] text-secondary w-12 flex-shrink-0">{kw.word}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" style={{ width: `${(kw.score / maxKwScore) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-muted w-8 text-right">{kw.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Word frequency */}
            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-sky-500" /> 高频词
              </h3>
              <div className="space-y-1.5">
                {result.topWords.map(w => (
                  <div key={w.word} className="flex items-center gap-2">
                    <span className="text-[11px] text-secondary w-20 truncate flex-shrink-0">{w.word}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full" style={{ width: `${(w.count / maxWordCount) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-muted w-6 text-right">{w.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats panel */}
          <div className="space-y-4 order-1 lg:order-2">
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold">📊 阅读评估</h3>
                <TrendingUp className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-[11px] opacity-90 mb-1">预计阅读时间</div>
              <div className="text-4xl font-bold mb-1">{result.readingTime} 分钟</div>
              <div className="text-[11px] opacity-80 mb-4">约 {result.charsNoSpace.toLocaleString()} 字（含标点）</div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <div className="opacity-80 mb-0.5">段落数</div>
                    <div className="text-lg font-bold">{result.paragraphs}</div>
                  </div>
                  <div>
                    <div className="opacity-80 mb-0.5">句子数</div>
                    <div className="text-lg font-bold">{result.sentences}</div>
                  </div>
                  <div>
                    <div className="opacity-80 mb-0.5">平均句长</div>
                    <div className="text-lg font-bold">{result.avgSentenceLen}</div>
                  </div>
                  <div>
                    <div className="opacity-80 mb-0.5">中文字数</div>
                    <div className="text-lg font-bold">{result.chineseChars}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-sky-500" /> 文本统计
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-muted">总字符</div>
                  <div className="text-base font-bold text-primary">{result.chars.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-muted">净字符</div>
                  <div className="text-base font-bold text-primary">{result.charsNoSpace.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-muted">分词数</div>
                  <div className="text-base font-bold text-primary">{result.words}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-muted">多样性</div>
                  <div className="text-base font-bold text-primary">{(result.uniqueRatio * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-sky-500" /> 可读性提示
              </h3>
              <div className="space-y-2 text-[11px] text-secondary">
                {result.avgSentenceLen > 80 && (
                  <div className="flex items-start gap-1.5 p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>句子偏长（{result.avgSentenceLen} 字），建议适当断句提升阅读体验</span>
                  </div>
                )}
                {result.paragraphs < 3 && (
                  <div className="flex items-start gap-1.5 p-2 bg-sky-50 text-sky-700 rounded-lg border border-sky-100">
                    <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>段落结构较为紧凑，适当分段有助于阅读理解</span>
                  </div>
                )}
                {result.chars > 500 && result.chars < 2000 && (
                  <div className="flex items-start gap-1.5 p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                    <CheckIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>文本长度适中（{result.chars} 字），适合深度阅读和关键词提取</span>
                  </div>
                )}
                {result.chars >= 2000 && (
                  <div className="flex items-start gap-1.5 p-2 bg-violet-50 text-violet-700 rounded-lg border border-violet-100">
                    <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>较长文本（{result.chars} 字），建议分段或做摘要处理</span>
                  </div>
                )}
                {result.sentiment > 0.3 && (
                  <div className="flex items-start gap-1.5 p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                    <Smile className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>文本整体基调积极正面，情感表达较明显</span>
                  </div>
                )}
                {result.sentiment <= 0.3 && result.sentiment > -0.1 && (
                  <div className="flex items-start gap-1.5 p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">
                    <Meh className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>文本语气较为中性客观，信息性较强</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 shadow-lg">
              <h3 className="text-xs font-bold mb-2.5 text-slate-100 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> 说明
              </h3>
              <p className="text-[10px] leading-relaxed opacity-80">
                本分析工具提供：字符/词/句/段统计、简单情感分析（基于关键词匹配）、双字词汇频率统计作为关键词提取。结果仅供参考，若需专业级别 NLP 分析请接入专用模型。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
