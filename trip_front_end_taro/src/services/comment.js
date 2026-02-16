import { get, post, put, del } from './request';

/**
 * 获取评论列表
 * @param {object} params
 * @param {number} params.hotelId - 酒店ID
 * @param {number} params.userId - 用户ID
 */
export const getComments = (params) => {
  return get('/comments', params);
};

/**
 * 创建评论
 * @param {object} data
 * @param {number} data.hotelId - 酒店ID
 * @param {string} data.content - 评论内容
 * @param {number} [data.score] - 评分
 */
export const createComment = (data) => {
  return post('/comments', data);
};

/**
 * 修改评论
 * @param {number} id - 评论ID
 * @param {object} data
 * @param {string} data.content - 评论内容
 * @param {number} [data.score] - 评分
 */
export const updateComment = (id, data) => {
  return put(`/comments/${id}`, data);
};

/**
 * 删除评论
 * @param {number} id - 评论ID
 */
export const deleteComment = (id) => {
  return del(`/comments/${id}`);
};
