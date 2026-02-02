import { PrismaClient } from '@/app/generated/prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据初始化...');

  // 1. 创建角色
  console.log('创建角色...');
  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: '普通用户',
    },
  });

  const merchantRole = await prisma.role.upsert({
    where: { name: 'MERCHANT' },
    update: {},
    create: {
      name: 'MERCHANT',
      description: '商户',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: '管理员',
    },
  });

  console.log('角色创建完成');

  // 2. 创建权限
  console.log('创建权限...');
  const permissions = [
    { name: 'HOTEL_AUDIT', description: '审核酒店状态' },
    { name: 'HOTEL_DELETE', description: '删除任何酒店' },
    { name: 'USER_READ', description: '查看所有用户列表' },
    { name: 'USER_UPDATE', description: '修改其他用户信息' },
    { name: 'USER_DELETE', description: '删除其他用户账户' },
    { name: 'TAG_CREATE', description: '创建新标签' },
    { name: 'TAG_UPDATE', description: '修改标签' },
    { name: 'TAG_DELETE', description: '删除标签' },
    { name: 'LOCATION_CREATE', description: '创建新位置' },
    { name: 'LOCATION_UPDATE', description: '修改位置信息' },
    { name: 'LOCATION_DELETE', description: '删除位置' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  console.log('权限创建完成');

  // 3. 为管理员角色分配所有权限
  console.log('分配权限...');
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('权限分配完成');

  // 4. 创建测试用户
  console.log('创建测试用户...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      email: 'admin@hotel.com',
      password: hashedPassword,
      name: '系统管理员',
      phone: '13800000001',
      roleId: adminRole.id,
    },
  });

  const merchantUser = await prisma.user.upsert({
    where: { email: 'merchant@hotel.com' },
    update: {},
    create: {
      email: 'merchant@hotel.com',
      password: hashedPassword,
      name: '测试商户',
      phone: '13800000002',
      roleId: merchantRole.id,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@hotel.com' },
    update: {},
    create: {
      email: 'user@hotel.com',
      password: hashedPassword,
      name: '测试用户',
      phone: '13800000003',
      roleId: userRole.id,
    },
  });

  console.log('测试用户创建完成');

  // 5. 创建位置
  console.log('创建位置...');
  const locations = [
    { name: '北京', description: '首都北京' },
    { name: '上海', description: '魔都上海' },
    { name: '广州', description: '羊城广州' },
    { name: '深圳', description: '鹏城深圳' },
    { name: '杭州', description: '人间天堂' },
    { name: '成都', description: '天府之国' },
  ];

  const createdLocations = [];
  for (const loc of locations) {
    // 检查是否已存在
    let location = await prisma.location.findFirst({
      where: { name: loc.name },
    });

    if (!location) {
      location = await prisma.location.create({
        data: loc,
      });
    }
    createdLocations.push(location);
  }

  console.log('位置创建完成');

  // 6. 创建标签
  console.log('创建标签...');
  const tags = [
    '豪华酒店',
    '经济型',
    '商务酒店',
    '度假酒店',
    '亲子酒店',
    '温泉酒店',
    '海景酒店',
    '山景酒店',
  ];

  const createdTags = [];
  for (const tagName of tags) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
    createdTags.push(tag);
  }

  console.log('标签创建完成');

  // 7. 创建测试酒店
  console.log('创建测试酒店...');
  const hotel = await prisma.hotel.create({
    data: {
      nameZh: '测试豪华酒店',
      nameEn: 'Test Luxury Hotel',
      address: '测试路123号',
      starRating: 5,
      description: '这是一家测试酒店，拥有优质的服务和设施',
      facilities: {
        wifi: true,
        parking: true,
        pool: true,
        gym: true,
        restaurant: true,
      },
      openingYear: 2020,
      images: [
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
      ],
      status: 'published',
      merchantId: merchantUser.id,
      locationId: createdLocations[0].id,
    },
  });

  // 8. 为酒店添加标签
  await prisma.hotelTag.create({
    data: {
      hotelId: hotel.id,
      tagId: createdTags[0].id,
    },
  });

  await prisma.hotelTag.create({
    data: {
      hotelId: hotel.id,
      tagId: createdTags[2].id,
    },
  });

  // 9. 创建房型
  console.log('创建房型...');
  const roomType = await prisma.roomType.create({
    data: {
      hotelId: hotel.id,
      name: '豪华大床房',
      description: '豪华装修，配备大床',
      price: 688.00,
      discount: 1.00,
      amenities: {
        bedType: '特大床',
        size: '40平米',
        maxGuests: 2,
        features: ['免费WiFi', '独立卫浴', '迷你吧', '保险箱'],
      },
      images: [
        'https://via.placeholder.com/800x600',
      ],
      stock: 10,
    },
  });

  console.log('房型创建完成');

  console.log('✅ 种子数据初始化完成！');
  console.log('\n测试账号：');
  console.log('管理员: admin@hotel.com / 123456');
  console.log('商户:   merchant@hotel.com / 123456');
  console.log('用户:   user@hotel.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
