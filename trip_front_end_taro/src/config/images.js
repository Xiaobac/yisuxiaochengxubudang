/**
 * 图片资源配置
 * 统一管理应用中使用的图片URL
 */

// API服务器地址（根据环境切换）
const API_BASE = 'http://localhost:3000';    // 开发环境

// 默认酒店图片
export const DEFAULT_HOTEL_IMAGE = `${API_BASE}/uploads/1770189062477-9-2026-02-03185959.png`;
export const DEFAULT_AVATAR = 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'; // Adding a default avatar

// Banner轮播图（src 为展示图片，url 为点击后跳转的页面路径，isTab 为 tabBar 页面需用 switchTab）
export const BANNER_IMAGES = [
  { src: `${API_BASE}/home1.png`, url: '/pages/Coupon/index' },
  { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', url: '/pages/hotelDetail/index?id=14' },
  { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', url: '/pages/hotelDetail/index?id=18' },
  { src: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800', url: '/pages/hotelDetail/index?id=22' },
];

// 获取图片URL（如果已经是完整URL则直接返回，否则拼接）
export const getImageUrl = (imagePath) => {
  if (!imagePath) return DEFAULT_HOTEL_IMAGE;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
};

export default {
  DEFAULT_HOTEL_IMAGE,
  BANNER_IMAGES,
  getImageUrl
};
