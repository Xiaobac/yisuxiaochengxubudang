import { get, post, put, del } from '@/app/lib/request';
import type { ApiResponse, User } from '@/app/types';

// 职员管理
export const getMyStaff = () => {
  return get<ApiResponse<User[]>>('/users', { params: { myStaff: 'true' } });
};

export const createStaff = (data: { email: string; password: string; name?: string; phone?: string; merchantId: number }) => {
  return post<ApiResponse<User>>('/auth/register', { ...data, role: 'staff' });
};

export const updateStaff = (id: number, data: { name?: string; phone?: string }) => {
  return put<ApiResponse<User>>(`/users/${id}`, data);
};

export const deleteStaff = (id: number) => {
  return del<ApiResponse>(`/users/${id}`);
};

// 个人信息
export const getProfile = () => {
  return get<ApiResponse<User>>('/users/profile');
};

export const updateProfile = (id: number, data: { name?: string; phone?: string }) => {
  return put<ApiResponse<User>>(`/users/${id}`, data);
};

export const changePassword = (id: number, data: { oldPassword: string; newPassword: string }) => {
  return put<ApiResponse>(`/users/${id}`, data);
};
