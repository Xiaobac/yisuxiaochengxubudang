// app/api/hotels/[id]/route.ts
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: 获取单个酒店详情
 *     description: 根据ID获取酒店详细信息，包含房型、标签、位置和商户信息
 *     tags:
 *       - Hotels
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 酒店ID
 *     responses:
 *       200:
 *         description: 成功获取酒店详情
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
 *                     nameZh:
 *                       type: string
 *                     hotelTags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tag:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *       404:
 *         description: 酒店不存在
 *       500:
 *         description: 服务器内部错误
 */
// GET - 获取单个酒店详情
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const hotelId = parseInt(params.id);

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        location: true,
        merchant: { select: { id: true, name: true, email: true } },
        roomTypes: true, // 包含关联的房型
        hotelTags: { include: { tag: true } }, // 包含关联的标签
      },
    });

    if (!hotel) {
      return NextResponse.json({ success: false, error: '酒店不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: hotel });
  } catch (error) {
    console.error('Fetch hotel detail error:', error);
    return NextResponse.json({ success: false, error: '获取酒店详情失败' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/hotels/{id}:
 *   put:
 *     summary: 更新酒店信息
 *     description: 更新酒店的详细信息，包括状态审核和其他基本信息
 *     tags:
 *       - Hotels
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
 *             properties:
 *               nameZh:
 *                 type: string
 *               nameEn:
 *                 type: string
 *               address:
 *                 type: string
 *               starRating:
 *                 type: number
 *               description:
 *                 type: string
 *               facilities:
 *                 type: object
 *               openingYear:
 *                 type: integer
 *               images:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [pending, published, rejected, offline]
 *               rejectionReason:
 *                 type: string
 *               locationId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 酒店更新成功
 *       500:
 *         description: 服务器内部错误
 */
// PUT - 更新酒店信息
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const hotelId = parseInt(params.id);
    const body = await request.json();

    // 1. 获取当前用户ID (从Token获取)
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    // 2. 获取当前用户及其角色权限
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermission: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 401 });
    }

    // 3. 获取当前酒店信息以对比状态
    const existingHotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!existingHotel) {
      return NextResponse.json({ success: false, error: '酒店不存在' }, { status: 404 });
    }

    // 准备更新数据
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.nameZh !== undefined) updateData.nameZh = body.nameZh;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.starRating !== undefined) updateData.starRating = Number(body.starRating);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.facilities !== undefined) updateData.facilities = body.facilities;
    if (body.openingYear !== undefined) updateData.openingYear = Number(body.openingYear);
    if (body.images !== undefined) updateData.images = body.images;
    if (body.rejectionReason !== undefined) updateData.rejectionReason = body.rejectionReason;
    if (body.locationId !== undefined) updateData.locationId = Number(body.locationId);

    // 检查状态变更
    const newStatus = body.status;
    const isStatusChange = newStatus && newStatus !== existingHotel.status;

    if (isStatusChange) {
      // 4. 检查权限
      const isOwner = existingHotel.merchantId === userId;
      const hasAuditPermission = currentUser.role?.rolePermission.some(
        (rp) => rp.permission.name === 'HOTEL_AUDIT'
      );

      // 允许下线的情况：拥有者 或 管理员(有HOTEL_AUDIT权限)
      // 允许其他状态变更的情况：仅管理员
      let canChangeStatus = false;
      if (newStatus === 'offline') {
        canChangeStatus = isOwner || hasAuditPermission;
      } else {
        canChangeStatus = hasAuditPermission;
      }

      if (!canChangeStatus) {
        return NextResponse.json({ success: false, error: '无权修改酒店状态' }, { status: 403 });
      }

      updateData.status = newStatus;
    }

    // 5. 使用事务执行更新和日志记录
    const updatedHotel = await prisma.$transaction(async (tx) => {
      const hotel = await tx.hotel.update({
        where: { id: hotelId },
        data: updateData,
      });

      if (isStatusChange) {
        await tx.hotelAuditLog.create({
          data: {
            hotelId: hotelId,
            operatorId: userId,
            oldStatus: existingHotel.status,
            newStatus: newStatus,
            comment: body.rejectionReason || 'State update',
          },
        });
      }

      return hotel;
    });

    return NextResponse.json({ success: true, data: updatedHotel });
  } catch (error) {
    console.error('Update hotel error:', error);
    return NextResponse.json({ success: false, error: '更新酒店失败' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/hotels/{id}:
 *   delete:
 *     summary: 删除酒店
 *     description: 根据ID删除酒店记录
 *     tags:
 *       - Hotels
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 酒店ID
 *     responses:
 *       200:
 *         description: 酒店删除成功
 *       500:
 *         description: 服务器内部错误
 */
// DELETE - 删除酒店
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const hotelId = parseInt(params.id);

    // 1. 获取当前用户ID (从Token获取)
    const authResult = verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const userId = authResult.user.userId;

    // 2. 获取当前用户权限
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermission: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ success: false, error: '用户不存在' }, { status: 401 });
    }

    // 3. 检查酒店是否存在及归属
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      return NextResponse.json({ success: false, error: '酒店不存在' }, { status: 404 });
    }

    // 4. 权限检查：拥有者 或 管理员(有HOTEL_DELETE权限)
    const isOwner = hotel.merchantId === userId;
    const hasDeletePermission = currentUser.role?.rolePermission.some(
      (rp) => rp.permission.name === 'HOTEL_DELETE'
    );

    if (!isOwner && !hasDeletePermission) {
      return NextResponse.json({ success: false, error: '无权删除该酒店' }, { status: 403 });
    }

    await prisma.hotel.delete({
      where: { id: hotelId },
    });

    return NextResponse.json({ success: true, message: '酒店删除成功' });
  } catch (error) {
    console.error('Delete hotel error:', error);
    return NextResponse.json({ success: false, error: '删除酒店失败' }, { status: 500 });
  }
}