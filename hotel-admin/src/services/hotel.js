import request from '../utils/request';

// 获取酒店列表（公开）
export const getHotels = (params) => {
  return request.get('/hotels', { params });
};

// 获取酒店详情
export const getHotelById = (id) => {
  return request.get(`/hotels/${id}`);
};

// 获取我的酒店（商户）
export const getMyHotels = () => {
  return request.get('/hotels/my/hotels');
};

// 创建酒店（商户）
export const createHotel = (data) => {
  return request.post('/hotels', data);
};

// 更新酒店（商户）
export const updateHotel = (id, data) => {
  return request.put(`/hotels/${id}`, data);
};

// 删除酒店（商户）
export const deleteHotel = (id) => {
  return request.delete(`/hotels/${id}`);
};

// 上传图片
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return request.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
