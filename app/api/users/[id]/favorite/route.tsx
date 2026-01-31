
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/users/{id}/favorite:
 *   get:
 *     summary: 获取用户收藏列表
 *     description: 获取指定用户的酒店收藏列表 (仅限用户本人)
 *     tags:
 *       - Favorites
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取收藏列表
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
 *                       hotelId:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                       hotel:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nameZh:
 *                             type: string
 *                           nameEn:
 *                             type: string
 *                           address:
 *                             type: string
 *                           starRating:
 *                             type: integer
 *                           images:
 *                             type: object
 *                           location:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *   post:
 *     summary: 添加收藏
 *     description: 添加酒店到收藏列表 (仅限用户本人)
 *     tags:
 *       - Favorites
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *             properties:
 *               hotelId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 收藏成功
 *       400:
 *         description: 请求无效或已收藏
 *   delete:
 *     summary: 取消收藏
 *     description: 从收藏列表中移除酒店 (仅限用户本人)
 *     tags:
 *       - Favorites
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *       - in: query
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 酒店ID
 *     responses:
 *       200:
 *         description: 取消收藏成功
 */

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const targetUserId = parseInt(params.id);

    // 1. 身份验证
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    // 2. 权限验证 (仅本人可查)
    // 注意：如果系统需求允许查看他人收藏，可在此调整。这里默认保护隐私。
    if (authResult.user.userId !== targetUserId) {
        return NextResponse.json({ success: false, error: '无权访问此数据' }, { status: 403 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: targetUserId },
      include: {
        hotel: {
            select: {
                id: true,
                nameZh: true,
                nameEn: true,
                address: true,
                starRating: true,
                images: true, // 列表展示可能需要图片
                location: { select: { name: true } }
            }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: favorites });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    return NextResponse.json({ success: false, error: '获取收藏列表失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const targetUserId = parseInt(params.id);

    // 1. 身份验证
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    // 2. 权限验证 (仅本人可操作)
    if (authResult.user.userId !== targetUserId) {
        return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
    }

    const body = await request.json();
    const { hotelId } = body;

    if (!hotelId || typeof hotelId !== 'number') {
        return NextResponse.json({ success: false, error: 'Invalid hotelId' }, { status: 400 });
    }

    // 3. 检查酒店是否存在
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
        return NextResponse.json({ success: false, error: '酒店不存在' }, { status: 404 });
    }

    // 4. 创建收藏
    // 使用 create，如果已存在会抛出错误 (因为复合主键)
    const favorite = await prisma.favorite.create({
      data: {
        userId: targetUserId,
        hotelId: hotelId,
      },
    });

    return NextResponse.json({ success: true, data: favorite }, { status: 201 });

  } catch (error: any) {
    // P2002: Unique constraint failed
    if (error.code === 'P2002') {
        return NextResponse.json({ success: false, error: '已收藏该酒店' }, { status: 400 }); // 或者返回 200 { success: true, message: 'Already favorited' }
    }
    console.error('Add favorite error:', error);
    return NextResponse.json({ success: false, error: '收藏失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const targetUserId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const hotelIdStr = searchParams.get('hotelId');

    if (!hotelIdStr) {
        return NextResponse.json({ success: false, error: 'Missing hotelId' }, { status: 400 });
    }
    const hotelId = parseInt(hotelIdStr);

    // 1. 身份验证
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    // 2. 权限验证 (仅本人可操作)
    if (authResult.user.userId !== targetUserId) {
        return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
    }

    // 3. 删除收藏
    await prisma.favorite.delete({
      where: {
        userId_hotelId: {
            userId: targetUserId,
            hotelId: hotelId
        }
      },
    });

    return NextResponse.json({ success: true, message: '已取消收藏' });

  } catch (error: any) {
    if (error.code === 'P2025') {
        return NextResponse.json({ success: false, error: '收藏记录不存在' }, { status: 404 });
    }
    console.error('Delete favorite error:', error);
    return NextResponse.json({ success: false, error: '取消收藏失败' }, { status: 500 });
  }
}
