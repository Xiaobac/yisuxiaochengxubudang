import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { updateHotelScore } from '@/app/api/utils/updateHotelScore';
import { PAGINATION } from '@/app/constants';

// GET /api/comments - 获取评论列表（带分页）
// 可通过 query 参数筛选：hotelId, userId, page, limit
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const userId = searchParams.get('userId');

  // 分页参数
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(
    PAGINATION.MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION.DEFAULT_PAGE_SIZE)))
  );
  const skip = (page - 1) * limit;

  const where: { hotelId?: number; userId?: number } = {};
  if (hotelId) where.hotelId = parseInt(hotelId);
  if (userId) where.userId = parseInt(userId);

  try {
    // 并发查询总数和数据
    const [total, comments] = await prisma.$transaction([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true
            },
          },
          hotel: {
            select: {
              id: true,
              nameZh: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: comments,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('获取评论失败:', error);
    return NextResponse.json({ success: false, message: '获取评论失败' }, { status: 500 });
  }
}

// POST /api/comments - 创建评论
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { hotelId, content, score } = body;

    if (!hotelId || !content) {
      return NextResponse.json({ success: false, message: '参数不完整' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: auth.user.userId,
        hotelId: parseInt(hotelId),
        content,
        score: score ? parseFloat(score) : null,
      },
    });

    await updateHotelScore(parseInt(hotelId));

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error('创建评论失败:', error);
    return NextResponse.json({ success: false, message: '创建评论失败' }, { status: 500 });
  }
}
