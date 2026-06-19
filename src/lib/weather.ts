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
  adcode?: string
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

// ⭐ 高德官方城市编码表（adcode）—— 用此编码查询天气最准确
// 覆盖全国 31 省 + 港澳台主要城市
export const CITY_ADCODE: Record<string, string> = {
  // 直辖市
  '北京': '110000', '北京市': '110000',
  '上海': '310000', '上海市': '310000',
  '天津': '120000', '天津市': '120000',
  '重庆': '500000', '重庆市': '500000',

  // 广东
  '广州': '440100', '广州市': '440100',
  '深圳': '440300', '深圳市': '440300',
  '东莞': '441900', '佛山': '440600',
  '珠海': '440400', '中山': '442000',
  '惠州': '441300', '汕头': '440500',
  '江门': '440700', '湛江': '440800',
  '肇庆': '441200', '茂名': '440900',
  '揭阳': '445200', '汕尾': '441500',
  '韶关': '440200', '清远': '441800',
  '梅州': '441400', '潮州': '445100',
  '云浮': '445300', '阳江': '441700',
  '河源': '441600',

  // 江苏
  '南京': '320100', '南京市': '320100',
  '苏州': '320500', '无锡': '320200',
  '常州': '320400', '南通': '320600',
  '扬州': '321000', '盐城': '320900',
  '徐州': '320300', '淮安': '320800',
  '连云港': '320700', '镇江': '321100',
  '泰州': '321200', '宿迁': '321300',

  // 浙江
  '杭州': '330100', '杭州市': '330100',
  '宁波': '330200', '温州': '330300',
  '绍兴': '330600', '嘉兴': '330400',
  '金华': '330700', '台州': '331000',
  '湖州': '330500', '衢州': '330800',
  '丽水': '331100', '舟山': '330900',

  // 四川
  '成都': '510100', '成都市': '510100',
  '绵阳': '510700', '德阳': '510600',
  '宜宾': '511500', '南充': '511300',
  '泸州': '510500', '乐山': '511100',
  '自贡': '510300', '内江': '511000',
  '攀枝花': '510400', '遂宁': '510900',
  '广元': '510800', '达州': '511700',
  '眉山': '511400', '雅安': '511800',
  '资阳': '512000', '广安': '511600',
  '巴中': '511900',

  // 湖北
  '武汉': '420100', '武汉市': '420100',
  '宜昌': '420500', '襄阳': '420600',
  '荆州': '421000', '黄石': '420200',
  '十堰': '420300', '孝感': '420900',
  '荆门': '420800', '咸宁': '421200',
  '鄂州': '420700', '随州': '421300',

  // 湖南
  '长沙': '430100', '株洲': '430200',
  '湘潭': '430300', '衡阳': '430400',
  '岳阳': '430600', '常德': '430700',
  '益阳': '430900', '张家界': '430800',
  '郴州': '431000', '永州': '431100',
  '邵阳': '430500', '怀化': '431200',
  '娄底': '431300', '湘西': '433100',

  // 山东
  '济南': '370100', '青岛': '370200',
  '烟台': '370600', '潍坊': '370700',
  '淄博': '370300', '威海': '371000',
  '日照': '371100', '临沂': '371300',
  '济宁': '370800', '泰安': '370900',
  '德州': '371400', '聊城': '371500',
  '滨州': '371600', '菏泽': '371700',
  '枣庄': '370400', '东营': '370500',

  // 福建
  '福州': '350100', '厦门': '350200',
  '泉州': '350500', '漳州': '350600',
  '莆田': '350300', '三明': '350400',
  '南平': '350700', '龙岩': '350800',
  '宁德': '350900',

  // 河南
  '郑州': '410100', '洛阳': '410300',
  '开封': '410200', '南阳': '411300',
  '新乡': '410700', '焦作': '410800',
  '许昌': '411000', '平顶山': '410400',
  '安阳': '410500', '商丘': '411400',
  '信阳': '411500', '周口': '411600',
  '驻马店': '411700', '鹤壁': '410600',
  '濮阳': '410900', '漯河': '411100',
  '三门峡': '411200', '济源': '419001',

  // 陕西
  '西安': '610100', '西安巿': '610100',
  '宝鸡': '610300', '咸阳': '610400',
  '渭南': '610500', '延安': '610600',
  '榆林': '610800', '汉中': '610700',
  '安康': '610900', '商洛': '611000',
  '铜川': '610200',

  // 安徽
  '合肥': '340100', '芜湖': '340200',
  '蚌埠': '340300', '马鞍山': '340500',
  '安庆': '340800', '滁州': '341100',
  '阜阳': '341200', '宿州': '341300',
  '六安': '341500', '黄山': '341000',
  '淮南': '340400', '淮北': '340600',
  '铜陵': '340700', '池州': '341700',
  '宣城': '341800', '亳州': '341600',

  // 江西
  '南昌': '360100', '九江': '360400',
  '赣州': '360700', '吉安': '360800',
  '上饶': '361100', '抚州': '361000',
  '宜春': '360900', '景德镇': '360200',
  '萍乡': '360300', '新余': '360500',
  '鹰潭': '360600',

  // 云南
  '昆明': '530100', '大理': '532900',
  '丽江': '530700', '曲靖': '530300',
  '玉溪': '530400', '保山': '530500',
  '昭通': '530600', '普洱': '530800',
  '临沧': '530900', '文山': '532600',
  '红河': '532500', '西双版纳': '532800',
  '楚雄': '532300', '迪庆': '533400',
  '怒江': '533300', '德宏': '533100',

  // 贵州
  '贵阳': '520100', '遵义': '520300',
  '毕节': '520500', '毕节市': '520500',
  '六盘水': '520200', '安顺': '520400',
  '铜仁': '520600', '黔东南': '522600',
  '黔南': '522700', '黔西南': '522300',

  // 广西
  '南宁': '450100', '柳州': '450200',
  '桂林': '450300', '梧州': '450400',
  '北海': '450500', '防城港': '450600',
  '钦州': '450700', '贵港': '450800',
  '玉林': '450900', '百色': '451000',
  '贺州': '451100', '河池': '451200',
  '来宾': '451300', '崇左': '451400',

  // 辽宁
  '沈阳': '210100', '大连': '210200',
  '鞍山': '210300', '抚顺': '210400',
  '本溪': '210500', '丹东': '210600',
  '锦州': '210700', '营口': '210800',
  '阜新': '210900', '辽阳': '211000',
  '盘锦': '211100', '铁岭': '211200',
  '朝阳': '211300', '葫芦岛': '211400',

  // 吉林
  '长春': '220100', '吉林': '220200',
  '四平': '220300', '辽源': '220400',
  '通化': '220500', '白山': '220600',
  '松原': '220700', '白城': '220800',
  '延边': '222400',

  // 黑龙江
  '哈尔滨': '230100', '齐齐哈尔': '230200',
  '大庆': '230600', '牡丹江': '231000',
  '佳木斯': '230800', '伊春': '230700',
  '鸡西': '230300', '鹤岗': '230400',
  '双鸭山': '230500', '七台河': '230900',
  '绥化': '231200', '黑河': '231100',
  '大兴安岭': '232700',

  // 河北
  '石家庄': '130100', '唐山': '130200',
  '秦皇岛': '130300', '邯郸': '130400',
  '邢台': '130500', '保定': '130600',
  '张家口': '130700', '承德': '130800',
  '沧州': '130900', '廊坊': '131000',
  '衡水': '131100',

  // 山西
  '太原': '140100', '大同': '140200',
  '阳泉': '140300', '长治': '140400',
  '晋城': '140500', '朔州': '140600',
  '晋中': '140700', '运城': '140800',
  '忻州': '140900', '临汾': '141000',
  '吕梁': '141100',

  // 内蒙古
  '呼和浩特': '150100', '包头': '150200',
  '乌海': '150300', '赤峰': '150400',
  '通辽': '150500', '鄂尔多斯': '150600',
  '呼伦贝尔': '150700', '巴彦淖尔': '150800',
  '乌兰察布': '150900', '兴安盟': '152200',
  '锡林郭勒': '152500', '阿拉善': '152900',

  // 甘肃
  '兰州': '620100', '嘉峪关': '620200',
  '金昌': '620300', '白银': '620400',
  '天水': '620500', '武威': '620600',
  '张掖': '620700', '平凉': '620800',
  '酒泉': '620900', '庆阳': '621000',
  '定西': '621100', '陇南': '621200',
  '临夏': '622900', '甘南': '623000',

  // 青海
  '西宁': '630100', '海东': '630200',
  '海北': '632200', '黄南': '632300',
  '海南': '632500', '果洛': '632600',
  '玉树': '632700', '海西': '632800',

  // 宁夏
  '银川': '640100', '石嘴山': '640200',
  '吴忠': '640300', '固原': '640400',
  '中卫': '640500',

  // 新疆
  '乌鲁木齐': '650100', '克拉玛依': '650200',
  '吐鲁番': '650400', '哈密': '650500',
  '昌吉': '652300', '博尔塔拉': '652700',
  '巴音郭楞': '652800', '阿克苏': '652900',
  '克孜勒苏': '653000', '喀什': '653100',
  '和田': '653200', '伊犁': '654000',
  '塔城': '654200', '阿勒泰': '654300',
  '石河子': '659001', '阿拉尔': '659002',
  '图木舒克': '659003', '五家渠': '659004',
  '北屯': '659005', '铁门关': '659006',

  // 西藏
  '拉萨': '540100', '日喀则': '540200',
  '昌都': '540300', '林芝': '540400',
  '山南': '540500', '那曲': '540600',
  '阿里': '542500',

  // 海南
  '海口': '460100', '三亚': '460200',
  '三沙': '460300', '儋州': '460400',

  // 港澳台
  '香港': '810000', '澳门': '820000',
  '台北': '710000', '高雄': '710001',
  '台中': '710002', '台南': '710003',
}

/** 根据城市名查 adcode（支持中文城市名、"市"字变体） */
export function lookupAdcode(cityName: string): string | null {
  if (!cityName) return null
  const key = cityName.trim()
  // 精确匹配
  if (CITY_ADCODE[key]) return CITY_ADCODE[key]
  // 去掉"市"字
  if (CITY_ADCODE[key.replace(/市$/, '')]) return CITY_ADCODE[key.replace(/市$/, '')]
  // 加"市"字
  if (CITY_ADCODE[key + '市']) return CITY_ADCODE[key + '市']
  // 模糊匹配
  for (const [name, code] of Object.entries(CITY_ADCODE)) {
    if (key.includes(name) || name.includes(key)) return code
  }
  return null
}

// 默认城市
export const DEFAULT_CITY: GeoResult = {
  lat: 39.9042, lon: 116.4074, city: '北京', country: '中国', timeZone: 'Asia/Shanghai', adcode: '110000',
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
// ⭐ 高德地图 API 请求（JSONP 方式，跨域最可靠）
// ============================================================

/** JSONP 请求封装 */
function jsonpRequest<T = any>(url: string, timeout = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const cbName = '__amap_cb_' + Date.now() + '_' + Math.random().toString(36).slice(2)
    const timer = setTimeout(() => { delete (window as any)[cbName]; s?.remove(); reject(new Error('请求超时')) }, timeout)
    ;(window as any)[cbName] = (data: T) => { clearTimeout(timer); delete (window as any)[cbName]; s?.remove(); resolve(data) }
    const s = document.createElement('script')
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cbName
    s.onerror = () => { clearTimeout(timer); delete (window as any)[cbName]; s.remove(); reject(new Error('网络请求失败')) }
    document.head.appendChild(s)
  })
}

/** 高德天气文本 → 图标（高德 API 返回的 weather 字段是中文文本） */
const AMAP_WEATHER_ICONS: Record<string, string> = {
  '晴': '☀️',
  '多云': '⛅',
  '阴': '☁️',
  '小雨': '🌧️',
  '中雨': '🌧️',
  '大雨': '⛈️',
  '暴雨': '⛈️',
  '大暴雨': '⛈️',
  '特大暴雨': '⛈️',
  '雷阵雨': '⛈️',
  '雷阵雨并伴有冰雹': '⛈️',
  '小雪': '🌨️',
  '中雪': '🌨️',
  '大雪': '❄️',
  '暴雪': '❄️',
  '雨夹雪': '🌨️',
  '冻雨': '🌨️',
  '雾': '🌫️',
  '浓雾': '🌫️',
  '强浓雾': '🌫️',
  '轻雾': '🌫️',
  '大雾': '🌫️',
  '特强浓雾': '🌫️',
  '霾': '🌫️',
  '中度霾': '🌫️',
  '重度霾': '🌫️',
  '严重霾': '🌫️',
  '浮尘': '🌫️',
  '扬沙': '🌫️',
  '沙尘暴': '🌪️',
  '强沙尘暴': '🌪️',
  '风': '💨',
  '大风': '💨',
  '飓风': '🌀',
  '热带风暴': '🌀',
  '强热带风暴': '🌀',
  '台风': '🌀',
  '强台风': '🌀',
  '超强台风': '🌀',
  '龙卷风': '🌪️',
}

/** 高德天气文本 → 图标 */
function amapWeatherIcon(weather: string): { text: string; icon: string } {
  if (!weather) return { text: '天气未知', icon: '🌡️' }
  const icon = AMAP_WEATHER_ICONS[weather]
  if (icon) return { text: weather, icon }
  // 模糊匹配（如 "小雨转中雨" → 取第一个天气类型）
  for (const [key, ico] of Object.entries(AMAP_WEATHER_ICONS)) {
    if (weather.includes(key)) return { text: weather, icon: ico }
  }
  return { text: weather, icon: '🌡️' }
}

/** 数字星期 → 中文星期 */
function weekNumberToText(week: string): string {
  const map: Record<string, string> = {
    '1': '星期一', '2': '星期二', '3': '星期三',
    '4': '星期四', '5': '星期五', '6': '星期六', '7': '星期日'
  }
  return map[week] || '星期' + week
}

// ============================================================
// 对外 API
// ============================================================

/** 高德 API 统一请求（对应用户代码中的 $.getJSON） */
async function amapRequest<T = any>(path: string, params: Record<string, string>): Promise<T> {
  const allParams = { ...params, key: '89d198e442cee91f8b01e5d69b850eed', output: 'json' }
  const qs = new URLSearchParams(allParams).toString()
  const url = `https://restapi.amap.com${path}?${qs}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    if (data.status !== '1') throw new Error('高德 API 错误: ' + (data.info || '未知错误'))
    return data as T
  } finally {
    clearTimeout(timer)
  }
}

/** IP 定位（用户代码中的 $.getJSON(ip)） */
export async function fetchLocationByIP(_key?: string): Promise<GeoResult & { ip?: string }> {
  const data = await amapRequest<any>('/v3/ip', {})
  const city = data.city || '未知城市'
  const province = data.province || ''
  const adcode = data.adcode || lookupAdcode(city) || '110000'
  let lat = 39.9042, lon = 116.4074
  if (data.rectangle && typeof data.rectangle === 'string') {
    const parts = data.rectangle.split(';')
    if (parts.length >= 2) {
      const [lon1, lat1] = parts[0].split(',').map(Number)
      const [lon2, lat2] = parts[1].split(',').map(Number)
      lon = (lon1 + lon2) / 2
      lat = (lat1 + lat2) / 2
    }
  } else {
    const coords = lookupCityCoords(city)
    if (coords) { lat = coords.lat; lon = coords.lon }
  }
  return {
    lat, lon, city: province + city, country: '中国',
    timeZone: 'Asia/Shanghai', adcode, ip: data.ip || undefined,
  }
}

/** 客户端定位（多层 fallback） */
export async function fetchClientLocation(): Promise<GeoResult & { ip?: string }> {
  // 方法 1: GPS
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 300000 })
      )
      const lat = pos.coords.latitude, lon = pos.coords.longitude
      if (lat >= 15 && lat <= 60 && lon >= 70 && lon <= 140) {
        const geo = await reverseGeocode(lat, lon)
        const adcode = lookupAdcode(geo.city) ?? undefined
        return { lat, lon, city: geo.city, country: geo.country, timeZone: geo.timeZone, adcode }
      }
    } catch { /* 继续 */ }
  }
  // 方法 2: 高德 IP（最可靠）
  try { return await fetchLocationByIP() } catch { /* 继续 */ }
  // 方法 3: ipapi.co（免费）
  try {
    const data = await fetch('https://ipapi.co/json/').then(r => r.json())
    if (data.city) {
      const adcode = lookupAdcode(data.city) ?? undefined
      return { lat: data.latitude, lon: data.longitude, city: data.city, country: data.country_name || '', timeZone: data.timezone || '', adcode }
    }
  } catch { /* 继续 */ }
  throw new Error('无法获取位置，请手动输入城市')
}

/** 天气数据类型：包含当天 + 4日预报 */
export type AmapWeatherResult = {
  temperature: number
  tempMin: number
  tempMax: number
  humidity: number
  weatherText: string
  weatherIcon: string
  windPower: string
  windDirection: string
  city: string
  reportTime: string
  fetchedAt: number
  forecast: Array<{
    date: string; weekText: string; dayWeather: string; nightWeather: string
    dayTemp: number; nightTemp: number; dayWind: string; nightWind: string
    dayWindPower: string; nightWindPower: string; dayIcon: string; nightIcon: string
  }>
}

/** 获取天气（extensions=all，含4日预报，如用户代码中的 getWeather(adcode)） */
export async function fetchWeatherByAmap(adcode: string): Promise<AmapWeatherResult> {
  const data = await amapRequest<any>('/v3/weather/weatherInfo', { city: adcode, extensions: 'all' })
  const forecast = data.forecasts || []
  if (forecast.length === 0) throw new Error('未获取到天气数据')
  const today = forecast[0]
  const casts = today.casts || []
  if (casts.length === 0) throw new Error('未获取到天气详情')
  const current = casts[0]
  const { text, icon } = amapWeatherIcon(current.dayweather || current.nightweather || '晴')
  return {
    temperature: parseFloat(current.daytemp) || 0,
    tempMin: parseFloat(current.nighttemp) || 0,
    tempMax: parseFloat(current.daytemp) || 0,
    humidity: 0,
    weatherText: text,
    weatherIcon: icon,
    windPower: current.daypower || '',
    windDirection: current.daywind || '',
    city: today.city || '',
    reportTime: today.reporttime || new Date().toISOString().slice(0, 10),
    fetchedAt: Date.now(),
    forecast: casts.map((c: any) => {
      const di = amapWeatherIcon(c.dayweather || '晴')
      const ni = amapWeatherIcon(c.nightweather || '晴')
      return {
        date: c.date || '',
        weekText: weekNumberToText(c.week || '1'),
        dayWeather: c.dayweather || '晴', nightWeather: c.nightweather || '晴',
        dayTemp: parseFloat(c.daytemp) || 0, nightTemp: parseFloat(c.nighttemp) || 0,
        dayWind: c.daywind || '', nightWind: c.nightwind || '',
        dayWindPower: c.daypower || '', nightWindPower: c.nightpower || '',
        dayIcon: di.icon, nightIcon: ni.icon,
      }
    }),
  }
}

/** 兼容旧 API：直接调用新的 adcode 方式，同时保留旧接口 */
export async function fetchWeatherByAmapCity(cityName: string, _key?: string): Promise<WeatherResult> {
  const adcode = lookupAdcode(cityName) || cityName
  try {
    const w = await fetchWeatherByAmap(adcode)
    return {
      temperature: w.temperature, apparentTemperature: w.temperature,
      humidity: w.humidity, windSpeed: 0, windDirection: 0,
      weatherCode: 0, weatherText: w.weatherText, weatherIcon: w.weatherIcon,
      isDay: true, precipitation: 0, cloudCover: 0,
      city: w.city, country: '中国', fetchedAt: w.fetchedAt,
    }
  } catch {
    // 回退：extensions=base 模式（实时）
    const data = await amapRequest<any>('/v3/weather/weatherInfo', { city: adcode, extensions: 'base' })
    const lives = data.lives || []
    if (lives.length === 0) throw new Error('未获取到天气数据')
    const live = lives[0]
    const { text, icon } = amapWeatherIcon(live.weather || '未知')
    return {
      temperature: parseFloat(live.temperature) || 0,
      apparentTemperature: parseFloat(live.temperature) || 0,
      humidity: parseFloat(live.humidity) || 0,
      windSpeed: 0, windDirection: 0, weatherCode: 0,
      weatherText: text, weatherIcon: icon,
      isDay: true, precipitation: 0, cloudCover: 0,
      city: live.city || cityName, country: '中国', fetchedAt: Date.now(),
    }
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
