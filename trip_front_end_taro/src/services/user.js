import { get, put } from './request';

/**
 * 获取用户个人信息
 * @returns {Promise}
 */
export const getUserProfile = () => {
  return get('/users/profile');
};

/**
 * 更新用户个人信息
 * @param {object} data
 * @returns {Promise}
 */
export const updateUserProfile = (data) => {
  return put('/users/profile', data);
};
