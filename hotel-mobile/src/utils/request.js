import axios from 'axios';
import { Toast } from 'antd-mobile';

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
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
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 404:
          Toast.show({ content: '请求的资源不存在', icon: 'fail' });
          break;
        case 500:
          Toast.show({ content: '服务器错误', icon: 'fail' });
          break;
        default:
          Toast.show({ content: data?.error || data?.message || '请求失败', icon: 'fail' });
      }
    } else if (error.request) {
      Toast.show({ content: '网络错误,请检查网络连接', icon: 'fail' });
    } else {
      Toast.show({ content: '请求配置错误', icon: 'fail' });
    }

    return Promise.reject(error);
  }
);

export default request;
