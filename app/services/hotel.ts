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
export const getMyHotels = async () => {
  // 后端需要根据当前用户 ID 过滤酒店
  // 从 localStorage 获取用户信息
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!userStr) {
    throw new Error('用户未登录');
  }

  const user = JSON.parse(userStr);
  const response = await get<{ success: boolean; data: any[] }>(`/hotels?merchantId=${user.id}`);

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
    facilities: Array.isArray(hotel.facilities) ? hotel.facilities : [],
    description: hotel.description || '',
    images: Array.isArray(hotel.images) ? hotel.images : [],
    status: hotel.status === 'published' ? 'published' : hotel.status === 'pending' ? 'draft' : 'offline',
    Rooms: [], // 需要单独获取房型
  }));
};

/**
 * 创建酒店（商户）
 */
export const createHotel = async (data: HotelFormData) => {
  // 获取当前用户 ID
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!userStr) {
    throw new Error('用户未登录');
  }

  const user = JSON.parse(userStr);

  // 转换前端数据格式为后端格式
  const backendData = {
    nameZh: data.name,
    nameEn: data.name_en || '',
    address: data.address,
    starRating: data.star_rating,
    description: data.description,
    facilities: data.facilities, // 后端期望 JSON 对象
    openingYear: data.opening_date ? parseInt(data.opening_date.split('-')[0]) : new Date().getFullYear(),
    images: data.images,
    merchantId: user.id,
    locationId: 1, // 暂时硬编码，后续需要从表单获取
  };

  const response = await post<{ success: boolean; data: any }>('/hotels', backendData);
  return response.data;
};

/**
 * 更新酒店（商户）
 */
export const updateHotel = async (id: number, data: Partial<HotelFormData>) => {
  // 转换前端数据格式为后端格式
  const backendData: any = {};

  if (data.name) backendData.nameZh = data.name;
  if (data.name_en) backendData.nameEn = data.name_en;
  if (data.address) backendData.address = data.address;
  if (data.star_rating !== undefined) backendData.starRating = data.star_rating;
  if (data.description) backendData.description = data.description;
  if (data.facilities) backendData.facilities = data.facilities;
  if (data.images) backendData.images = data.images;
  if (data.opening_date) {
    backendData.openingYear = parseInt(data.opening_date.split('-')[0]);
  }

  const response = await put<{ success: boolean; data: any }>(`/hotels/${id}`, backendData);
  return response.data;
};

/**
 * 删除酒店（商户）
 */
export const deleteHotel = async (id: number) => {
  const response = await del<{ success: boolean }>(`/hotels/${id}`);
  return response;
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
