/**
 * 统一的认证存储管理
 * 集中管理所有与用户认证相关的 localStorage 操作
 * 解决之前分散在 auth.ts 和 token.ts 中的重复逻辑
 */

import { STORAGE_KEYS } from '@/app/constants';
import type { User } from '@/app/types';

/**
 * 认证存储工具对象
 * 提供统一的认证数据存储和读取接口
 */
export const authStorage = {
  /**
   * 获取访问令牌
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  /**
   * 设置访问令牌
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  },

  /**
   * 获取刷新令牌
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * 设置刷新令牌
   */
  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    }
  },

  /**
   * 获取用户信息
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  },

  /**
   * 设置用户信息
   */
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  },

  /**
   * 保存完整的认证信息（token + refreshToken + user）
   * 通常在登录成功后调用
   */
  saveAuth(token: string, refreshToken: string, user: User): void {
    this.setToken(token);
    this.setRefreshToken(refreshToken);
    this.setUser(user);
  },

  /**
   * 清除所有认证信息
   * 通常在登出或认证失败时调用
   */
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  /**
   * 检查是否已登录（是否有有效的 token）
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * 获取用户角色
   */
  getUserRole(): string | null {
    const user = this.getUser();
    return user?.role?.name || null;
  },

  /**
   * 检查用户是否具有指定角色
   */
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    // 兼容 'admin' 和 'administrator'
    if (role === 'admin' || role === 'administrator') {
      return userRole === 'admin' || userRole === 'administrator';
    }

    return userRole === role;
  },

  /**
   * 获取用户 ID
   */
  getUserId(): number | null {
    const user = this.getUser();
    return user?.id || null;
  },
};

// 兼容性导出：保持与原有 token.ts 的兼容
export const getToken = authStorage.getToken.bind(authStorage);
export const setToken = authStorage.setToken.bind(authStorage);
export const getRefreshToken = authStorage.getRefreshToken.bind(authStorage);
export const clearAuth = authStorage.clearAuth.bind(authStorage);
