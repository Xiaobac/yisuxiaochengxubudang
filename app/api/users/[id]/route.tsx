import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 更新用户信息
 *     description: 更新指定用户的基本信息（本人、管理员或商户管理自己的职员）
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
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
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

    // 2. 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // 3. 权限判断：本人 / USER_UPDATE权限 / 商户管理自己的职员
    const isSelf = currentUserId === targetUserId;
    const hasAdminPermission = !isSelf && await checkPermission(currentUserId, 'USER_UPDATE');
    const isMerchantManagingStaff = !isSelf && !hasAdminPermission &&
      authResult.user.role?.toUpperCase() === 'MERCHANT' &&
      targetUser.merchantId === currentUserId;

    if (!isSelf && !hasAdminPermission && !isMerchantManagingStaff) {
      return NextResponse.json({ success: false, error: '无权修改该用户信息' }, { status: 403 });
    }

    // 4. 构建更新数据
    const updateData: { name?: string; phone?: string; password?: string } = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;

    // 5. 修改密码（仅限本人）
    if (body.oldPassword && body.newPassword) {
      if (!isSelf) {
        return NextResponse.json({ success: false, error: '只能修改自己的密码' }, { status: 403 });
      }
      const isMatch = await bcrypt.compare(body.oldPassword, targetUser.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, error: '旧密码不正确' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(body.newPassword, 10);
    }

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
 *     description: 删除指定用户账户（本人、管理员或商户删除自己的职员）
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

    // 2. 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
    }

    // 3. 权限判断：本人 / USER_DELETE权限 / 商户删除自己的职员
    const isSelf = currentUserId === targetUserId;
    const hasAdminPermission = !isSelf && await checkPermission(currentUserId, 'USER_DELETE');
    const isMerchantManagingStaff = !isSelf && !hasAdminPermission &&
      authResult.user.role?.toUpperCase() === 'MERCHANT' &&
      targetUser.merchantId === currentUserId;

    if (!isSelf && !hasAdminPermission && !isMerchantManagingStaff) {
      return NextResponse.json({ success: false, error: '无权删除该用户' }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: targetUserId }
    });

    return NextResponse.json({ success: true, message: '用户已删除' });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
