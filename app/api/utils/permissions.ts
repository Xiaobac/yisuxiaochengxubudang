import { prisma } from '@/app/lib/prisma';

/**
 * 权限缓存管理
 * 使用 Map 结构缓存用户权限，避免重复查询数据库
 */
class PermissionCache {
  private cache: Map<number, { permissions: Set<string>; timestamp: number }>;
  private readonly TTL = 15 * 60 * 1000; // 15分钟过期

  constructor() {
    this.cache = new Map();
  }

  /**
   * 获取缓存的权限列表
   */
  get(userId: number): Set<string> | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }

    return cached.permissions;
  }

  /**
   * 设置用户权限缓存
   */
  set(userId: number, permissions: Set<string>): void {
    this.cache.set(userId, {
      permissions,
      timestamp: Date.now(),
    });
  }

  /**
   * 清除特定用户的缓存
   */
  clear(userId: number): void {
    this.cache.delete(userId);
  }

  /**
   * 清除所有缓存
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([userId, data]) => ({
        userId,
        permissions: Array.from(data.permissions),
        age: Date.now() - data.timestamp,
      })),
    };
  }
}

// 创建单例缓存实例
const permissionCache = new PermissionCache();

/**
 * 从数据库获取用户的所有权限
 * 优化版本：只查询需要的字段，减少数据传输量
 */
async function fetchUserPermissions(userId: number): Promise<Set<string>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          rolePermission: {
            select: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();

  if (user?.role?.rolePermission) {
    for (const rp of user.role.rolePermission) {
      permissions.add(rp.permission.name);
    }
  }

  return permissions;
}

/**
 * 检查用户是否拥有特定权限
 *
 * @param userId - 用户ID
 * @param permissionName - 权限名称
 * @returns 是否拥有权限
 *
 * 性能优化：
 * 1. 使用缓存避免重复查询（15分钟TTL）
 * 2. 只 select 需要的字段，减少数据传输
 * 3. 使用 Set 数据结构提高查找效率
 *
 * @example
 * ```typescript
 * const hasPermission = await checkPermission(userId, 'TAG_CREATE');
 * if (!hasPermission) {
 *   return NextResponse.json({ error: '无权限' }, { status: 403 });
 * }
 * ```
 */
export async function checkPermission(
  userId: number,
  permissionName: string
): Promise<boolean> {
  // 1. 尝试从缓存获取
  let permissions = permissionCache.get(userId);

  // 2. 缓存未命中，查询数据库
  if (!permissions) {
    permissions = await fetchUserPermissions(userId);
    permissionCache.set(userId, permissions);
  }

  // 3. 检查权限
  return permissions.has(permissionName);
}

/**
 * 批量检查多个权限（OR 逻辑）
 * 用户只需拥有其中任意一个权限即可
 *
 * @param userId - 用户ID
 * @param permissionNames - 权限名称数组
 * @returns 是否拥有任意一个权限
 *
 * @example
 * ```typescript
 * const hasAnyPermission = await checkAnyPermission(userId, ['TAG_CREATE', 'TAG_UPDATE']);
 * ```
 */
export async function checkAnyPermission(
  userId: number,
  permissionNames: string[]
): Promise<boolean> {
  let permissions = permissionCache.get(userId);

  if (!permissions) {
    permissions = await fetchUserPermissions(userId);
    permissionCache.set(userId, permissions);
  }

  return permissionNames.some(name => permissions!.has(name));
}

/**
 * 批量检查多个权限（AND 逻辑）
 * 用户必须拥有所有指定的权限
 *
 * @param userId - 用户ID
 * @param permissionNames - 权限名称数组
 * @returns 是否拥有所有权限
 *
 * @example
 * ```typescript
 * const hasAllPermissions = await checkAllPermissions(userId, ['TAG_CREATE', 'TAG_DELETE']);
 * ```
 */
export async function checkAllPermissions(
  userId: number,
  permissionNames: string[]
): Promise<boolean> {
  let permissions = permissionCache.get(userId);

  if (!permissions) {
    permissions = await fetchUserPermissions(userId);
    permissionCache.set(userId, permissions);
  }

  return permissionNames.every(name => permissions!.has(name));
}

/**
 * 清除用户权限缓存
 *
 * 应在以下情况调用：
 * - 用户角色变更
 * - 角色权限变更
 * - 用户登出
 *
 * @param userId - 用户ID（可选，不传则清除所有缓存）
 *
 * @example
 * ```typescript
 * // 清除特定用户缓存
 * clearPermissionCache(123);
 *
 * // 清除所有缓存
 * clearPermissionCache();
 * ```
 */
export function clearPermissionCache(userId?: number): void {
  if (userId !== undefined) {
    permissionCache.clear(userId);
  } else {
    permissionCache.clearAll();
  }
}

/**
 * 获取权限缓存统计信息（用于调试和监控）
 */
export function getPermissionCacheStats() {
  return permissionCache.getStats();
}
