import { get, post, patch } from '@/app/lib/request';
import type { Hotel, ReviewData, ReviewResponse, HotelStatus } from '@/app/types';

/**
 * 获取待审核酒店列表（管理员）
 */
export const getPendingHotels = () => {
  return get<Hotel[]>('/review/pending');
};

/**
 * 审核酒店（管理员）
 */
export const reviewHotel = (id: number, data: ReviewData) => {
  return post<ReviewResponse>(`/review/hotels/${id}`, data);
};

/**
 * 更新酒店状态（管理员）
 */
export const updateHotelStatus = (id: number, status: HotelStatus) => {
  return patch<ReviewResponse>(`/review/hotels/${id}/status`, { status });
};
