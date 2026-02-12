import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyAuth } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/room-availability:
 *   get:
 *     summary: 获取指定日期和酒店的所有房型可用性
 *     tags: [RoomAvailability]
 *     parameters:
 *       - in: query
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 酒店ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 成功获取可用性列表
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;
    if (!user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hotelId = parseInt(searchParams.get('hotelId') || '0');
    const dateStr = searchParams.get('date');

    if (!hotelId || !dateStr) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }
    
    // 验证酒店归属权限
    const hotel = await prisma.hotel.findFirst({
        where: { id: hotelId }
    });
    
    if (!hotel) {
        return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }
    
    // 允许管理员或酒店所有者
    if (user.role !== 'ADMIN' && hotel.merchantId !== user.userId) {
        return NextResponse.json({ success: false, error: '无权操作此酒店' }, { status: 403 });
    }

    // 1. 获取该酒店所有房型
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
      }
    });

    if (roomTypes.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const roomTypeIds = roomTypes.map(rt => rt.id);

    // 2. 获取这些房型在指定日期的可用性配置
    const availabilities = await prisma.roomAvailability.findMany({
      where: {
        roomTypeId: { in: roomTypeIds },
        date: new Date(dateStr),
      },
    });

    // 3. 组合数据
    const result = roomTypes.map(rt => {
      const avail = availabilities.find(a => a.roomTypeId === rt.id);
      
      // 如果有配置记录，使用配置记录；否则使用默认值
      // 注意：availability中通常存的是quota（总库存）和booked（已订），或者是quota（剩余库存）？
      // 根据之前的代码：quota = availability?.quota ?? roomType.stock;
      // available = quota - booked;
      // 假设 availability.quota 是也就是当天的总设置库存
      
      const quota = avail?.quota ?? rt.stock;
      const booked = avail?.booked ?? 0;
      const price = avail?.price ?? rt.price;
      const isClosed = avail?.isClosed ?? false;
      const available = quota - booked;

      return {
        roomTypeId: rt.id,
        room_type: rt.name, // 前端需要这个字段名
        total_count: quota,
        available_count: available >= 0 ? available : 0,
        booked_count: booked,
        price: Number(price),
        isClosed: isClosed,
        availabilityId: avail?.id // 可选，如果需要更新特定id
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Fetch availability error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
