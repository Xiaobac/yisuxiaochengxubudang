import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/app/api/utils/auth';
import { z } from 'zod';

const createCouponSchema = z.object({
  code:        z.string().min(1).max(50),
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  discount:    z.number().positive(),
  minSpend:    z.number().nonnegative().optional(),
  validFrom:   z.coerce.date({ message: 'validFrom 须为有效日期时间' }),
  validTo:     z.coerce.date({ message: 'validTo 须为有效日期时间' }),
}).refine(d => d.validTo > d.validFrom, {
  message: 'validTo 必须晚于 validFrom',
  path: ['validTo'],
});

// GET /api/coupons - 获取所有优惠券列表
// 可选：管理员可以看到所有，普通用户也可以看到（用于领券列表）
export async function GET(req: NextRequest) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取优惠券列表失败' }, { status: 500 });
  }
}

// POST /api/coupons - 创建优惠券
// 只有管理员可以创建
export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.success) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  // 检查是否为管理员
  // 假设 role 字段存储角色名，且 'ADMIN' 为管理员
  // 具体实现取决于 role 字段的数据结构（string 还是通过 Role 关联）
  // 这里假设 decodedUser 中包含 role 信息
  // 如果 role 是复杂对象，可能需要查询数据库。
  // auth.ts 中 DecodedUser: role: string | undefined;
  if (auth.user.role !== 'ADMIN') {
      // 双重检查：如果 token 里没有 role，或者不可信，可以查库
      // 为了安全，这里通常建议查库，除非 token 签名严谨且含有有效 role
      // 简单起见，这里先信任 token 中的 role，或者如果 token 中 role 也是 string
      return NextResponse.json({ success: false, message: '需要管理员权限' }, { status: 403 });
  }

  try {
    const rawBody = await req.json();
    const parsed = createCouponSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }
    const { code, name, description, discount, minSpend, validFrom, validTo } = parsed.data;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name,
        description,
        discount,
        minSpend,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
      },
    });

    return NextResponse.json({ success: true, data: coupon });
  } catch (error) {
    console.error('创建优惠券失败:', error);
    // @ts-ignore
    if (error.code === 'P2002') {
       return NextResponse.json({ success: false, message: '优惠券代码已存在' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: '创建优惠券失败' }, { status: 500 });
  }
}
