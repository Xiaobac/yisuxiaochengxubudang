import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';

// GET /api/comments/[id] - 获取单条评论详情
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true }
        },
        hotel: {
          select: { id: true, nameZh: true }
        }
      }
    });

    if (!comment) {
      return NextResponse.json({ success: false, message: '评论不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取评论失败' }, { status: 500 });
  }
}

// PUT /api/comments/[id] - 修改评论
// 只有评论所属用户可修改
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  const id = parseInt(params.id);

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ success: false, message: '评论不存在' }, { status: 404 });
    }

    // 权限检查：只有作者可以修改
    if (comment.userId !== auth.user.userId) {
      return NextResponse.json({ success: false, message: '无权修改此评论' }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json({ success: true, data: updatedComment });
  } catch (error) {
    console.error('修改评论失败:', error);
    return NextResponse.json({ success: false, message: '修改评论失败' }, { status: 500 });
  }
}

// DELETE /api/comments/[id] - 删除评论
// 只有评论所属用户可删除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  const id = parseInt(params.id);

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ success: false, message: '评论不存在' }, { status: 404 });
    }

    // 权限检查：只有作者或者管理员可以删除
    if (comment.userId !== auth.user.userId && auth.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '无权删除此评论' }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: '评论已删除' });
  } catch (error) {
    console.error('删除评论失败:', error);
    return NextResponse.json({ success: false, message: '删除评论失败' }, { status: 500 });
  }
}
