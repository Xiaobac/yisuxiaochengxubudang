import { get, post, put, del } from './request';
// import { getReviewsByHotelId } from './review'; // Circular dependency if not careful, or just duplication.
// Let's implement getReviewsByHotelId inside comments.js or use this file as the source of truth.

/**
 * 获取评论列表
 * @param {object} params
 * @param {number} params.hotelId - 酒店ID
 * @param {number} params.userId - 用户ID
 */
export const getComments = (params) => {
  return get('/comments', params);
};

// Re-implementing functions from review.js to consolidate

export const getMyReviews = async (userId) => {
  try {
    const res = await get('/comments', { userId });
    return res;
  } catch (error) {
    console.error('获取评价列表失败:', error);
    throw error;
  }
};

export const getReviewsByHotelId = async (hotelId) => {
  try {
    const res = await getComments({ hotelId });
    return res;
  } catch (error) {
    console.error('获取酒店评价失败:', error);
    throw error;
  }
};

export const createReview = async (hotelId, rating, content) => {
  try {
    const res = await createComment({ hotelId, score: rating, content });
    return res;
  } catch (error) {
    console.error('提交评价失败:', error);
    throw error;
  }
};

export const updateReview = async (reviewId, rating, content) => {
  try {
    // Strip prefix if present (e.g. c_123 -> 123)
    const id = String(reviewId).replace(/^[c_r_]+/, '');
    const res = await updateComment(id, { score: rating, content });
    return res;
  } catch (error) {
    console.error('修改评价失败:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    // Strip prefix if present
    const id = String(reviewId).replace(/^[c_r_]+/, '');
    const res = await deleteComment(id);
    return res;
  } catch (error) {
    console.error('删除评价失败:', error);
    throw error;
  }
};

/**
 * 获取酒店聚合评论（包含评论和订单词评价）
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
  } catch (error) {
    console.error('获取聚合评论失败:', error);
    return [];
  }
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
