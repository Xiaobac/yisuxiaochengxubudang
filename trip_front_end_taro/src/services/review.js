import { get, post, del } from './request';

export const getMyReviews = async () => {
  try {
    const res = await get('/reviews');
    return res;
  } catch (error) {
    console.error('获取评价列表失败:', error);
    throw error;
  }
};

export const getReviewsByHotelId = async (hotelId) => {
  try {
    const res = await get('/reviews', { hotelId });
    return res;
  } catch (error) {
    console.error('获取酒店评价失败:', error);
    throw error;
  }
};

export const createReview = async (bookingId, rating, content) => {
  try {
    const res = await post('/reviews', { bookingId, rating, content });
    return res;
  } catch (error) {
    console.error('提交评价失败:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    const res = await del(`/reviews/${reviewId}`);
    return res;
  } catch (error) {
    console.error('删除评价失败:', error);
    throw error;
  }
};
