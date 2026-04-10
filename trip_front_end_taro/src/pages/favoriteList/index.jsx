/**
 * 收藏列表页面
 * 显示用户收藏的所有酒店
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import {
  getMyFavorites,
  removeFavorite
} from '../../services/favorite';
import { formatPrice } from '../../utils/format';
import { DEFAULT_HOTEL_IMAGE } from '../../config/images';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { useTheme } from '../../utils/useTheme'
import { getImageUrl } from '../../config/images';
import './index.css';
import AiChatWidget from '../../components/AiChatWidget';

function FavoriteList() {
  const { cssVars } = useTheme()
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  // 加载收藏列表
  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await getMyFavorites();

      if (res.success && res.data && res.data.length > 0) {
        const formattedFavorites = res.data.map(fav => {
          const hotel = fav.hotel;
          let images = [];
          try {
            images = hotel.images && hotel.images.length > 0
              ? (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images)
              : [];
          } catch { images = []; }

          return {
            id: fav.id,
            hotelId: hotel.id,
            name: hotel.nameZh || hotel.name,
            score: (hotel.score !== null && hotel.score !== undefined) ? Number(hotel.score).toFixed(1) : '暂无评分',
            address: hotel.address || '',
            price: formatPrice(hotel.minPrice),
            priceNum: hotel.minPrice || 0,
            img: images[0] || DEFAULT_HOTEL_IMAGE,
            createdAt: fav.createdAt
          };
        });

        setFavorites(formattedFavorites);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('❌ 加载收藏列表失败:', error);
      Taro.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // 下拉刷新
  usePullDownRefresh(async () => {
    await loadFavorites();
    Taro.stopPullDownRefresh();
  });

  // 取消收藏
  const handleRemoveFavorite = (hotelId, e) => {
    e.stopPropagation();

    Taro.showModal({
      title: '取消收藏',
      content: '确定要取消收藏这家酒店吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await removeFavorite(hotelId);

            if (result.success) {
              Taro.showToast({ title: '已取消收藏', icon: 'success', duration: 1500 });
              // 从列表中移除
              setFavorites(favorites.filter(f => f.hotelId !== hotelId));
            }
          } catch (error) {
            Taro.showToast({ title: '取消失败，请重试', icon: 'none' });
          }
        }
      }
    });
  };

  // 点击酒店卡片
  const handleHotelClick = (hotelId) => {
    Taro.navigateTo({
      url: `/pages/hotelDetail/index?id=${hotelId}`
    });
  };

  if (loading) {
    return (
      <View className='favorite-page-container' style={cssVars}>
        <LoadingSpinner text='加载中...' fullScreen />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View className='favorite-page-container' style={cssVars}>
        <EmptyState
          image='heartFill'
          title='暂无收藏'
          description='快去收藏心仪的酒店吧'
          buttonText='去逛逛'
          onButtonClick={() => Taro.switchTab({ url: '/pages/home/index' })}
        />
      </View>
    );
  }

  return (
    <View className='favorite-page-container' style={cssVars}>
      {/* 操作栏 */}
      <View className='favorite-actions'>
        <View className='favorite-count'>
          <Text className='count-text'>共收藏{favorites.length}家酒店</Text>
        </View>
      </View>

      <View className='favorite-list'>
        {favorites.map((hotel) => (
          <View key={hotel.id} className='favorite-card' onClick={() => handleHotelClick(hotel.hotelId)}>
            <Image className='hotel-image' src={getImageUrl(hotel.img)} mode='aspectFill' />

            <View className='hotel-info'>
              <View className='name-row'>
                <Text className='hotel-name'>{hotel.name}</Text>
              </View>

              <View className='score-row'>
                <View className='score-badge'>{hotel.score}</View>
                <Text className='score-text'>分</Text>
              </View>

              <Text className='hotel-address'>{hotel.address}</Text>

              <View className='bottom-row'>
                <View className='price-box'>
                  <Text className='price-symbol'>¥</Text>
                  <Text className='price-value'>{hotel.priceNum}</Text>
                  <Text className='price-unit'>起</Text>
                </View>

                <View
                  className='favorite-btn active'
                  onClick={(e) => handleRemoveFavorite(hotel.hotelId, e)}
                >
                  <Icon name='heartFill' size={28} color='#ff4d4f' style={{ marginRight: '4rpx' }} />
                  <Text className='favorite-text'>已收藏</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
      <AiChatWidget />
    </View>
  );
}

export default FavoriteList;
