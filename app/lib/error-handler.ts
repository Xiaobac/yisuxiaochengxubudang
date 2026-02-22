/**
 * 统一错误处理工具
 * 提供一致的错误响应格式和用户友好的错误消息
 */

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '@/app/constants';

/**
 * API 错误响应格式
 */
export interface ErrorResponse {
  error: string;
  status: number;
  details?: any;
}

/**
 * Prisma 错误码映射表
 */
const PRISMA_ERROR_MESSAGES: Record<string, string> = {
  P2002: '该记录已存在，请检查唯一字段',
  P2003: '关联的记录不存在',
  P2025: '记录未找到',
  P2014: '数据关系冲突',
  P2000: '字段值超出允许范围',
  P2001: '记录未找到',
} as const;

/**
 * 业务错误码映射表
 */
export const ERROR_MESSAGES = {
  // 认证相关
  INVALID_CREDENTIALS: '邮箱或密码错误',
  TOKEN_EXPIRED: '登录已过期，请重新登录',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '无权限执行此操作',

  // 预订相关
  INSUFFICIENT_STOCK: '抱歉，该房型库存不足',
  BOOKING_CONFLICT: '该时间段已被预订',
  INVALID_DATE_RANGE: '入住日期必须早于退房日期',

  // 酒店相关
  HOTEL_NOT_FOUND: '酒店不存在',
  HOTEL_ALREADY_EXISTS: '酒店已存在',
  HOTEL_OFFLINE: '该酒店已下线',

  // 通用错误
  VALIDATION_ERROR: '数据验证失败',
  INTERNAL_ERROR: '服务器内部错误，请稍后重试',
  NOT_FOUND: '请求的资源不存在',
} as const;

/**
 * 处理 Prisma 错误
 */
function handlePrismaError(error: PrismaClientKnownRequestError): ErrorResponse {
  const message = PRISMA_ERROR_MESSAGES[error.code] || '数据库操作失败';

  // 特殊处理唯一约束冲突，提供更详细的信息
  if (error.code === 'P2002') {
    const meta = error.meta as { target?: string[] };
    if (meta?.target) {
      const field = meta.target[0];
      return {
        error: `该${field === 'email' ? '邮箱' : field}已被注册，请使用其他${field === 'email' ? '邮箱' : field}`,
        status: HTTP_STATUS.CONFLICT,
      };
    }
  }

  // P2025: 记录未找到
  if (error.code === 'P2025') {
    return {
      error: '记录已被删除或不存在，请刷新页面',
      status: HTTP_STATUS.NOT_FOUND,
    };
  }

  return {
    error: message,
    status: HTTP_STATUS.BAD_REQUEST,
  };
}

/**
 * 处理 Zod 验证错误
 */
function handleZodError(error: ZodError): ErrorResponse {
  // 返回所有字段错误，而非仅第一个
  const fieldErrors = error.issues.reduce((acc, issue) => {
    const path = issue.path.join('.');
    acc[path] = issue.message;
    return acc;
  }, {} as Record<string, string>);

  return {
    error: ERROR_MESSAGES.VALIDATION_ERROR,
    status: HTTP_STATUS.BAD_REQUEST,
    details: {
      fieldErrors,
      message: error.issues[0].message, // 保留第一个错误作为主要消息
    },
  };
}

/**
 * 统一的 API 错误处理函数
 *
 * @param error - 捕获的错误对象
 * @param defaultMessage - 默认错误消息
 * @returns 标准化的错误响应
 *
 * @example
 * ```typescript
 * try {
 *   const result = await prisma.user.create({ data });
 * } catch (error) {
 *   return NextResponse.json(
 *     handleApiError(error, '创建用户失败'),
 *     { status: handleApiError(error, '创建用户失败').status }
 *   );
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = ERROR_MESSAGES.INTERNAL_ERROR
): ErrorResponse {
  // Prisma 数据库错误
  if (error instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Zod 验证错误
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  // 标准 Error 对象
  if (error instanceof Error) {
    // 检查是否是已知的业务错误
    const knownError = Object.entries(ERROR_MESSAGES).find(
      ([_, message]) => error.message === message
    );

    if (knownError) {
      return {
        error: error.message,
        status: HTTP_STATUS.BAD_REQUEST,
      };
    }

    return {
      error: error.message || defaultMessage,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  // 未知错误类型
  return {
    error: defaultMessage,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  };
}

/**
 * 创建标准化的成功响应
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * 创建标准化的错误响应
 */
export function createErrorResponse(error: string, details?: any) {
  return {
    success: false,
    error,
    ...(details && { details }),
  };
}

/**
 * 业务错误类（用于主动抛出业务错误）
 */
export class BusinessError extends Error {
  constructor(
    message: string,
    public status: number = HTTP_STATUS.BAD_REQUEST
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

/**
 * 便捷的业务错误创建函数
 */
export function throwBusinessError(message: string, status?: number): never {
  throw new BusinessError(message, status);
}
