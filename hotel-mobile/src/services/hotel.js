import request from '../utils/request';

// 获取酒店列表
export const getHotels = (params) => {
  return request.get('/hotels', { params });
};

// 获取酒店详情
export const getHotelById = (id) => {
  return request.get(`/hotels/${id}`);
};
