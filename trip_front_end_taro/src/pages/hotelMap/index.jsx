import React, { useState, useEffect } from 'react';
import { View, Text, Map, CoverView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getHotels } from '../../services/hotel';
import { DEFAULT_HOTEL_IMAGE } from '../../config/images';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../utils/useTheme';
import './index.css';

// 默认中心（上海）
const DEFAULT_LAT = 31.2304;
const DEFAULT_LNG = 121.4737;

function HotelMap() {
  const { cssVars } = useTheme();
  const router = useRouter();

  // 判断是"单酒店详情模式"还是"搜索列表模式"
  const singleMode = !!router.params.hotelId;
  const singleName = router.params.name ? decodeURIComponent(router.params.name) : '';
  const singleAddress = router.params.address ? decodeURIComponent(router.params.address) : '';
  const singleLat = router.params.lat ? parseFloat(router.params.lat) : null;
  const singleLng = router.params.lng ? parseFloat(router.params.lng) : null;

  const searchParams = !singleMode && router.params.params
    ? JSON.parse(decodeURIComponent(router.params.params))
    : {};

  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });

  useEffect(() => {
    // 先获取用户位置
    Taro.getLocation({
      type: 'gcj02',
      success: (res) => {
        setUserLocation({ latitude: res.latitude, longitude: res.longitude });
        if (singleMode && !singleLat) {
          // 单酒店模式但无坐标：以用户位置为中心
          setMapCenter({ latitude: res.latitude, longitude: res.longitude });
        }
      },
      fail: () => {}
    });

    if (singleMode) {
      initSingleMode();
    } else {
      loadHotels();
    }
  }, []);

  // 单酒店模式：直接用传入的坐标或地址
  const initSingleMode = () => {
    if (singleLat && singleLng) {
      setMapCenter({ latitude: singleLat, longitude: singleLng });
      setMarkers([{
        id: 1,
        latitude: singleLat,
        longitude: singleLng,
        title: singleName,
        callout: {
          content: singleName,
          color: '#FFFFFF',
          fontSize: 13,
          borderRadius: 8,
          bgColor: '#0066FF',
          padding: 8,
          display: 'ALWAYS',
          textAlign: 'center'
        }
      }]);
    }
    setLoading(false);
  };

  // 搜索列表模式：加载多个酒店
  const loadHotels = async () => {
    try {
      setLoading(true);
      const res = await getHotels({
        locationId: searchParams.locationId,
        keyword: searchParams.keyword
      });

      if (res.success && res.data && res.data.length > 0) {
        const hotelData = res.data.map(hotel => {
          const images = hotel.images && hotel.images.length > 0
            ? (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images)
            : [];
          return {
            id: hotel.id,
            name: hotel.nameZh || hotel.name,
            address: hotel.address || '',
            price: hotel.minPrice || '0',
            rating: hotel.rating || '4.5',
            starRating: hotel.starRating || 3,
            latitude: hotel.latitude || DEFAULT_LAT + (Math.random() - 0.5) * 0.1,
            longitude: hotel.longitude || DEFAULT_LNG + (Math.random() - 0.5) * 0.1,
            image: images[0] || DEFAULT_HOTEL_IMAGE
          };
        });

        setHotels(hotelData);
        setMarkers(hotelData.map(hotel => ({
          id: hotel.id,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          title: hotel.name,
          callout: {
            content: `¥${hotel.price}`,
            color: '#FFFFFF',
            fontSize: 12,
            borderRadius: 8,
            bgColor: '#0066FF',
            padding: 8,
            display: 'ALWAYS',
            textAlign: 'center'
          }
        })));

        setMapCenter({ latitude: hotelData[0].latitude, longitude: hotelData[0].longitude });
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerTap = (e) => {
    const hotel = hotels.find(h => h.id === e.detail.markerId);
    if (hotel) setSelectedHotel(hotel);
  };

  // 导航到酒店（调起微信内置导航）
  const handleNavigate = () => {
    const lat = singleMode ? singleLat : selectedHotel?.latitude;
    const lng = singleMode ? singleLng : selectedHotel?.longitude;
    const name = singleMode ? singleName : selectedHotel?.name;
    const address = singleMode ? singleAddress : selectedHotel?.address;

    if (!lat || !lng) {
      Taro.showToast({ title: '该酒店暂无坐标信息', icon: 'none' });
      return;
    }

    Taro.openLocation({
      latitude: lat,
      longitude: lng,
      name,
      address,
      scale: 16,
    });
  };

  // 回到用户当前位置
  const handleLocateMe = () => {
    if (userLocation) {
      setMapCenter({ ...userLocation });
    } else {
      Taro.getLocation({
        type: 'gcj02',
        success: (res) => {
          setUserLocation({ latitude: res.latitude, longitude: res.longitude });
          setMapCenter({ latitude: res.latitude, longitude: res.longitude });
        },
        fail: () => Taro.showToast({ title: '获取位置失败，请检查授权', icon: 'none' })
      });
    }
  };

  if (loading) {
    return (
      <View className='map-page-container' style={cssVars}>
        <LoadingSpinner text='加载地图中...' fullScreen />
      </View>
    );
  }

  return (
    <View className='map-page-container' style={cssVars}>
      <Map
        className='hotel-map'
        longitude={mapCenter.longitude}
        latitude={mapCenter.latitude}
        scale={15}
        markers={markers}
        onMarkerTap={handleMarkerTap}
        showLocation
      >
        {/* 返回按钮 */}
        <CoverView className='map-back-btn' onClick={() => {
          const pages = Taro.getCurrentPages();
          if (pages.length > 1) {
            Taro.navigateBack();
          } else {
            Taro.switchTab({ url: '/pages/home/index' });
          }
        }}>
          <CoverView className='back-btn-content'>
            <CoverView className='back-icon'>{'<'}</CoverView>
            <CoverView className='back-text'>{singleMode ? '返回' : '列表'}</CoverView>
          </CoverView>
        </CoverView>

        {/* 定位到我的位置按钮 */}
        <CoverView className='locate-me-btn' onClick={handleLocateMe}>
          <CoverView className='locate-icon'>📍</CoverView>
        </CoverView>

        {/* 单酒店模式：底部酒店信息 */}
        {singleMode && (
          <CoverView className='single-hotel-bar'>
            <CoverView className='single-hotel-info'>
              <CoverView className='single-hotel-name'>{singleName}</CoverView>
              <CoverView className='single-hotel-addr'>{singleAddress}</CoverView>
            </CoverView>
            <CoverView className='navigate-btn' onClick={handleNavigate}>导航</CoverView>
          </CoverView>
        )}

        {/* 搜索列表模式：酒店数量 */}
        {!singleMode && (
          <CoverView className='hotel-count-badge'>
            <CoverView className='count-text'>共{hotels.length}家酒店</CoverView>
          </CoverView>
        )}
      </Map>

      {/* 搜索列表模式：选中酒店卡片 */}
      {!singleMode && selectedHotel && (
        <View className='hotel-card-popup'>
          <View className='card-close' onClick={() => setSelectedHotel(null)}>✕</View>
          <View className='card-content' onClick={() => Taro.navigateTo({
            url: `/pages/hotelDetail/index?id=${selectedHotel.id}&checkIn=${searchParams.checkInDate || ''}&checkOut=${searchParams.checkOutDate || ''}`
          })}>
            <View className='card-info'>
              <Text className='card-name'>{selectedHotel.name}</Text>
              <Text className='card-address'>{selectedHotel.address}</Text>
              <View className='card-price-row'>
                <Text className='price-label'>￥</Text>
                <Text className='price-value'>{selectedHotel.price}</Text>
                <Text className='price-unit'>起</Text>
              </View>
            </View>
            <View className='card-navigate' onClick={(e) => { e.stopPropagation(); setSelectedHotel(selectedHotel); handleNavigate(); }}>
              <Text className='card-navigate-text'>导航</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default HotelMap;
