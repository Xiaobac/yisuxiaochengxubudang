import { get, post, put, del } from '@/app/lib/request';
import type { ApiResponse, Tag, Location } from '@/app/types';

// --- Tags ---

export const getTags = (name?: string) => {
  return get<ApiResponse<Tag[]>>('/tags', { params: { name } });
};

export const createTag = (name: string) => {
  return post<ApiResponse<Tag>>('/tags', { name });
};

export const updateTag = (id: number, name: string) => {
  return put<ApiResponse<Tag>>(`/tags/${id}`, { name });
};

export const deleteTag = (id: number) => {
  return del<ApiResponse<void>>(`/tags/${id}`);
};

// --- Locations ---

export const getLocations = (params?: { name?: string; type?: string }) => {
  return get<ApiResponse<Location[]>>('/locations', { params });
};

export const createLocation = (name: string, description?: string, type?: string, parentId?: number) => {
  return post<ApiResponse<Location>>('/locations', { name, description, type, parentId });
};

export const updateLocation = (id: number, name: string, description?: string, type?: string, parentId?: number) => {
  return put<ApiResponse<Location>>(`/locations/${id}`, { name, description, type, parentId });
};

export const deleteLocation = (id: number) => {
  return del<ApiResponse<void>>(`/locations/${id}`);
};
