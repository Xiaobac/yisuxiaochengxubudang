
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: 获取所有位置
 *     description: 获取系统中的所有位置列表
 *     tags:
 *       - Locations
 *     responses:
 *       200:
 *         description: 成功获取位置列表
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *   post:
 *     summary: 创建位置
 *     description: 创建新的地理位置 (需要管理员权限)
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 位置创建成功
 *       400:
 *         description: 请求无效
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */

export async function GET(request: NextRequest) {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error('Fetch locations error:', error);
    return NextResponse.json({ success: false, error: '获取位置列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证身份
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    // 2. 验证权限
    const userId = authResult.user.userId;
    const hasPermission = await checkPermission(userId, 'LOCATION_CREATE');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: '无权创建位置' }, { status: 403 });
    }

    // 3. 处理请求
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: '位置名称不能为空' }, { status: 400 });
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
      },
    });

    return NextResponse.json({ success: true, data: location }, { status: 201 });

  } catch (error) {
    console.error('Create location error:', error);
    return NextResponse.json({ success: false, error: '创建位置失败' }, { status: 500 });
  }
}
