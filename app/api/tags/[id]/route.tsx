
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: 更新标签
 *     description: 更新标签名称 (需要管理员权限)
 *     tags:
 *       - Tags
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除标签
 *     description: 删除标签 (需要管理员权限)
 *     tags:
 *       - Tags
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 */

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const hasPermission = await checkPermission(authResult.user.userId, 'TAG_UPDATE');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: '无权修改标签' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: '标签名称不能为空' }, { status: 400 });
    }

    // 检查是否有重名 (除了自己)
    const existingTag = await prisma.tag.findFirst({
        where: { 
            name: name.trim(),
            NOT: { id: id }
        }
    });
    if (existingTag) {
        return NextResponse.json({ success: false, error: '标签名称已存在' }, { status: 400 });
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, data: updatedTag });
  } catch (error) {
    console.error('Update tag error:', error);
    // 处理 P2025 Record not found
    return NextResponse.json({ success: false, error: '更新标签失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const hasPermission = await checkPermission(authResult.user.userId, 'TAG_DELETE');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: '无权删除标签' }, { status: 403 });
    }

    const id = parseInt(params.id);

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: '标签已删除' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ success: false, error: '删除标签失败' }, { status: 500 });
  }
}
