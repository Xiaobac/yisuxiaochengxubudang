/**
 * 导入演示酒店数据到数据库
 * 运行: npx tsx prisma/seed-demo-hotels.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient } from '../app/generated/prisma/client';

const prisma = new PrismaClient();

interface RoomTypeData {
  name: string;
  description?: string;
  price: number;
  discount: number;
  amenities: string[];
  images: string[];
  stock: number;
}

interface HotelData {
  nameZh: string;
  nameEn?: string;
  address: string;
  starRating: number;
  description?: string;
  facilities: string[];
  openingYear?: number;
  images: string[];
  latitude?: number;
  longitude?: number;
  locationId: number;
  type: string;
  status: string;
  roomTypes: RoomTypeData[];
  tags: string[];
}

async function seedTags(tagNames: string[]) {
  /**
   * 确保所有标签都存在，返回标签ID列表
   */
  const tagIds: number[] = [];

  for (const tagName of tagNames) {
    // 查找或创建标签
    let tag = await prisma.tag.findUnique({
      where: { name: tagName }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: tagName }
      });
      console.log(`    [新增标签] ${tagName}`);
    }

    tagIds.push(tag.id);
  }

  return tagIds;
}

async function seedHotels() {
  console.log('=' .repeat(60));
  console.log('开始导入演示酒店数据');
  console.log('=' .repeat(60));
  console.log();

  // 读取生成的酒店数据
  const dataPath = path.join(__dirname, '../scripts/hotel-scraper/output/hotels.json');

  if (!fs.existsSync(dataPath)) {
    console.error(`错误：找不到数据文件 ${dataPath}`);
    console.error('请先运行: cd scripts/hotel-scraper && python3 generate_mock_data.py');
    process.exit(1);
  }

  const hotelsData: HotelData[] = JSON.parse(
    fs.readFileSync(dataPath, 'utf-8')
  );

  console.log(`读取到 ${hotelsData.length} 家酒店数据\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const hotelData of hotelsData) {
    try {
      // 检查酒店是否已存在
      const existing = await prisma.hotel.findFirst({
        where: {
          nameZh: hotelData.nameZh
        }
      });

      if (existing) {
        console.log(`[跳过] ${hotelData.nameZh} - 已存在`);
        skipCount++;
        continue;
      }

      // 准备标签ID
      const tagIds = await seedTags(hotelData.tags);

      // 创建酒店记录
      const hotel = await prisma.hotel.create({
        data: {
          nameZh: hotelData.nameZh,
          nameEn: hotelData.nameEn,
          address: hotelData.address,
          starRating: hotelData.starRating,
          description: hotelData.description,
          facilities: hotelData.facilities,
          openingYear: hotelData.openingYear,
          images: hotelData.images,
          latitude: hotelData.latitude,
          longitude: hotelData.longitude,
          locationId: hotelData.locationId,
          type: hotelData.type,
          status: hotelData.status,
          // 创建房型
          roomTypes: {
            create: hotelData.roomTypes.map(rt => ({
              name: rt.name,
              description: rt.description,
              price: rt.price,
              discount: rt.discount,
              amenities: rt.amenities,
              images: rt.images,
              stock: rt.stock
            }))
          },
          // 创建标签关联
          hotelTags: {
            create: tagIds.map(tagId => ({
              tagId: tagId
            }))
          }
        },
        include: {
          roomTypes: true,
          hotelTags: {
            include: {
              tag: true
            }
          }
        }
      });

      console.log(`[成功] ${hotel.nameZh} (${hotel.starRating}星)`);
      console.log(`    房型数: ${hotel.roomTypes.length}`);
      console.log(`    标签: ${hotel.hotelTags.map(ht => ht.tag.name).join(', ')}`);

      successCount++;
    } catch (error: any) {
      console.error(`[失败] ${hotelData.nameZh}: ${error.message}`);
    }
  }

  console.log();
  console.log('=' .repeat(60));
  console.log('导入完成!');
  console.log('=' .repeat(60));
  console.log(`成功导入: ${successCount} 家酒店`);
  console.log(`跳过已存在: ${skipCount} 家`);
  console.log();

  // 显示统计信息
  const totalHotels = await prisma.hotel.count();
  const totalRoomTypes = await prisma.roomType.count();
  const totalTags = await prisma.tag.count();

  console.log('数据库统计:');
  console.log(`  酒店总数: ${totalHotels}`);
  console.log(`  房型总数: ${totalRoomTypes}`);
  console.log(`  标签总数: ${totalTags}`);
  console.log();

  // 按城市统计
  const hotelsByLocation = await prisma.hotel.groupBy({
    by: ['locationId'],
    _count: {
      id: true
    }
  });

  console.log('按城市分布:');
  for (const group of hotelsByLocation) {
    const location = await prisma.location.findUnique({
      where: { id: group.locationId || 0 }
    });
    if (location) {
      console.log(`  ${location.name}: ${group._count.id} 家酒店`);
    }
  }
}

async function main() {
  try {
    await seedHotels();
  } catch (error: any) {
    console.error('导入失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✓ 所有操作完成!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ 操作失败:', error);
    process.exit(1);
  });
