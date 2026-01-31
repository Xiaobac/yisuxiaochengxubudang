
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/room-types/{id}/availability:
 *   get:
 *     summary: 获取房型库存日历
 *     description: 获取指定日期范围内的库存和价格配置
 *     tags:
 *       - RoomAvailability
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 房型ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 成功获取
 *   post:
 *     summary: 设置库存/价格
 *     description: 酒店拥有者批量设置某一天的库存和价格
 *     tags:
 *       - RoomAvailability
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
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - date
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     price:
 *                       type: number
 *                     quota:
 *                       type: integer
 *                     isClosed:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: 设置成功
 */

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const roomTypeId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // 默认查询未来30天
    const start = startDateStr ? new Date(startDateStr) : new Date();
    const end = endDateStr ? new Date(endDateStr) : new Date(new Date().setDate(new Date().getDate() + 30));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ success: false, error: '日期格式无效' }, { status: 400 });
    }

    const availabilities = await prisma.roomAvailability.findMany({
      where: {
        roomTypeId,
        date: {
            gte: start,
            lte: end,
        }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({ success: true, data: availabilities });
  } catch (error) {
    console.error('Fetch availability error:', error);
    return NextResponse.json({ success: false, error: '获取库存日历失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const roomTypeId = parseInt(params.id);

    // 1. 验证身份
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    // 2. 验证房型所有权
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: { select: { merchantId: true } } }
    });

    if (!roomType || !roomType.hotel) {
      return NextResponse.json({ success: false, error: '房型不存在' }, { status: 404 });
    }

    if (roomType.hotel.merchantId !== userId) {
      return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
    }

    // 3. 批量更新
    const body = await request.json();
    const { data } = body; // Expecting array of updates

    if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ success: false, error: '数据格式错误' }, { status: 400 });
    }

    // 使用事务处理批量 upsert
    const results = await prisma.$transaction(
        data.map((item: any) => {
            const date = new Date(item.date);
            if (isNaN(date.getTime())) throw new Error('Invalid date');

            return prisma.roomAvailability.upsert({
                where: {
                    roomTypeId_date: {
                        roomTypeId,
                        date: date
                    }
                },
                update: {
                    price: item.price !== undefined ? item.price : undefined,
                    quota: item.quota !== undefined ? item.quota : undefined,
                    isClosed: item.isClosed !== undefined ? item.isClosed : undefined,
                },
                create: {
                    roomTypeId,
                    date: date,
                    price: item.price ?? roomType.price,
                    quota: item.quota ?? roomType.stock, // 默认使用房型基础库存
                    isClosed: item.isClosed ?? false,
                    booked: 0 // 新记录初始占用为 0
                }
            });
        })
    );

    return NextResponse.json({ success: true, data: results });

  } catch (error) {
    console.error('Update availability error:', error);
    return NextResponse.json({ success: false, error: '设置库存失败' }, { status: 500 });
  }
}
