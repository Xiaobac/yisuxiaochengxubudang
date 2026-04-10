import { get, post, put, del } from './request';
import { storage } from '../utils/storage';

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
 * 获取我的评价列表
 */
export const getMyReviews = () => {
  const user = storage.getUser();
  return get('/comments', { userId: user?.id });
};

/**
 * 获取酒店评价列表
 * @param {number} hotelId
 */
export const getReviewsByHotelId = (hotelId) => {
  return getComments({ hotelId });
};

/**
 * 提交评价
 */
export const createReview = (hotelId, rating, content) => {
  return createComment({ hotelId, score: rating, content });
};

/**
 * 修改评价
 */
export const updateReview = (reviewId, rating, content) => {
  const id = String(reviewId).replace(/^[c_r_]+/, '');
  return updateComment(id, { score: rating, content });
};

/**
 * 删除评价
 */
export const deleteReview = (reviewId) => {
  const id = String(reviewId).replace(/^[c_r_]+/, '');
  return deleteComment(id);
};

/**
 * 获取酒店聚合评论
 * @param {number} hotelId
 */
export const getHotelCommentsCombined = async (hotelId) => {
  try {
    const commentsRes = await getComments({ hotelId });

    const commentList = commentsRes.success && commentsRes.data
      ? commentsRes.data.map(c => ({
          id: `c_${c.id}`,
          user: c.user,
          score: c.score,
          content: c.content,
          createdAt: c.createdAt,
          roomType: null,
        }))
      : [];

    return commentList.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } catch {
    return [];
  }
};

/**
 * 创建评论
 */
export const createComment = (data) => {
  return post('/comments', data);
};

/**
 * 修改评论
 */
export const updateComment = (id, data) => {
  return put(`/comments/${id}`, data);
};

/**
 * 删除评论
 */
export const deleteComment = (id) => {
  return del(`/comments/${id}`);
};
