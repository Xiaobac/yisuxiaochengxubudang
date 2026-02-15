import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

// GET /api/coupons/[id] - 获取单张优惠券详情
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });
    if (!coupon) {
      return NextResponse.json({ success: false, message: '优惠券不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取详情失败' }, { status: 500 });
  }
}

// PUT /api/coupons/[id] - 修改优惠券
// 仅管理员
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: '需要管理员权限' }, { status: 403 });
  }

  const id = parseInt(params.id);

  try {
    const body = await req.json();
    const { 
      code, 
      name, 
      description, 
      discount, 
      minSpend, 
      validFrom, 
      validTo 
    } = body;

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        name,
        description,
        discount,
        minSpend,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validTo: validTo ? new Date(validTo) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updatedCoupon });
  } catch (error) {
    console.error('修改优惠券失败:', error);
    return NextResponse.json({ success: false, message: '修改优惠券失败' }, { status: 500 });
  }
}

// DELETE /api/coupons/[id] - 删除优惠券
// 仅管理员
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: '需要管理员权限' }, { status: 403 });
  }

  const id = parseInt(params.id);

  try {
    await prisma.coupon.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: '优惠券已删除' });
  } catch (error) {
    console.error('删除优惠券失败:', error);
    return NextResponse.json({ success: false, message: '删除优惠券失败' }, { status: 500 });
  }
}
