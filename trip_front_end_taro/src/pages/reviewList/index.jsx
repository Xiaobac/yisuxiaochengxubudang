import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea, Button } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { getMyReviews, deleteReview } from '../../services/review';
import { storage } from '../../utils/storage';
import { useTheme } from '../../utils/useTheme';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AiChatWidget from '../../components/AiChatWidget';
import './index.css';

function ReviewList() {
  const { cssVars } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storage.isAuthenticated()) {
      Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 });
      setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1500);
      return;
    }
    loadReviews();
  }, []);

  usePullDownRefresh(async () => {
    await loadReviews();
    Taro.stopPullDownRefresh();
  });

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await getMyReviews();
      if (res.success && res.data) {
        setReviews(res.data);
      }
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (reviewId) => {
    Taro.showModal({
      title: '提示',
      content: '确定要删除这条评价吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteReview(reviewId);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            Taro.showToast({ title: '删除成功', icon: 'success' });
          } catch {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className='review-list-container' style={cssVars}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View className='review-list-container' style={cssVars}>
      <ScrollView scrollY className='review-scroll'>
        {reviews.length === 0 ? (
          <EmptyState message='暂无评价记录' />
        ) : (
          reviews.map(review => (
            <View key={review.id} className='review-card'>
              <View className='review-hotel-info'>
                <Text className='review-hotel-name'>{review.hotel?.nameZh || '未知酒店'}</Text>
                <Text className='review-room-name'>{review.booking?.roomType?.name || ''}</Text>
              </View>
              <View className='review-stay-info'>
                <Text className='review-stay-text'>
                  {formatDate(review.booking?.checkInDate)} - {formatDate(review.booking?.checkOutDate)}
                </Text>
              </View>
              <View className='review-stars-row'>
                <Text className='review-stars'>{renderStars(review.rating)}</Text>
                <Text className='review-rating-num'>{review.rating}分</Text>
              </View>
              {review.content ? (
                <Text className='review-content'>{review.content}</Text>
              ) : (
                <Text className='review-content-empty'>暂无文字评价</Text>
              )}
              <View className='review-footer'>
                <Text className='review-date'>{formatDate(review.createdAt)}</Text>
                <Text className='review-delete-btn' onClick={() => handleDelete(review.id)}>删除</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <AiChatWidget />
    </View>
  );
}

export default ReviewList;
