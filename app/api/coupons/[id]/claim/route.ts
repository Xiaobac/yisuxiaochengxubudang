import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

// POST /api/coupons/[id]/claim - 用户领取优惠券
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const authResult = verifyAuth(req);
  if (!authResult.success) {
    return NextResponse.json({ success: false, message: '请先登录' }, { status: 401 });
  }

  const userId = authResult.user.userId;
  const params = await props.params;
  const couponId = parseInt(params.id);

  if (isNaN(couponId)) {
    return NextResponse.json({ success: false, message: '优惠券ID无效' }, { status: 400 });
  }

  try {
    // 检查优惠券是否存在且在有效期内
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      return NextResponse.json({ success: false, message: '优惠券不存在' }, { status: 404 });
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
      return NextResponse.json({ success: false, message: '优惠券不在有效期内' }, { status: 400 });
    }

    // 处理积分兑换逻辑
    if (coupon.points > 0) {
      return await prisma.$transaction(async (tx) => {
        // 1. 检查用户积分
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { points: true }
        });

        if (!user || user.points < coupon.points) {
           throw new Error('INSUFFICIENT_POINTS');
        }

        // 2. 扣除积分
        await tx.user.update({
          where: { id: userId },
          data: { points: { decrement: coupon.points } }
        });

        // 3. 发放优惠券
        const userCoupon = await tx.userCoupon.create({
          data: { userId, couponId },
        });

        return NextResponse.json({ success: true, message: '兑换成功', data: userCoupon }, { status: 201 });
      });
    }

    // 创建领取记录（复合主键，重复领取会报 P2002）
    const userCoupon = await prisma.userCoupon.create({
      data: { userId, couponId },
    });

    return NextResponse.json({ success: true, data: userCoupon }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_POINTS') {
      return NextResponse.json({ success: false, message: '积分不足' }, { status: 400 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: '已领取过该优惠券' }, { status: 400 });
    }
    console.error('领取优惠券失败:', error);
    return NextResponse.json({ success: false, message: '领取失败' }, { status: 500 });
  }
}
