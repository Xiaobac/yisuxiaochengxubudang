import { get, post } from '@/app/lib/request';
import type { RoomType, RoomAvailability, ApiResponse } from '@/app/types';

/**
 * 获取酒店的所有房型
 */
export const getHotelRoomTypes = async (hotelId: number) => {
  const response = await get<ApiResponse<RoomType[]>>(`/hotels/${hotelId}/room-types`);
  return response.data;
};

/**
 * 创建房型
 */
export const createRoomType = async (hotelId: number, data: Partial<RoomType>) => {
  const response = await post<ApiResponse<RoomType>>(`/hotels/${hotelId}/room-types`, data);
  return response.data;
};

/**
 * 获取房型的可用性日历（库存和价格）
 */
export const getRoomAvailability = async (
  roomTypeId: number,
  startDate?: string,
  endDate?: string
) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryString = params.toString();
  const url = `/room-types/${roomTypeId}/availability${queryString ? `?${queryString}` : ''}`;

  const response = await get<ApiResponse<RoomAvailability[]>>(url);
  return response.data;
};

/**
 * 批量设置房型的可用性（价格和库存）
 */
export const updateRoomAvailability = async (
  roomTypeId: number,
  data: Array<{
    date: string;
    price?: number;
    quota?: number;
    isClosed?: boolean;
  }>
) => {
  const response = await post<ApiResponse<RoomAvailability[]>>(
    `/room-types/${roomTypeId}/availability`,
    { data }
  );
  return response.data;
};

/**
 * 房型可用性扩展类型（包含房型信息）
 */
export interface RoomTypeWithAvailability extends RoomAvailability {
  roomType?: RoomType;
}

/**
 * 获取指定日期和酒店的所有房型可用性
 */
export const getRoomAvailabilityByDate = async (hotelId: number, date: string) => {
  const response = await get<ApiResponse<RoomTypeWithAvailability[]>>(`/room-availability?hotelId=${hotelId}&date=${date}`);
  return response.data;
};

