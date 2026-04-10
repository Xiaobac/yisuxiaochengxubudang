import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     description: 注册新用户，支持普通用户和商户注册
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [staff, merchant]
 *                 description: 注册角色类型
 *     responses:
 *       201:
 *         description: 注册成功
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
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *       400:
 *         description: 请求参数错误或用户已存在
 *       500:
 *         description: 服务器错误
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone, role, merchantId } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: '缺少必要字段: email, password, role' },
        { status: 400 }
      );
    }

    // 职员注册时需要指定所属商户
    if (role.toLowerCase() === 'staff') {
      if (!merchantId) {
        return NextResponse.json(
          { success: false, error: '职员注册必须选择所属商户' },
          { status: 400 }
        );
      }
      // 验证商户存在且角色为 MERCHANT
      const merchantUser = await prisma.user.findUnique({
        where: { id: merchantId },
        include: { role: true },
      });
      if (!merchantUser || merchantUser.role?.name?.toUpperCase() !== 'MERCHANT') {
        return NextResponse.json(
          { success: false, error: '所选商户不存在或角色不正确' },
          { status: 400 }
        );
      }
    }

    // 1. 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 2. 角色白名单验证（只允许 STAFF 和 MERCHANT 注册，ADMIN 由管理员创建）
    const ALLOWED_ROLES = ['STAFF', 'MERCHANT'];
    const roleNameUpper = role.toUpperCase();

    if (!ALLOWED_ROLES.includes(roleNameUpper)) {
      return NextResponse.json(
        { success: false, error: `不允许注册该角色: ${role}` },
        { status: 400 }
      );
    }

    // 3. 查找对应的角色（禁止自动创建）
    const roleNameLower = role.toLowerCase();

    let dbRole = await prisma.role.findUnique({
      where: { name: roleNameUpper },
    });

    if (!dbRole) {
       dbRole = await prisma.role.findUnique({
           where: { name: roleNameLower },
       });
    }

    if (!dbRole) {
       dbRole = await prisma.role.findUnique({
           where: { name: role },
       });
    }

    if (!dbRole) {
      return NextResponse.json(
        { success: false, error: `无效角色: ${role}，请联系管理员` },
        { status: 400 }
      );
    }

    // 4. 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. 创建用户（使用关系语法连接 role 和 merchant）
    const createData: {
      email: string;
      password: string;
      name?: string;
      phone?: string;
      role: { connect: { id: number } };
      merchant?: { connect: { id: number } };
    } = {
      email,
      password: hashedPassword,
      name,
      phone,
      role: { connect: { id: dbRole.id } },
    };

    if (role.toLowerCase() === 'staff' && merchantId) {
      createData.merchant = { connect: { id: merchantId } };
    }

    const newUser = await prisma.user.create({
      data: createData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        merchantId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: '注册失败' },
      { status: 500 }
    );
  }
}
