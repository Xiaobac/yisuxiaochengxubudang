import { get, post, put, del } from '@/app/lib/request';
import type {
  Hotel,
  HotelFormData,
  HotelSearchParams,
  HotelListResponse,
} from '@/app/types';

/**
 * 获取酒店列表（公开API）
 */
export const getHotels = (params?: HotelSearchParams) => {
  return get<HotelListResponse>('/hotels', { params });
};

/**
 * 根据ID获取酒店详情（公开API）
 */
export const getHotelById = (id: number) => {
  return get<Hotel>(`/hotels/${id}`);
};

/**
 * 获取我的酒店列表（商户）
 */
export const getMyHotels = () => {
  return get<Hotel[]>('/hotels/my/hotels');
};

/**
 * 创建酒店（商户）
 */
export const createHotel = (data: HotelFormData) => {
  return post<Hotel>('/hotels', data);
};

/**
 * 更新酒店（商户）
 */
export const updateHotel = (id: number, data: Partial<HotelFormData>) => {
  return put<Hotel>(`/hotels/${id}`, data);
};

/**
 * 删除酒店（商户）
 */
export const deleteHotel = (id: number) => {
  return del(`/hotels/${id}`);
};

/**
 * 上传图片
 */
export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return post<{ url: string }>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
