import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/hotels/{id}/bookings:
 *   get:
 *     summary: 获取酒店预订记录
 *     description: 查看特定酒店的预订记录 (公开访问)
 *     tags:
 *       - Hotels
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 酒店ID
 *     responses:
 *       200:
 *         description: 成功获取列表
 *       404:
 *         description: 酒店不存在
 *       500:
 *         description: 服务器错误
 */

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const hotelId = parseInt(params.id);

    // 1. 检查酒店是否存在
    const hotel = await prisma.hotel.findUnique({
        where: { id: hotelId },
    });

    if (!hotel) {
        return NextResponse.json({ success: false, error: '酒店不存在' }, { status: 404 });
    }

    // 2. 查询预订记录
    // 根据用户要求，所有人都可以查看，因此移除身份验证和权限检查
    const bookings = await prisma.booking.findMany({
      where: { hotelId },
      include: {
        user: {
            // 公开接口返回敏感信息(电话/邮箱)可能存在风险
            // 但按照原需求保留了字段选择，如需脱敏请指示
            select: { name: true, email: true, phone: true }
        },
        roomType: {
            select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Fetch hotel bookings error:', error);
    return NextResponse.json({ success: false, error: '获取预订记录失败' }, { status: 500 });
  }
}
