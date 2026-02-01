
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: 更新位置
 *     description: 更新位置信息 (需要管理员权限)
 *     tags:
 *       - Locations
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *   delete:
 *     summary: 删除位置
 *     description: 删除位置 (需要管理员权限)
 *     tags:
 *       - Locations
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

    const hasPermission = await checkPermission(authResult.user.userId, 'LOCATION_UPDATE');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: '无权修改位置' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: '位置名称不能为空' }, { status: 400 });
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim(),
      },
    });

    return NextResponse.json({ success: true, data: updatedLocation });
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json({ success: false, error: '更新位置失败' }, { status: 500 });
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

    const hasPermission = await checkPermission(authResult.user.userId, 'LOCATION_DELETE');
    if (!hasPermission) {
      return NextResponse.json({ success: false, error: '无权删除位置' }, { status: 403 });
    }

    const id = parseInt(params.id);

    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: '位置已删除' });
  } catch (error) {
    console.error('Delete location error:', error);
    return NextResponse.json({ success: false, error: '删除位置失败' }, { status: 500 });
  }
}
