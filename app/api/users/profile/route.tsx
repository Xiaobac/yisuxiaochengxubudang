import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: 获取当前用户信息
 *     description: 获取当前登录用户的详细个人资料
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *       401:
 *         description: 未认证
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证身份
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    // 2. 查询用户详情
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        role: {
            select: {
                id: true,
                name: true,
                description: true
            }
        },
        points: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ success: false, error: '获取个人信息失败' }, { status: 500 });
  }
}
