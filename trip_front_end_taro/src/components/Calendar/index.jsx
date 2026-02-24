import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import dayjs from 'dayjs'
import { useTheme } from '../../utils/useTheme'
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
  mode = 'range' // 模式：'range'区间选择，'single'单日期选择
}) => {
  const { tokens } = useTheme()

  // 基础日期计算
  const today = useMemo(() => propToday || dayjs(), [propToday])
  const maxDate = useMemo(() => today.add(30, 'day'), [today])
  
  // 生成可预约的月份列表（今天所在的月份到maxDate所在的月份）
  const availableMonths = useMemo(() => {
    const months = []
    let currentMonth = today.startOf('month')
    const endMonth = maxDate.startOf('month')
    
    while (currentMonth.isBefore(endMonth) || currentMonth.isSame(endMonth, 'month')) {
      months.push(currentMonth.clone())
      currentMonth = currentMonth.add(1, 'month')
    }
    
    return months
  }, [today, maxDate])
  
  // 当前显示的月份索引
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
  
  // 当前显示的月份
  const currentMonth = useMemo(() => 
    availableMonths[currentMonthIndex] || availableMonths[0] || today.startOf('month'), 
  [availableMonths, currentMonthIndex, today])
  
  // 内部临时选中的日期
  const [tempStart, setTempStart] = useState('')
  const [tempEnd, setTempEnd] = useState('')

  // 每次打开日历时，用 props 的已选日期来初始化临时状态（方便用户看到当前值再调整）
  useEffect(() => {
    if (visible) {
      setTempStart(startDate || '')
      setTempEnd(endDate || '')
    }
  }, [visible])

  // 封装关闭函数，关闭前清空临时状态
  const handleClose = () => {
    setTempStart('')
    setTempEnd('')
    onClose()
  }

  // 获取当前月份的开始日期和结束日期
  const monthStart = currentMonth.startOf('month')
  const monthEnd = currentMonth.endOf('month')
  
  // 根据模式决定标题
  const headerTitle = useMemo(() => {
    return mode === 'single' ? '选择入住日期' : '选择入住/离店日期'
  }, [mode])
  
  // 生成当前月的日期网格
  const generateMonthGrid = useCallback(() => {
    const grid = []
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
    
    // 3. 补全到42个格子（6行×7列）
    while (grid.length < 42) {
      grid.push(null)
    }
    
    return grid
  }, [monthStart, monthEnd])
  
  // 处理月份切换（切换月份时不清空临时状态，允许跨月选择区间）
  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonthIndex < availableMonths.length - 1) {
      setCurrentMonthIndex(prev => prev + 1)
    }
  }
  
  const canGoPrevMonth = currentMonthIndex > 0
  const canGoNextMonth = currentMonthIndex < availableMonths.length - 1
  
  // 处理日期点击
  const handleDayClick = (day) => {
    if (!day) return

    const dayStr = day.format('YYYY-MM-DD')

    // 检查日期是否在可选范围内
    if (day.isBefore(today, 'day') || day.isAfter(maxDate, 'day')) {
      return
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
    if (day.isBefore(today, 'day') || day.isAfter(maxDate, 'day')) {
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
  
  // 检查日期是否在当前月份
  const isInCurrentMonth = (day) => {
    if (!day) return false
    return day.month() === currentMonth.month() && day.year() === currentMonth.year()
  }
  
  // 计算入住晚数（基于内部临时状态）
  const calculateNights = () => {
    if (!tempStart || !tempEnd) return 0
    return dayjs(tempEnd).diff(dayjs(tempStart), 'day')
  }
  
  // 获取月份状态标签
  const getMonthStatus = () => {
    if (availableMonths.length === 0) return ''
    const isFirstMonth = currentMonthIndex === 0
    const isLastMonth = currentMonthIndex === availableMonths.length - 1
    if (isFirstMonth && isLastMonth) return '（仅此月）'
    if (isFirstMonth) return '（首月）'
    if (isLastMonth) return '（末月）'
    return ''
  }
  
  // 确定按钮：提交选择并关闭
  const handleConfirm = () => {
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
  
  const monthGrid = generateMonthGrid()
  const monthTitle = currentMonth.format('YYYY年MM月')
  
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
        
        {/* 月份切换栏 */}
        <View className='month-switcher'>
          <View 
            className={`prev-month-btn ${!canGoPrevMonth ? 'disabled' : ''}`}
            onClick={canGoPrevMonth ? handlePrevMonth : undefined}
          >
            <Text className='arrow-icon'>‹</Text>
          </View>
          <View className='current-month-info'>
            <Text className='current-month-title'>{monthTitle}</Text>
            <Text className='month-status-label'>{getMonthStatus()}</Text>
          </View>
          <View 
            className={`next-month-btn ${!canGoNextMonth ? 'disabled' : ''}`}
            onClick={canGoNextMonth ? handleNextMonth : undefined}
          >
            <Text className='arrow-icon'>›</Text>
          </View>
        </View>
        
        {/* 可滚动内容区 */}
        <View className='calendar-scroll-body'>
          {/* 预约提示 */}
          <View className='booking-notice'>
            <Text className='notice-text'>
              📅 可选日期：今天至{maxDate.format('MM月DD日')}（共30天）
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
                ✅ 已选好，点"确定"确认，或重新点选更改
              </Text>
            )}
          </View>

          {/* 星期标题 */}
          <View className='weekdays'>
            {WEEKDAYS.map(day => (
              <Text key={day} className='weekday'>{day}</Text>
            ))}
          </View>

          {/* 日期网格 */}
          <View className='dates-grid'>
            {monthGrid.map((day, index) => {
              const isInMonth = isInCurrentMonth(day)
              const isSelectable = isDaySelectable(day) && isInMonth
              const status = getDayStatus(day)
              const isToday = day ? day.isSame(today, 'day') : false
              const isStartDate = day ? day.format('YYYY-MM-DD') === tempStart : false
              const isEndDate = mode === 'range' && day ? day.format('YYYY-MM-DD') === tempEnd : false

              return (
                <View
                  key={index}
                  className={`date-cell ${status} ${isSelectable ? 'selectable' : 'disabled'} ${!isInMonth ? 'other-month' : ''}`}
                  onClick={() => isSelectable && handleDayClick(day)}
                >
                  {day ? (
                    <View className='day-content'>
                      <Text className={`day-number ${isToday ? 'today' : ''}`}>
                        {day.date()}
                      </Text>
                      {isStartDate && isInMonth ? (
                        <Text className='day-label start-label'>入住</Text>
                      ) : isEndDate && isInMonth ? (
                        <Text className='day-label end-label'>离店</Text>
                      ) : isToday && isInMonth ? (
                        <Text className='day-label today-label'>今天</Text>
                      ) : !isSelectable && isInMonth ? (
                        <Text className='day-label disabled-label'>不可选</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              )
            })}
          </View>
        </View>

        {/* 底部确认栏 — 始终可见 */}
        {renderFooter()}
      </View>
    </View>
  )
}

export default Calendar