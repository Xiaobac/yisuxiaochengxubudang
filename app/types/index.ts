// 用户相关类型
export type UserRole = 'merchant' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

// 酒店相关类型
export type HotelStatus = 'draft' | 'published' | 'offline';

export interface Room {
  id?: number;
  room_type: string;
  price: number;
  total_count: number;
  available_count?: number;
  bed_type?: string;
  size?: string;
  max_guests?: number;
}

export interface Hotel {
  id?: number;
  name: string;
  name_en?: string;
  city: string;
  address: string;
  star_rating: number;
  price: number;
  opening_date: string;
  facilities: string[];
  description: string;
  images: string[];
  status?: HotelStatus;
  Rooms?: Room[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelFormData extends Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'> {
  Rooms: Room[];
}

// 搜索和筛选相关类型
export interface HotelSearchParams {
  city?: string;
  keyword?: string;
  checkInDate?: string;
  checkOutDate?: string;
  starRating?: number[];
  minPrice?: number;
  maxPrice?: number;
  facilities?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'default' | 'price_asc' | 'price_desc';
}

export interface HotelListResponse {
  hotels: Hotel[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 预订相关类型
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Booking {
  id?: number;
  hotel_id: number;
  hotel_name?: string;
  room_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  check_in_date: string;
  check_out_date: string;
  room_count: number;
  total_price: number;
  status: BookingStatus;
  special_requests?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BookingFormData {
  hotel_id: number;
  room_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  check_in_date: string;
  check_out_date: string;
  room_count: number;
  special_requests?: string;
}

// 审核相关类型
export interface ReviewData {
  status: 'published' | 'rejected';
  reason?: string;
}

export interface ReviewResponse {
  message: string;
  hotel: Hotel;
}

// API 响应通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 常量
export const CITIES = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '成都',
  '西安',
  '南京',
] as const;

export const STAR_RATINGS = [1, 2, 3, 4, 5] as const;

export const FACILITIES = [
  '免费WiFi',
  '停车场',
  '游泳池',
  '健身房',
  '餐厅',
  '会议室',
  '商务中心',
  '接送服务',
  '洗衣服务',
  '儿童乐园',
] as const;

export const PRICE_RANGES = [
  { label: '200元以下', min: 0, max: 200 },
  { label: '200-500元', min: 200, max: 500 },
  { label: '500-1000元', min: 500, max: 1000 },
  { label: '1000元以上', min: 1000, max: Infinity },
] as const;

export const QUICK_TAGS = [
  '亲子',
  '豪华',
  '商务',
  '度假',
  '经济型',
  '温泉',
] as const;
