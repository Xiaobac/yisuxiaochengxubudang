// app/api/hotels/[id]/route.ts
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - 获取单个酒店详情
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hotelId = parseInt(params.id);

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        location: true,
        merchant: { select: { id: true, name: true, email: true } },
        roomTypes: true, // 包含关联的房型
        // 可以根据需要include更多关联模型，如hotelTags等
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

// PUT - 更新酒店信息（例如审核操作）
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hotelId = parseInt(params.id);
    const body = await request.json();

    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        // 根据传入的字段更新，例如更新状态和驳回理由
        ...(body.status && { status: body.status }),
        ...(body.rejectionReason && { rejectionReason: body.rejectionReason }),
        // 可以更新其他字段...
      },
    });

    // 如果需要，可以在这里添加审计日志（操作你的HotelAuditLog模型）
    // await prisma.hotelAuditLog.create({ ... });

    return NextResponse.json({ success: true, data: updatedHotel });
  } catch (error) {
    console.error('Update hotel error:', error);
    return NextResponse.json({ success: false, error: '更新酒店失败' }, { status: 500 });
  }
}

// DELETE - 删除酒店
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hotelId = parseInt(params.id);

    await prisma.hotel.delete({
      where: { id: hotelId },
    });

    return NextResponse.json({ success: true, message: '酒店删除成功' });
  } catch (error) {
    console.error('Delete hotel error:', error);
    return NextResponse.json({ success: false, error: '删除酒店失败' }, { status: 500 });
  }
}