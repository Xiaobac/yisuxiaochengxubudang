import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     description: 获取所有用户列表（仅管理员可见）
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       name:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       role:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权访问
 *       500:
 *         description: 服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    // 公开接口：按角色筛选（如 ?role=MERCHANT）— 仅返回基本信息，用于注册页选择商户
    if (roleFilter) {
      const users = await prisma.user.findMany({
        where: {
          role: { name: roleFilter.toUpperCase() },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: users });
    }

    // 完整用户列表：需要认证和权限
    // 1. 验证身份
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    // 2. 权限检查：使用统一权限检查函数
    const hasPermission = await checkPermission(userId, 'USER_READ');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: '无权查看用户列表' }, { status: 403 });
    }

    // 3. 获取用户列表
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ success: false, error: '获取用户列表失败' }, { status: 500 });
  }
}
