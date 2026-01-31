import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新 Token
 *     description: 使用 Refresh Token 获取新的 Access Token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh Token 无效或过期
 *       500:
 *         description: 服务器错误
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: '缺少 refreshToken' },
        { status: 400 }
      );
    }

    // 1. 验证 Refresh Token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'RefreshToken 无效或已过期' },
        { status: 401 }
      );
    }

    // 2. 检查用户是否存在 (可选但推荐)
    const userId = decoded.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 401 }
      );
    }

    // 3. 生成新的 Access Token
    const accessTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role?.name,
      roleId: user.roleId,
    };

    const newAccessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
      expiresIn: '1h', 
    });

    // 这里我们仅返回新的 AccessToken，不旋转 RefreshToken
    // 如果需要更安全，可以同时返回新的 RefreshToken 并使旧的失效（需要DB支持存储）

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: '刷新 Token 失败' },
      { status: 500 }
    );
  }
}
