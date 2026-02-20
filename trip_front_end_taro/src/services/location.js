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
export const getLocations = async (params = {}) => {
  try {
    let url = '/locations';
    const queryList = [];
    if (params.name) queryList.push(`name=${encodeURIComponent(params.name)}`);
    if (params.type) queryList.push(`type=${encodeURIComponent(params.type)}`);
    
    if (queryList.length > 0) {
      url += `?${queryList.join('&')}`;
    }

    const res = await get(url);

    console.log('✅ 获取位置列表成功:', res);

    return res;
  } catch (error) {
    console.error('❌ 获取位置列表失败:', error);
    throw error;
  }
};

/**
 * 获取位置详情
 * @param {number} id - 位置 ID
 * @returns {Promise} 返回位置详情
 */
export const getLocationById = async (id) => {
  try {
    const res = await get(`/locations/${id}`);

    console.log('✅ 获取位置详情成功:', res);

    return res;
  } catch (error) {
    console.error('❌ 获取位置详情失败:', error);
    throw error;
  }
};

export default {
  getLocations,
  getLocationById,
};
