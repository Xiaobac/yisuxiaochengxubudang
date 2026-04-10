
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';

/**
 * @swagger
 * /api/room-types/{id}:
 *   put:
 *     summary: 更新房型
 *     description: 酒店拥有者更新房型信息
 *     tags:
 *       - RoomTypes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               amenities:
 *                 type: object
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               discount:
 *                 type: number
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                  data:
 *                    type: object
 *                    properties:
 *                      id:
 *                        type: integer
 *                      name:
 *                        type: string
 *   delete:
 *     summary: 删除房型
 *     description: 酒店拥有者删除房型
 *     tags:
 *       - RoomTypes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                  message:
 *                    type: string
 */

async function checkOwnership(userId: number, roomTypeId: number) {
  // 1. 并行查询房型和用户信息（提升性能）
  const [roomType, user] = await Promise.all([
    prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: { select: { merchantId: true } } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } }, merchantId: true }
    })
  ]);

  if (!roomType || !roomType.hotel) return null;

  // 2. 检查是否是商户拥有者
  if (roomType.hotel.merchantId === userId) return true;

  // 3. 检查是否是属于该商户的员工
  if (user?.role?.name === 'STAFF' && user.merchantId === roomType.hotel.merchantId) {
    return true;
  }

  // 4. 检查管理员权限（使用统一权限检查函数）
  if (user?.role?.name === 'ADMIN' || user?.role?.name === 'SUPERADMIN') {
     return await checkPermission(userId, 'HOTEL_UPDATE');
  }

  return false;
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const roomTypeId = parseInt(params.id);
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const isOwner = await checkOwnership(authResult.user.userId, roomTypeId);
    if (isOwner === null) return NextResponse.json({ success: false, error: '房型不存在' }, { status: 404 });
    if (!isOwner) return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });

    const body = await request.json();
    // 过滤允许更新的字段
    const { name, description, price, stock, amenities, images, discount } = body;

    const updatedRoomType = await prisma.roomType.update({
        where: { id: roomTypeId },
        data: {
            name, description, price, stock, amenities, images, discount
        }
    });

    return NextResponse.json({ success: true, data: updatedRoomType });

  } catch (error) {
    console.error('Update room type error:', error);
    return NextResponse.json({ success: false, error: '更新房型失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const roomTypeId = parseInt(params.id);
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const isOwner = await checkOwnership(authResult.user.userId, roomTypeId);
    if (isOwner === null) return NextResponse.json({ success: false, error: '房型不存在' }, { status: 404 });
    if (!isOwner) return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });

    await prisma.roomType.delete({
        where: { id: roomTypeId }
    });

    return NextResponse.json({ success: true, message: '房型已删除' });

  } catch (error) {
    console.error('Delete room type error:', error);
    return NextResponse.json({ success: false, error: '删除房型失败' }, { status: 500 });
  }
}
