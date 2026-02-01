
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/room-availability/{id}:
 *   put:
 *     summary: 修改单日库存/价格
 *     description: 酒店拥有者修改特定库存记录
 *     tags:
 *       - RoomAvailability
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
 *               price:
 *                 type: number
 *               quota:
 *                 type: integer
 *               isClosed:
 *                 type: boolean
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
 *                     price:
 *                       type: number
 *                     quota:
 *                       type: integer
 *                     isClosed:
 *                       type: boolean
 *   delete:
 *     summary: 删除库存记录
 *     description: 酒店拥有者删除特定库存记录 (仅当没有预订时可删除)
 *     tags:
 *       - RoomAvailability
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
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 无法删除(已有预订)
 */

async function checkOwner(userId: number, availabilityId: number) {
    const record = await prisma.roomAvailability.findUnique({
        where: { id: availabilityId },
        include: {
            roomType: {
                include: {
                    hotel: {
                        select: { merchantId: true }
                    }
                }
            }
        }
    });

    if (!record || !record.roomType || !record.roomType.hotel) return { record: null, isOwner: false };
    return { record, isOwner: record.roomType.hotel.merchantId === userId };
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    // 1. 验证身份
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    // 2. 检查权限
    const { record, isOwner } = await checkOwner(authResult.user.userId, id);
    if (!record) return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
    if (!isOwner) return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });

    // 3. 更新
    const body = await request.json();
    const { price, quota, isClosed } = body;

    const updated = await prisma.roomAvailability.update({
        where: { id },
        data: {
            price,
            quota,
            isClosed
        }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update availability error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = parseInt(params.id);

    // 1. 验证身份
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    // 2. 检查权限
    const { record, isOwner } = await checkOwner(authResult.user.userId, id);
    if (!record) return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
    if (!isOwner) return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });

    // 3. 检查是否有预订
    if (record.booked > 0) {
        return NextResponse.json({ success: false, error: '该日期已有预订，无法直接删除记录' }, { status: 400 });
    }

    // 4. 删除
    await prisma.roomAvailability.delete({
        where: { id }
    });

    return NextResponse.json({ success: true, message: '记录已删除' });

  } catch (error) {
    console.error('Delete availability error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
