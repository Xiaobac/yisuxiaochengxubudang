import { post, get } from '@/app/lib/request';
import { authStorage } from '@/app/lib/auth-storage';
import { API_ENDPOINTS } from '@/app/constants';
import type {
  LoginData,
  RegisterData,
  AuthResponse,
  User,
  ApiResponse,
} from '@/app/types';

/**
 * 登录表单数据类型（支持 username 或 email 字段）
 */
interface LoginFormData {
  username?: string;
  email?: string;
  password: string;
}

/**
 * 后端登录响应类型
 */
interface LoginApiResponse {
  success?: boolean;
  accessToken?: string;
  token?: string;
  refreshToken: string;
  user: User;
}

/**
 * 用户注册
 */
export const register = (data: RegisterData) => {
  return post<ApiResponse<User>>(API_ENDPOINTS.AUTH.REGISTER, data);
};

/**
 * 用户登录
 */
export const login = async (data: LoginData | LoginFormData) => {
  // 后端期望接收 { email, password }，前端表单使用的是 username 字段。
  const formData = data as LoginFormData;
  const payload = {
    email: formData.username ?? formData.email ?? (data as LoginData).email,
    password: data.password,
  };

  // 后端返回 { success, accessToken, refreshToken, user }，这里做兼容处理并返回统一结构
  const res = await post<LoginApiResponse>(API_ENDPOINTS.AUTH.LOGIN, payload);

  return {
    success: res.success ?? true,
    accessToken: res.accessToken || res.token || '',
    refreshToken: res.refreshToken,
    user: res.user,
  } as AuthResponse;
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return get<ApiResponse<User>>(API_ENDPOINTS.USERS.PROFILE);
};

/**
 * 退出登录（客户端）
 */
export const logout = () => {
  authStorage.clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = API_ENDPOINTS.AUTH.LOGIN;
  }
};

/**
 * 获取存储的用户信息
 */
export const getStoredUser = (): User | null => {
  return authStorage.getUser();
};

/**
 * 保存用户信息和 token
 */
export const saveAuth = (token: string, refreshToken: string, user: User) => {
  authStorage.saveAuth(token, refreshToken, user);
};

/**
 * 获取刷新 Token
 * @deprecated 请使用 authStorage.getRefreshToken()
 */
export const getRefreshToken = (): string | null => {
  return authStorage.getRefreshToken();
};

/**
 * 刷新 Access Token
 * 注意：这个函数现在主要由 lib/request.ts 的拦截器调用
 * 大多数情况下，token 刷新是自动进行的，不需要手动调用
 */
export const refreshAccessToken = async () => {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  const data = await response.json();
  if (data.accessToken) {
    authStorage.setToken(data.accessToken);
    return data.accessToken;
  }

  throw new Error('No access token returned');
};


/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return authStorage.isAuthenticated();
};
