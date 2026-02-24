import React, { useState, useMemo, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import dayjs from 'dayjs'
import { useTheme } from '../../utils/useTheme'
import { getDayExtraInfo } from '../../utils/lunarHelper'
import './index.css'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const Calendar = ({
  visible = false,
  onClose = () => {},
  onSelect = () => {},
  onConfirm = () => {},
  startDate = '',
  endDate = '',
  today: propToday = '',
  mode = 'range', // 模式：'range'区间选择，'single'单日期选择
  maxDate: propMaxDate = null, // 可选的最大日期限制，null表示不限制
  maxDays = null, // 可选的最大天数限制，null表示不限制
  showLunar = true, // 是否显示农历/节假日
  showPrice = false, // 是否显示价格
  priceData = null, // 价格数据 { '2024-03-01': 299, '2024-03-02': 399 }
  priceFormatter = (price) => `¥${price}` // 价格格式化函数
}) => {
  const { tokens } = useTheme()

  // 基础日期计算
  const today = useMemo(() => propToday || dayjs(), [propToday])
  const maxDate = useMemo(() => {
    if (propMaxDate) return dayjs(propMaxDate)
    if (maxDays) return today.add(maxDays, 'day')
    return null // 不限制
  }, [propMaxDate, maxDays, today])

  // 显示的月份数量（初始显示6个月，滚动时可以加载更多）
  const [monthsToShow, setMonthsToShow] = useState(6)

  // 生成可预约的月份列表（从今天开始，显示指定数量的月份）
  const availableMonths = useMemo(() => {
    const months = []
    let currentMonth = today.startOf('month')

    for (let i = 0; i < monthsToShow; i++) {
      months.push(currentMonth.clone())
      currentMonth = currentMonth.add(1, 'month')
    }

    return months
  }, [today, monthsToShow])

  // 内部临时选中的日期
  const [tempStart, setTempStart] = useState('')
  const [tempEnd, setTempEnd] = useState('')

  // 每次打开日历时，用 props 的已选日期来初始化临时状态（方便用户看到当前值再调整）
  useEffect(() => {
    if (visible) {
      setTempStart(startDate || '')
      setTempEnd(endDate || '')
      // 重置月份数量为初始值
      setMonthsToShow(6)
    }
  }, [visible, startDate, endDate])

  // 封装关闭函数，关闭前清空临时状态
  const handleClose = () => {
    setTempStart('')
    setTempEnd('')
    onClose()
  }

  // 根据模式决定标题
  const headerTitle = useMemo(() => {
    return mode === 'single' ? '选择入住日期' : '选择入住/离店日期'
  }, [mode])

  // 生成指定月份的日期网格
  const generateMonthGrid = useCallback((month) => {
    const grid = []
    const monthStart = month.startOf('month')
    const monthEnd = month.endOf('month')
    const firstDayOfWeek = monthStart.day() // 0=周日, 1=周一, ... 6=周六

    // 1. 填充前面的空白格子（上个月的日期）
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null)
    }

    // 2. 填充当前月的所有日期
    let currentDay = monthStart.clone()
    while (currentDay.isBefore(monthEnd) || currentDay.isSame(monthEnd, 'day')) {
      grid.push(currentDay.clone())
      currentDay = currentDay.add(1, 'day')
    }

    // 3. 只补全到当前周结束（7的倍数），不固定填充到42个
    const remainder = grid.length % 7
    if (remainder !== 0) {
      const toAdd = 7 - remainder
      for (let i = 0; i < toAdd; i++) {
        grid.push(null)
      }
    }

    return grid
  }, [])
  
  // 处理日期点击
  const handleDayClick = (day) => {
    if (!day) return

    const dayStr = day.format('YYYY-MM-DD')

    // 检查日期是否在可选范围内
    if (day.isBefore(today, 'day')) {
      return
    }
    if (maxDate && day.isAfter(maxDate, 'day')) {
      return
    }

    // 触觉反馈
    try {
      Taro.vibrateShort?.({ type: 'light' })
    } catch (e) {
      // 静默失败
    }

    if (mode === 'single') {
      // 单日期模式：选中后等待用户点"确定"
      setTempStart(dayStr)
      setTempEnd('')
    } else {
      // 区间模式
      if (!tempStart || tempEnd) {
        // 没有起始日期，或已经选完一次（第三次点击=重新选）
        setTempStart(dayStr)
        setTempEnd('')
      } else {
        // 第二次点击：有 tempStart 没有 tempEnd
        if (dayStr === tempStart) {
          // 点同一个日期，忽略
          return
        }

        // 自动确定入住/离店顺序
        const firstDay = dayjs(tempStart)
        const secondDay = day
        let finalStart, finalEnd
        if (secondDay.isAfter(firstDay, 'day')) {
          finalStart = tempStart
          finalEnd = dayStr
        } else {
          finalStart = dayStr
          finalEnd = tempStart
        }
        setTempStart(finalStart)
        setTempEnd(finalEnd)
      }
    }
  }
  
  // 检查日期是否可选
  const isDaySelectable = (day) => {
    if (!day) return false
    if (day.isBefore(today, 'day')) {
      return false
    }
    if (maxDate && day.isAfter(maxDate, 'day')) {
      return false
    }
    return true
  }
  
  // 获取日期状态（基于内部 temp 状态，不依赖 props 的 startDate/endDate）
  const getDayStatus = (day) => {
    if (!day) return ''

    const dayStr = day.format('YYYY-MM-DD')

    // 临时选中的起点或终点
    if (dayStr === tempStart || (tempEnd && dayStr === tempEnd)) {
      return 'selected'
    }

    // 区间模式：tempStart 和 tempEnd 都存在时，显示区间高亮
    if (mode === 'range' && tempStart && tempEnd) {
      const start = dayjs(tempStart)
      const end = dayjs(tempEnd)
      if (day.isAfter(start, 'day') && day.isBefore(end, 'day')) {
        return 'in-range'
      }
    }

    return ''
  }
  
  // 检查日期是否在指定月份
  const isInMonth = (day, month) => {
    if (!day) return false
    return day.month() === month.month() && day.year() === month.year()
  }
  
  // 计算入住晚数（基于内部临时状态）
  const calculateNights = () => {
    if (!tempStart || !tempEnd) return 0
    return dayjs(tempEnd).diff(dayjs(tempStart), 'day')
  }

  // 获取日期价格
  const getDayPrice = useCallback((day) => {
    if (!showPrice || !priceData || !day) return null

    const dayStr = day.format('YYYY-MM-DD')
    const price = priceData[dayStr]
    return price !== undefined && price !== null ? price : null
  }, [showPrice, priceData])

  // 缓存农历信息（性能优化）
  const lunarCache = useMemo(() => {
    if (!showLunar) return new Map()

    const cache = new Map()
    availableMonths.forEach(month => {
      const grid = generateMonthGrid(month)
      grid.forEach(day => {
        if (day) {
          const dayStr = day.format('YYYY-MM-DD')
          cache.set(dayStr, getDayExtraInfo(day))
        }
      })
    })
    return cache
  }, [showLunar, availableMonths, generateMonthGrid])

  // 从缓存获取农历信息
  const getLunarFromCache = useCallback((day) => {
    if (!day) return null
    return lunarCache.get(day.format('YYYY-MM-DD'))
  }, [lunarCache])

  // 获取区间日期的位置类（用于胶囊效果）
  const getRangePositionClass = (day, index) => {
    if (!day || mode !== 'range' || !tempStart || !tempEnd) return ''

    const dayStr = day.format('YYYY-MM-DD')
    const isStart = dayStr === tempStart
    const isEnd = dayStr === tempEnd

    const classes = []

    if (isStart) {
      classes.push('range-start')
    }

    if (isEnd) {
      classes.push('range-end')
    }

    return classes.join(' ')
  }

  // 滚动到底部时加载更多月份
  const handleLoadMore = useCallback(() => {
    setMonthsToShow(prev => prev + 3) // 每次加载3个月
  }, [])

  // 确定按钮：提交选择并关闭
  const handleConfirm = () => {
    // 触觉反馈
    try {
      Taro.vibrateShort?.({ type: 'medium' })
    } catch (e) {
      // 静默失败
    }

    if (mode === 'range') {
      if (tempStart && tempEnd) {
        onSelect(tempStart, tempEnd)
        onConfirm()
        handleClose() // handleClose 内部会清除 autoCloseTimer
      }
    } else {
      // single 模式确定按钮（一般不会走到这里，单选即关）
      if (tempStart) {
        onSelect(tempStart, '')
        onConfirm()
        handleClose()
      }
    }
  }

  // 渲染底部确认栏
  const renderFooter = () => {
    if (mode === 'single') {
      return (
        <View className='calendar-footer'>
          <View className='summary'>
            {tempStart ? (
              <View className='date-summary'>
                <Text className='summary-text'>
                  已选择：{dayjs(tempStart).format('MM月DD日')}
                </Text>
                <Text className='date-range'>点击任意日期可重新选择</Text>
              </View>
            ) : (
              <Text className='summary-text'>请选择入住日期</Text>
            )}
          </View>
          <Button
            className={`confirm-btn ${tempStart ? 'active' : ''}`}
            disabled={!tempStart}
            onClick={handleConfirm}
          >
            确定
          </Button>
        </View>
      )
    } else {
      // 区间模式
      let summaryText = '请选择入住日期'
      let detailText = ''
      if (tempStart && tempEnd) {
        summaryText = `共 ${calculateNights()} 晚`
        detailText = `${dayjs(tempStart).format('MM月DD日')} - ${dayjs(tempEnd).format('MM月DD日')}`
      } else if (tempStart) {
        summaryText = `已选：${dayjs(tempStart).format('MM月DD日')}`
        detailText = '请选择离店日期'
      }

      return (
        <View className='calendar-footer'>
          <View className='summary'>
            <View className='date-summary'>
              <Text className='summary-text'>{summaryText}</Text>
              {detailText && <Text className='date-range'>{detailText}</Text>}
            </View>
          </View>
          <Button
            className={`confirm-btn ${tempStart && tempEnd ? 'active' : ''}`}
            disabled={!tempStart || !tempEnd}
            onClick={handleConfirm}
          >
            确定
          </Button>
        </View>
      )
    }
  }
  
  if (!visible) return null

  return (
    <View className='calendar-container'>
      {/* 遮罩层点击使用 handleClose，确保关闭时清空临时状态 */}
      <View className='calendar-mask' onClick={handleClose} />
      <View className='calendar-main'>
        {/* 头部 */}
        <View className='calendar-header'>
          <Text className='header-title'>{headerTitle}</Text>
          <View className='close-btn' onClick={handleClose}>
            <Text className='close-text'>×</Text>
          </View>
        </View>

        {/* 预约提示 */}
        <View className='booking-notice'>
          <Text className='notice-text'>
            {maxDate
              ? `📅 可选日期：今天至${maxDate.format('MM月DD日')}，向下滑动查看更多月份`
              : '📅 向下滑动可查看更多月份'}
          </Text>
          {mode === 'range' && !tempStart && (
            <Text className='notice-text' style={{ color: tokens['--color-primary'], fontWeight: 500 }}>
              💡 请先选择入住日期
            </Text>
          )}
          {mode === 'range' && tempStart && !tempEnd && (
            <Text className='notice-text' style={{ color: tokens['--color-primary'], fontWeight: 500 }}>
              💡 请选择离店日期（系统会自动识别顺序）
            </Text>
          )}
          {mode === 'range' && tempStart && tempEnd && (
            <Text className='notice-text' style={{ color: tokens['--color-success'], fontWeight: 500 }}>
              ✅已选好，点"确定"确认，或重新点选更改
            </Text>
          )}
        </View>

        {/* 星期标题 - 固定在顶部 */}
        <View className='weekdays'>
          {WEEKDAYS.map(day => (
            <Text key={day} className='weekday'>{day}</Text>
          ))}
        </View>

        {/* 可滚动内容区 - 显示所有月份 */}
        <ScrollView
          className='calendar-scroll-body'
          scrollY
          enhanced
          showScrollbar={false}
          lowerThreshold={100}
          onScrollToLower={handleLoadMore}
          style={{ flex: 1, height: '100%' }}
        >
          {availableMonths.map((month, monthIndex) => {
            const monthGrid = generateMonthGrid(month)
            const monthTitle = month.format('YYYY年MM月')

            return (
              <View key={monthIndex} className='month-section'>
                {/* 月份标题 */}
                <View className='month-title-bar'>
                  <Text className='month-title'>{monthTitle}</Text>
                </View>

                {/* 日期网格 */}
                <View className='dates-grid'>
                  {monthGrid.map((day, index) => {
                    const isInCurrentMonth = isInMonth(day, month)
                    const isSelectable = isDaySelectable(day) && isInCurrentMonth
                    const status = getDayStatus(day)
                    const isToday = day ? day.isSame(today, 'day') : false
                    const isStartDate = day ? day.format('YYYY-MM-DD') === tempStart : false
                    const isEndDate = mode === 'range' && day ? day.format('YYYY-MM-DD') === tempEnd : false
                    const isWeekend = day ? (day.day() === 0 || day.day() === 6) : false

                    // 获取价格和农历信息（独立获取，不互斥）
                    const dayPrice = getDayPrice(day)
                    const lunarInfo = showLunar && day ? getLunarFromCache(day) : null

                    return (
                      <View
                        key={index}
                        className={`date-cell ${status} ${isSelectable ? 'selectable' : 'disabled'} ${!isInCurrentMonth ? 'other-month' : ''} ${isWeekend ? 'weekend' : ''} ${getRangePositionClass(day, index)}`}
                        onClick={() => isSelectable && handleDayClick(day)}
                      >
                        {day ? (
                          <View className='day-content'>
                            <Text className={`day-number ${isToday ? 'today' : ''}`}>
                              {day.date()}
                            </Text>
                            {/* 标签显示：入住/离店/今天优先，其他信息可同时显示 */}
                            <View className='day-labels'>
                              {isStartDate && isInCurrentMonth ? (
                                <Text className='day-label start-label'>入住</Text>
                              ) : isEndDate && isInCurrentMonth ? (
                                <Text className='day-label end-label'>离店</Text>
                              ) : isToday && isInCurrentMonth ? (
                                <Text className='day-label today-label'>今天</Text>
                              ) : (
                                <>
                                  {/* 价格在第一行（固定位置） */}
                                  {dayPrice !== null && isInCurrentMonth && (
                                    <Text className='day-label price-label'>
                                      {priceFormatter(dayPrice)}
                                    </Text>
                                  )}

                                  {/* 节日在第二行（如果有） */}
                                  {lunarInfo?.display && isInCurrentMonth && (
                                    <Text className={`day-label lunar-label ${lunarInfo.isSpecial ? 'festival-label' : ''}`}>
                                      {lunarInfo.display}
                                    </Text>
                                  )}

                                  {/* 没有任何信息时显示不可选 */}
                                  {!dayPrice && !lunarInfo?.display && !isSelectable && isInCurrentMonth && (
                                    <Text className='day-label disabled-label'>不可选</Text>
                                  )}
                                </>
                              )}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}

          {/* 加载提示 */}
          <View className='loading-more'>
            <Text className='loading-text'>向下滑动加载更多月份...</Text>
          </View>
        </ScrollView>

        {/* 底部确认栏 — 始终可见 */}
        {renderFooter()}
      </View>
    </View>
  )
}

export default Calendar