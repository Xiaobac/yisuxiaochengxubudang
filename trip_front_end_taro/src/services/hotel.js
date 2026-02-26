/**
 * 酒店服务
 * 处理酒店相关的 API 请求
 */
import { get } from './request';

/**
 * 获取酒店列表
 * @param {object} params - 查询参数
 * @param {number} params.locationId - 位置 ID
 * @param {string} params.tags - 标签列表（逗号分隔）
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.type - 酒店类型('hotel' | 'homestay' | 'hourly')
 * @param {number} params.minPrice - 最低价格
 * @param {number} params.maxPrice - 最高价格
 * @param {string} params.checkIn - 入住日期 (YYYY-MM-DD)
 * @param {string} params.checkOut - 退房日期 (YYYY-MM-DD)
 * @param {string} params.starRating - 星级
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise} 返回酒店列表
 */
export const getHotels = async (params = {}) => {
  const queryParams = {};

  if (params.locationId) {
    queryParams.locationId = params.locationId;
  }

  if (params.tags) {
    queryParams.tags = Array.isArray(params.tags) ? params.tags.join(',') : params.tags;
  }

  if (params.keyword) {
    queryParams.keyword = params.keyword;
  }

  if (params.type) {
    queryParams.type = params.type;
  }

  if (params.minPrice) {
    queryParams.minPrice = params.minPrice;
  }

  if (params.maxPrice) {
    queryParams.maxPrice = params.maxPrice;
  }

  if (params.checkIn) {
    queryParams.checkIn = params.checkIn;
  }

  if (params.checkOut) {
    queryParams.checkOut = params.checkOut;
  }

  if (params.starRating) {
    queryParams.starRating = params.starRating;
  }

  if (params.page) {
    queryParams.page = params.page;
  }

  if (params.pageSize) {
    queryParams.limit = params.pageSize;
  }
  if (params.limit) {
    queryParams.limit = params.limit;
  }

  return get('/hotels', queryParams);
};

/**
 * 获取酒店详情
 * @param {number} id - 酒店 ID
 * @returns {Promise} 返回酒店详情
 */
export const getHotelById = (id) => {
  return get(`/hotels/${id}`);
};

/**
 * 获取酒店房型列表
 * @param {number} hotelId - 酒店 ID
 * @param {string} [startDate] - 开始日期 YYYY-MM-DD，传入后返回剩余量和动态价格
 * @param {string} [endDate] - 结束日期 YYYY-MM-DD
 * @returns {Promise} 返回房型列表
 */
export const getHotelRoomTypes = (hotelId, startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return get(`/hotels/${hotelId}/room-types`, params);
};

/**
 * 获取房型可用性（库存和价格）
 * @param {number} roomTypeId - 房型 ID
 * @param {string} startDate - 开始日期 YYYY-MM-DD
 * @param {string} endDate - 结束日期 YYYY-MM-DD
 * @returns {Promise} 返回房型可用性数据
 */
export const getRoomAvailability = (roomTypeId, startDate, endDate) => {
  return get(`/room-types/${roomTypeId}/availability`, { startDate, endDate });
};

/**
 * 搜索酒店（按关键词）
 * @param {string} keyword - 搜索关键词
 * @param {object} filters - 筛选条件
 * @returns {Promise} 返回搜索结果
 */
export const searchHotels = (keyword, filters = {}) => {
  return getHotels({ keyword, ...filters });
};

export default {
  getHotels,
  getHotelById,
  getHotelRoomTypes,
  getRoomAvailability,
  searchHotels,
};
