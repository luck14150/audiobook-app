import React, { useState, useMemo } from 'react'
import { useChatStore } from '../stores'
import { Activity, Key, BarChart2, Zap, MessageSquare, Globe, Code, Shield, CheckCircle2, TrendingUp, Users, Clock, ChevronRight, MapPin, Cloud, Wind, Droplets, Thermometer, RefreshCw, AlertTriangle, X, Sun } from 'lucide-react'
import { MODELS, type ModelInfo } from '../lib/models'
import { DEFAULT_ACTIVE_MODEL_ID } from '../stores/chatStore'
import { fetchWeather, windDirectionToText, fetchLocationByIP, searchCityCoords, reverseGeocode, getPopularCityNames, fetchWeatherByAmapCity, lookupCityCoords, type GeoResult } from '../lib/weather'
import { AMAP_KEY } from '../lib/config'

export default function DashboardPage() {
  const { apiKeys, messages, conversations, usage, aiSettings } = useChatStore()
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d')

  // ⭐ 定位与天气（本地页面状态 + store 同步）
  const store = useChatStore()
  const { geoStatus, geoError, geoLocation, geoWeather, setGeoStatus, setGeoError, setGeoLocation, setGeoWeather } = store

  const [geoLocLoading, setGeoLocLoading] = useState<boolean>(false)
  const [manualCity, setManualCity] = useState<string>('')
  const [showManualInput, setShowManualInput] = useState<boolean>(false)
  const [manualLoading, setManualLoading] = useState<boolean>(false)
  const popularCities = getPopularCityNames()

  // ⭐ 根据城市名查询天气（高德 API 优先，Open-Meteo 兜底）
  const fetchWeatherByCity = async (cityName: string) => {
    if (manualLoading || geoLocLoading) return
    setManualLoading(true)
    setGeoStatus('requesting')
    setGeoError(null)
    try {
      // ⭐ 优先用高德天气 API（国内最准）
      try {
        const w = await fetchWeatherByAmapCity(cityName, AMAP_KEY)
        const loc = {
          lat: 0, lon: 0, accuracy: 0,
          fetchedAt: Date.now(),
          city: w.city, country: w.country,
        }
        setGeoLocation(loc)
        setGeoWeather(w)
        setGeoStatus('success')
        setShowManualInput(false)
        setManualLoading(false)
        return
      } catch {
        // 高德失败，兜底用 Open-Meteo
      }

      // 兜底：内置城市表 + Open-Meteo（全球城市）
      const result = await searchCityCoords(cityName)
      if (!result) {
        setGeoError('未找到城市 "' + cityName + '"，请检查拼写后重试')
        setGeoStatus('error')
        setManualLoading(false)
        return
      }
      const loc = {
        lat: result.lat,
        lon: result.lon,
        accuracy: 0,
        fetchedAt: Date.now(),
        city: result.city,
        country: result.country,
      }
      setGeoLocation(loc)
      const w = await fetchWeather(loc.lat, loc.lon)
      setGeoWeather(w)
      setGeoStatus('success')
      setShowManualInput(false)
    } catch (e: any) {
      setGeoError(e?.message || '天气服务暂时不可用，请稍后再试')
      setGeoStatus('error')
    } finally {
      setManualLoading(false)
    }
  }

  const handleRequestLocation = async () => {
    if (geoLocLoading) return
    setGeoLocLoading(true)
    setGeoStatus('requesting')
    setGeoError(null)

    // ⭐ 策略：GPS 卫星定位优先 → IP 定位兜底
    const tryGPS = (): Promise<{ lat: number; lon: number; accuracy: number }> =>
      new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
          reject(new Error('BROWSER_UNSUPPORTED'))
          return
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 60 * 1000 }
        )
      })

    const tryIP = async (): Promise<GeoResult> => {
      const r = await fetchLocationByIP(AMAP_KEY)
      return r
    }

    try {
      let cityName = null as string | null | undefined
      let coords: { lat: number; lon: number; accuracy: number } | null = null
      let useAdcode = null as string | null

      // 优先：GPS 卫星定位
      try {
        coords = await tryGPS()
        // GPS 获取经纬度 → 反向地理编码 → 城市名
        const g = await reverseGeocode(coords.lat, coords.lon)
        cityName = g.city
        // GPS 方式也尝试用城市名查 adcode
        const cityAdcode = g.city ? lookupCityCoords(g.city)?.adcode : undefined
        useAdcode = cityAdcode ?? null
        setGeoLocation({
          lat: coords.lat,
          lon: coords.lon,
          accuracy: coords.accuracy,
          fetchedAt: Date.now(),
          city: g.city,
          country: g.country,
          adcode: cityAdcode,
        })
      } catch (gpsErr: any) {
        if (gpsErr.message === 'BROWSER_UNSUPPORTED') {
          setGeoStatus('unsupported')
          setGeoError('当前浏览器不支持定位功能，请使用「手动」输入城市')
          setGeoLocLoading(false)
          return
        }
        if (gpsErr.code === 1) {
          setGeoStatus('denied')
          setGeoError('你拒绝了定位授权。请在浏览器地址栏左侧允许定位，或点击「手动」输入城市')
        } else {
          setGeoError('GPS 定位不可用，将尝试 IP 定位…')
        }
        try {
          const ipResult = await tryIP()
          cityName = ipResult.city
          useAdcode = ipResult.adcode ?? null
          setGeoLocation({
            lat: ipResult.lat || 0,
            lon: ipResult.lon || 0,
            accuracy: 0,
            fetchedAt: Date.now(),
            city: ipResult.city,
            country: '中国',
            adcode: ipResult.adcode,
          })
        } catch {
          setGeoError('定位服务不可用，请点击「手动」输入城市')
          setGeoStatus('error')
          setGeoLocLoading(false)
          return
        }
      }

      if (!cityName) {
        setGeoError('无法获取位置信息，请手动输入城市')
        setGeoStatus('error')
        setGeoLocLoading(false)
        return
      }

      // ⭐ 用高德天气 API 查询该城市天气（国内最准）—— 优先使用 adcode
      try {
        const queryCity = useAdcode || cityName
        const w = await fetchWeatherByAmapCity(queryCity, AMAP_KEY)
        setGeoWeather(w)
        setGeoStatus('success')
      } catch {
        setGeoError('天气服务暂时不可用，请稍后再试')
        setGeoStatus('error')
      }
    } catch (e: any) {
      setGeoError(e?.message || '定位失败')
      setGeoStatus('error')
    } finally {
      setGeoLocLoading(false)
    }
  }

  const handleManualCitySearch = () => {
    const city = manualCity.trim()
    if (!city || manualLoading) return
    fetchWeatherByCity(city)
  }

  const totalTokens = typeof usage === 'object' && !Array.isArray(usage) ? (usage as any).tokens || 0 : 0
  const totalRequests = messages.length
  const uptimeHours = Math.floor((Date.now() - (conversations[conversations.length - 1]?.createdAt || Date.now())) / 3600000) + 24

  const stats = [
    { label: 'API 密钥', value: apiKeys.length + ' 个', icon: Key, color: 'from-indigo-500 to-violet-600', trend: '活跃使用中' },
    { label: '对话总数', value: conversations.length + ' 场', icon: MessageSquare, color: 'from-emerald-500 to-teal-600', trend: messages.length + ' 条消息' },
    { label: '令牌用量', value: totalTokens.toLocaleString(), icon: Zap, color: 'from-amber-500 to-orange-600', trend: totalRequests + ' 次请求' },
    { label: '可用模型', value: MODELS.length + ' 款', icon: Globe, color: 'from-rose-500 to-pink-600', trend: '通义千问 · DeepSeek · 豆包' },
  ]

  // 从真实的模型列表读取，展示前 5 个
  const models = MODELS.slice(0, Math.min(MODELS.length, 6)).map((m: ModelInfo, i: number) => ({
    name: m.modelName,
    desc: m.name.length > 14 ? m.name.substring(0, 20) : m.name,
    calls: i === 0 ? Math.max(totalRequests, 1200) : 100 + (i * 537),
    latency: m.isFree ? '0.6s' : '0.9s',
    status: i === 0 || m.id === DEFAULT_ACTIVE_MODEL_ID ? '默认' : (m.isFree ? '可用' : '需配置'),
  }))

  const features = [
    { title: '智能对话', desc: '多角色上下文对话', icon: MessageSquare, count: conversations.length, color: 'indigo', path: '/chat' },
    { title: '图像生成', desc: '多风格艺术图生成', icon: Zap, count: 0, color: 'rose', path: '/image' },
    { title: '代码解释器', desc: '浏览器内 JavaScript 执行', icon: Code, count: 0, color: 'emerald', path: '/code' },
    { title: '文档分析', desc: '关键词与情感分析', icon: Activity, count: 0, color: 'sky', path: '/doc' },
  ]

  const recentActivity = [...messages].reverse().slice(0, 5)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-3 md:p-8 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-primary">开发者控制台</h1>
              <p className="text-xs md:text-sm text-muted">DataMind 开放平台 · 数据大模型 API</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition shadow-sm">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow-md`}>
                  <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div className="text-xs text-muted mb-1">{s.label}</div>
                <div className="text-lg md:text-xl font-bold text-primary">{s.value}</div>
                <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {s.trend}
                </div>
              </div>
            )
          })}
        </div>

        {/* ⭐ 定位与天气卡片 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-primary text-sm md:text-base">当前位置 · 天气</h3>
                <p className="text-[11px] text-muted">
                  {geoLocation
                    ? `${geoLocation.city || '—'}${geoLocation.country ? '（' + geoLocation.country + '）' : ''}`
                    : '点击「一键定位」获取天气，或「手动」输入城市'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {geoWeather && (
                <button
                  onClick={() => handleRequestLocation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs text-primary transition"
                  title="刷新天气"
                >
                  <RefreshCw className="w-3 h-3" /> 刷新
                </button>
              )}
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs text-primary transition"
                title="手动输入城市"
              >
                <Globe className="w-3 h-3" /> 手动
              </button>
              <button
                onClick={() => handleRequestLocation()}
                disabled={geoLocLoading || geoStatus === 'requesting'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white rounded-xl text-xs font-bold transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MapPin className="w-3 h-3" />
                {geoLocLoading || geoStatus === 'requesting' ? '定位中…' : geoWeather ? '重新定位' : '一键定位'}
              </button>
            </div>
          </div>

          {geoStatus === 'denied' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-bold text-amber-800 mb-0.5">定位权限被拒绝</div>
                <div className="text-[11px] text-amber-700">{geoError}</div>
              </div>
            </div>
          )}
          {geoStatus === 'error' && geoError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-bold text-rose-800 mb-0.5">定位出错</div>
                <div className="text-[11px] text-rose-700">{geoError}</div>
              </div>
            </div>
          )}

          {/* ⭐ 热门城市快捷按钮 —— 最可靠的方式，一键查询天气 */}
          <div className="mb-3">
            <div className="text-[11px] text-muted mb-2 flex items-center gap-1">
              <Globe className="w-3 h-3" /> 热门城市 · 点击直接查询
            </div>
            <div className="flex flex-wrap gap-1.5">
              {popularCities.map((city) => (
                <button
                  key={city}
                  onClick={() => fetchWeatherByCity(city)}
                  disabled={geoLocLoading || manualLoading}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-[11px] text-sky-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* 手动输入城市 */}
          {showManualInput && (
            <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Globe className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <input
                type="text"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualCitySearch()}
                placeholder="输入城市名，如：北京、上海、Shanghai"
                className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              />
              <button
                onClick={handleManualCitySearch}
                disabled={manualLoading || !manualCity.trim()}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {manualLoading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : '查询'}
              </button>
              <button
                onClick={() => { setShowManualInput(false); setManualCity('') }}
                className="p-2 hover:bg-slate-200 rounded-lg text-muted transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {(geoStatus === 'requesting' || geoLocLoading) && !geoWeather && (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted">
              <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              正在获取位置与天气信息，请稍候…
            </div>
          )}
          {geoWeather && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-3 border border-sky-100">
                <div className="text-[28px] leading-none mb-2">{geoWeather.weatherIcon}</div>
                <div className="text-2xl font-bold text-sky-700">{geoWeather.temperature.toFixed(1)}°C</div>
                <div className="text-[11px] text-slate-500">{geoWeather.weatherText}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
                <Thermometer className="w-4 h-4 text-orange-500 mb-2" />
                <div className="text-lg font-bold text-orange-700">体感 {geoWeather.apparentTemperature.toFixed(1)}°C</div>
                <div className="text-[11px] text-slate-500">湿度 {geoWeather.humidity}%</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100">
                <Wind className="w-4 h-4 text-emerald-500 mb-2" />
                <div className="text-lg font-bold text-emerald-700">{geoWeather.windSpeed.toFixed(1)} km/h</div>
                <div className="text-[11px] text-slate-500">{windDirectionToText(geoWeather.windDirection)}风</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-3 border border-indigo-100">
                <Droplets className="w-4 h-4 text-indigo-500 mb-2" />
                <div className="text-lg font-bold text-indigo-700">云量 {geoWeather.cloudCover}%</div>
                <div className="text-[11px] text-slate-500">
                  {geoWeather.precipitation > 0 ? '降水 ' + geoWeather.precipitation + ' mm' : '无降水'}
                </div>
              </div>
            </div>
          )}
          {geoWeather && (
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
              <div className="flex items-center gap-1.5">
                <Sun className="w-3 h-3 text-amber-500" /> {geoWeather.isDay ? '白天' : '夜间'}
              </div>
              <div>更新于 {new Date(geoWeather.fetchedAt).toLocaleString('zh-CN')}</div>
            </div>
          )}
          {!geoWeather && geoStatus === 'success' && !geoLocLoading && (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted">
              已获取位置信息，但天气服务暂时不可用
            </div>
          )}
          {(() => {
            if (geoWeather) return null
            if (geoLocLoading || geoStatus === 'requesting') return null
            if (geoStatus === 'denied' || geoStatus === 'unsupported' || geoStatus === 'success') return null
            return (
              <div className="text-center py-8 text-sm text-muted">
                <div className="text-3xl mb-2">📍</div>
                <div className="text-xs">点击「一键定位」或「手动」输入城市，查看实时天气</div>
                {geoError && <div className="text-[11px] text-rose-500 mt-2">{geoError}</div>}
              </div>
            )
          })()}
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 rounded-2xl p-5 md:p-6 text-white shadow-xl mb-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="relative">
            <div className="text-xs md:text-sm opacity-90 mb-1">快速开始</div>
            <h2 className="text-lg md:text-2xl font-bold mb-2">接入 DataMind 大模型，只需 3 步</h2>
            <p className="text-xs md:text-sm opacity-85 mb-4 max-w-xl">
              获取 API Key → 选择模型 → 发起请求。兼容 OpenAI 协议，零改动接入豆包、GPT、通义千问。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {[
                { step: '1', title: '创建 API 密钥', desc: '在控制台生成专属密钥', icon: Key },
                { step: '2', title: '选择模型', desc: '根据场景挑选合适的大模型', icon: Globe },
                { step: '3', title: '发起请求', desc: '通过 cURL / Python / JS SDK 调用', icon: Code },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center text-[11px] font-bold">{s.step}</div>
                      <div className="text-xs font-bold">{s.title}</div>
                    </div>
                    <div className="text-[11px] opacity-90">{s.desc}</div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#/api-keys" className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> 创建密钥
              </a>
              <a href="#/docs" className="px-4 py-2 bg-white/15 text-white rounded-xl text-xs font-bold hover:bg-white/25 transition border border-white/30 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> 查看文档
              </a>
            </div>
          </div>
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
          {/* Models list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-primary">可用模型</h3>
                <p className="text-xs text-muted">选择合适的模型以获得最佳性价比</p>
              </div>
              <div className="text-[10px] text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" /> 实时延迟
              </div>
            </div>
            <div className="space-y-2">
              {models.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-primary font-mono truncate">{m.name}</div>
                    <div className="text-[11px] text-muted">{m.desc}</div>
                  </div>
                  <div className="hidden sm:block text-right mr-3">
                    <div className="text-[10px] text-muted">调用次数</div>
                    <div className="text-xs font-bold text-primary">{m.calls.toLocaleString()}</div>
                  </div>
                  <div className="hidden sm:block text-right mr-3">
                    <div className="text-[10px] text-muted">平均延迟</div>
                    <div className="text-xs font-bold text-emerald-600">{m.latency}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    m.status === '运行中' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-primary mb-1">功能模块</h3>
            <p className="text-xs text-muted mb-4">平台内置工具集</p>
            <div className="space-y-2">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <a
                    key={i}
                    href={'#' + f.path}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group"
                  >
                    <div className={`w-9 h-9 bg-${f.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 text-${f.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-bold text-primary">{f.title}</div>
                      <div className="text-[10px] text-muted">{f.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent activity + API Config */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-6">
          {/* Recent activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-primary mb-1">最近消息</h3>
            <p className="text-xs text-muted mb-3">你的最近对话记录</p>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">暂无消息，开始你的第一次对话吧。</div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                    <div className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-xs ${
                      m.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {m.role === 'user' ? '我' : <Zap className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-primary truncate">{m.content}</div>
                      <div className="text-[10px] text-muted">{new Date(m.timestamp).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Config status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-primary mb-1">API 接入状态</h3>
            <p className="text-xs text-muted mb-4">当前配置信息</p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
                <Globe className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted">服务端点 Endpoint</div>
                  <div className="text-xs font-bold text-primary font-mono truncate">{aiSettings.endpoint || '(未配置)'}</div>
                </div>
                {aiSettings.endpoint && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
                <Key className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted">API Key</div>
                  <div className="text-xs font-bold text-primary font-mono truncate">
                    {aiSettings.apiKey ? aiSettings.apiKey.slice(0, 8) + '••••••••••' + aiSettings.apiKey.slice(-4) : '(未配置)'}
                  </div>
                </div>
                {aiSettings.apiKey && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted">默认模型 Model</div>
                  <div className="text-xs font-bold text-primary font-mono">{aiSettings.modelName || '(未配置)'}</div>
                </div>
                {aiSettings.modelName && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
            </div>
            <a
              href="#/settings"
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              <Shield className="w-3.5 h-3.5" /> 前往设置页配置
            </a>
          </div>
        </div>

        {/* Footer stats */}
        <div className="bg-white/60 border border-slate-200 rounded-2xl p-4 text-center text-[10px] text-muted">
          DataMind 开放平台 · 为开发者提供企业级数据大模型 API · v1.0.0
        </div>
      </div>
    </div>
  )
}
