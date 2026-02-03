import { post, get } from '@/app/lib/request';
import type {
  LoginData,
  RegisterData,
  AuthResponse,
  User,
  ApiResponse,
} from '@/app/types';

/**
 * 用户注册
 */
export const register = (data: RegisterData) => {
  return post<ApiResponse<User>>('/auth/register', data);
};

/**
 * 用户登录
 */
export const login = (data: LoginData) => {
  return post<AuthResponse>('/auth/login', data);
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return get<ApiResponse<User>>('/users/profile');
};

/**
 * 退出登录（客户端）
 */
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
};

/**
 * 获取存储的用户信息
 */
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * 保存用户信息和 token
 */
export const saveAuth = (token: string, user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};
