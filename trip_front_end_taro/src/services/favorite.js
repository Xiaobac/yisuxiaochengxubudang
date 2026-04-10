/**
 * 收藏服务
 * 处理酒店收藏相关的 API 请求
 */
import { get, post, del } from './request';

/**
 * 添加收藏
 * @param {number} hotelId - 酒店 ID
 * @returns {Promise} 返回收藏结果
 */
export const addFavorite = (hotelId) => {
  return post('/favorites', { hotelId });
};

/**
 * 取消收藏
 * @param {number} hotelId - 酒店 ID
 * @returns {Promise} 返回取消结果
 */
export const removeFavorite = (hotelId) => {
  return del(`/favorites/${hotelId}`);
};

/**
 * 获取我的收藏列表
 * @returns {Promise} 返回收藏列表
 */
export const getMyFavorites = () => {
  return get('/favorites');
};

/**
 * 检查酒店是否已收藏
 * @param {number} hotelId - 酒店 ID
 * @returns {Promise} 返回是否已收藏
 */
export const checkFavorite = (hotelId) => {
  return get(`/favorites/check/${hotelId}`);
};

export default {
  addFavorite,
  removeFavorite,
  getMyFavorites,
  checkFavorite
};
