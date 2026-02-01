
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/users/{id}/bookings:
 *   get:
 *     summary: 获取用户预订历史
 *     description: 查询用户的所有预订记录
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: 成功获取列表
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
 *                       checkInDate:
 *                         type: string
 *                         format: date-time
 *                       checkOutDate:
 *                         type: string
 *                         format: date-time
 *                       totalPrice:
 *                         type: number
 *                       status:
 *                         type: string
 *                       hotel:
 *                         type: object
 *                         properties:
 *                           nameZh:
 *                             type: string
 *                           nameEn:
 *                             type: string
 *                           images:
 *                             type: object
 *                       roomType:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 */

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const userId = parseInt(params.id);

    // 1. 验证
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    // 只能查自己的
    if (authResult.user.userId !== userId) {
        return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        hotel: {
            select: { nameZh: true, nameEn: true, images: true }
        },
        roomType: {
            select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Fetch user bookings error:', error);
    return NextResponse.json({ success: false, error: '获取预订记录失败' }, { status: 500 });
  }
}
