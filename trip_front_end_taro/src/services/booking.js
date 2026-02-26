/**
 * 预订服务
 * 处理酒店预订相关的 API 请求
 */
import { get, post, put, del } from './request';

/**
 * 创建预订
 * @param {object} data - 预订数据
 * @param {number} data.hotelId - 酒店 ID
 * @param {number} data.roomTypeId - 房型 ID
 * @param {string} data.checkInDate - 入住日期 YYYY-MM-DD
 * @param {string} data.checkOutDate - 离店日期 YYYY-MM-DD
 * @param {number} data.guestCount - 入住人数
 * @param {number} data.totalPrice - 总价
 * @param {string} data.specialRequests - 特殊要求
 * @returns {Promise} 返回预订结果
 */
export const createBooking = (data) => {
  return post('/bookings', {
    hotelId: data.hotelId,
    roomTypeId: data.roomTypeId,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    guestCount: data.guestCount || 1,
    totalPrice: data.totalPrice,
    guestInfo: {
      specialRequests: data.specialRequests || '',
      guestName: data.guestName || '',
      guestPhone: data.guestPhone || '',
      arrivalTime: data.arrivalTime || '',
    },
  });
};

/**
 * 获取我的预订列表
 * @param {object} params - 查询参数
 * @param {string} params.status - 订单状态筛选
 * @returns {Promise} 返回预订列表
 */
export const getMyBookings = (params = {}) => {
  return get('/bookings', params);
};

/**
 * 获取预订详情
 * @param {number} id - 预订 ID
 * @returns {Promise} 返回预订详情
 */
export const getBookingById = (id) => {
  return get(`/bookings/${id}`);
};

/**
 * 更新预订状态
 * @param {number} id - 预订 ID
 * @param {string} status - 新状态
 * @returns {Promise} 返回更新结果
 */
export const updateBookingStatus = (id, status) => {
  return put(`/bookings/${id}`, { status });
};

/**
 * 取消预订
 * @param {number} id - 预订 ID
 * @returns {Promise} 返回取消结果
 */
export const cancelBooking = (id) => {
  return put(`/bookings/${id}`, { status: 'cancelled' });
};

/**
 * 删除预订
 * @param {number} id - 预订 ID
 * @returns {Promise} 返回删除结果
 */
export const deleteBooking = (id) => {
  return del(`/bookings/${id}`);
};

export default {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
};
