/**
 * 标签服务
 * 处理酒店标签相关的 API 请求
 */
import { get } from './request';

/**
 * 获取所有标签列表
 * @returns {Promise} 返回标签列表
 */
export const getTags = () => {
  return get('/tags');
};

/**
 * 获取标签详情
 * @param {number} id - 标签 ID
 * @returns {Promise} 返回标签详情
 */
export const getTagById = (id) => {
  return get(`/tags/${id}`);
};

export default {
  getTags,
  getTagById,
};
