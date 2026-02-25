'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, isAuthenticated } from '@/app/services/auth';
import type { User } from '@/app/types';

/**
 * 认证 Hook
 * 用于获取当前用户信息和检查认证状态
 * @param requiredRole - 单个角色名称或角色名称数组
 */
export function useAuth(requiredRole?: string | string[]) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 用 ref 存储 requiredRole，避免数组引用变化导致 useEffect 无限触发
  const requiredRoleRef = useRef(requiredRole);
  requiredRoleRef.current = requiredRole;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    const userRole = currentUser.role?.name?.toUpperCase();
    const role = requiredRoleRef.current;

    if (role) {
      if (!userRole) {
        router.push('/auth/login');
        return;
      }

      const roles = Array.isArray(role)
        ? role.map(r => r.toUpperCase())
        : [role.toUpperCase()];

      if (!roles.includes(userRole)) {
        console.warn(`角色不匹配: 需要 ${roles.join('|')}, 当前用户是 ${userRole}`);
        router.push('/');
        return;
      }
    }

    setUser(currentUser);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return { user, loading };
}

/**
 * 商户/职员权限 Hook
 */
export function useMerchantAuth() {
  return useAuth(['merchant', 'staff']);
}

/**
 * 管理员权限 Hook
 */
export function useAdminAuth() {
  return useAuth('admin');
}
