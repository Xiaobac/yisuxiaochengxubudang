import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

// GET /api/reviews
// - 有 hotelId 参数：公开查询该酒店的所有评价（无需鉴权）
// - 无 hotelId 参数：查询当前登录用户自己的评价（需要鉴权）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelIdParam = searchParams.get('hotelId');

  if (hotelIdParam) {
    const hotelId = parseInt(hotelIdParam);
    if (isNaN(hotelId)) {
      return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { hotelId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        booking: { select: { checkInDate: true, checkOutDate: true, roomType: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: reviews });
  }

  // 无 hotelId：查当前用户自己的评价，需要鉴权
  const auth = verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  const reviews = await prisma.review.findMany({
    where: { userId: auth.user.userId },
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
  const auth = verifyAuth(req);
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
    where: { id: bookingId, userId: auth.user.userId },
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
      userId: auth.user.userId,
      hotelId: booking.hotelId,
      bookingId,
      rating,
      content: content || null,
    },
  });

  return NextResponse.json({ success: true, data: review }, { status: 201 });
}
