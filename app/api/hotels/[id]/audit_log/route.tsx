import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { checkPermission } from '@/app/api/utils/permissions';

/**
 * @swagger
 * /api/hotels/{id}/audit_log:
 *   get:
 *     summary: 获取酒店审核日志
 *     description: 获取指定酒店的审核历史记录
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
 *         description: 成功获取审核日志
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
 *                       oldStatus:
 *                         type: string
 *                       newStatus:
 *                         type: string
 *                       comment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       operator:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *       401:
 *         description: 未认证
 *       403:
 *         description: 无权访问
 *       404:
 *         description: 酒店不存在
 *       500:
 *         description: 服务器内部错误
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
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    // 2. 检查酒店是否存在
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { merchantId: true }
    });

    if (!hotel) {
      return NextResponse.json({ success: false, error: '酒店不存在' }, { status: 404 });
    }

    // 3. 权限检查：仅 酒店拥有者 或 拥有审核权限的管理员 可查看
    const isOwner = hotel.merchantId === userId;
    
    // 获取用户权限详情
    const hasAuditPermission = await checkPermission(userId, 'HOTEL_AUDIT');

    if (!isOwner && !hasAuditPermission) {
      return NextResponse.json({ success: false, error: '无权查看审核日志' }, { status: 403 });
    }

    // 4. 查询日志
    const logs = await prisma.hotelAuditLog.findMany({
      where: { hotelId },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: logs });

  } catch (error) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json({ success: false, error: '获取审核日志失败' }, { status: 500 });
  }
}
