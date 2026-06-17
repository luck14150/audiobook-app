import React, { useState, useRef, useEffect } from 'react'
import { Palette, Sparkles, Download, Wand2, RefreshCw, Check } from 'lucide-react'

const STYLES = [
  { id: 'aurora', name: '极光梦境', from: '#FF6B9D', to: '#C471ED', hint: '柔和梦幻渐变' },
  { id: 'sunset', name: '日落海岸', from: '#f093fb', to: '#f5576c', hint: '暖色调波浪' },
  { id: 'ocean', name: '深海蓝调', from: '#4facfe', to: '#00f2fe', hint: '清凉海洋色系' },
  { id: 'forest', name: '森林秘境', from: '#43e97b', to: '#38f9d7', hint: '清新自然绿色' },
  { id: 'circuit', name: '赛博电路', from: '#a8edea', to: '#fed6e3', hint: '未来科技感' },
  { id: 'nebula', name: '星云幻想', from: '#667eea', to: '#764ba2', hint: '深空紫色调' },
  { id: 'candy', name: '糖果色彩', from: '#ffecd2', to: '#fcb69f', hint: '甜美温暖渐变' },
  { id: 'gold', name: '黄金时代', from: '#f6d365', to: '#fda085', hint: '金橙色温暖感' },
]

const SHAPES = ['circles', 'waves', 'triangles', 'grid', 'splatter']

export default function ImageGenPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [prompt, setPrompt] = useState('神秘森林中的极光，柔和的光芒，奇幻氛围')
  const [styleId, setStyleId] = useState('aurora')
  const [seed, setSeed] = useState(Date.now())
  const [shape, setShape] = useState('circles')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generate()
  }, [styleId, seed, shape])

  const generate = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const style = STYLES.find(s => s.id === styleId) || STYLES[0]

    // bg gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, style.from)
    grad.addColorStop(1, style.to)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // pseudo random seeded
    let s = seed
    const rand = () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }

    // overlay circles
    ctx.save()
    if (shape === 'circles') {
      for (let i = 0; i < 40; i++) {
        const x = rand() * canvas.width
        const y = rand() * canvas.height
        const r = 20 + rand() * 180
        ctx.globalAlpha = 0.08 + rand() * 0.18
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
        rg.addColorStop(0, 'rgba(255,255,255,0.7)')
        rg.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = rg
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (shape === 'waves') {
      ctx.globalAlpha = 0.2
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      for (let wave = 0; wave < 8; wave++) {
        ctx.beginPath()
        for (let x = 0; x <= canvas.width; x += 5) {
          const y = canvas.height * (wave / 8) + Math.sin(x / 50 + wave + seed / 1000) * 30
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    } else if (shape === 'triangles') {
      for (let i = 0; i < 25; i++) {
        const x = rand() * canvas.width
        const y = rand() * canvas.height
        const size = 30 + rand() * 120
        ctx.globalAlpha = 0.1 + rand() * 0.2
        ctx.fillStyle = `hsl(${rand() * 360}, 70%, 70%)`
        ctx.beginPath()
        ctx.moveTo(x, y - size / 2)
        ctx.lineTo(x + size / 2, y + size / 2)
        ctx.lineTo(x - size / 2, y + size / 2)
        ctx.closePath()
        ctx.fill()
      }
    } else if (shape === 'grid') {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1
      for (let i = 0; i < 20; i++) {
        ctx.beginPath()
        ctx.moveTo((canvas.width / 20) * i, 0)
        ctx.lineTo((canvas.width / 20) * i, canvas.height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, (canvas.height / 20) * i)
        ctx.lineTo(canvas.width, (canvas.height / 20) * i)
        ctx.stroke()
      }
    } else if (shape === 'splatter') {
      for (let i = 0; i < 100; i++) {
        const x = rand() * canvas.width
        const y = rand() * canvas.height
        const r = 2 + rand() * 20
        ctx.globalAlpha = 0.15 + rand() * 0.25
        ctx.fillStyle = `hsl(${rand() * 60 + 200}, 80%, 80%)`
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()

    // central glowing shape with prompt hash
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    ctx.save()
    const rg2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180)
    rg2.addColorStop(0, 'rgba(255,255,255,0.55)')
    rg2.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = rg2
    ctx.beginPath()
    ctx.arc(cx, cy, 180, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // text overlay
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 8
    ctx.fillText(style.name, cx, cy - 10)
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    const txt = prompt.length > 36 ? prompt.substring(0, 36) + '...' : prompt
    ctx.fillText(txt, cx, cy + 14)
    ctx.font = '10px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('seed: ' + seed, cx, canvas.height - 20)
    ctx.restore()

    // noise
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    let ns = seed
    for (let i = 0; i < data.length; i += 4) {
      ns = (ns * 9301 + 49297) % 233280
      const n = (ns / 233280 - 0.5) * 12
      data[i] = Math.min(255, Math.max(0, data[i] + n))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n))
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'datamind-art-' + seed + '.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-slate-50 to-indigo-50 p-3 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">AI 图像生成</h1>
            <p className="text-xs text-muted">基于 Canvas 的创意艺术生成器 · 多种风格与形状</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-4 md:gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-theme p-3 md:p-5">
            <div className="rounded-xl overflow-hidden bg-slate-900 shadow-inner">
              <canvas ref={canvasRef} width={600} height={450} className="w-full h-auto block" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button onClick={() => setSeed(Date.now())} className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-medium transition-colors">
                <Wand2 className="w-3.5 h-3.5" /> 新种子
              </button>
              <button onClick={generate} className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-medium transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> 重新生成
              </button>
              <button onClick={download} className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-medium transition-colors">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />} {copied ? '已下载' : '下载 PNG'}
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
                <Sparkles className="w-3 h-3" /> 创作提示词
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                className="w-full bg-white border border-theme rounded-lg p-2.5 text-sm text-primary outline-none focus:border-indigo-400 resize-none"
                placeholder="描述你想生成的图像..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-rose-500" /> 艺术风格
              </h3>
              <div className="space-y-1.5">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyleId(s.id)}
                    className={'w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ' + (styleId === s.id ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent')}
                  >
                    <div className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, ' + s.from + ', ' + s.to + ')' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-primary">{s.name}</div>
                      <div className="text-[10px] text-muted">{s.hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-theme p-4">
              <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 形状元素
              </h3>
              <div className="grid grid-cols-5 gap-1.5">
                {SHAPES.map(sh => (
                  <button
                    key={sh}
                    onClick={() => setShape(sh)}
                    className={'py-1.5 rounded-lg text-[10px] transition-all ' + (shape === sh ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-100 text-secondary hover:bg-slate-200')}
                  >
                    {sh === 'circles' ? '圆点' : sh === 'waves' ? '波浪' : sh === 'triangles' ? '三角' : sh === 'grid' ? '网格' : '泼墨'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-4 text-white shadow-lg">
              <h3 className="text-xs font-bold mb-2">💡 创作技巧</h3>
              <ul className="text-[10px] space-y-1 opacity-90">
                <li>· 描述性语言能影响文字层内容</li>
                <li>· 尝试不同的风格+形状组合</li>
                <li>· 每次点击"新种子"会有惊喜</li>
                <li>· 支持下载为高清 PNG 图片</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
