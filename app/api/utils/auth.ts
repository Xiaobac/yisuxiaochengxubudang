import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const raw = process.env.JWT_SECRET;
if (!raw || raw === 'your-secret-key-should-be-in-env') {
  throw new Error('[startup] JWT_SECRET 环境变量未设置或使用了默认值，请在 .env 中配置强密钥');
}
export const JWT_SECRET = raw;

export interface DecodedUser {
  userId: number;
  email: string;
  role: string | undefined;
  roleId: number | null;
  merchantId: number | null;
}

/**
 * 获取已认证用户的有效商户ID
 * 商户: 返回自己的ID
 * 职员: 返回其所属商户ID (token中的merchantId)
 */
export function getEffectiveMerchantIdFromToken(decoded: DecodedUser): number | null {
  if (decoded.role?.toUpperCase() === 'MERCHANT') return decoded.userId;
  if (decoded.role?.toUpperCase() === 'STAFF') return decoded.merchantId;
  return null;
}

export function verifyAuth(request: NextRequest): { success: true; user: DecodedUser } | { success: false; error: string; status: number } {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: '未认证用户', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: 'Token 无效或过期', status: 401 };
  }
}
