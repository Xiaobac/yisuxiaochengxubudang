import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

// GET /api/users/coupons - 获取当前用户已领取的优惠券列表
export async function GET(req: NextRequest) {
  const authResult = verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ success: false, message: '请先登录' }, { status: 401 });
  }

  const userId = authResult.user.userId;

  try {
    const userCoupons = await prisma.userCoupon.findMany({
      where: { userId },
      include: {
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: userCoupons });
  } catch (error) {
    console.error('获取用户优惠券失败:', error);
    return NextResponse.json({ success: false, message: '获取失败' }, { status: 500 });
  }
}
