import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea, Button, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { getMyReviews, deleteReview, createReview, updateReview } from '../../services/comments'; // Use combined service
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
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);

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

  const handleEdit = (review) => {
    // Ideally navigate to an edit page or show modal
    // For simplicity here, let's use a very simple inline edit mode or modal simulation
    // Since Taro modals are limited for inputs, we might need a custom View overlay
    // But user asked for "capability", let's assume navigating to a new page is better UX
    // OR we can implement a simple edit state here if the UI allows.
    // Let's use a simple state toggle for now.
    setEditingId(review.id);
    setEditContent(review.content || '');
    setEditRating(review.rating || 5);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateReview(editingId, editRating, editContent);
      Taro.showToast({ title: '修改成功', icon: 'success' });
      // Refresh list
      loadReviews();
      setEditingId(null);
    } catch (error) {
      Taro.showToast({ title: '修改失败', icon: 'none' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
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
              </View>
              <View className='review-stars-row'>
                <Text className='review-stars'>{renderStars(review.score)}</Text>
                <Text className='review-rating-num'>{review.score}分</Text>
              </View>
              {review.content ? (
                <Text className='review-content'>{review.content}</Text>
              ) : (
                <Text className='review-content-empty'>暂无文字评价</Text>
              )}
              
              {editingId === review.id ? (
                <View className='edit-box'>
                  <Text>评分:</Text>
                  <Input 
                    type='number' 
                    value={editRating} 
                    onInput={(e) => setEditRating(Number(e.detail.value))} 
                    className='edit-input' 
                  />
                  <Text>内容:</Text>
                  <Textarea 
                    value={editContent} 
                    onInput={(e) => setEditContent(e.detail.value)} 
                    className='edit-textarea' 
                  />
                  <View className='edit-actions'>
                    <Button size='mini' onClick={handleSaveEdit}>保存</Button>
                    <Button size='mini' onClick={handleCancelEdit}>取消</Button>
                  </View>
                </View>
              ) : (
                <View className='review-footer'>
                  <Text className='review-date'>{formatDate(review.createdAt)}</Text>
                  <View className='footer-btns'>
                    <Text className='review-edit-btn' onClick={() => handleEdit(review)}>编辑</Text>
                    <Text className='review-delete-btn' onClick={() => handleDelete(review.id)}>删除</Text>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
      <AiChatWidget />
    </View>
  );
}

export default ReviewList;
