import { Solar } from 'lunar-javascript'

/**
 * 获取农历信息
 * @param {Object} day - dayjs 对象
 * @returns {Object} { lunarDay: '初一', festival: '春节' }
 */
export function getLunarInfo(day) {
  if (!day) return { lunarDay: '', festival: '' }

  try {
    const solar = Solar.fromYmd(day.year(), day.month() + 1, day.date())
    const lunar = solar.getLunar()

    // 获取农历日期（如：初一、十五）
    const lunarDay = typeof lunar.getDayInChinese === 'function' ? lunar.getDayInChinese() : ''

    // 获取节日（优先级：传统节日 > 节气 > 农历日期）
    const festival = (typeof lunar.getFestival === 'function' ? lunar.getFestival() : '') ||
                     (typeof lunar.getJieQi === 'function' ? lunar.getJieQi() : '') ||
                     ''

    return {
      lunarDay,
      festival,
      // 是否为重要节日
      isImportantFestival: ['春节', '元宵节', '清明节', '端午节', '中秋节', '重阳节'].includes(festival)
    }
  } catch (error) {
    console.warn('lunar-javascript error:', error)
    return { lunarDay: '', festival: '', isImportantFestival: false }
  }
}

/**
 * 获取公历节假日
 * @param {Object} day - dayjs 对象
 * @returns {string} 节日名称
 */
export function getSolarFestival(day) {
  if (!day) return ''

  const month = day.month() + 1
  const date = day.date()
  const key = `${month}-${date}`

  const solarFestivals = {
    '1-1': '元旦',
    '2-14': '情人节',
    '3-8': '妇女节',
    '5-1': '劳动节',
    '5-4': '青年节',
    '6-1': '儿童节',
    '10-1': '国庆节',
    '12-25': '圣诞节'
  }

  return solarFestivals[key] || ''
}

/**
 * 综合获取日期信息（供日历组件使用）
 * @param {Object} day - dayjs 对象
 * @returns {Object} { display: '春节', isSpecial: true }
 */
export function getDayExtraInfo(day) {
  if (!day) return { display: '', isSpecial: false }

  try {
    // 优先级：公历节日 > 农历节日
    // 不再显示普通农历日期，只显示节假日
    const solarFestival = getSolarFestival(day)
    if (solarFestival) {
      return { display: solarFestival, isSpecial: true, type: 'solar-festival' }
    }

    const { festival, isImportantFestival } = getLunarInfo(day)
    if (festival) {
      return { display: festival, isSpecial: isImportantFestival, type: 'lunar-festival' }
    }

    // 没有节日就不显示任何农历信息
    return { display: '', isSpecial: false, type: 'none' }
  } catch (error) {
    console.warn('getDayExtraInfo error:', error)
    return { display: '', isSpecial: false, type: 'none' }
  }
}
