import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';

export interface DecodedUser {
  userId: number;
  email: string;
  role: string | undefined;
  roleId: number | null;
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
