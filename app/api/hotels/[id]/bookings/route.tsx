import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, getEffectiveMerchantIdFromToken } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/hotels/{id}/bookings:
 *   get:
 *     summary: 获取酒店预订记录
 *     description: 查看特定酒店的预订记录 (需要认证，仅限商户及其员工访问)
 *     tags:
 *       - Hotels
 *     security:
 *       - bearerAuth: []
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
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                       roomType:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权访问
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

    // 1. 身份验证
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // 2. 检查酒店是否存在
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { id: true, merchantId: true }
    });

    if (!hotel) {
      return NextResponse.json({ success: false, error: '酒店不存在' }, { status: 404 });
    }

    // 3. 权限验证：仅酒店所属商户或其员工可查看
    const effectiveMerchantId = getEffectiveMerchantIdFromToken(authResult.user);

    if (hotel.merchantId !== effectiveMerchantId) {
      return NextResponse.json({ error: '无权查看该酒店的预订记录' }, { status: 403 });
    }

    // 4. 查询预订记录（脱敏用户信息）
    const bookings = await prisma.booking.findMany({
      where: { hotelId },
      include: {
        user: {
          select: { name: true } // 仅返回姓名，移除 email 和 phone
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
