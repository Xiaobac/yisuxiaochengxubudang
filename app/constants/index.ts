/**
 * 应用常量定义
 * 集中管理所有硬编码的字符串，提高可维护性
 */

// ==================== API 端点常量 ====================
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/users/profile',
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id: number) => `/users/${id}`,
    PROFILE: '/users/profile',
  },
  HOTELS: {
    LIST: '/hotels',
    DETAIL: (id: number) => `/hotels/${id}`,
    CREATE: '/hotels',
    UPDATE: (id: number) => `/hotels/${id}`,
    DELETE: (id: number) => `/hotels/${id}`,
    ROOM_TYPES: (hotelId: number) => `/hotels/${hotelId}/room-types`,
  },
  BOOKINGS: {
    LIST: '/bookings',
    DETAIL: (id: number) => `/bookings/${id}`,
    CREATE: '/bookings',
    UPDATE: (id: number) => `/bookings/${id}`,
    CANCEL: (id: number) => `/bookings/${id}/cancel`,
  },
  ROOMS: {
    LIST: '/room-types',
    DETAIL: (id: number) => `/room-types/${id}`,
    AVAILABILITY: (id: number) => `/room-types/${id}/availability`,
  },
  TAGS: {
    LIST: '/tags',
    DETAIL: (id: number) => `/tags/${id}`,
    CREATE: '/tags',
  },
  LOCATIONS: {
    LIST: '/locations',
    DETAIL: (id: number) => `/locations/${id}`,
  },
  COMMENTS: {
    LIST: '/comments',
    DETAIL: (id: number) => `/comments/${id}`,
  },
  REVIEWS: {
    LIST: '/reviews',
    DETAIL: (id: number) => `/reviews/${id}`,
  },
  COUPONS: {
    LIST: '/coupons',
    DETAIL: (id: number) => `/coupons/${id}`,
    CLAIM: (id: number) => `/coupons/${id}/claim`,
  },
  FAVORITES: {
    LIST: '/favorites',
    TOGGLE: '/favorites',
  },
  AI: {
    RECOMMEND: '/ai/recommend',
    CHAT: '/ai/chat',
  },
} as const;

// ==================== 状态常量 ====================

/**
 * 酒店状态
 */
export const HOTEL_STATUS = {
  PENDING: 'pending',       // 审核中
  PUBLISHED: 'published',   // 已发布
  REJECTED: 'rejected',     // 已驳回
  OFFLINE: 'offline',       // 已下线
} as const;

export type HotelStatusType = typeof HOTEL_STATUS[keyof typeof HOTEL_STATUS];

/**
 * 订单状态
 */
export const BOOKING_STATUS = {
  PENDING: 'pending',           // 待确认
  CONFIRMED: 'confirmed',       // 已确认
  CHECKED_IN: 'checked_in',     // 已入住
  CHECKED_OUT: 'checked_out',   // 已退房
  COMPLETED: 'completed',       // 已完成
  CANCELLED: 'cancelled',       // 已取消
} as const;

export type BookingStatusType = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

/**
 * 酒店类型
 */
export const HOTEL_TYPE = {
  HOTEL: 'hotel',       // 酒店
  HOMESTAY: 'homestay', // 民宿
  HOURLY: 'hourly',     // 钟点房
} as const;

export type HotelTypeValue = typeof HOTEL_TYPE[keyof typeof HOTEL_TYPE];

/**
 * 位置类型
 */
export const LOCATION_TYPE = {
  DOMESTIC: 'domestic',   // 国内
  OVERSEAS: 'overseas',   // 海外
  PROVINCE: 'province',   // 省份
} as const;

export type LocationTypeValue = typeof LOCATION_TYPE[keyof typeof LOCATION_TYPE];

// ==================== 角色常量 ====================

/**
 * 用户角色
 */
export const ROLES = {
  STAFF: 'staff',         // 职员
  MERCHANT: 'merchant',   // 商户
  ADMIN: 'admin',         // 管理员
  ADMINISTRATOR: 'administrator', // 管理员（兼容旧数据）
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

/**
 * 权限名称
 */
export const PERMISSIONS = {
  // 酒店相关
  HOTEL_CREATE: 'HOTEL_CREATE',
  HOTEL_UPDATE: 'HOTEL_UPDATE',
  HOTEL_DELETE: 'HOTEL_DELETE',
  HOTEL_APPROVE: 'HOTEL_APPROVE',

  // 标签相关
  TAG_CREATE: 'TAG_CREATE',
  TAG_UPDATE: 'TAG_UPDATE',
  TAG_DELETE: 'TAG_DELETE',

  // 位置相关
  LOCATION_CREATE: 'LOCATION_CREATE',
  LOCATION_UPDATE: 'LOCATION_UPDATE',
  LOCATION_DELETE: 'LOCATION_DELETE',

  // 用户相关
  USER_MANAGE: 'USER_MANAGE',
  USER_DELETE: 'USER_DELETE',
} as const;

// ==================== 本地存储键 ====================

/**
 * localStorage 键名
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

// ==================== 其他常量 ====================

/**
 * 分页默认值
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * 评分范围
 */
export const RATING = {
  MIN: 1,
  MAX: 5,
} as const;

/**
 * 价格范围（用于筛选）
 */
export const PRICE_RANGE = {
  MIN: 0,
  MAX: 10000,
} as const;

/**
 * 文件上传限制
 */
export const UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

/**
 * 响应状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Ant Design 状态标签颜色映射 - 酒店状态
 */
export const HOTEL_STATUS_TAG_COLORS = {
  [HOTEL_STATUS.PENDING]: 'processing',
  [HOTEL_STATUS.PUBLISHED]: 'success',
  [HOTEL_STATUS.REJECTED]: 'error',
  [HOTEL_STATUS.OFFLINE]: 'default',
} as const;

/**
 * Ant Design 状态标签颜色映射 - 订单状态
 */
export const BOOKING_STATUS_TAG_COLORS = {
  [BOOKING_STATUS.PENDING]: 'processing',
  [BOOKING_STATUS.CONFIRMED]: 'success',
  [BOOKING_STATUS.CHECKED_IN]: 'cyan',
  [BOOKING_STATUS.CHECKED_OUT]: 'blue',
  [BOOKING_STATUS.COMPLETED]: 'green',
  [BOOKING_STATUS.CANCELLED]: 'default',
} as const;

/**
 * 状态文本映射（中文显示）- 酒店状态
 */
export const HOTEL_STATUS_TEXT = {
  [HOTEL_STATUS.PENDING]: '审核中',
  [HOTEL_STATUS.PUBLISHED]: '已发布',
  [HOTEL_STATUS.REJECTED]: '已驳回',
  [HOTEL_STATUS.OFFLINE]: '已下线',
} as const;

/**
 * 状态文本映射（中文显示）- 订单状态
 */
export const BOOKING_STATUS_TEXT = {
  [BOOKING_STATUS.PENDING]: '待确认',
  [BOOKING_STATUS.CONFIRMED]: '已确认',
  [BOOKING_STATUS.CHECKED_IN]: '已入住',
  [BOOKING_STATUS.CHECKED_OUT]: '已退房',
  [BOOKING_STATUS.COMPLETED]: '已完成',
  [BOOKING_STATUS.CANCELLED]: '已取消',
} as const;

/**
 * 酒店类型文本映射
 */
export const HOTEL_TYPE_TEXT = {
  [HOTEL_TYPE.HOTEL]: '酒店',
  [HOTEL_TYPE.HOMESTAY]: '民宿',
  [HOTEL_TYPE.HOURLY]: '钟点房',
} as const;

/**
 * 位置类型文本映射
 */
export const LOCATION_TYPE_TEXT = {
  [LOCATION_TYPE.DOMESTIC]: '国内',
  [LOCATION_TYPE.OVERSEAS]: '海外',
  [LOCATION_TYPE.PROVINCE]: '省份',
} as const;
