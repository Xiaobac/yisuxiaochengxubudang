import { get, put } from '@/app/lib/request';
import type { Hotel } from '@/app/types';

/**
 * 获取待审核酒店列表（管理员）
 */
export const getPendingHotels = async () => {
  const response = await get<{ success: boolean; data: any[] }>('/hotels?status=pending');

  // 转换后端数据格式为前端格式
  return response.data.map((hotel: any) => ({
    id: hotel.id,
    name: hotel.nameZh,
    name_en: hotel.nameEn,
    city: hotel.location?.name || '',
    address: hotel.address,
    star_rating: hotel.starRating || 0,
    price: 0, // 需要从房型中计算最低价
    opening_date: hotel.openingYear ? `${hotel.openingYear}-01-01` : '',
    facilities: Array.isArray(hotel.facilities) ? Object.keys(hotel.facilities).filter(k => hotel.facilities[k]) : [],
    description: hotel.description || '',
    images: Array.isArray(hotel.images) ? hotel.images : [],
    status: hotel.status,
  })) as Hotel[];
};

/**
 * 审核酒店 - 通过
 */
export const approveHotel = async (id: number) => {
  const response = await put<{ success: boolean; data: any }>(`/hotels/${id}`, {
    status: 'published',
  });
  return response.data;
};

/**
 * 审核酒店 - 拒绝
 */
export const rejectHotel = async (id: number, reason: string) => {
  const response = await put<{ success: boolean; data: any }>(`/hotels/${id}`, {
    status: 'rejected',
    rejectionReason: reason,
  });
  return response.data;
};

/**
 * 更新酒店状态（管理员）
 */
export const updateHotelStatus = async (id: number, status: string) => {
  const response = await put<{ success: boolean; data: any }>(`/hotels/${id}`, { status });
  return response.data;
};
