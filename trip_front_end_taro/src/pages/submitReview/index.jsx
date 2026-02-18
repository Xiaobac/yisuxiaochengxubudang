import React, { useState } from 'react';
import { View, Text, Textarea, Button, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { createReview } from '../../services/comments';
import { useTheme } from '../../utils/useTheme';
import './index.css';

function SubmitReview() {
  const { cssVars } = useTheme();
  const router = useRouter();
  const { orderId, hotelId, hotelName } = router.params;
  
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '请输入评价内容', icon: 'none' });
      return;
    }
    
    setLoading(true);
    try {
      await createReview(hotelId, rating, content);
      Taro.showToast({ title: '评价提交成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='submit-review-container' style={cssVars}>
      <View className='header'>
        <Text className='header-title'>评价 {decodeURIComponent(hotelName || '酒店')}</Text>
      </View>
      
      <View className='form-card'>
        <Text className='label'>评分 (1-5)</Text>
        <View className='rating-input-row'>
           {[1,2,3,4,5].map(star => (
             <Text 
               key={star} 
               className={`star-icon ${rating >= star ? 'active' : ''}`}
               onClick={() => setRating(star)}
             >★</Text>
           ))}
           <Text className='rating-val'>{rating}分</Text>
        </View>

        <Text className='label'>评价内容</Text>
        <Textarea 
          className='content-input'
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          placeholder='请输入您的入住体验...'
          maxlength={500}
        />
        
        <Button 
          className='submit-btn' 
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        >
          提交评价
        </Button>
      </View>
    </View>
  );
}

export default SubmitReview;
