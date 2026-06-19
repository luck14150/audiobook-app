// 天气服务：采用高德地图 API（国内最权威的定位+天气服务）
// 定位：高德 IP 定位（国内最准）
// 天气：高德天气预报 API
// 文档：https://lbs.amap.com/api/webservice/guide/api/weather

export type GeoResult = {
  lat: number
  lon: number
  city?: string
  country?: string
  timeZone?: string
}

export type WeatherResult = {
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  weatherText: string
  weatherIcon: string
  isDay: boolean
  precipitation: number
  cloudCover: number
  city: string
  country: string
  fetchedAt: number
}

// ⭐ 内置热门城市坐标表（完全免费，零延迟）
export const CITY_COORDS: Record<string, { lat: number; lon: number; country: string }> = {
  '北京': { lat: 39.9042, lon: 116.4074, country: '中国' },
  '北京市': { lat: 39.9042, lon: 116.4074, country: '中国' },
  '上海': { lat: 31.2304, lon: 121.4737, country: '中国' },
  '上海市': { lat: 31.2304, lon: 121.4737, country: '中国' },
  '天津': { lat: 39.3434, lon: 117.3616, country: '中国' },
  '天津市': { lat: 39.3434, lon: 117.3616, country: '中国' },
  '重庆': { lat: 29.5630, lon: 106.5516, country: '中国' },
  '重庆市': { lat: 29.5630, lon: 106.5516, country: '中国' },
  '深圳': { lat: 22.5431, lon: 114.0579, country: '中国' },
  '深圳市': { lat: 22.5431, lon: 114.0579, country: '中国' },
  '广州': { lat: 23.1291, lon: 113.2644, country: '中国' },
  '广州市': { lat: 23.1291, lon: 113.2644, country: '中国' },
  '东莞': { lat: 23.0207, lon: 113.7518, country: '中国' },
  '佛山': { lat: 23.0218, lon: 113.1219, country: '中国' },
  '珠海': { lat: 22.2707, lon: 113.5767, country: '中国' },
  '中山': { lat: 22.5145, lon: 113.3923, country: '中国' },
  '惠州': { lat: 23.1117, lon: 114.4161, country: '中国' },
  '南京': { lat: 32.0603, lon: 118.7969, country: '中国' },
  '南京市': { lat: 32.0603, lon: 118.7969, country: '中国' },
  '苏州': { lat: 31.2990, lon: 120.5853, country: '中国' },
  '无锡': { lat: 31.4912, lon: 120.3124, country: '中国' },
  '常州': { lat: 31.8107, lon: 119.9740, country: '中国' },
  '扬州': { lat: 32.3943, lon: 119.4128, country: '中国' },
  '南通': { lat: 31.9802, lon: 120.8946, country: '中国' },
  '杭州': { lat: 30.2741, lon: 120.1551, country: '中国' },
  '杭州市': { lat: 30.2741, lon: 120.1551, country: '中国' },
  '宁波': { lat: 29.8683, lon: 121.5440, country: '中国' },
  '温州': { lat: 28.0000, lon: 120.6720, country: '中国' },
  '金华': { lat: 29.0782, lon: 119.6474, country: '中国' },
  '绍兴': { lat: 30.0300, lon: 120.5800, country: '中国' },
  '成都': { lat: 30.5728, lon: 104.0668, country: '中国' },
  '成都市': { lat: 30.5728, lon: 104.0668, country: '中国' },
  '绵阳': { lat: 31.4642, lon: 104.6827, country: '中国' },
  '武汉': { lat: 30.5928, lon: 114.3055, country: '中国' },
  '武汉市': { lat: 30.5928, lon: 114.3055, country: '中国' },
  '长沙': { lat: 28.2282, lon: 112.9388, country: '中国' },
  '青岛': { lat: 36.0671, lon: 120.3826, country: '中国' },
  '济南': { lat: 36.6512, lon: 117.1201, country: '中国' },
  '烟台': { lat: 37.4638, lon: 121.4480, country: '中国' },
  '厦门': { lat: 24.4798, lon: 118.0894, country: '中国' },
  '福州': { lat: 26.0745, lon: 119.2965, country: '中国' },
  '西安': { lat: 34.3416, lon: 108.9398, country: '中国' },
  '西安巿': { lat: 34.3416, lon: 108.9398, country: '中国' },
  '郑州': { lat: 34.7466, lon: 113.6254, country: '中国' },
  '合肥': { lat: 31.8206, lon: 117.2272, country: '中国' },
  '南昌': { lat: 28.6820, lon: 115.8579, country: '中国' },
  '昆明': { lat: 25.0389, lon: 102.7183, country: '中国' },
  '贵阳': { lat: 26.6470, lon: 106.6302, country: '中国' },
  '南宁': { lat: 22.8170, lon: 108.3665, country: '中国' },
  '海口': { lat: 20.0174, lon: 110.3492, country: '中国' },
  '三亚': { lat: 18.2528, lon: 109.5119, country: '中国' },
  '兰州': { lat: 36.0611, lon: 103.8343, country: '中国' },
  '银川': { lat: 38.4872, lon: 106.2309, country: '中国' },
  '西宁': { lat: 36.6171, lon: 101.7778, country: '中国' },
  '乌鲁木齐': { lat: 43.8256, lon: 87.6168, country: '中国' },
  '拉萨': { lat: 29.7027, lon: 91.1283, country: '中国' },
  '呼和浩特': { lat: 40.8428, lon: 111.7519, country: '中国' },
  '哈尔滨': { lat: 45.8038, lon: 126.5349, country: '中国' },
  '长春': { lat: 43.8171, lon: 125.3235, country: '中国' },
  '沈阳': { lat: 41.8057, lon: 123.4315, country: '中国' },
  '大连': { lat: 38.9140, lon: 121.6147, country: '中国' },
  '石家庄': { lat: 38.0428, lon: 114.5149, country: '中国' },
  '太原': { lat: 37.8706, lon: 112.5489, country: '中国' },
  '洛阳': { lat: 34.6197, lon: 112.4540, country: '中国' },
  '香港': { lat: 22.3193, lon: 114.1694, country: '中国' },
  '澳门': { lat: 22.1987, lon: 113.5439, country: '中国' },
  '台北': { lat: 25.0330, lon: 121.5654, country: '中国' },
  '东京': { lat: 35.6762, lon: 139.6503, country: '日本' },
  '首尔': { lat: 37.5665, lon: 126.9780, country: '韩国' },
  '新加坡': { lat: 1.3521, lon: 103.8198, country: '新加坡' },
  '曼谷': { lat: 13.7563, lon: 100.5018, country: '泰国' },
  '吉隆坡': { lat: 3.1390, lon: 101.6869, country: '马来西亚' },
  '雅加达': { lat: -6.2088, lon: 106.8456, country: '印度尼西亚' },
  '胡志明': { lat: 10.8231, lon: 106.6297, country: '越南' },
  '河内': { lat: 21.0278, lon: 105.8342, country: '越南' },
  '孟买': { lat: 19.0760, lon: 72.8777, country: '印度' },
  '新德里': { lat: 28.6139, lon: 77.2090, country: '印度' },
  '迪拜': { lat: 25.2048, lon: 55.2708, country: '阿联酋' },
  '伦敦': { lat: 51.5074, lon: -0.1278, country: '英国' },
  '巴黎': { lat: 48.8566, lon: 2.3522, country: '法国' },
  '柏林': { lat: 52.5200, lon: 13.4050, country: '德国' },
  '罗马': { lat: 41.9028, lon: 12.4964, country: '意大利' },
  '马德里': { lat: 40.4168, lon: -3.7038, country: '西班牙' },
  '莫斯科': { lat: 55.7558, lon: 37.6173, country: '俄罗斯' },
  '纽约': { lat: 40.7128, lon: -74.0060, country: '美国' },
  '洛杉矶': { lat: 34.0522, lon: -118.2437, country: '美国' },
  '旧金山': { lat: 37.7749, lon: -122.4194, country: '美国' },
  '芝加哥': { lat: 41.8781, lon: -87.6298, country: '美国' },
  '华盛顿': { lat: 38.9072, lon: -77.0369, country: '美国' },
  '多伦多': { lat: 43.6532, lon: -79.3832, country: '加拿大' },
  '温哥华': { lat: 49.2827, lon: -123.1207, country: '加拿大' },
  '悉尼': { lat: -33.8688, lon: 151.2093, country: '澳大利亚' },
  '墨尔本': { lat: -37.8136, lon: 144.9631, country: '澳大利亚' },
  '奥克兰': { lat: -36.8509, lon: 174.7645, country: '新西兰' },
  '开罗': { lat: 30.0444, lon: 31.2357, country: '埃及' },
  '开普敦': { lat: -33.9249, lon: 18.4241, country: '南非' },
  '圣保罗': { lat: -23.5505, lon: -46.6333, country: '巴西' },
  '布宜诺斯艾利斯': { lat: -34.6037, lon: -58.3816, country: '阿根廷' },
  '墨西哥城': { lat: 19.4326, lon: -99.1332, country: '墨西哥' },
  'Beijing': { lat: 39.9042, lon: 116.4074, country: 'China' },
  'Shanghai': { lat: 31.2304, lon: 121.4737, country: 'China' },
  'Shenzhen': { lat: 22.5431, lon: 114.0579, country: 'China' },
  'Guangzhou': { lat: 23.1291, lon: 113.2644, country: 'China' },
  'Hangzhou': { lat: 30.2741, lon: 120.1551, country: 'China' },
  'Chengdu': { lat: 30.5728, lon: 104.0668, country: 'China' },
  'Wuhan': { lat: 30.5928, lon: 114.3055, country: 'China' },
  "Xi'an": { lat: 34.3416, lon: 108.9398, country: 'China' },
  'Nanjing': { lat: 32.0603, lon: 118.7969, country: 'China' },
  'Suzhou': { lat: 31.2990, lon: 120.5853, country: 'China' },
  'Hong Kong': { lat: 22.3193, lon: 114.1694, country: 'China' },
  'Taipei': { lat: 25.0330, lon: 121.5654, country: 'China' },
  'Tokyo': { lat: 35.6762, lon: 139.6503, country: 'Japan' },
  'Seoul': { lat: 37.5665, lon: 126.9780, country: 'South Korea' },
  'Singapore': { lat: 1.3521, lon: 103.8198, country: 'Singapore' },
  'Bangkok': { lat: 13.7563, lon: 100.5018, country: 'Thailand' },
  'London': { lat: 51.5074, lon: -0.1278, country: 'United Kingdom' },
  'Paris': { lat: 48.8566, lon: 2.3522, country: 'France' },
  'Berlin': { lat: 52.5200, lon: 13.4050, country: 'Germany' },
  'New York': { lat: 40.7128, lon: -74.0060, country: 'United States' },
  'Los Angeles': { lat: 34.0522, lon: -118.2437, country: 'United States' },
  'San Francisco': { lat: 37.7749, lon: -122.4194, country: 'United States' },
  'Dubai': { lat: 25.2048, lon: 55.2708, country: 'UAE' },
  'Moscow': { lat: 55.7558, lon: 37.6173, country: 'Russia' },
  'Sydney': { lat: -33.8688, lon: 151.2093, country: 'Australia' },
  'Melbourne': { lat: -37.8136, lon: 144.9631, country: 'Australia' },
  'Toronto': { lat: 43.6532, lon: -79.3832, country: 'Canada' },
  'Vancouver': { lat: 49.2827, lon: -123.1207, country: 'Canada' },
}

// 默认城市
export const DEFAULT_CITY: GeoResult = {
  lat: 39.9042, lon: 116.4074, city: '北京', country: '中国', timeZone: 'Asia/Shanghai',
}

/** 从内置城市表查询坐标 */
export function lookupCityCoords(cityName: string): GeoResult | null {
  if (!cityName) return null
  const key = cityName.trim()
  const result = CITY_COORDS[key] || CITY_COORDS[key.replace(/市$/, '')] || CITY_COORDS[key + '市']
  if (result) return { lat: result.lat, lon: result.lon, city: key, country: result.country }
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(name) || name.includes(key)) {
      return { lat: coords.lat, lon: coords.lon, city: name, country: coords.country }
    }
  }
  return null
}

// ============================================================
// ⭐ 高德地图 API JSONP 请求（核心，解决 CORS 跨域问题）
// 高德 Web 服务 API 不支持 CORS，必须用 JSONP 方式调用
// ============================================================

/** JSONP 请求封装（用于高德 API） */
function jsonpRequest<T = any>(url: string, timeout = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = '__amap_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2)
    const timer = setTimeout(() => {
      delete (window as any)[callbackName]
      script && script.remove()
      reject(new Error('请求超时'))
    }, timeout)
    ;(window as any)[callbackName] = (data: T) => {
      clearTimeout(timer)
      delete (window as any)[callbackName]
      script?.remove()
      resolve(data)
    }
    const script = document.createElement('script')
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName
    script.onerror = () => {
      clearTimeout(timer)
      delete (window as any)[callbackName]
      script.remove()
      reject(new Error('网络请求失败'))
    }
    document.head.appendChild(script)
  })
}

// 高德天气代码 → 文本 + 图标
const AMAP_WEATHER_CODES: Record<string, { text: string; icon: string }> = {
  '0': { text: '晴', icon: '☀️' },
  '1': { text: '晴', icon: '☀️' },
  '2': { text: '多云', icon: '⛅' },
  '3': { text: '阴', icon: '☁️' },
  '4': { text: '小雨', icon: '🌧️' },
  '5': { text: '中雨', icon: '🌧️' },
  '6': { text: '大雨', icon: '⛈️' },
  '7': { text: '雷阵雨', icon: '⛈️' },
  '8': { text: '雷阵雨', icon: '⛈️' },
  '9': { text: '小雨', icon: '🌧️' },
  '10': { text: '中雨', icon: '🌧️' },
  '11': { text: '大雨', icon: '⛈️' },
  '12': { text: '暴雨', icon: '⛈️' },
  '13': { text: '大暴雨', icon: '⛈️' },
  '14': { text: '特大暴雨', icon: '⛈️' },
  '15': { text: '小雪', icon: '🌨️' },
  '16': { text: '中雪', icon: '🌨️' },
  '17': { text: '大雪', icon: '❄️' },
  '18': { text: '暴雪', icon: '❄️' },
  '19': { text: '雨夹雪', icon: '🌨️' },
  '20': { text: '雾', icon: '🌫️' },
  '21': { text: '冻雨', icon: '🌨️' },
  '22': { text: '沙尘暴', icon: '🌪️' },
  '23': { text: '扬沙', icon: '🌫️' },
  '24': { text: '浮尘', icon: '🌫️' },
  '25': { text: '雾', icon: '🌫️' },
  '26': { text: '霾', icon: '🌫️' },
  '27': { text: '霾', icon: '🌫️' },
  '28': { text: '雾', icon: '🌫️' },
  '29': { text: '晴', icon: '☀️' },
  '30': { text: '多云', icon: '⛅' },
  '31': { text: '阴', icon: '☁️' },
}

/** 高德天气代码 → 文本+图标 */
function amapWeatherText(code: string): { text: string; icon: string } {
  return AMAP_WEATHER_CODES[code] || { text: '天气未知', icon: '🌡️' }
}

// ============================================================
// 对外 API
// ============================================================

/**
 * ⭐ 通过高德地图 IP 定位（国内最准，无需用户授权）
 * API: https://restapi.amap.com/v3/ip?key=xxx
 */
export async function fetchLocationByIP(key: string): Promise<GeoResult & { ip?: string }> {
  try {
    const data = await jsonpRequest<any>(
      `https://restapi.amap.com/v3/ip?key=${key}&output=json`
    )
    if (data.status !== '1') throw new Error('高德 IP 定位失败: ' + (data.info || '未知错误'))

    const city = data.city || '未知城市'
    const coords = lookupCityCoords(city) || lookupCityCoords(city.replace(/市$/, ''))

    return {
      lat: coords?.lat || 39.9042,
      lon: coords?.lon || 116.4074,
      city,
      country: '中国',
      timeZone: 'Asia/Shanghai',
      ip: data.ip || undefined,
    }
  } catch (e: any) {
    throw new Error('IP 定位服务不可用: ' + (e.message || '未知错误'))
  }
}

/**
 * ⭐ 通过高德地图天气 API 获取天气（国内最权威）
 * API: https://restapi.amap.com/v3/weather/weatherInfo?city=城市名&key=xxx
 */
export async function fetchWeatherByAmapCity(cityName: string, key: string): Promise<WeatherResult> {
  try {
    const data = await jsonpRequest<any>(
      `https://restapi.amap.com/v3/weather/weatherInfo?city=${encodeURIComponent(cityName)}&key=${key}&extensions=base&output=json`
    )
    if (data.status !== '1') throw new Error('高德天气失败: ' + (data.info || '未知错误'))

    const lives = data.lives
    if (!lives || lives.length === 0) throw new Error('未找到天气数据')

    const live = lives[0]
    const code = live.weather || '2'
    const { text, icon } = amapWeatherText(code)

    return {
      temperature: Number(live.temperature) || 0,
      apparentTemperature: Number(live.temperature) || 0,
      humidity: Number(live.humidity) || 0,
      windSpeed: Number(live.windspeed) || 0,
      windDirection: 0,
      weatherCode: Number(code),
      weatherText: text,
      weatherIcon: icon,
      isDay: true,
      precipitation: 0,
      cloudCover: 0,
      city: live.city || cityName,
      country: '中国',
      fetchedAt: Date.now(),
    }
  } catch (e: any) {
    throw new Error('天气服务不可用: ' + (e.message || '未知错误'))
  }
}

/**
 * 根据经纬度获取城市信息（反向地理编码）
 * 使用 Open-Meteo Geocoding API（支持 CORS）
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string; timeZone: string }> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=3&language=zh&format=json`
    const res = await fetch(url)
    if (!res.ok) return { city: '未知位置', country: '', timeZone: '' }
    const data = await res.json()
    const results = data?.results
    if (results && results.length > 0) {
      const r = results[0]
      return { city: r.name || r.admin1 || r.admin2 || '未知位置', country: r.country || '', timeZone: r.timezone || '' }
    }
    return { city: '未知位置', country: '', timeZone: '' }
  } catch {
    return { city: '未知位置', country: '', timeZone: '' }
  }
}

/**
 * 根据城市名搜索经纬度
 * 先查内置表（最快）→ 再查 Open-Meteo 搜索 API（全球城市）
 */
export async function searchCityCoords(cityName: string): Promise<GeoResult | null> {
  if (!cityName || !cityName.trim()) return null
  const name = cityName.trim()
  const localResult = lookupCityCoords(name)
  if (localResult) return localResult
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=zh&format=json`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const results = data?.results
    if (!results || results.length === 0) return null
    const r = results[0]
    return { lat: r.latitude, lon: r.longitude, city: r.name, country: r.country || '', timeZone: r.timezone || '' }
  } catch {
    return null
  }
}

/**
 * 根据经纬度获取天气（Open-Meteo，国际/非高德覆盖区域使用）
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherResult> {
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day',
    timezone: 'auto', wind_speed_unit: 'kmh', precipitation_unit: 'mm',
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('天气服务暂时不可用 (' + res.status + ')')
  const data = await res.json()
  const cur = data?.current || {}
  const code: number = Number(cur.weather_code ?? 0)
  const { text, icon } = weatherCodeToText(code)
  const geo = await reverseGeocode(lat, lon)
  return {
    temperature: Number(cur.temperature_2m ?? 0),
    apparentTemperature: Number(cur.apparent_temperature ?? 0),
    humidity: Number(cur.relative_humidity_2m ?? 0),
    windSpeed: Number(cur.wind_speed_10m ?? 0),
    windDirection: Number(cur.wind_direction_10m ?? 0),
    weatherCode: code, weatherText: text, weatherIcon: icon,
    isDay: cur.is_day === 1,
    precipitation: Number(cur.precipitation ?? 0),
    cloudCover: Number(cur.cloud_cover ?? 0),
    city: geo.city, country: geo.country, fetchedAt: Date.now(),
  }
}

/** WMO 天气代码 → 中文描述 + 表情 */
export function weatherCodeToText(code: number): { text: string; icon: string } {
  const c = Math.round(code)
  if (c === 0) return { text: '晴朗', icon: '☀️' }
  if (c === 1) return { text: '基本晴朗', icon: '🌤️' }
  if (c === 2) return { text: '局部多云', icon: '⛅' }
  if (c === 3) return { text: '阴天', icon: '☁️' }
  if (c === 45 || c === 48) return { text: '雾', icon: '🌫️' }
  if (c >= 51 && c <= 57) return { text: '毛毛雨', icon: '🌦️' }
  if (c >= 61 && c <= 67) return { text: '小雨', icon: '🌧️' }
  if (c >= 71 && c <= 77) return { text: '小雪', icon: '🌨️' }
  if (c >= 80 && c <= 82) return { text: '阵雨', icon: '🌧️' }
  if (c >= 85 && c <= 86) return { text: '阵雪', icon: '❄️' }
  if (c >= 95 && c <= 99) return { text: '雷阵雨', icon: '⛈️' }
  return { text: '天气未知', icon: '🌡️' }
}

/** 风向角度 → 八方位 */
export function windDirectionToText(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const idx = Math.round(((deg % 360) / 45)) % 8
  return dirs[idx] || '—'
}

/** 格式化天气供 AI 聊天使用 */
export function formatWeatherForChat(w: WeatherResult, ip?: string | null): string {
  const lines = [
    `【当前位置天气 · ${w.city}${w.country ? '（' + w.country + '）' : ''}】`,
    `${w.weatherIcon} ${w.weatherText}  ${w.temperature.toFixed(1)}°C（体感 ${w.apparentTemperature.toFixed(1)}°C）`,
    `💨 风速 ${w.windSpeed.toFixed(1)} km/h（${windDirectionToText(w.windDirection)}风）`,
    `💧 湿度 ${w.humidity}% · ☁️ 云量 ${w.cloudCover}%${w.precipitation > 0 ? ' · 降水 ' + w.precipitation + 'mm' : ''}`,
  ]
  if (ip) lines.push(`📡 登录 IP：${ip}`)
  lines.push(`⏱️ 更新时间：${new Date(w.fetchedAt).toLocaleString('zh-CN')}`)
  return lines.join('\n')
}

/** 热门城市列表 */
export function getPopularCityNames(): string[] {
  return [
    '北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '西安',
    '南京', '苏州', '重庆', '天津', '青岛', '大连', '厦门', '长沙',
    '郑州', '合肥', '济南', '福州', '昆明', '南宁', '海口', '三亚',
    '哈尔滨', '沈阳', '长春', '香港', '澳门', '台北',
    '东京', '首尔', '新加坡', '曼谷', '伦敦', '巴黎', '纽约', '洛杉矶',
    '旧金山', '悉尼', '墨尔本', '多伦多', '温哥华', '迪拜', '莫斯科',
  ]
}
