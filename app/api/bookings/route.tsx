
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { z } from 'zod';
import { handleApiError } from '@/app/lib/error-handler';
import { PAGINATION } from '@/app/constants';

const createBookingSchema = z.object({
  hotelId:     z.number().int().positive(),
  roomTypeId:  z.number().int().positive(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  checkOutDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
  guestCount:  z.number().int().min(1).max(20).optional().default(1),
  guestInfo:   z.record(z.string(), z.any()).optional(),
  couponId:    z.number().int().positive().optional(),
});

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: 获取预订列表
 *     description: 获取预订列表。支持查询当前用户的预订，或商户查询自己名下酒店的预订。
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: query
 *         name: merchantId
 *         schema:
 *           type: integer
 *         description: 商户ID (选填，若提供则返回该商户名下酒店的所有预订)
 *     responses:
 *       200:
 *         description: 成功
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
 *   post:
 *     summary: 创建预订
 *     description: 用户预订酒店房间
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *               - roomTypeId
 *               - checkInDate
 *               - checkOutDate
 *             properties:
 *               hotelId:
 *                 type: integer
 *               roomTypeId:
 *                 type: integer
 *               checkInDate:
 *                 type: string
 *                 format: date
 *                 description: YYYY-MM-DD
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *                 description: YYYY-MM-DD
 *               guestCount:
 *                 type: integer
 *               guestInfo:
 *                 type: object
 *     responses:
 *       201:
 *         description: 预订成功
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
 *                     status:
 *                       type: string
 *                     totalPrice:
 *                       type: number
 *       400:
 *         description: 输入无效或库存不足
 *       401:
 *         description: 未登录
 */

export async function GET(request: NextRequest) {
  try {
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const currentUserId = authResult.user.userId;

    const { searchParams } = new URL(request.url);
    const merchantIdParam = searchParams.get('merchantId');

    // 分页参数
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(
      PAGINATION.MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION.DEFAULT_PAGE_SIZE)))
    );
    const skip = (page - 1) * limit;

    let where: any = {};

    if (merchantIdParam) {
      // 商户/职员查询酒店的订单
      const merchantId = parseInt(merchantIdParam);

      // 安全检查：商户只能查自己的，职员只能查所属商户的
      // 查询当前用户信息以判断职员归属
      let effectiveMerchantId = currentUserId;
      if (authResult.user.role?.toUpperCase() === 'STAFF') {
        // 职员：从token中获取所属商户ID，或从数据库查询
        effectiveMerchantId = authResult.user.merchantId ?? 0;
      }

      if (merchantId !== effectiveMerchantId) {
         return NextResponse.json({ success: false, error: '无权查看他人商户订单' }, { status: 403 });
      }

      where = {
        hotel: {
          merchantId: merchantId
        }
      };
    } else {
      // 普通用户查询自己的订单
      where = {
        userId: currentUserId
      };
    }

    // 并发查询总数和数据
    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          hotel: {
            select: {
              id: true,
              nameZh: true,
              images: true
            }
          },
          roomType: {
            select: {
              id: true,
              name: true,
            }
          },
          user: {
             select: {
                 id: true,
                 name: true,
                 email: true,
                 phone: true
             }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: bookings,
      total,
      page,
      limit
    });
  } catch (error) {
    const err = handleApiError(error, '获取预订列表失败');
    return NextResponse.json({ success: false, error: err.error }, { status: err.status });
  }
}

export async function POST(request: NextRequest) {

  try {
    // 1. 验证用户
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    // 2. 解析并校验请求
    const rawBody = await request.json();
    const parsed = createBookingSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { hotelId, roomTypeId, checkInDate, checkOutDate, guestCount, guestInfo, couponId } = parsed.data;

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (start >= end) {
      return NextResponse.json({ success: false, error: '退房日期必须晚于入住日期' }, { status: 400 });
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json({ success: false, error: '入住日期不能早于今天' }, { status: 400 });
    }

    // 3. 事务处理：检查库存并扣减
    const result = await prisma.$transaction(async (tx) => {
      // 3.1 获取房型基础信息
      const roomType = await tx.roomType.findUnique({
        where: { id: roomTypeId },
      });
      if (!roomType || roomType.hotelId !== hotelId) {
        throw new Error('房型不存在或不属于该酒店');
      }

      // 3.2 计算每一天的价格和库存
      // 需要遍历 checkIn 到 checkOut 的每一天
      let currentDate = new Date(start);
      let totalPrice = 0;

      while (currentDate < end) {
        const dateKey = new Date(currentDate);
        const dateStr = currentDate.toISOString().split('T')[0];

        // 3.2.1 确保 RoomAvailability 记录存在（upsert 不修改已有记录）
        await tx.roomAvailability.upsert({
          where: {
            roomTypeId_date: { roomTypeId, date: dateKey },
          },
          update: {}, // 已存在则不修改
          create: {
            roomTypeId,
            date: dateKey,
            booked: 0,
            quota: roomType.stock,
            price: roomType.price,
          },
        });

        // 3.2.2 查询当天状态
        const availability = await tx.roomAvailability.findUnique({
          where: { roomTypeId_date: { roomTypeId, date: dateKey } },
        });

        if (availability?.isClosed) {
          throw new Error(`日期 ${dateStr} 房间已关闭`);
        }

        const price = availability?.price ?? roomType.price;
        totalPrice += Number(price);

        // 3.2.3 原子条件更新：仅当 booked < quota 时才扣减库存，防止并发超卖
        const updated = await tx.roomAvailability.updateMany({
          where: {
            roomTypeId,
            date: dateKey,
            booked: { lt: availability?.quota ?? roomType.stock },
          },
          data: { booked: { increment: 1 } },
        });

        if (updated.count === 0) {
          throw new Error(`日期 ${dateStr} 房间已售罄`);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 3.4 优惠券验证与折扣计算
      let discountAmount = 0;
      if (couponId) {
        const userCoupon = await tx.userCoupon.findUnique({
          where: { userId_couponId: { userId, couponId } },
          include: { coupon: true },
        });
        if (!userCoupon) {
          throw new Error('优惠券不存在或未领取');
        }
        if (userCoupon.isUsed) {
          throw new Error('该优惠券已被使用');
        }
        const now = new Date();
        if (now < userCoupon.coupon.validFrom || now > userCoupon.coupon.validTo) {
          throw new Error('优惠券不在有效期内');
        }
        const minSpend = userCoupon.coupon.minSpend ? Number(userCoupon.coupon.minSpend) : 0;
        if (totalPrice < minSpend) {
          throw new Error(`订单金额需满 ${minSpend} 元才能使用此优惠券`);
        }
        discountAmount = Math.min(Number(userCoupon.coupon.discount), totalPrice);

        // 标记优惠券已使用
        await tx.userCoupon.update({
          where: { userId_couponId: { userId, couponId } },
          data: { isUsed: true, usedAt: now },
        });
      }

      const finalPrice = totalPrice - discountAmount;

      // 3.5 创建订单
      const booking = await tx.booking.create({
        data: {
            userId,
            hotelId,
            roomTypeId,
            checkInDate: start,
            checkOutDate: end,
            guestCount,
            totalPrice: finalPrice,
            discountAmount,
            couponId: couponId ?? null,
            status: 'pending',
            guestInfo: guestInfo ?? {}
        }
      });

      return booking;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });

  } catch (error) {
    const err = handleApiError(error, '预订失败');
    return NextResponse.json({ success: false, error: err.error }, { status: err.status });
  }
}
