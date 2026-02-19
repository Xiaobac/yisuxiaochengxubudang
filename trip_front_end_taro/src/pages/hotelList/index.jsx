import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, Input, Map, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import { getHotels } from '../../services/hotel';
import { getLocations } from '../../services/location';
import { getHotelMinPrice } from '../../services/hotel';
import { formatStars, formatPrice } from '../../utils/format';
import { DEFAULT_HOTEL_IMAGE } from '../../config/images';
import { getImageUrl } from '../../config/images';
import FilterPanel from '../../components/FilterPanel';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import Calendar from '../../components/Calendar';
import Icon from '../../components/Icon';
import { useTheme } from '../../utils/useTheme';
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

  // ---------- 辅助函数 ----------
  const getCityIdsByType = (type) => {
    if (type === 'hotel') return { min: 1, max: 10 };
    if (type === 'homestay') return { min: 1, max: 10 };
    if (type === 'hourly') return { min: 1, max: 10 };
    return { min: 1, max: 10 };
  };

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
      setLocations(locationsData);

      if (searchParams.locationId) {
        const found = locationsData.find(loc => loc.id === searchParams.locationId);
        setSelectedLocation(found || null);
      } else if (locationsData.length > 0) {
        const { min, max } = getCityIdsByType(searchParams.type);
        const defaultCity = locationsData.find(loc => loc.id >= min && loc.id <= max) || locationsData[0];
        setSelectedLocation(defaultCity);
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
    const newParams = { ...searchParams, locationId: location.id, locationName: location.name };
    setSearchParams(newParams);
    loadHotels(newParams);
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

  // ---------- 格式化酒店数据 ----------
  const formatHotelsWithPrice = async (rawList) => {
    const baseHotels = rawList.map(hotel => {
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
        price: '0',
        priceNum: 0,
        img: images[0] || DEFAULT_HOTEL_IMAGE,
        facilities: Array.isArray(facilities) ? facilities : [],
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        address: hotel.address || ''
      };
    });

    return Promise.all(
      baseHotels.map(async (hotel) => {
        try {
          const minPrice = await getHotelMinPrice(hotel.id);
          return { ...hotel, price: minPrice.toString(), priceNum: minPrice };
        } catch {
          return hotel;
        }
      })
    );
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
        const hotelsWithPrice = await formatHotelsWithPrice(res.data);
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
        const newHotels = await formatHotelsWithPrice(res.data);
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
        const newParams = { ...searchParams, keyword: val.trim() };
        setSearchParams(newParams);
        loadHotels(newParams);
      }
    }, 300);
  }, [searchParams]);

  const handleSearch = (keyword) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const newParams = { ...searchParams, keyword };
    setSearchParams(newParams);
    loadHotels(newParams);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleOpenSortMenu = () => {
    const itemList = ['推荐排序', '好评优先', '价格升序', '价格降序'];
    const keys = ['recommend', 'distance', 'priceAsc', 'priceDesc'];
    Taro.showActionSheet({
      itemList,
      success: (res) => handleSortChange(keys[res.tapIndex])
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

    const message = filterInfo.length > 0 ? `已应用: ${filterInfo.join(', ')}` : '筛选已应用';
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
    if (params) {
      setSearchParams(params);
      if (params.checkIn) setStartDate(params.checkIn);
      if (params.checkOut) setEndDate(params.checkOut);
      loadHotels(params);
      Taro.removeStorageSync('hotelSearchParams');
      setSavedScrollTop(0); // 新搜索，回到顶部
    } else if (hotelList.length === 0) {
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
            <Text className='pill-city-name'>{selectedLocation?.name || searchParams.locationName || '上海'}</Text>
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
              placeholderStyle='color:#999;font-size:26rpx;'
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
          image='🏨'
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
              选择城市
              <View className='city-selector-close' onClick={() => setIsCitySelectorVisible(false)}>
                <Icon name='x' size={36} color={iconSecondaryColor} />
              </View>
            </View>
            <ScrollView scrollY className='city-selector-scroll'>
              {locations
                .filter(loc => {
                  const { min, max } = getCityIdsByType(searchParams.type);
                  return loc.id >= min && loc.id <= max;
                })
                .map((loc) => (
                  <View
                    key={loc.id}
                    className={`city-select-item ${selectedLocation?.id === loc.id ? 'active' : ''}`}
                    hoverClass='city-select-hover'
                    onClick={() => handleSelectCity(loc)}
                  >
                    {loc.name}
                  </View>
                ))}
              {locations.filter(loc => {
                const { min, max } = getCityIdsByType(searchParams.type);
                return loc.id >= min && loc.id <= max;
              }).length === 0 && (
                <View className='empty-city-tip'>当前无城市可选</View>
              )}
            </ScrollView>
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
