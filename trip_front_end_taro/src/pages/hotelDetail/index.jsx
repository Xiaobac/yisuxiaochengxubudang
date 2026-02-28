import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, ScrollView, Button, Swiper, SwiperItem } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import dayjs from 'dayjs';
import { getHotelById, getHotelRoomTypes, getRoomAvailability } from '../../services/hotel';
// import { getComments } from '../../services/comment';
import { getHotelCommentsCombined } from '../../services/comments';
// import { getReviewsByHotelId } from '../../services/review';
import { createBooking } from '../../services/booking';
import { addFavorite, removeFavorite, checkFavorite } from '../../services/favorite';
import { formatPrice, formatStars } from '../../utils/format';
import { getImageUrl, DEFAULT_AVATAR } from '../../config/images';
import { storage } from '../../utils/storage';
import BookingConfirm from '../../components/BookingConfirm';
import Skeleton from '../../components/Skeleton';
import Calendar from '../../components/Calendar';
import Icon from '../../components/Icon';
import { useTheme } from '../../utils/useTheme'
import './index.css';
import AiChatWidget from '../../components/AiChatWidget';

function HotelDetail() {
  // 获取路由参数
  const { cssVars, isDark, tokens } = useTheme()
  const router = useRouter();
  const hotelId = Number(router.params.id);
  const checkIn = router.params.checkIn;
  const checkOut = router.params.checkOut;

  // 状态管理
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const [startDate, setStartDate] = useState(checkIn || dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(checkOut || dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(null);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const COMMENT_PREVIEW_COUNT = 3;
  const [roomPriceData, setRoomPriceData] = useState(null); // 存储选中房型的每日价格数据
  const dateChangeTimerRef = useRef(null); // 用于日期切换防抖

  // 解析房型数据（复用于初始加载和日期刷新）
  const transformRoomTypes = (roomData) => {
    const transformed = roomData.map(room => {
      let amenitiesList = [];
      if (room.amenities) {
        try {
          amenitiesList = typeof room.amenities === 'string'
            ? JSON.parse(room.amenities)
            : room.amenities;
        } catch (e) {
          amenitiesList = ['免费WiFi', '独立卫浴'];
        }
      }

      let roomImages = [];
      if (room.images) {
        try {
          roomImages = typeof room.images === 'string'
            ? JSON.parse(room.images)
            : room.images;
          if (!Array.isArray(roomImages)) roomImages = [];
        } catch (e) {
          roomImages = [];
        }
      }

      return {
        id: room.id,
        name: room.name || '标准大床房',
        bed: room.description || '大床',
        area: room.description || '30㎡',
        floor: '10-20层',
        capacity: '2人入住',
        price: parseFloat(room.price) || 299,
        features: amenitiesList,
        images: roomImages,
        remainingRooms: room.remainingRooms ?? null,
        dynamicPrice: room.dynamicPrice ?? null,
      };
    });
    transformed.sort((a, b) => (a.dynamicPrice ?? a.price) - (b.dynamicPrice ?? b.price));
    return transformed;
  };

  // 初始加载：并行请求酒店详情、房型、收藏状态、评论
  useEffect(() => {
    if (!hotelId) return;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [hotelRes, roomTypesRes, favoriteRes, commentList] = await Promise.all([
          getHotelById(hotelId),
          getHotelRoomTypes(hotelId, startDate, endDate),
          storage.isAuthenticated() ? checkFavorite(hotelId).catch(() => null) : Promise.resolve(null),
          getHotelCommentsCombined(hotelId),
        ]);

        // 处理酒店详情
        if (hotelRes.success && hotelRes.data) {
          const rawData = hotelRes.data;

          let facilitiesList = [];
          if (rawData.facilities) {
            try {
              facilitiesList = typeof rawData.facilities === 'string'
                ? JSON.parse(rawData.facilities)
                : rawData.facilities;
            } catch (e) {
              facilitiesList = ['免费WiFi', '24小时前台', '行李寄存'];
            }
          } else {
            facilitiesList = ['免费WiFi', '24小时前台', '行李寄存'];
          }

          let imageUrl = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400';
          let imagesList = [imageUrl];
          if (rawData.images) {
            try {
              const images = typeof rawData.images === 'string'
                ? JSON.parse(rawData.images)
                : rawData.images;
              if (Array.isArray(images) && images.length > 0) {
                imageUrl = images[0];
                imagesList = images;
              }
            } catch (e) { /* 使用默认图片 */ }
          }

          setHotel({
            id: rawData.id,
            name: rawData.nameZh || rawData.name || '未知酒店',
            score: (rawData.score !== null && rawData.score !== undefined) ? Number(rawData.score).toFixed(1) : '暂无评分',
            scoreDesc: rawData.score >= 4.8 ? '超棒' : rawData.score >= 4.5 ? '很好' : rawData.score >= 4.0 ? '不错' : '',
            reviews: `${rawData.reviewCount || 0}点评`,
            collects: `${Number((rawData.favoriteCount || 0) / 10000).toFixed(1)}万收藏`,
            tags: rawData.hotelTags?.map(t => t.tag?.name).filter(Boolean) || [rawData.location?.name || '市中心'],
            notice: rawData.description || '优质酒店，环境舒适，服务周到',
            services: facilitiesList,
            price: rawData.basePrice || '299',
            img: imageUrl,
            images: imagesList,
            address: rawData.address || '未知地址',
            location: rawData.location?.name || '市中心',
            latitude: rawData.latitude || null,
            longitude: rawData.longitude || null,
          });
        }

        // 处理房型
        if (roomTypesRes.success && roomTypesRes.data && roomTypesRes.data.length > 0) {
          const transformedRoomTypes = transformRoomTypes(roomTypesRes.data);
          setRoomTypes(transformedRoomTypes);
          if (transformedRoomTypes.length > 0) {
            setSelectedRoomTypeId(transformedRoomTypes[0].id);
          }
        } else {
          setRoomTypes([]);
        }

        // 处理收藏状态
        if (favoriteRes && favoriteRes.success) {
          setIsFavorite(favoriteRes.data?.isFavorite || false);
        }

        // 处理评论
        setComments(commentList || []);
      } catch (error) {
        console.error('获取酒店详情失败:', error);
        Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [hotelId]);

  // 日期变化时重新请求带库存的房型数据（带防抖和竞态保护）
  useEffect(() => {
    // 清理上次的定时器
    if (dateChangeTimerRef.current) {
      clearTimeout(dateChangeTimerRef.current);
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        const res = await getHotelRoomTypes(hotelId, startDate, endDate);
        if (cancelled) return; // 忽略过期结果

        if (res.success && res.data) {
          setRoomTypes(prev => {
            const updated = prev.map(room => {
              const fresh = res.data.find(r => r.id === room.id);
              if (!fresh) return room;
              return {
                ...room,
                remainingRooms: fresh.remainingRooms ?? null,
                dynamicPrice: fresh.dynamicPrice ?? null,
              };
            });
            updated.sort((a, b) => (a.dynamicPrice ?? a.price) - (b.dynamicPrice ?? b.price));
            return updated;
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('刷新房型库存失败:', error);
        }
      }
    };

    if (hotelId && startDate && endDate) {
      // Debounce: 500ms 后才发送请求
      dateChangeTimerRef.current = setTimeout(() => {
        loadData();
      }, 500);
    }

    return () => {
      cancelled = true;
      if (dateChangeTimerRef.current) {
        clearTimeout(dateChangeTimerRef.current);
      }
    };
  }, [hotelId, startDate, endDate]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (dateChangeTimerRef.current) {
        clearTimeout(dateChangeTimerRef.current);
      }
    };
  }, []);

  const handleScroll = (e) => {
    const scrollTop = e.detail.scrollTop;
    setScrollTop(scrollTop);

    const opacity = Math.min(scrollTop / 150, 1);
    setHeaderOpacity(opacity);

    setShowHeaderTitle(scrollTop > 100);
  };

  // 检查酒店是否已收藏
  const checkHotelFavorite = async () => {
    try {
      if (!hotelId) {
        console.warn('⚠️ hotelId为空，无法检查收藏状态');
        return;
      }
      // 未登录时不检查收藏状态，避免触发 401 重定向
      if (!storage.isAuthenticated()) {
        return;
      }
      const res = await checkFavorite(hotelId);
      if (res.success) {
        setIsFavorite(res.data?.isFavorite || false);
      }
    } catch (error) {
      console.error('❌ 检查收藏状态失败:', error);
    }
  };

  // 切换收藏状态
  const handleCollect = async () => {
    if (!storage.isAuthenticated()) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1500);
      return;
    }
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        const res = await removeFavorite(hotelId);

        if (res.success) {
          setIsFavorite(false);
          Taro.showToast({ title: '已取消收藏', icon: 'success', duration: 1500 });
        } else {
          throw new Error(res.message || '取消收藏失败');
        }
      } else {
        const res = await addFavorite(hotelId);

        if (res.success) {
          setIsFavorite(true);
          Taro.showToast({ title: '收藏成功', icon: 'success', duration: 1500 });
        } else {
          throw new Error(res.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('❌ 收藏操作失败:', error);

      // 如果是"已收藏"错误,更新状态并重新检查
      if (error.message && error.message.includes('已收藏')) {
        setIsFavorite(true);
        await checkHotelFavorite();
        Taro.showToast({ title: '该酒店已在收藏列表中', icon: 'none', duration: 1500 });
      } else {
        Taro.showToast({
          title: error.message || '操作失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleMapClick = () => {
    if (!hotel) return;
    // 统一跳转到地图页，同时显示酒店位置和自己的位置，并可直接导航
    const url = hotel.latitude && hotel.longitude
      ? `/pages/hotelMap/index?hotelId=${hotel.id}&name=${encodeURIComponent(hotel.name)}&address=${encodeURIComponent(hotel.address)}&lat=${hotel.latitude}&lng=${hotel.longitude}`
      : `/pages/hotelMap/index?hotelId=${hotel.id}&name=${encodeURIComponent(hotel.name)}&address=${encodeURIComponent(hotel.address)}`;
    Taro.navigateTo({ url });
  };

  const handleFacilityClick = () => {
    Taro.showToast({
      title: '查看设施政策',
      icon: 'none',
      duration: 1500
    });
  };

  const handleOpenCalendar = () => {
    setIsCalendarVisible(true);
  };

  const handleViewRoom = (roomId) => {
    setSelectedRoomTypeId(roomId);
    Taro.showToast({
      title: '已选择此房型',
      icon: 'success',
      duration: 1000
    });
  };

  const handleAskHotel = () => {
    Taro.showToast({ title: '请到前台咨询或通过官网联系酒店', icon: 'none', duration: 2000 });
  };

  const handleBookNow = async () => {
    // 检查是否已登录
    if (!storage.isAuthenticated()) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 1500
      });
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' });
      }, 1500);
      return;
    }

    // 检查是否选择了房型
    if (!selectedRoomTypeId) {
      Taro.showToast({
        title: '请先选择房型',
        icon: 'none'
      });
      return;
    }

    // 显示预订确认弹窗
    setShowBookingConfirm(true);
  };

  // 确认预订
  const handleConfirmBooking = async (guestInfo) => {
    // 验证表单
    if (!guestInfo.guestName.trim()) {
      Taro.showToast({
        title: '请填写入住人姓名',
        icon: 'none'
      });
      return;
    }

    if (!guestInfo.guestPhone.trim()) {
      Taro.showToast({
        title: '请填写联系电话',
        icon: 'none'
      });
      return;
    }

    try {
      const selectedRoom = roomTypes.find(r => r.id === selectedRoomTypeId);
      const nightlyPrice = selectedRoom ? (selectedRoom.dynamicPrice ?? selectedRoom.price ?? 0) : 0;
      const totalPrice = nightlyPrice * getNightCount();

      const bookingData = {
        hotelId: hotel.id,
        roomTypeId: selectedRoomTypeId,
        checkInDate: startDate,
        checkOutDate: endDate,
        guestCount: guestInfo.guestCount,
        totalPrice: totalPrice,
        specialRequests: guestInfo.specialRequests || '',
        guestName: guestInfo.guestName,
        guestPhone: guestInfo.guestPhone,
        arrivalTime: guestInfo.arrivalTime
      };

      const result = await createBooking(bookingData);

      if (result.success) {
        setShowBookingConfirm(false);
        Taro.showToast({
          title: '预订成功',
          icon: 'success'
        });
        setTimeout(() => {
          Taro.navigateTo({ url: '/pages/orderList/index' });
        }, 1500);
      }
    } catch (error) {
      console.error('预订失败:', error);
      Taro.showToast({
        title: error.message || '预订失败，请重试',
        icon: 'none'
      });
    }
  };

  const getNightCount = useCallback(() => {
    if (!startDate || !endDate) return 1;
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (end.isAfter(start, 'day')) {
      return end.diff(start, 'day');
    }
    return 1;
  }, [startDate, endDate]);

  // 根据房型基础价格生成默认价格映射（与PC端逻辑一致：没有单独记录的日期使用基础价格）
  const buildBasePriceMap = useCallback((room) => {
    if (!room) return {};
    const basePrice = Number(room.dynamicPrice ?? room.price);
    if (!basePrice && basePrice !== 0) return {};
    const priceMap = {};
    const today = dayjs();
    for (let i = 0; i < 90; i++) {
      priceMap[today.add(i, 'day').format('YYYY-MM-DD')] = basePrice;
    }
    return priceMap;
  }, []);

  // 当选中房型变化时，立即用基础价格填充，然后异步获取商家设置的价格覆盖
  useEffect(() => {
    if (!selectedRoomTypeId) {
      setRoomPriceData(null);
      return;
    }

    const selectedRoom = roomTypes.find(r => r.id === selectedRoomTypeId);
    // 立即用基础价格填充（用户打开日历时一定能看到价格）
    const basePriceMap = buildBasePriceMap(selectedRoom);
    setRoomPriceData(basePriceMap);

    // 异步获取商家在PC端设置的具体价格，覆盖基础价格
    let cancelled = false;
    const fetchPrices = async () => {
      try {
        const today = dayjs();
        const res = await getRoomAvailability(
          selectedRoomTypeId,
          today.format('YYYY-MM-DD'),
          today.add(90, 'day').format('YYYY-MM-DD')
        );
        if (cancelled) return;

        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mergedMap = { ...basePriceMap };
          res.data.forEach(item => {
            if (item.date && item.price !== undefined && item.price !== null) {
              const dateKey = dayjs(item.date).format('YYYY-MM-DD');
              if (item.isClosed) {
                delete mergedMap[dateKey];
              } else {
                mergedMap[dateKey] = Number(item.price);
              }
            }
          });
          setRoomPriceData(mergedMap);
        }
      } catch (error) {
        // API失败时保留基础价格，不清空
        console.error('获取房型价格详情失败:', error);
      }
    };

    fetchPrices();
    return () => { cancelled = true; };
  }, [selectedRoomTypeId, roomTypes, buildBasePriceMap]);

  const handleCalendarSelect = (start, end) => {
    setStartDate(start || '');
    setEndDate(end || '');
  };

  const handleCalendarConfirm = () => {
    // Calendar 组件自己负责关闭（onClose 已处理）
  };

  const FACILITY_MAP = {
    '2020开业': 'buildings',
    '免费WiFi': 'wifiHigh',
    '度假胜地': 'umbrella',
    '含早餐': 'cookingPot',
    '免费停车': 'car',
    '温泉酒店': 'thermometerHot',
    '海景房': 'waves',
    '游泳池': 'swimmingPool',
    '靠近地铁': 'train',
    '健身房': 'barbell',
    '亲子友好': 'usersThree',
    '商务出差': 'briefcase',
    '情侣约会': 'heartStraight',
    '接送机服务': 'car',
    '宠物友好': 'pawPrint',
    '24小时前台': 'clock',
    '无烟房': 'prohibit',
    '行政酒廊': 'wine',
    '会议室': 'presentationChart',
    '洗衣服务': 'tShirt',
    '行李寄存': 'suitcase'
  };

  const getFacilities = () => {
    if (!hotel || !hotel.tags) return [];

    const allTags = new Set([...(hotel.tags || []), ...(hotel.services || [])]);

    return Array.from(allTags).map(tag => {
      const iconName = FACILITY_MAP[tag] || 'sparkle';
      return { iconName, text: tag };
    }).slice(0, 8);
  };

  const facilities = getFacilities();


  // Loading 状态 - 使用骨架屏
  if (loading) {
    return (
      <View className='detail-page-container' style={cssVars}>
        <Skeleton type='hotelDetail' />
      </View>
    );
  }

  // 数据为空
  if (!hotel) {
    return (
      <View className='detail-page-container' style={cssVars}>
        <View style={{ padding: '100rpx', textAlign: 'center' }}>
          <Text>酒店信息不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='detail-page-container' style={cssVars}>
      {/* 1.顶部导航栏 - 动态效果 */}
      <View
        className='detail-header'
        style={{
          backgroundColor: isDark
            ? `rgba(36,36,36,${headerOpacity})`
            : `rgba(255,255,255,${headerOpacity})`,
          color: headerOpacity > 0.5 ? tokens['--color-text-primary'] : '#fff'
        }}
      >
        <View
          className='header-back'
          hoverClass='header-back-hover'
          onClick={() => Taro.navigateBack()}
        >
          <Icon
            name='arrowLeft'
            size={36}
            color={headerOpacity > 0.5
              ? (tokens['--color-text-primary'])
              : '#fff'}
          />
        </View>
        <Text
          className='header-title'
          style={{
            opacity: showHeaderTitle ? 1 : 0,
            color: headerOpacity > 0.5
              ? (tokens['--color-text-primary'])
              : '#fff'
          }}
        >
          {hotel.name}
        </Text>
      </View>

      <ScrollView
        scrollY
        className='scroll-content'
        onScroll={handleScroll}
        scrollTop={scrollTop}
      >
        {/* 2.媒体区域 - Swiper 左右滑动 */}
        <View className='media-box'>
          <Swiper
            className='media-swiper'
            indicatorDots
            indicatorColor='rgba(255,255,255,0.5)'
            indicatorActiveColor='#ffffff'
            circular
            autoplay={false}
          >
            {(hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.img]).map((imgUrl, index) => (
              <SwiperItem key={index}>
                <Image
                  className='main-media-img'
                  src={getImageUrl(imgUrl)}
                  mode='aspectFill'
                  lazyLoad
                  onClick={() => {
                    const urls = (hotel.images || [hotel.img]).map(url => getImageUrl(url));
                    Taro.previewImage({ urls, current: getImageUrl(imgUrl) });
                  }}
                />
              </SwiperItem>
            ))}
          </Swiper>
          <View className='media-count-badge'>
            <Text className='media-count-text'>
              {hotel.images ? hotel.images.length : 1} 张
            </Text>
          </View>
          <View className='tag-sq-btn'>口碑榜</View>
        </View>

        {/* 3.核心信息卡片 */}
        <View className='info-card'>
          <View className='info-card-header'>
            <Text className='hotel-name'>{hotel.name}</Text>
            <View className='score-row'>
                  <Text className='score-badge'>{hotel.score}</Text>
                  <Text className='score-desc'>{hotel.scoreDesc}</Text>
                </View>
          </View>

          <View className='rank-section'>
            <Text className='rank-text'>{hotel.location}精选酒店</Text>
          </View>

          {/* 设施图标行 */}
          <View className='facility-icon-row'>
            {facilities.map((item, index) => (
              <View key={index} className='facility-item'>
                <Icon name={item.iconName} size={36} color={tokens['--color-primary']} />
                <Text className='facility-text'>{item.text}</Text>
              </View>
            ))}
            <View className='shortcut-arrow' onClick={handleFacilityClick}>
            <Icon name='caretRight' size={24} color={tokens['--color-text-tertiary']} />
          </View>
          </View>

          {/* 评分与地址 (分栏显示) */}
          <View className='info-detail-cols'>
            <View className='col-left'>
              <View className='score-section'>
                <Text className='recommendation-text'>"{hotel.notice || '舒适安逸'}"</Text>
              </View>
            </View>
            <View className='col-right' onClick={handleMapClick}>
            {/* 左侧：距离信息（加粗，垂直居中） */}
              <Text className='distance-text'>{hotel.address || '距地铁站300m'}</Text>
            
            {/* 右侧：图标 + 地图文字（垂直排列） */}
              <View className='map-vertical'>
                <View className='map-icon-small'>
                  <Icon name='mapPin' size={28} color={tokens['--color-text-secondary']} />
                </View>
                <Text className='map-text'>地图</Text>
              </View>
            </View>
          </View>

          <View className='info-card-separator'></View>

          {/* 日期信息行 */}
          <View className='date-info-row' onClick={handleOpenCalendar}>
            <View className='date-left-info'>
              <View className='date-item-group'>
                <Text className='date-val-num'>{dayjs(startDate).format('M月D日')}</Text>
                <Text className='date-desc-text'>入住</Text>
              </View>
              <View className='date-divider-line'></View>
              <View className='date-item-group'>
                <Text className='date-val-num'>{dayjs(endDate).format('M月D日')}</Text>
                <Text className='date-desc-text'>离店</Text>
              </View>
            </View>
            <Text className='night-count-total'>{getNightCount()}晚</Text>
            <Icon name='caretRight' size={28} color={tokens['--color-text-tertiary']} style={{ marginRight: '10rpx' }} />
          </View>
        </View>

        

        {/* 4.房型列表区块 */}
        <View className='room-type-section'>
          {roomTypes.length > 0 ? (
            roomTypes.map((room) => (
              <View key={room.id} className='room-card'>
                {/* 房型头部标签（可保留） */}
                <View className='room-header'>
                  {room.features && room.features.length > 0 && (
                    <View className='room-header-right-tag'>
                      {room.features.slice(0, 2).map((feature, index) => (
                        <Text key={index} className='room-tag-item'>{feature}</Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* 图片 + 详情区域 */}
                <View className='room-preview-row'>
                  <Image
                    className='room-preview-img'
                    src={room.images && room.images.length > 0 ? getImageUrl(room.images[0]) : getImageUrl(hotel.img)}
                    mode='aspectFill'
                  />
                  <View className='room-preview-details'>
                    {/* 房型名称（加粗大字） */}
                    <Text className='room-title'>{room.name}</Text>
                    {/* 规格信息（小字） */}
                    <Text className='room-specs'>
                      {room.area} · {room.capacity} · {room.floor}
                    </Text>

                    {/* 第一行：红色价格 + 预订按钮（靠右） */}
                    <View className='price-button-group'>
                      <Text className='room-price-large'>
                        ¥{room.dynamicPrice ?? room.price}
                        <Text className='room-price-unit-small'>/晚</Text>
                      </Text>
                      <Button
                        className={`room-detail-btn ${
                          selectedRoomTypeId === room.id ? 'selected' : ''
                        } ${room.remainingRooms === 0 ? 'disabled' : ''}`}
                        onClick={() =>
                          room.remainingRooms !== 0 && handleViewRoom(room.id)
                        }
                      >
                        {room.remainingRooms === 0
                          ? '已售罄'
                          : selectedRoomTypeId === room.id
                          ? '已选择'
                          : '选择房型'}
                      </Button>
                    </View>

                    {/* 第二行：共几晚 + 总价 + 剩余房数（靠右） */}
                    <View className='price-info'>
                      <Text className='price-total'>
                        共{getNightCount()}晚 ¥
                        {(room.dynamicPrice ?? room.price) * getNightCount()}
                      </Text>
                      {room.remainingRooms !== null && (
                        <Text
                          className={`room-remaining ${
                            room.remainingRooms <= 3 ? 'room-remaining-urgent' : ''
                          }`}
                        >
                          {room.remainingRooms === 0
                            ? '已售罄'
                            : `仅剩${room.remainingRooms}间`}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: '40rpx', textAlign: 'center' }}>
              <Text>暂无房型信息</Text>
            </View>
          )}
        </View>

        {/* 评论区 */}
        <View className='comment-section'>
          <View className='comment-header'>用户评论（{comments.length}条）</View>
          <View className='comment-list'>
            {comments.length > 0 ? (
              (showAllComments ? comments : comments.slice(0, COMMENT_PREVIEW_COUNT)).map((comment) => (
                <View key={comment.id} className='comment-item'>
                  <Image className='avatar' src={comment.user?.avatar || DEFAULT_AVATAR} mode='aspectFill' />
                  <View className='comment-main'>
                   <View className='comment-header-row'>
                      <Text className='username'>{comment.user?.name || '匿名用户'}</Text>
                      <Text className='comment-date'>{dayjs(comment.createdAt).format('YYYY-MM-DD')}</Text>
                      {(comment.score !== null && comment.score !== undefined) && <Text className='comment-score'>{Number(comment.score).toFixed(1)}</Text>}
                   </View>
                   {comment.roomType && <Text className='comment-room-type'>{comment.roomType}</Text>}
                   <Text className='comment-content'>{comment.content}</Text>
                 </View>
               </View>
              ))
            ) : (
                <View className='no-comments'>
                  <Text>暂无评论</Text>
                </View>
            )}
            {!showAllComments && comments.length > COMMENT_PREVIEW_COUNT && (
              <View className='load-more-btn' onClick={() => setShowAllComments(true)}>
                <Text className='load-more-text'>查看全部 {comments.length} 条评论</Text>
              </View>
            )}
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: '50rpx' }} />
      </ScrollView>

      {/* 5.底部悬浮操作栏 */}
      <View className='sticky-footer'>
        <View className='footer-price-area'>
          {(() => {
            const selectedRoom = roomTypes.find(r => r.id === selectedRoomTypeId);
            const nightlyPrice = selectedRoom ? (selectedRoom.dynamicPrice ?? selectedRoom.price) : null;
            return selectedRoom ? (
              <>
                <View className='footer-price-row'>
                  <Text className='footer-price-symbol'>¥</Text>
                  <Text className='footer-price-val'>{nightlyPrice}</Text>
                  <Text className='footer-price-per'>/晚</Text>
                </View>
                <Text className='footer-price-total'>共{getNightCount()}晚 ¥{nightlyPrice * getNightCount()}</Text>
              </>
            ) : (
              <View className='footer-price-row'>
                <Text className='footer-price-symbol'>¥</Text>
                <Text className='footer-price-val'>{hotel.price}</Text>
                <Text className='footer-price-per'>起</Text>
              </View>
            );
          })()}
        </View>
        <View className='footer-right-group'>
          <View
            className={`footer-collect-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleCollect}
          >
            <Icon name={isFavorite ? 'heartFill' : 'heart'} size={28} color={isFavorite ? tokens['--color-secondary'] : tokens['--color-border-base']} />
            <Text>{isFavorite ? '已收藏' : '收藏'}</Text>
          </View>
          <Button className='footer-action-btn' hoverClass='footer-action-btn-hover' onClick={handleBookNow}>
            立即预订
          </Button>
        </View>
      </View>

      {/* 日历选择器 */}
      {isCalendarVisible && (
        <Calendar
          visible={isCalendarVisible}
          onClose={() => setIsCalendarVisible(false)}
          onSelect={handleCalendarSelect}
          onConfirm={handleCalendarConfirm}
          startDate={startDate}
          endDate={endDate}
          today={dayjs()}
          mode="range"
          showLunar={true}
          showPrice={true}
          priceData={roomPriceData}
          priceFormatter={(price) => `¥${price}`}
        />
      )}

      {/* 预订确认弹窗 */}
      <BookingConfirm
        visible={showBookingConfirm}
        hotel={hotel}
        room={roomTypes.find(r => r.id === selectedRoomTypeId)}
        checkIn={dayjs(startDate).format('M月D日')}
        checkOut={dayjs(endDate).format('M月D日')}
        nights={getNightCount()}
        totalPrice={(() => { const r = roomTypes.find(x => x.id === selectedRoomTypeId); return (r ? (r.dynamicPrice ?? r.price) : 0) * getNightCount(); })()}
        onClose={() => setShowBookingConfirm(false)}
        onConfirm={handleConfirmBooking}
      />
      <AiChatWidget />
    </View>
  );
}

export default HotelDetail;
