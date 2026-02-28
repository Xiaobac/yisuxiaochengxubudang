import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 更新用户信息
 *     description: 更新指定用户的基本信息（仅限本人或管理员）
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 目标用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *       403:
 *         description: 无权修改
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const targetUserId = parseInt(params.id);
    const body = await request.json();

    // 1. 验证身份
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const currentUserId = authResult.user.userId;

    // 2. 权限判断：本人或有USER_UPDATE权限
    const isSelf = currentUserId === targetUserId;
    const hasPermission = isSelf || await checkPermission(currentUserId, 'USER_UPDATE');

    if (!hasPermission) {
      return NextResponse.json({ success: false, error: '无权修改该用户信息' }, { status: 403 });
    }

    // 3. 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }});
    if (!targetUser) {
        return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // 4. 执行更新
    const updateData: { name?: string; phone?: string } = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    // 如果允许管理员修改角色，可以在这里加判断

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: { id: true, name: true, phone: true, email: true }
    });

    return NextResponse.json({ success: true, data: updatedUser });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 删除用户账户
 *     description: 删除指定用户账户（仅限本人或管理员）
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 目标用户ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: 无权删除
 *       404:
 *         description: 用户不存在
 *       500:
 *         description: 服务器内部错误
 */
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
  ) {
    try {
      const params = await props.params;
      const targetUserId = parseInt(params.id);
  
      // 1. 验证身份
      const authResult = verifyAuth(request);
      if (!authResult.success) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
      }
      const currentUserId = authResult.user.userId;
  
      // 2. 权限判断：本人或有USER_DELETE权限
      const isSelf = currentUserId === targetUserId;
      const hasPermission = isSelf || await checkPermission(currentUserId, 'USER_DELETE');

      if (!hasPermission) {
        return NextResponse.json({ success: false, error: '无权删除该用户' }, { status: 403 });
      }
  
      // 3. 执行删除
      await prisma.user.delete({
        where: { id: targetUserId }
      });
  
      return NextResponse.json({ success: true, message: '用户已删除' });
  
    } catch (error) {
      console.error('Delete user error:', error);
      // Prisma error for checking if record exists usually handled by delete throwing error if not found? 
      // strict mode usually throws P2025. 
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }
  }
