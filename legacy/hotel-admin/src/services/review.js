import request from '../utils/request';

// 获取待审核酒店列表（管理员）
export const getPendingHotels = () => {
  return request.get('/review/pending');
};

// 审核酒店（管理员）
export const reviewHotel = (id, data) => {
  return request.post(`/review/hotels/${id}`, data);
};

// 更新酒店状态（管理员）
export const updateHotelStatus = (id, status) => {
  return request.patch(`/review/hotels/${id}/status`, { status });
};
