import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

// GET /api/reviews - 获取当前用户的所有评价
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    where: { userId: auth.userId },
    include: {
      hotel: { select: { id: true, nameZh: true, address: true, images: true } },
      booking: { select: { id: true, checkInDate: true, checkOutDate: true, roomType: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: reviews });
}

// POST /api/reviews - 创建评价
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  const body = await req.json();
  const { bookingId, rating, content } = body;

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });
  }

  // 验证订单属于当前用户且状态为已完成
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: auth.userId },
  });

  if (!booking) {
    return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
  }

  if (!['completed', 'checked_out'].includes(booking.status)) {
    return NextResponse.json({ success: false, message: '只有已完成的订单才能评价' }, { status: 400 });
  }

  // 检查是否已评价
  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) {
    return NextResponse.json({ success: false, message: '该订单已评价' }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      userId: auth.userId,
      hotelId: booking.hotelId,
      bookingId,
      rating,
      content: content || null,
    },
  });

  return NextResponse.json({ success: true, data: review }, { status: 201 });
}
