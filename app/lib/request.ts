import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getRefreshToken, setToken, clearAuth } from './token';

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 处理 Token 刷新的逻辑
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

// 处理队列中的请求
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token（客户端）
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error: AxiosError<any>) => {
    // 错误处理（移除 message 调用，错误在组件中处理）
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // 检查是否是 401 错误，且存在 request config
    if (error.response?.status === 401 && originalRequest) {
      const url = originalRequest.url;

      // 排除登录接口和刷新接口本身的 401 错误，避免死循环
      // 如果已经是重试过的请求，也不再重试
      if (
        typeof window !== 'undefined' && 
        !url?.includes('/auth/login') && 
        !url?.includes('/auth/refresh') &&
        !originalRequest._retry
      ) {
        if (isRefreshing) {
          // 当前正在刷新，将请求加入队列
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
              }
              return request(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = getRefreshToken();
          
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          // 手动调用刷新接口，避免走拦截器逻辑
          const response = await fetch('/api/auth/refresh', {
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
          const { accessToken } = data;

          if (accessToken) {
            setToken(accessToken);
            
            // 更新当前请求的 Header
            if (originalRequest.headers) {
               originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
            }
            
            // 处理队列中的等待请求
            processQueue(null, accessToken);
            
            // 重试当前请求
            return request(originalRequest);
          } else {
             throw new Error('Refresh failed with no token');
          }

        } catch (refreshError) {
          processQueue(refreshError, null);
          clearAuth();
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    // 如果不是 401 或者 是登录/刷新接口的错误，或者重试失败
    if (error.response?.status === 401 && typeof window !== 'undefined' && !error.config?.url?.includes('/auth/login')) {
         clearAuth();
         window.location.href = '/auth/login';
    }

    return Promise.reject(error);
  }
);

export default request;

// 导出类型化的请求方法
export const get = <T = any>(url: string, config?: AxiosRequestConfig) =>
  request.get<T, T>(url, config);

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  request.post<T, T>(url, data, config);

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  request.put<T, T>(url, data, config);

export const patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  request.patch<T, T>(url, data, config);

export const del = <T = any>(url: string, config?: AxiosRequestConfig) =>
  request.delete<T, T>(url, config);
