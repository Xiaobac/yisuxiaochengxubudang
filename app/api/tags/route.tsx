
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: 获取所有标签
 *     description: 获取系统中的所有标签列表
 *     tags:
 *       - Tags
 *     responses:
 *       200:
 *         description: 成功获取标签列表
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
 *   post:
 *     summary: 创建标签
 *     description: 创建新的标签 (需要管理员权限)
 *     tags:
 *       - Tags
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
 *     responses:
 *       201:
 *         description: 标签创建成功
 *       400:
 *         description: 标签已存在或请求无效
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权限
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    const where: { name?: { contains: string } } = {};
    if (name) {
      where.name = { contains: name };
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error('Fetch tags error:', error);
    return NextResponse.json({ success: false, error: '获取标签列表失败' }, { status: 500 });
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
    const hasPermission = await checkPermission(userId, 'TAG_CREATE');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: '无权创建标签' }, { status: 403 });
    }

    // 3. 处理请求
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: '标签名称不能为空' }, { status: 400 });
    }

    // 4. 防止重复
    const existingTag = await prisma.tag.findUnique({
      where: { name: name.trim() }
    });
    if (existingTag) {
      return NextResponse.json({ success: false, error: '标签已存在' }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({ success: true, data: tag }, { status: 201 });

  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json({ success: false, error: '创建标签失败' }, { status: 500 });
  }
}
