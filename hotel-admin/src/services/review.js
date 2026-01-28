import request from '../utils/request';

// 获取待审核酒店列表（管理员）
export const getPendingHotels = () => {
  return request.get('/reviews/pending');
};

// 审核酒店（管理员）
export const reviewHotel = (data) => {
  return request.post('/reviews', data);
};

// 更新酒店状态（管理员）
export const updateHotelStatus = (id, status) => {
  return request.put(`/hotels/${id}/status`, { status });
};
