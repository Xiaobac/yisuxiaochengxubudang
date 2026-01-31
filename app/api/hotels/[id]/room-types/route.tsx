
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/hotels/{id}/room-types:
 *   get:
 *     summary: 获取酒店房型列表
 *     description: 获取指定酒店的所有房型信息
 *     tags:
 *       - RoomTypes
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       stock:
 *                         type: integer
 *                       amenities:
 *                         type: object
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *   post:
 *     summary: 创建房型
 *     description: 酒店拥有者创建新房型
 *     tags:
 *       - RoomTypes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 酒店ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: 房型名称
 *               description:
 *                 type: string
 *                 description: 房型描述
 *               price:
 *                 type: number
 *                 description: 基础价格
 *               stock:
 *                 type: integer
 *                 description: 基础库存
 *               amenities:
 *                 type: object
 *                 description: 设施JSON
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 图片URL列表
 *               discount:
 *                 type: number
 *                 description: 默认折扣
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *       403:
 *         description: 无权操作
 */

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const hotelId = parseInt(params.id);

    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId },
      include: {
        // 可以选择包含当天的可用性概要，或者不包含保持轻量
        // 这里仅返回基本信息
      },
      orderBy: { price: 'asc' }
    });

    return NextResponse.json({ success: true, data: roomTypes });
  } catch (error) {
    console.error('Fetch room types error:', error);
    return NextResponse.json({ success: false, error: '获取房型失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const hotelId = parseInt(params.id);

    // 1. 验证身份
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    // 2. 验证所有权
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { merchantId: true }
    });

    if (!hotel) {
      return NextResponse.json({ success: false, error: '酒店不存在' }, { status: 404 });
    }

    if (hotel.merchantId !== userId) {
      return NextResponse.json({ success: false, error: '无权操作此酒店' }, { status: 403 });
    }

    // 3. 创建房型
    const body = await request.json();
    const { name, description, price, stock, amenities, images, discount } = body;

    if (!name || !price) {
        return NextResponse.json({ success: false, error: '名称和价格必填' }, { status: 400 });
    }

    const roomType = await prisma.roomType.create({
      data: {
        hotelId,
        name,
        description,
        price,
        stock: stock ?? 0,
        amenities: amenities ?? {},
        images: images ?? [],
        discount: discount ?? 1.0,
      }
    });

    return NextResponse.json({ success: true, data: roomType }, { status: 201 });

  } catch (error) {
    console.error('Create room type error:', error);
    return NextResponse.json({ success: false, error: '创建房型失败' }, { status: 500 });
  }
}
