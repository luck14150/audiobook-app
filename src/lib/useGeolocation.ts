import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWeather, type WeatherResult, type GeoResult, reverseGeocode } from './weather'

export type GeoLocation = {
  lat: number
  lon: number
  accuracy: number
  fetchedAt: number
  city?: string
  country?: string
}

export type GeoStatus =
  | 'idle'
  | 'requesting'
  | 'success'
  | 'denied'
  | 'unsupported'
  | 'error'

/**
 * 封装浏览器 geolocation + 天气查询
 * - 使用 watchPosition 进行实时定位
 * - 可选择高精度模式（高耗电）或省电模式
 * - 自动调用 Open-Meteo 获取当前位置天气
 */
export function useGeolocation(options?: { auto?: boolean; highAccuracy?: boolean }) {
  const { auto = false, highAccuracy = false } = options || {}
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false)
  const watcherRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return
    if (watcherRef.current != null) {
      navigator.geolocation.clearWatch(watcherRef.current)
      watcherRef.current = null
    }
  }, [])

  const refreshWeather = useCallback(async (loc: GeoLocation) => {
    setWeatherLoading(true)
    try {
      const w = await fetchWeather(loc.lat, loc.lon)
      setWeather(w)
      setErrorMsg(null)
    } catch (e: any) {
      setWeather(null)
      setErrorMsg(e?.message || '天气服务不可用')
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  const request = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported')
      setErrorMsg('当前浏览器/环境不支持定位功能')
      return
    }
    setStatus('requesting')
    setErrorMsg(null)
    stop()
    watcherRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = pos.coords
        const loc: GeoLocation = {
          lat: coords.latitude,
          lon: coords.longitude,
          accuracy: coords.accuracy,
          fetchedAt: Date.now(),
        }
        // 顺便取一次城市名（一次即可）
        if (!loc.city) {
          try {
            const g = await reverseGeocode(loc.lat, loc.lon)
            loc.city = g.city
            loc.country = g.country
          } catch { /* ignore */ }
        }
        setLocation(loc)
        setStatus('success')
        // 首次定位成功后才刷新天气，后续 watch 不再自动刷新天气（避免频繁请求）
        setWeatherLoading(true)
        try {
          const w = await fetchWeather(loc.lat, loc.lon)
          setWeather(w)
          setErrorMsg(null)
        } catch (e: any) {
          setErrorMsg(e?.message || '天气服务不可用')
        } finally {
          setWeatherLoading(false)
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setErrorMsg('用户拒绝了定位授权，请在浏览器设置中允许定位后重试')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('error')
          setErrorMsg('当前位置信息不可用')
        } else {
          setStatus('error')
          setErrorMsg(err.message || '定位失败')
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 60 * 1000, // 允许使用 1 分钟内的缓存数据
      }
    )
  }, [highAccuracy, stop])

  // 组件卸载时清理
  useEffect(() => {
    return () => stop()
  }, [stop])

  // 可选：自动请求定位
  useEffect(() => {
    if (auto && status === 'idle') {
      request()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto])

  return {
    status,
    errorMsg,
    location,
    weather,
    weatherLoading,
    request,
    stop,
    refreshWeather: () => (location ? refreshWeather(location) : request()),
  }
}
