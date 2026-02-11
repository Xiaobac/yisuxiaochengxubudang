import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

// DELETE /api/reviews/[id] - 删除评价
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = parseInt(id);

  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId: auth.userId },
  });

  if (!review) {
    return NextResponse.json({ success: false, message: '评价不存在' }, { status: 404 });
  }

  await prisma.review.delete({ where: { id: reviewId } });

  return NextResponse.json({ success: true, message: '删除成功' });
}
