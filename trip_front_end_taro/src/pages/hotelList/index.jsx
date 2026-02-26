import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Image, Input, Map, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import { getHotels } from '../../services/hotel';
import { getLocations } from '../../services/location';
import { formatStars, formatPrice } from '../../utils/format';
import { DEFAULT_HOTEL_IMAGE } from '../../config/images';
import { getImageUrl } from '../../config/images';
import FilterPanel from '../../components/FilterPanel';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import Calendar from '../../components/Calendar';
import Icon from '../../components/Icon';
import { useTheme } from '../../utils/useTheme';
import { groupByInitial } from '../../utils/pinyinMap';
import AiChatWidget from '../../components/AiChatWidget';
import './index.css';

function HotelList() {
  const { cssVars, tokens } = useTheme();

  // ---------- 原有酒店列表状态 ----------
  const [hotelList, setHotelList] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [searchParams, setSearchParams] = useState({});
  const [loading, setLoading] = useState(false);

  const [filterParams, setFilterParams] = useState({
    sortBy: 'recommend',
    priceRange: null,
    minScore: null,
    minStars: null,
    facilities: []
  });
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('recommend');
  const [localSearchKeyword, setLocalSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [markers, setMarkers] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [mapCenter, setMapCenter] = useState({ latitude: 31.2304, longitude: 121.4737 });

  // ---------- 分页状态 ----------
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ---------- 城市选择状态 ----------
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isCitySelectorVisible, setIsCitySelectorVisible] = useState(false);
  const [citySearchKeyword, setCitySearchKeyword] = useState('');
  const [cityTab, setCityTab] = useState(0); // 0=国内, 1=国外
  const [scrollIntoViewId, setScrollIntoViewId] = useState('');

  // ---------- 日期选择状态 ----------
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ---------- 滚动位置保持 ----------
  const [savedScrollTop, setSavedScrollTop] = useState(0);
  const scrollTopRef = useRef(0);

  // ---------- 搜索防抖 ----------
  const searchTimerRef = useRef(null);

  const today = dayjs();
  const tomorrow = today.add(1, 'day');

  const iconColor = tokens['--color-text-primary'];
  const iconSecondaryColor = tokens['--color-text-secondary'];

  // ---------- 加载城市列表 ----------
  const loadLocations = async () => {
    try {
      const res = await getLocations();
      let locationsData = [];
      if (res) {
        if (Array.isArray(res)) {
          locationsData = res;
        } else if (res.data && Array.isArray(res.data)) {
          locationsData = res.data;
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          locationsData = res.data.data;
        }
      }

      // 仅展示 domestic 和 overseas 类型的城市
      locationsData = locationsData.filter(loc => ['domestic', 'overseas'].includes(loc.type));
      setLocations(locationsData);

      if (searchParams.locationId) {
        const found = locationsData.find(loc => loc.id === searchParams.locationId);
        setSelectedLocation(found || null);
      } else {
        // 尝试从同步的城市中恢复
        const syncedCity = Taro.getStorageSync('selectedCitySync');
        if (syncedCity) {
          const found = locationsData.find(loc => loc.id === syncedCity.id);
          if (found) setSelectedLocation(found);
        }
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      setLocations([]);
    }
  };

  // ---------- 城市选择处理 ----------
  const handleSelectCity = (location) => {
    setSelectedLocation(location);
    setIsCitySelectorVisible(false);
    setLocalSearchKeyword(''); // 选城市时清空搜索关键词
    const newParams = { ...searchParams, locationId: location.id, locationName: location.name };
    delete newParams.keyword; // 移除关键词筛选
    setSearchParams(newParams);
    loadHotels(newParams);
    // 同步城市选择到首页
    Taro.setStorageSync('selectedCitySync', { id: location.id, name: location.name });
  };

  // ---------- 重置城市筛选（显示所有酒店） ----------
  const handleResetCity = () => {
    setSelectedLocation(null);
    setIsCitySelectorVisible(false);
    setCitySearchKeyword('');
    setLocalSearchKeyword(''); // 重置时也清空搜索关键词
    const { locationId, locationName, keyword, ...restParams } = searchParams;
    setSearchParams(restParams);
    loadHotels(restParams);
    Taro.removeStorageSync('selectedCitySync');
  };

  // ---------- 城市分组（A-Z） ----------
  const groupedCities = useMemo(() => {
    const typeFilter = cityTab === 0 ? 'domestic' : 'overseas';
    let filtered = locations.filter(loc => loc.type === typeFilter);
    if (citySearchKeyword) {
      filtered = filtered.filter(loc =>
        loc.name.toLowerCase().includes(citySearchKeyword.toLowerCase())
      );
    }
    return groupByInitial(filtered);
  }, [locations, cityTab, citySearchKeyword]);

  const indexLetters = useMemo(() => groupedCities.map(g => g.letter), [groupedCities]);

  const handleIndexTap = (letter) => {
    setScrollIntoViewId(`city-group-${letter}`);
  };

  // ---------- 日期选择处理 ----------
  const handleOpenCalendar = () => {
    setIsCalendarVisible(true);
  };

  const handleCalendarConfirm = (start, end) => {
    if (start) setStartDate(start);
    if (end) setEndDate(end);
    let newParams = { ...searchParams };
    if (start && end) {
      newParams = { ...newParams, checkIn: start, checkOut: end };
    } else if (start) {
      newParams = { ...newParams, checkIn: start, checkOut: '' };
    }
    setSearchParams(newParams);
    loadHotels(newParams);
  };

  // ---------- 日期显示 ----------
  const getDisplayDate = (date, isToday = false, isTomorrow = false) => {
    if (date) return dayjs(date).format('MM月DD日');
    if (isTomorrow) return tomorrow.format('MM月DD日');
    return today.format('MM月DD日');
  };

  const getNightCount = () => {
    const start = startDate ? dayjs(startDate) : today;
    const end = endDate ? dayjs(endDate) : tomorrow;
    if (end.isAfter(start, 'day')) {
      return `共${end.diff(start, 'day')}晚`;
    }
    return '共1晚';
  };

  // ---------- 格式化酒店数据（同步，从已返回的 roomTypes 计算最低价） ----------
  const formatHotelsWithPrice = (rawList) => {
    return rawList.map(hotel => {
      let images = [];
      try {
        images = hotel.images && hotel.images.length > 0
          ? (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images)
          : [];
      } catch { images = []; }
      let facilities = [];
      try {
        facilities = hotel.facilities
          ? (typeof hotel.facilities === 'string' ? JSON.parse(hotel.facilities) : hotel.facilities)
          : [];
      } catch { facilities = []; }

      // 直接从后端已返回的 roomTypes 计算最低价，避免 N+1 请求
      const prices = (hotel.roomTypes || [])
        .map(rt => parseFloat(rt.price))
        .filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

      return {
        id: hotel.id,
        name: hotel.nameZh || hotel.name,
        score: (hotel.score !== null && hotel.score !== undefined) ? Number(hotel.score).toFixed(1) : '暂无评分',
        scoreDesc: hotel.score >= 4.8 ? '超棒' : hotel.score >= 4.5 ? '很好' : hotel.score >= 4.0 ? '不错' : '',
        reviews: `${hotel.reviewCount || 0}点评`,
        collects: `${((hotel.favoriteCount || 0) / 10000).toFixed(1)}万收藏`,
        tags: hotel.location?.name ? [hotel.location.name] : [],
        notice: hotel.description || '',
        services: Array.isArray(facilities) ? facilities.slice(0, 4) : [],
        price: minPrice.toString(),
        priceNum: minPrice,
        img: images[0] || DEFAULT_HOTEL_IMAGE,
        facilities: Array.isArray(facilities) ? facilities : [],
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        address: hotel.address || ''
      };
    });
  };

  // ---------- 加载酒店列表 ----------
  const loadHotels = async (params = {}) => {
    setLoading(true);
    setCurrentPage(1);
    setHasMore(true);
    try {
      const res = await getHotels({
        locationId: params.locationId,
        keyword: params.keyword,
        type: params.type,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        starRating: params.starRating,
        tags: params.tags,
        page: 1,
        limit: PAGE_SIZE,
      });

      if (res.success && res.data && res.data.length > 0) {
        const hotelsWithPrice = formatHotelsWithPrice(res.data);
        setHotelList(hotelsWithPrice);
        generateMapMarkers(hotelsWithPrice);
        const total = res.total ?? res.data.length;
        setHasMore(hotelsWithPrice.length < total);
      } else {
        setHotelList([]);
        setMarkers([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ 加载酒店列表失败:', error);
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
      setHotelList([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // ---------- 上滑加载下一页 ----------
  const loadMoreHotels = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      const res = await getHotels({
        locationId: searchParams.locationId,
        keyword: searchParams.keyword,
        type: searchParams.type,
        minPrice: searchParams.minPrice,
        maxPrice: searchParams.maxPrice,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        starRating: searchParams.starRating,
        tags: searchParams.tags,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (res.success && res.data && res.data.length > 0) {
        const newHotels = formatHotelsWithPrice(res.data);
        setHotelList(prev => {
          const updated = [...prev, ...newHotels];
          generateMapMarkers(updated);
          return updated;
        });
        setCurrentPage(nextPage);
        const total = res.total ?? (currentPage * PAGE_SIZE + res.data.length);
        setHasMore(nextPage * PAGE_SIZE < total);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ 加载更多失败:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ---------- 生成地图标记 ----------
  const generateMapMarkers = (hotels) => {
    const mapMarkers = hotels
      .filter(hotel => hotel.latitude && hotel.longitude)
      .map((hotel) => ({
        id: hotel.id,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        title: hotel.name,
        iconPath: '/assets/marker-hotel.png',
        width: 30,
        height: 30,
        callout: {
          content: `¥${hotel.price}`,
          color: '#FFFFFF',
          fontSize: 12,
          borderRadius: 8,
          bgColor: '#FF6B00',
          padding: 8,
          display: 'ALWAYS',
          textAlign: 'center'
        }
      }));
    setMarkers(mapMarkers);
    if (mapMarkers.length > 0) {
      setMapCenter({ latitude: mapMarkers[0].latitude, longitude: mapMarkers[0].longitude });
    }
  };

  // ---------- 筛选和排序 ----------
  const filterAndSortHotels = () => {
    let filtered = [...hotelList];
    if (filterParams.priceRange) {
      const [min, max] = filterParams.priceRange;
      filtered = filtered.filter(h => h.priceNum >= min && h.priceNum <= max);
    }
    if (filterParams.minScore) {
      filtered = filtered.filter(h => parseFloat(h.score) >= filterParams.minScore);
    }
    if (filterParams.minStars) {
      filtered = filtered.filter(h => (h.starRating || 0) >= filterParams.minStars);
    }
    if (filterParams.facilities && filterParams.facilities.length > 0) {
      filtered = filtered.filter(h =>
        filterParams.facilities.every(f => h.facilities.includes(f))
      );
    }
    switch (sortBy) {
      case 'priceAsc':
        filtered.sort((a, b) => a.priceNum - b.priceNum);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.priceNum - a.priceNum);
        break;
      case 'distance':
        filtered.sort((a, b) => {
          const scoreA = parseFloat(a.score) || 0;
          const scoreB = parseFloat(b.score) || 0;
          const reviewA = parseInt(a.reviews) || 0;
          const reviewB = parseInt(b.reviews) || 0;
          return (scoreB * reviewB) - (scoreA * reviewA);
        });
        break;
      case 'recommend':
      default:
        filtered.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
        break;
    }
    setFilteredHotels(filtered);
  };

  // ---------- 搜索（带防抖）----------
  const handleSearchInput = useCallback((e) => {
    const val = e.detail.value;
    setLocalSearchKeyword(val);

    // 防抖：300ms 后执行搜索
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (val.trim()) {
        // 有关键词 → 移除城市筛选，全局搜索
        const { locationId, locationName, ...rest } = searchParams;
        const newParams = { ...rest, keyword: val.trim() };
        setSearchParams(newParams);
        setSelectedLocation(null);
        loadHotels(newParams);
      } else {
        // 清空关键词 → 移除 keyword，重新加载
        const { keyword, ...rest } = searchParams;
        setSearchParams(rest);
        loadHotels(rest);
      }
    }, 300);
  }, [searchParams]);

  const handleSearch = (keyword) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (keyword && keyword.trim()) {
      // 有关键词 → 移除城市筛选，全局搜索
      const { locationId, locationName, ...rest } = searchParams;
      const newParams = { ...rest, keyword: keyword.trim() };
      setSearchParams(newParams);
      setSelectedLocation(null);
      loadHotels(newParams);
    } else {
      // 空关键词 → 移除 keyword，重新加载
      const { keyword: _, ...rest } = searchParams;
      setSearchParams(rest);
      setLocalSearchKeyword('');
      loadHotels(rest);
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleOpenSortMenu = () => {
    const itemList = ['推荐排序', '好评优先', '价格升序', '价格降序'];
    const keys = ['recommend', 'distance', 'priceAsc', 'priceDesc'];
    Taro.showActionSheet({
      itemList,
      success: (res) => handleSortChange(keys[res.tapIndex]),
      fail: () => {} // 用户取消时忽略
    });
  };

  const handleOpenFilter = () => setShowFilter(true);

  const handleConfirmFilter = (filters) => {
    setFilterParams(filters);
    setShowFilter(false);

    let filterInfo = [];
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      filterInfo.push(`价格${min}-${max}元`);
    }
    if (filters.minScore) filterInfo.push(`${filters.minScore}分以上`);
    if (filters.minStars) filterInfo.push(`${filters.minStars}星及以上`);
    if (filters.facilities && filters.facilities.length > 0) filterInfo.push(`${filters.facilities.length}个设施`);

    const message = filterInfo.length > 0 
      ? `已应用筛选条件` 
      : '筛选已应用';
    Taro.showToast({ title: message, icon: 'success', duration: 2000 });
  };

  const handleHotelClick = (hotelId) => {
    // 保存滚动位置
    Taro.setStorageSync('hotelListScrollTop', scrollTopRef.current);
    Taro.navigateTo({
      url: `/pages/hotelDetail/index?id=${hotelId}&checkIn=${searchParams.checkIn || ''}&checkOut=${searchParams.checkOut || ''}`
    });
  };

  const handleBack = () => Taro.navigateBack();

  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'map' : 'list';
    setViewMode(newMode);
    if (newMode === 'map') generateMapMarkers(filteredHotels);
  };

  const handleMarkerTap = (e) => {
    const markerId = e.detail.markerId;
    const hotel = filteredHotels.find(h => h.id === markerId);
    if (hotel) setSelectedHotel(hotel);
  };

  const handleCloseCard = () => setSelectedHotel(null);

  // 记录滚动位置
  const handleScroll = useCallback((e) => {
    scrollTopRef.current = e.detail.scrollTop;
  }, []);

  // ---------- 生命周期 ----------
  useDidShow(() => {
    const params = Taro.getStorageSync('hotelSearchParams');
    
    // 如果存在搜索参数，则使用参数搜索
    if (params) {
      // 1. 设置搜索参数状态
      setSearchParams(prev => ({
        ...prev,
        ...params
      }));

      // 2. 恢复日期
      if (params.checkIn) setStartDate(params.checkIn);
      if (params.checkOut) setEndDate(params.checkOut);

      // 3. 恢复筛选面板状态 (价格区间)
      if (typeof params.minPrice === 'number' || typeof params.maxPrice === 'number') {
        const min = typeof params.minPrice === 'number' ? params.minPrice : 0;
        const max = typeof params.maxPrice === 'number' ? params.maxPrice : 99999;
        
        setFilterParams(prev => ({
          ...prev,
          priceRange: [min, max]
        }));
      }

      // 4. 加载酒店列表
      loadHotels(params);
      
      // 5. 清除Storage中的临时参数
      Taro.removeStorageSync('hotelSearchParams');
      setSavedScrollTop(0); 

      // 6. 更新选中的位置
      // 注意：locations可能还在加载中，或者是之前加载过的。
      // 我们需要在这里尝试匹配。如果locations为空，loadLocations会在加载完后处理（但这依赖于loadLocations读取最新的searchParams - 可是它闭包了旧的）
      // 所以最好的办法是：在这里单纯根据params.locationId去匹配 current locations
      if (locations.length > 0 && params.locationId) {
        const found = locations.find(loc => loc.id === params.locationId);
        if (found) setSelectedLocation(found);
      }
    } else if (hotelList.length === 0) {
      // 没有参数且列表为空 (首次进入且无参数，或刷新)
      loadHotels({});
    } else {
      // 从详情返回，恢复滚动位置
      const saved = Taro.getStorageSync('hotelListScrollTop');
      if (saved) {
        setSavedScrollTop(saved);
        Taro.removeStorageSync('hotelListScrollTop');
      }
    }
  });

  // 当 locations 或 searchParams 变化时，如果还没有选中的位置，尝试同步
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation && searchParams.locationId) {
       const found = locations.find(loc => loc.id === searchParams.locationId);
       if (found) setSelectedLocation(found);
    }
  }, [locations, searchParams.locationId]);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    filterAndSortHotels();
  }, [hotelList, filterParams, sortBy, localSearchKeyword]);

  usePullDownRefresh(async () => {
    await loadHotels(searchParams);
    Taro.stopPullDownRefresh();
  });

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  return (
    <View className='list-page-container' style={cssVars}>
      {/* 顶部搜索条 */}
      <View className='header-nav-section'>
        <View className='back-btn-circle' hoverClass='back-btn-hover' onClick={handleBack}>
          <Icon name='arrowLeft' size={36} color={iconColor} />
        </View>
        <View className='search-pill-box'>
          <View className='pill-city-info' hoverClass='pill-city-hover' onClick={() => setIsCitySelectorVisible(true)}>
            <Text className='pill-city-name'>{selectedLocation?.name || searchParams.locationName || '全国'}</Text>
            <View className='pill-date-box' onClick={(e) => { e.stopPropagation(); handleOpenCalendar(); }}>
              <Text className='p-date'>住 {getDisplayDate(startDate, true).replace('月', '-').replace('日', '')}</Text>
              <Text className='p-date'>离 {getDisplayDate(endDate, false, true).replace('月', '-').replace('日', '')}</Text>
            </View>
            <Text className='p-night' onClick={(e) => { e.stopPropagation(); handleOpenCalendar(); }}>{getNightCount()}</Text>
          </View>
          <View className='pill-input-box'>
            <Input
              className='p-search-input'
              placeholder={searchParams.keyword || '位置/品牌/酒店'}
              placeholderStyle={`color:${tokens['--color-text-disabled']};font-size:26rpx;`}
              value={localSearchKeyword}
              onInput={handleSearchInput}
              onConfirm={(e) => handleSearch(e.detail.value)}
              confirmType='search'
            />
          </View>
        </View>
        <View className='map-entry-box' hoverClass='map-entry-hover' onClick={toggleViewMode}>
          <Icon name={viewMode === 'list' ? 'mapTrifold' : 'listBullets'} size={36} color={iconColor} />
          <Text className='map-text-small'>{viewMode === 'list' ? '地图' : '列表'}</Text>
        </View>
      </View>

      {/* 筛选栏 */}
      <View className='filter-tab-bar'>
        <View className='filter-tab-item active' hoverClass='filter-tab-hover' onClick={handleOpenSortMenu}>
          {sortBy === 'recommend' && '推荐排序'}
          {sortBy === 'distance' && '好评优先'}
          {sortBy === 'priceAsc' && '价格升序'}
          {sortBy === 'priceDesc' && '价格降序'}
          <Icon name='caretDown' size={20} color={iconSecondaryColor} style={{ marginLeft: '8rpx' }} />
        </View>
        <View className='filter-tab-item' hoverClass='filter-tab-hover' onClick={handleOpenFilter}>
          筛选
          <Icon name='funnel' size={24} color={iconSecondaryColor} style={{ marginLeft: '8rpx' }} />
          {(filterParams.priceRange || filterParams.minScore || filterParams.minStars || filterParams.facilities.length > 0) && (
            <View className='filter-badge'></View>
          )}
        </View>
      </View>

      {/* 筛选结果统计 */}
      {!loading && (
        <View className='result-stats-bar'>
          <Text className='stats-text'>找到 {filteredHotels.length} 家酒店</Text>
          {searchParams.priceRange && (
            <Text className='stats-filter-tag'>{searchParams.priceRange}</Text>
          )}
          {searchParams.tags && searchParams.tags.length > 0 && (
            <Text className='stats-filter-tag'>{searchParams.tags.length}个标签</Text>
          )}
        </View>
      )}

      {loading ? (
        <Skeleton type='hotelCard' count={4} />
      ) : filteredHotels.length === 0 ? (
        <EmptyState
          image='buildings'
          title='没有找到符合条件的酒店'
          description='试试调整筛选条件或换个搜索词吧'
          buttonText='重新搜索'
          onButtonClick={() => loadHotels(searchParams)}
        />
      ) : viewMode === 'list' ? (
        <ScrollView
          className='hotel-list-body'
          scrollY
          scrollTop={savedScrollTop}
          onScroll={handleScroll}
          onScrollToLower={loadMoreHotels}
          lowerThreshold={100}
        >
          {filteredHotels.map((hotel) => (
            <View
              key={hotel.id}
              className='hotel-card-box'
              hoverClass='hotel-card-hover'
              hoverStayTime={100}
              onClick={() => handleHotelClick(hotel.id)}
            >
              <View className='hotel-card-left'>
                <Image
                  className='hotel-card-img'
                  src={getImageUrl(hotel.img)}
                  mode='aspectFill'
                  lazyLoad
                />
              </View>
              <View className='hotel-card-right'>
                <View className='h-name-row'>
                  <Text className='h-name-text'>{hotel.name}</Text>
                </View>
                <View className='h-score-row'>
                  <View className='h-score-badge'>{hotel.score}</View>
                  <Text className='h-score-title'>{hotel.scoreDesc}</Text>
                  <Text className='h-reviews-text'>{hotel.reviews} · {hotel.collects}</Text>
                </View>
                {hotel.tags.length > 0 && (
                  <View className='h-location-row'>
                    {hotel.tags.map(t => <Text key={t} className='h-loc-tag'>{t}</Text>)}
                  </View>
                )}
                {hotel.notice && (
                  <View className='h-boss-notice'>
                    <Text className='h-notice-content'>{hotel.notice}</Text>
                  </View>
                )}
                {hotel.services.length > 0 && (
                  <View className='h-service-row'>
                    {hotel.services.map((s, idx) => <Text key={idx} className='h-service-pill'>{s}</Text>)}
                  </View>
                )}
                <View className='h-price-row'>
                  <View className='h-price-left'>
                    <Text className='h-diamond-price'>钻石贵宾价 {'>'}</Text>
                  </View>
                  <View className='h-price-right'>
                    <Text className='h-price-symbol'>¥</Text>
                    <Text className='h-price-val'>{hotel.price}</Text>
                    <Text className='h-price-unit'>起</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* 加载更多状态 */}
          {loadingMore && (
            <View className='load-more-tip'>
              <View className='load-more-spinner'>
                <View className='spinner-dot' />
                <View className='spinner-dot' />
                <View className='spinner-dot' />
              </View>
              <Text className='load-more-text'>加载更多...</Text>
            </View>
          )}
          {!hasMore && filteredHotels.length > 0 && (
            <View className='load-more-tip load-more-end'>
              <View className='end-line' />
              <Text className='load-more-text'>已加载全部酒店</Text>
              <View className='end-line' />
            </View>
          )}
        </ScrollView>
      ) : (
        <View className='hotel-map-container'>
          <Map
            className='hotel-map-view'
            longitude={mapCenter.longitude}
            latitude={mapCenter.latitude}
            scale={14}
            markers={markers}
            onMarkerTap={handleMarkerTap}
            showLocation
          />
          {selectedHotel && (
            <View className='hotel-card-popup'>
              <View className='card-close' hoverClass='card-close-hover' onClick={handleCloseCard}>
                <Icon name='x' size={28} color={iconSecondaryColor} />
              </View>
              <View className='card-content' onClick={() => handleHotelClick(selectedHotel.id)}>
                <Image className='card-image' src={selectedHotel.img} mode='aspectFill' lazyLoad />
                <View className='card-info'>
                  <Text className='card-name'>{selectedHotel.name}</Text>
                  <View className='card-rating'>
                    <Text className='rating-score'>{selectedHotel.score}分</Text>
                  </View>
                  <Text className='card-address'>{selectedHotel.address}</Text>
                  <View className='card-price-row'>
                    <Text className='price-label'>¥</Text>
                    <Text className='price-value'>{selectedHotel.price}</Text>
                    <Text className='price-unit'>起</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 筛选面板 */}
      <FilterPanel
        visible={showFilter}
        defaultFilters={filterParams}
        onClose={() => setShowFilter(false)}
        onConfirm={handleConfirmFilter}
      />

      {/* 城市选择器弹窗 */}
      {isCitySelectorVisible && (
        <View className='city-selector-mask visible' onClick={() => setIsCitySelectorVisible(false)}>
          <View className='city-selector-content' onClick={e => e.stopPropagation()}>
            <View className='city-selector-header'>
              <View className='city-reset-btn' hoverClass='city-reset-hover' onClick={handleResetCity}>
                <Text className='city-reset-text'>重置</Text>
              </View>
              选择城市
              <View className='city-selector-close' onClick={() => setIsCitySelectorVisible(false)}>
                <Icon name='x' size={36} color={iconSecondaryColor} />
              </View>
            </View>

            {/* 国内/国外 Tab */}
            <View className='city-tab-bar'>
              <View
                className={`city-tab-item ${cityTab === 0 ? 'active' : ''}`}
                onClick={() => { setCityTab(0); setCitySearchKeyword(''); }}
              >
                <Text>国内</Text>
              </View>
              <View
                className={`city-tab-item ${cityTab === 1 ? 'active' : ''}`}
                onClick={() => { setCityTab(1); setCitySearchKeyword(''); }}
              >
                <Text>国外</Text>
              </View>
            </View>

            {/* 城市搜索框 */}
            <View className='city-search-box'>
              <Icon name='search' size={32} color={iconSecondaryColor} />
              <Input
                className='city-search-input'
                placeholder='搜索城市'
                placeholderStyle='color:var(--color-text-disabled);'
                value={citySearchKeyword}
                onInput={(e) => setCitySearchKeyword(e.detail.value)}
              />
            </View>

            {/* 城市列表 + 右侧索引 */}
            <View className='city-body-wrapper'>
              <ScrollView
                scrollY
                className='city-list-scroll'
                scrollIntoView={scrollIntoViewId}
                scrollWithAnimation
              >
                {groupedCities.length > 0 ? groupedCities.map(group => (
                  <View key={group.letter} id={`city-group-${group.letter}`}>
                    <View className='city-group-title'>
                      <Text>{group.letter}</Text>
                    </View>
                    <View className='city-grid-container'>
                      {group.cities.map(loc => (
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
                  </View>
                )) : (
                  <View className='empty-city-tip'>当前无城市可选</View>
                )}
              </ScrollView>

              {/* 右侧字母索引栏 */}
              {indexLetters.length > 0 && (
                <View className='city-index-bar'>
                  {indexLetters.map(letter => (
                    <View
                      key={letter}
                      className='city-index-letter'
                      onClick={() => handleIndexTap(letter)}
                    >
                      <Text>{letter}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 日历组件 */}
      <Calendar
        visible={isCalendarVisible}
        onSelect={handleCalendarConfirm}
        onClose={() => setIsCalendarVisible(false)}
        startDate={startDate}
        endDate={endDate}
        today={today}
        mode={searchParams.type === 'hourly' ? 'single' : 'range'}
      />

      {/* AI 助手 */}
      <AiChatWidget />
    </View>
  );
}

export default HotelList;
