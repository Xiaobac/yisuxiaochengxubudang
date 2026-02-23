import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, Input, Button, Swiper, SwiperItem, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Calendar from '../../components/Calendar';
import SearchSuggestion from '../../components/SearchSuggestion';
import AiChatWidget from '../../components/AiChatWidget';
import Icon from '../../components/Icon';
import { getLocations } from '../../services/location';
import { getTags } from '../../services/tag';
import { BANNER_IMAGES } from '../../config/images';
import dayjs from 'dayjs';
import { useTheme } from '../../utils/useTheme';
import './index.css';

function Home() {
  const { cssVars, tokens } = useTheme();

  // --- 基础状态 ---
  const [currentTab, setCurrentTab] = useState(0);
  const tabs = ['国内', '海外', '钟点房', '民宿'];

  // --- 位置和标签数据 ---
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [tags, setTags] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [citySearchKeyword, setCitySearchKeyword] = useState(''); // 城市搜索关键词

  // --- 筛选条件 ---
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTagSelectorVisible, setIsTagSelectorVisible] = useState(false);

  // --- 价格面板 ---
  const PRICE_MIN = 0;
  const PRICE_MAX = 4500;
  const [isPricePanelVisible, setIsPricePanelVisible] = useState(false);
  const [sliderMin, setSliderMin] = useState(PRICE_MIN);
  const [sliderMax, setSliderMax] = useState(PRICE_MAX);
  const [panelMinInput, setPanelMinInput] = useState('');
  const [panelMaxInput, setPanelMaxInput] = useState('');

  // 价格滑块：缓存轨道 rect，避免每次 touchMove 都查询 DOM
  const sliderRectRef = useRef(null);

  const handlePanelMinInput = (e) => {
    const val = e.detail.value;
    setPanelMinInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= PRICE_MIN && num < sliderMax) setSliderMin(num);
    else if (val === '') setSliderMin(PRICE_MIN);
  };

  const handlePanelMaxInput = (e) => {
    const val = e.detail.value;
    setPanelMaxInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > sliderMin && num <= PRICE_MAX) setSliderMax(num);
    else if (val === '') setSliderMax(PRICE_MAX);
  };

  const handlePriceReset = () => {
    setSliderMin(PRICE_MIN);
    setSliderMax(PRICE_MAX);
    setPanelMinInput('');
    setPanelMaxInput('');
  };

  const handlePriceConfirm = () => {
    setMinPriceInput(sliderMin === PRICE_MIN ? '' : String(sliderMin));
    setMaxPriceInput(sliderMax === PRICE_MAX ? '' : String(sliderMax));
    setIsPricePanelVisible(false);
  };

  const getPriceLabel = () => {
    if (!minPriceInput && !maxPriceInput) return '价格区间';
    if (!maxPriceInput) return `¥${minPriceInput}以上`;
    if (!minPriceInput) return `¥0-${maxPriceInput}`;
    return `¥${minPriceInput}-${maxPriceInput}`;
  };

  // 缓存滑块轨道位置（touchStart 时获取，touchMove 直接用）
  const cacheSliderRect = () => {
    Taro.createSelectorQuery()
      .select('.price-slider-track')
      .boundingClientRect((rect) => {
        if (rect) sliderRectRef.current = rect;
      })
      .exec();
  };

  const calcPriceFromTouch = (touchX) => {
    const rect = sliderRectRef.current;
    if (!rect) return null;
    const ratio = Math.max(0, Math.min(1, (touchX - rect.left) / rect.width));
    return Math.round(ratio * PRICE_MAX / 50) * 50;
  };

  // --- 城市选择弹窗状态 ---
  const [isCitySelectorVisible, setIsCitySelectorVisible] = useState(false);

  // --- 搜索建议 ---
  const [showSearchSuggestion, setShowSearchSuggestion] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [hotSearches] = useState([
    '上海外滩酒店', '浦东机场附近', '迪士尼度假区', '南京路步行街',
    '虹桥枢纽', '豫园附近', '陆家嘴金融中心', '新天地商圈'
  ]);

  // --- 日历 ---
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const today = dayjs();
  const tomorrow = today.add(1, 'day');
  const isHourlyRoom = useMemo(() => currentTab === 2, [currentTab]);

  const isEarlyMorning = useMemo(() => {
    const currentHour = today.hour();
    return currentHour >= 0 && currentHour < 6;
  }, [today]);

  // ---------- 辅助函数 ----------
  const getLocationType = (tabIndex) => tabIndex === 1 ? 'overseas' : 'domestic';

  const filterCitiesByTab = (tabIndex, locationList) => {
    const locationType = getLocationType(tabIndex);
    return locationList.filter(loc => loc.type === locationType);
  };

  useEffect(() => {
    if (!startDate && !endDate) {
      setStartDate(today.format('YYYY-MM-DD'));
      setEndDate(tomorrow.format('YYYY-MM-DD'));
    }
  }, [today, tomorrow]);

  useEffect(() => {
    loadInitialData();
    loadSearchHistory();
  }, []);

  const loadInitialData = async () => {
    try {
      let locationsData = [];
      let tagsData = [];

      try {
        const res = await getLocations();
        if (res) {
          if (Array.isArray(res)) locationsData = res;
          else if (res.data && Array.isArray(res.data)) locationsData = res.data;
          else if (res.data && res.data.data && Array.isArray(res.data.data)) locationsData = res.data.data;
        }
      } catch (error) {
        console.error('获取位置失败:', error);
      }

      try {
        const res = await getTags();
        if (res) {
          if (Array.isArray(res)) tagsData = res;
          else if (res.data && Array.isArray(res.data)) tagsData = res.data;
          else if (res.data && res.data.data && Array.isArray(res.data.data)) tagsData = res.data.data;
        }
      } catch (error) {
        console.error('获取标签失败:', error);
      }

      if (locationsData.length > 0) {
        setLocations(locationsData);
        const defaultCity = filterCitiesByTab(currentTab, locationsData)[0] || null;
        setSelectedLocation(defaultCity);
      } else {
        setLocations([]);
        setSelectedLocation(null);
      }
      setTags(tagsData);
    } catch (error) {
      console.error('loadInitialData 未知错误:', error);
      setLocations([]);
      setSelectedLocation(null);
      setTags([]);
    }
  };

  const loadSearchHistory = () => {
    try {
      const history = Taro.getStorageSync('searchHistory') || [];
      setSearchHistory(history);
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  };

  const saveSearchHistory = (keyword) => {
    if (!keyword || !keyword.trim()) return;
    try {
      let history = Taro.getStorageSync('searchHistory') || [];
      history = history.filter(item => item !== keyword);
      history.unshift(keyword);
      if (history.length > 10) history = history.slice(0, 10);
      Taro.setStorageSync('searchHistory', history);
      setSearchHistory(history);
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  const handleClearSearchHistory = () => {
    Taro.showModal({
      title: '清空搜索历史',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            Taro.removeStorageSync('searchHistory');
            setSearchHistory([]);
            Taro.showToast({ title: '已清空', icon: 'success', duration: 1000 });
          } catch (error) {
            console.error('清空搜索历史失败:', error);
          }
        }
      }
    });
  };

  const handleSelectSuggestion = (keyword) => {
    setSearchKeyword(keyword);
    setShowSearchSuggestion(false);
    saveSearchHistory(keyword);
  };

  const handleOpenCalendar = () => setIsCalendarVisible(true);

  const handleCalendarConfirm = (start, end) => {
    if (isHourlyRoom) {
      if (start) { setStartDate(start); setEndDate(''); }
    } else {
      if (start && end) { setStartDate(start); setEndDate(end); }
      else if (start) { setStartDate(start); setEndDate(''); }
    }
  };

  const getNightCount = () => {
    if (isHourlyRoom) return '钟点房';
    const start = startDate ? dayjs(startDate) : today;
    const end = endDate ? dayjs(endDate) : tomorrow;
    if (end.isAfter(start, 'day')) return `共${end.diff(start, 'day')}晚`;
    return '共1晚';
  };

  const handleQuickDateSelect = (type) => {
    const todayStr = today.format('YYYY-MM-DD');
    const tomorrowStr = tomorrow.format('YYYY-MM-DD');
    const dayAfterTomorrowStr = today.add(2, 'day').format('YYYY-MM-DD');

    switch (type) {
      case 'today':
        setStartDate(todayStr); setEndDate(tomorrowStr); break;
      case 'tomorrow':
        setStartDate(tomorrowStr); setEndDate(dayAfterTomorrowStr); break;
      case 'weekend': {
        const dayOfWeek = today.day();
        const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
        setStartDate(today.add(daysUntilFriday, 'day').format('YYYY-MM-DD'));
        setEndDate(today.add(daysUntilFriday + 2, 'day').format('YYYY-MM-DD'));
        break;
      }
      case 'nextweek':
        setStartDate(today.add(7, 'day').format('YYYY-MM-DD'));
        setEndDate(today.add(8, 'day').format('YYYY-MM-DD'));
        break;
    }
  };

  const getDisplayDate = (date, isToday = false, isTomorrow = false) => {
    if (date) return dayjs(date).format('MM月DD日');
    if (isTomorrow) return tomorrow.format('MM月DD日');
    return today.format('MM月DD日');
  };

  const getDateDesc = (isStartDate, date) => {
    if (isHourlyRoom) return date ? '入住日期' : '今天';
    if (date) return isStartDate ? '入住' : '离店';
    return isStartDate ? '今天' : '明天';
  };

  const handleTabChange = (index) => {
    setCurrentTab(index);
    const citiesForTab = filterCitiesByTab(index, locations);
    const isValid = selectedLocation && citiesForTab.some(loc => loc.id === selectedLocation.id);
    if (!isValid) setSelectedLocation(citiesForTab[0] || null);

    if (index === 2) {
      if (!startDate) setStartDate(today.format('YYYY-MM-DD'));
      setEndDate('');
    } else {
      if (!startDate) setStartDate(today.format('YYYY-MM-DD'));
      if (!endDate) setEndDate(tomorrow.format('YYYY-MM-DD'));
    }
  };

  const handleSelectCity = (location) => {
    setSelectedLocation(location);
    setIsCitySelectorVisible(false);
  };

  const handleToggleTag = (tag) => {
    setSelectedTags(prev => {
      const exists = prev.some(t => t.id === tag.id);
      if (exists) return prev.filter(t => t.id !== tag.id);
      return [...prev, tag];
    });
  };

  const handleSearch = () => {
    const keyword = searchKeyword.trim();
    if (keyword) saveSearchHistory(keyword);

    const minPrice = minPriceInput !== '' ? parseInt(minPriceInput) : undefined;
    const maxPrice = maxPriceInput !== '' ? parseInt(maxPriceInput) : undefined;

    let type;
    if (currentTab === 2) type = 'hourly';
    else if (currentTab === 3) type = 'homestay';
    else type = 'hotel';

    const params = {
      locationId: selectedLocation?.id,
      locationName: selectedLocation?.name,
      checkIn: startDate, checkOut: endDate,
      keyword, minPrice, maxPrice, type,
      tags: selectedTags.map(t => t.id)
    };

    setShowSearchSuggestion(false);
    Taro.setStorageSync('hotelSearchParams', params);
    Taro.switchTab({ url: '/pages/hotelList/index' });
  };

  const handleSearchFocus = () => setShowSearchSuggestion(true);
  const handleSearchBlur = () => setTimeout(() => setShowSearchSuggestion(false), 200);

  // ----------------------- 渲染 -----------------------
  return (
    <View className='home-page-container' style={cssVars}>
      {/* 顶部轮播图 */}
      <View className='top-banner-box'>
        <Swiper
          autoplay circular indicatorDots
          interval={5000} duration={500}
          indicatorColor="rgba(255, 255, 255, 0.4)"
          indicatorActiveColor="#ffffff"
          className='banner-swiper'
        >
          {BANNER_IMAGES.map((item, index) => (
            <SwiperItem key={index} onClick={() => Taro.navigateTo({ url: `/pages/hotelDetail/index?id=${item.hotelId}` })}>
              <Image className='banner-img' src={item.src} mode='aspectFill' lazyLoad />
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      {/* 搜索卡片主体 */}
      <View className='search-main-card'>
        {/* 标签切换 */}
        <View className='tabs-header-row'>
          {tabs.map((tab, index) => (
            <View
              key={index}
              className={currentTab === index ? 'tab-item-box active' : 'tab-item-box'}
              hoverClass='tab-item-hover'
              onClick={() => handleTabChange(index)}
            >
              <Text className='tab-text-val'>{tab}</Text>
              {currentTab === index && <View className='tab-active-line' />}
            </View>
          ))}
        </View>

        {/* 城市选择+搜索输入 */}
        <View className='row-section city-search-row'>
          <View className='city-wrap-box' hoverClass='city-wrap-hover' onClick={() => setIsCitySelectorVisible(true)}>
            <Text className='city-label-text'>
              {selectedLocation?.name || '选择城市'}
            </Text>
            <Icon name='caretDown' size={24} color={tokens['--color-text-primary']} style={{ marginLeft: '6rpx' }} />
          </View>
          <View className='input-wrap-box' style={{ position: 'relative' }}>
            <Input
              className='search-input-el'
              placeholder='位置/品牌/酒店'
              placeholderStyle='color:var(--color-text-disabled);'
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            <SearchSuggestion
              visible={showSearchSuggestion}
              keyword={searchKeyword}
              searchHistory={searchHistory}
              hotSearches={hotSearches}
              onSelect={handleSelectSuggestion}
              onClearHistory={handleClearSearchHistory}
            />
          </View>
          <View className='gps-location-box'>
            <Icon name='crosshair' size={36} color={tokens['--color-primary']} />
          </View>
        </View>

        {/* 日期选择行 */}
        <View className='row-section date-select-row' hoverClass='date-select-hover' onClick={handleOpenCalendar}>
          {isHourlyRoom ? (
            <View className='date-single-info'>
              <View className='date-item-group'>
                <Text className='date-val-num'>{getDisplayDate(startDate, true)}</Text>
                <Text className='date-desc-text'>{getDateDesc(true, startDate)}</Text>
              </View>
            </View>
          ) : (
            <View className='date-left-info'>
              <View className='date-item-group'>
                <Text className='date-val-num'>{getDisplayDate(startDate, true)}</Text>
                <Text className='date-desc-text'>{getDateDesc(true, startDate)}</Text>
              </View>
              <View className='date-divider-line'></View>
              <View className='date-item-group'>
                <Text className='date-val-num'>{getDisplayDate(endDate, false, true)}</Text>
                <Text className='date-desc-text'>{getDateDesc(false, endDate)}</Text>
              </View>
            </View>
          )}
          <Text className='night-count-total'>{getNightCount()}</Text>
        </View>

        {/* 快捷日期选择 */}
        {!isHourlyRoom && (
          <View className='quick-date-row'>
            {['today', 'tomorrow', 'weekend'].map((type) => (
              <View key={type} className='quick-date-item' hoverClass='quick-date-hover' onClick={() => handleQuickDateSelect(type)}>
                <Text className='quick-date-text'>
                  {type === 'today' ? '今晚' : type === 'tomorrow' ? '明晚' : '周末'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 凌晨提示条 */}
        {isEarlyMorning && (
          <View className='night-notice-bar'>
            <Icon name='info' size={32} color={tokens['--color-warning']} style={{ marginRight: '12rpx' }} />
            <Text className='notice-content-text'>
              当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"
            </Text>
          </View>
        )}

        {/* 价格区间筛选入口 */}
        <View className='row-section price-filter-row' hoverClass='price-filter-hover' onClick={() => setIsPricePanelVisible(true)}>
          <Text className={minPriceInput || maxPriceInput ? 'filter-active-text' : 'placeholder-light-text'}>
            {getPriceLabel()}
          </Text>
          <Icon name='caretDown' size={24} color={tokens['--color-text-tertiary']} />
        </View>

        {/* 标签选择器入口 */}
        <View className='row-section tag-filter-row' hoverClass='price-filter-hover' onClick={() => setIsTagSelectorVisible(true)}>
          <View className='tag-filter-content'>
            {selectedTags.length > 0 ? (
              <View className='selected-tags-preview'>
                {selectedTags.map(tag => (
                  <Text key={tag.id} className='selected-tag-chip'>{tag.name}</Text>
                ))}
              </View>
            ) : (
              <Text className='placeholder-light-text'>标签筛选</Text>
            )}
          </View>
          <Icon name='caretDown' size={24} color={tokens['--color-text-tertiary']} />
        </View>

        {/* 查询按钮 */}
        <Button className='submit-search-btn' hoverClass='submit-search-btn-hover' onClick={handleSearch}>
          查询
        </Button>

        {/* 优惠券入口 */}
        <View
          className='coupon-entry-card'
          hoverClass='coupon-entry-hover'
          onClick={() => Taro.navigateTo({ url: '/pages/Coupon/index' })}
        >
          <View className='coupon-entry-left'>
            <Icon name='ticket' size={44} color={tokens['--color-primary']} />
            <View>
              <Text className='coupon-entry-title'>领取优惠券</Text>
              <Text className='coupon-entry-desc'>精选酒店红包，限时领取</Text>
            </View>
          </View>
          <Icon name='caretRight' size={32} color={tokens['--color-primary']} />
        </View>
      </View>

      {/* 日历组件 */}
      <Calendar
        visible={isCalendarVisible}
        onSelect={handleCalendarConfirm}
        onClose={() => setIsCalendarVisible(false)}
        startDate={startDate}
        endDate={endDate}
        today={today}
        mode={isHourlyRoom ? 'single' : 'range'}
      />

      {/* AI 助手组件 */}
      <AiChatWidget />

      {/* 标签选择弹窗 */}
      <View
        className={`city-selector-mask ${isTagSelectorVisible ? 'visible' : ''}`}
        onClick={() => setIsTagSelectorVisible(false)}
      >
        <View className='city-selector-content' onClick={e => e.stopPropagation()}>
          <View className='city-selector-header'>
            选择标签
            <View className='city-selector-close' onClick={() => setIsTagSelectorVisible(false)}>
              <Icon name='x' size={36} color={tokens['--color-text-tertiary']} />
            </View>
          </View>
          <ScrollView scrollY className='city-selector-scroll'>
            <View className='tag-selector-grid'>
              {tags.map((tag) => {
                const isSelected = selectedTags.some(t => t.id === tag.id);
                return (
                  <View
                    key={tag.id}
                    className={isSelected ? 'tag-bubble-item tag-active' : 'tag-bubble-item'}
                    hoverClass='tag-bubble-hover'
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag.name}
                  </View>
                );
              })}
            </View>
          </ScrollView>
          <View className='city-selector-header' style={{ borderTop: '1rpx solid var(--color-border-base)', borderBottom: 'none' }}>
            <View className='tag-selector-reset' hoverClass='tag-btn-hover' onClick={() => setSelectedTags([])}>
              重置
            </View>
            <View className='tag-selector-confirm' hoverClass='tag-btn-hover' onClick={() => setIsTagSelectorVisible(false)}>
              确定
            </View>
          </View>
        </View>
      </View>

      {/* 价格区间面板 */}
      <View
        className={`city-selector-mask ${isPricePanelVisible ? 'visible' : ''}`}
        onClick={() => setIsPricePanelVisible(false)}
      >
        <View className='city-selector-content price-panel-content' onClick={e => e.stopPropagation()}>
          <View className='city-selector-header'>
            价格区间
            <View className='city-selector-close' onClick={() => setIsPricePanelVisible(false)}>
              <Icon name='x' size={36} color={tokens['--color-text-tertiary']} />
            </View>
          </View>

          {/* 输入框区域 */}
          <View className='price-panel-inputs'>
            <Input
              className='price-panel-input'
              type='number'
              placeholder='最低价'
              placeholderStyle='color:var(--color-text-disabled);'
              value={panelMinInput}
              onInput={handlePanelMinInput}
            />
            <Text className='price-panel-sep'>-</Text>
            <Input
              className='price-panel-input'
              type='number'
              placeholder='最高价'
              placeholderStyle='color:var(--color-text-disabled);'
              value={panelMaxInput}
              onInput={handlePanelMaxInput}
            />
            <Text className='price-panel-unit'>元</Text>
          </View>

          {/* 双滑块轨道 */}
          <View className='price-slider-wrap'>
            <View className='price-slider-track'>
              <View
                className='price-slider-fill'
                style={{
                  left: `${(sliderMin / PRICE_MAX) * 100}%`,
                  width: `${((sliderMax - sliderMin) / PRICE_MAX) * 100}%`
                }}
              />
            </View>
            {/* 左滑块 - 使用缓存 rect */}
            <View
              className='price-thumb price-thumb-min'
              style={{ left: `calc(${(sliderMin / PRICE_MAX) * 100}% - 20rpx)` }}
              catchMove
              onTouchStart={cacheSliderRect}
              onTouchMove={(e) => {
                const price = calcPriceFromTouch(e.touches[0].clientX);
                if (price !== null && price < sliderMax) {
                  setSliderMin(price);
                  setPanelMinInput(price === PRICE_MIN ? '' : String(price));
                }
              }}
            />
            {/* 右滑块 */}
            <View
              className='price-thumb price-thumb-max'
              style={{ left: `calc(${(sliderMax / PRICE_MAX) * 100}% - 20rpx)` }}
              catchMove
              onTouchStart={cacheSliderRect}
              onTouchMove={(e) => {
                const price = calcPriceFromTouch(e.touches[0].clientX);
                if (price !== null && price > sliderMin) {
                  setSliderMax(price);
                  setPanelMaxInput(price === PRICE_MAX ? '' : String(price));
                }
              }}
            />
          </View>

          {/* 刻度标注 */}
          <View className='price-slider-labels'>
            <Text className='price-slider-label-text'>¥0</Text>
            <Text className='price-slider-label-text'>¥4500+</Text>
          </View>

          {/* 快捷价格标签 */}
          <View className='price-quick-tags'>
            {[['不限', 0, PRICE_MAX], ['200以下', 0, 200], ['200-500', 200, 500], ['500-1000', 500, 1000], ['1000-2000', 1000, 2000], ['2000以上', 2000, PRICE_MAX]].map(([label, min, max]) => {
              const isActive = sliderMin === min && sliderMax === max;
              return (
                <View
                  key={label}
                  className={`price-quick-tag ${isActive ? 'active' : ''}`}
                  hoverClass='price-quick-tag-hover'
                  onClick={() => {
                    setSliderMin(min);
                    setSliderMax(max);
                    setPanelMinInput(min === PRICE_MIN ? '' : String(min));
                    setPanelMaxInput(max === PRICE_MAX ? '' : String(max));
                  }}
                >
                  {label}
                </View>
              );
            })}
          </View>

          {/* 底部按钮 */}
          <View className='city-selector-header' style={{ borderTop: '1rpx solid var(--color-border-base)', borderBottom: 'none', display: 'flex', justifyContent: 'space-between' }}>
            <View className='tag-selector-reset' hoverClass='tag-btn-hover' onClick={handlePriceReset}>重置</View>
            <View className='tag-selector-confirm' hoverClass='tag-btn-hover' onClick={handlePriceConfirm}>确定</View>
          </View>
        </View>
      </View>

      {/* 城市选择弹窗 */}
      <View
        className={`city-selector-mask ${isCitySelectorVisible ? 'visible' : ''}`}
        onClick={() => setIsCitySelectorVisible(false)}
      >
        <View className='city-selector-content' onClick={e => e.stopPropagation()}>
          <View className='city-selector-header'>
            选择城市
            <View className='city-selector-close' onClick={() => setIsCitySelectorVisible(false)}>
              <Icon name='x' size={36} color={tokens['--color-text-tertiary']} />
            </View>
          </View>

          {/* 城市搜索框 */}
          <View className='city-search-box'>
            <Icon name='search' size={32} color={tokens['--color-text-tertiary']} />
            <Input
              className='city-search-input'
              placeholder='搜索城市'
              placeholderStyle='color:var(--color-text-disabled);'
              value={citySearchKeyword}
              onInput={(e) => setCitySearchKeyword(e.detail.value)}
            />
          </View>

          <ScrollView scrollY className='city-selector-scroll'>
            <View className='city-grid-container'>
              {filterCitiesByTab(currentTab, locations)
                .filter(loc => !citySearchKeyword || loc.name.toLowerCase().includes(citySearchKeyword.toLowerCase()))
                .map((loc) => (
                <View
                  key={loc.id}
                  className={`city-grid-item ${selectedLocation?.id === loc.id ? 'active' : ''}`}
                  hoverClass='city-select-hover'
                  onClick={() => handleSelectCity(loc)}
                >
                  {loc.name}
                </View>
              ))}
            </View>
            {filterCitiesByTab(currentTab, locations).filter(loc => !citySearchKeyword || loc.name.toLowerCase().includes(citySearchKeyword.toLowerCase())).length === 0 && (
              <View className='empty-city-tip'>当前标签下无城市可选</View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

export default Home;
