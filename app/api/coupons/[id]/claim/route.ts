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

    // 统一在事务内处理，防止竞态条件
    return await prisma.$transaction(async (tx) => {
      // 1. 检查是否已领取（在事务内检查）
      const existing = await tx.userCoupon.findUnique({
        where: { userId_couponId: { userId, couponId } }
      });

      if (existing) {
        return NextResponse.json({ success: false, message: '已领取过该优惠券' }, { status: 400 });
      }

      // 2. 如果需要积分，检查并扣减积分
      if (coupon.points > 0) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { points: true }
        });

        if (!user || user.points < coupon.points) {
          throw new Error('INSUFFICIENT_POINTS');
        }

        await tx.user.update({
          where: { id: userId },
          data: { points: { decrement: coupon.points } }
        });
      }

      // 3. 创建领券记录
      const userCoupon = await tx.userCoupon.create({
        data: { userId, couponId },
      });

      return NextResponse.json(
        { success: true, message: coupon.points > 0 ? '兑换成功' : '领取成功', data: userCoupon },
        { status: 201 }
      );
    });
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_POINTS') {
      return NextResponse.json({ success: false, message: '积分不足' }, { status: 400 });
    }
    if (error.code === 'P2002') {
      // 理论上事务内已检查，但保留作为后备
      return NextResponse.json({ success: false, message: '已领取过该优惠券' }, { status: 400 });
    }
    console.error('领取优惠券失败:', error);
    return NextResponse.json({ success: false, message: '领取失败' }, { status: 500 });
  }
}
