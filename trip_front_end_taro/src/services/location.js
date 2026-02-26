/**
 * 位置服务
 * 处理城市位置相关的 API 请求
 */
import { get } from './request';

/**
 * 获取所有位置（城市）列表
 * @param {Object} params - 查询参数 { name, type }
 * @returns {Promise} 返回位置列表
 */
export const getLocations = (params = {}) => {
  let url = '/locations';
  const queryList = [];
  if (params.name) queryList.push(`name=${encodeURIComponent(params.name)}`);
  if (params.type) queryList.push(`type=${encodeURIComponent(params.type)}`);

  if (queryList.length > 0) {
    url += `?${queryList.join('&')}`;
  }

  return get(url);
};

/**
 * 获取位置详情
 * @param {number} id - 位置 ID
 * @returns {Promise} 返回位置详情
 */
export const getLocationById = (id) => {
  return get(`/locations/${id}`);
};

export default {
  getLocations,
  getLocationById,
};
