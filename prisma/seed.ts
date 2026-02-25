// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- 1. Locations (分层级：国内/海外 -> 省份/区域 -> 城市) ---
  const locationsData = [
    // --- 国内热门省份/直辖市 (province) ---
    {
      name: '北京',
      description: '中华人民共和国首都',
      type: 'province',
      children: [{ name: '北京', description: '北京市辖区', type: 'domestic' }],
    },
    {
      name: '上海',
      description: '国际化大都市',
      type: 'province',
      children: [{ name: '上海', description: '上海市辖区', type: 'domestic' }],
    },
    {
      name: '天津',
      description: '北方航运中心',
      type: 'province',
      children: [{ name: '天津', description: '天津市辖区', type: 'domestic' }],
    },
    {
      name: '重庆',
      description: '山城，火锅之都',
      type: 'province',
      children: [{ name: '重庆', description: '重庆市辖区', type: 'domestic' }],
    },
    {
      name: '广东',
      description: '岭南文化中心',
      type: 'province',
      children: [
        { name: '广州', description: '羊城', type: 'domestic' },
        { name: '深圳', description: '鹏城', type: 'domestic' },
        { name: '珠海', description: '百岛之市', type: 'domestic' },
        { name: '佛山', description: '武术之乡', type: 'domestic' },
        { name: '惠州', description: '惠民之州', type: 'domestic' },
        { name: '东莞', description: '世界工厂', type: 'domestic' },
        { name: '中山', description: '伟人故里', type: 'domestic' },
        { name: '汕头', description: '海滨邹鲁', type: 'domestic' },
      ],
    },
    {
      name: '浙江',
      description: '鱼米之乡',
      type: 'province',
      children: [
        { name: '杭州', description: '人间天堂', type: 'domestic' },
        { name: '宁波', description: '港口城市', type: 'domestic' },
        { name: '温州', description: '商贾之地', type: 'domestic' },
        { name: '绍兴', description: '水乡桥乡', type: 'domestic' },
        { name: '嘉兴', description: '革命圣地', type: 'domestic' },
        { name: '金华', description: '火腿之乡', type: 'domestic' },
        { name: '台州', description: '山海之城', type: 'domestic' },
        { name: '湖州', description: '太湖明珠', type: 'domestic' },
      ],
    },
    {
      name: '江苏',
      description: '江南水乡',
      type: 'province',
      children: [
        { name: '南京', description: '六朝古都', type: 'domestic' },
        { name: '苏州', description: '园林之城', type: 'domestic' },
        { name: '无锡', description: '太湖明珠', type: 'domestic' },
        { name: '常州', description: '龙城', type: 'domestic' },
        { name: '扬州', description: '运河名城', type: 'domestic' },
        { name: '徐州', description: '五省通衢', type: 'domestic' },
        { name: '南通', description: '江海明珠', type: 'domestic' },
        { name: '连云港', description: '亚欧桥头堡', type: 'domestic' },
      ],
    },
    {
      name: '四川',
      description: '天府之国',
      type: 'province',
      children: [
        { name: '成都', description: '蓉城', type: 'domestic' },
        { name: '绵阳', description: '科技城', type: 'domestic' },
        { name: '乐山', description: '海棠香国', type: 'domestic' },
        { name: '宜宾', description: '酒都', type: 'domestic' },
        { name: '南充', description: '绸都', type: 'domestic' },
        { name: '德阳', description: '重装之都', type: 'domestic' },
        { name: '泸州', description: '酒城', type: 'domestic' },
      ],
    },
    {
      name: '云南',
      description: '彩云之南',
      type: 'province',
      children: [
        { name: '昆明', description: '春城', type: 'domestic' },
        { name: '大理', description: '风花雪月', type: 'domestic' },
        { name: '丽江', description: '艳遇之都', type: 'domestic' },
        { name: '西双版纳', description: '热带雨林', type: 'domestic' },
        { name: '香格里拉', description: '世外桃源', type: 'domestic' },
        { name: '玉溪', description: '云烟之乡', type: 'domestic' },
        { name: '曲靖', description: '珠江源头', type: 'domestic' },
      ],
    },
    {
      name: '福建',
      description: '八山一水一分田',
      type: 'province',
      children: [
        { name: '福州', description: '榕城', type: 'domestic' },
        { name: '厦门', description: '鹭岛', type: 'domestic' },
        { name: '泉州', description: '刺桐城', type: 'domestic' },
        { name: '漳州', description: '水仙花之乡', type: 'domestic' },
        { name: '武夷山', description: '世界遗产', type: 'domestic' },
        { name: '莆田', description: '文献名邦', type: 'domestic' },
        { name: '龙岩', description: '客家祖地', type: 'domestic' },
      ],
    },
    {
      name: '山东',
      description: '孔孟之乡',
      type: 'province',
      children: [
        { name: '济南', description: '泉城', type: 'domestic' },
        { name: '青岛', description: '岛城', type: 'domestic' },
        { name: '烟台', description: '港城', type: 'domestic' },
        { name: '潍坊', description: '鸢都', type: 'domestic' },
        { name: '威海', description: '花园城市', type: 'domestic' },
        { name: '济宁', description: '运河之都', type: 'domestic' },
        { name: '泰安', description: '泰山所在地', type: 'domestic' },
        { name: '临沂', description: '物流之都', type: 'domestic' },
      ],
    },
    {
      name: '陕西',
      description: '三秦大地',
      type: 'province',
      children: [
        { name: '西安', description: '长安', type: 'domestic' },
        { name: '宝鸡', description: '炎帝故里', type: 'domestic' },
        { name: '咸阳', description: '秦朝都城', type: 'domestic' },
        { name: '延安', description: '革命圣地', type: 'domestic' },
        { name: '渭南', description: '华山所在地', type: 'domestic' },
        { name: '汉中', description: '天汉', type: 'domestic' },
        { name: '榆林', description: '塞上明珠', type: 'domestic' },
      ],
    },
    {
      name: '湖南',
      description: '芙蓉国',
      type: 'province',
      children: [
        { name: '长沙', description: '星城', type: 'domestic' },
        { name: '张家界', description: '奇峰三千', type: 'domestic' },
        { name: '岳阳', description: '洞庭明珠', type: 'domestic' },
        { name: '常德', description: '桃花源', type: 'domestic' },
        { name: '株洲', description: '动力之都', type: 'domestic' },
        { name: '衡阳', description: '雁城', type: 'domestic' },
        { name: '湘潭', description: '莲城', type: 'domestic' },
      ],
    },
    {
      name: '湖北',
      description: '千湖之省',
      type: 'province',
      children: [
        { name: '武汉', description: '江城', type: 'domestic' },
        { name: '宜昌', description: '水电之都', type: 'domestic' },
        { name: '襄阳', description: '古城', type: 'domestic' },
        { name: '十堰', description: '车城', type: 'domestic' },
        { name: '荆州', description: '楚文化中心', type: 'domestic' },
        { name: '黄石', description: '矿冶名城', type: 'domestic' },
        { name: '恩施', description: '土家苗寨', type: 'domestic' },
      ],
    },
    {
      name: '河南',
      description: '中原大地',
      type: 'province',
      children: [
        { name: '郑州', description: '绿城', type: 'domestic' },
        { name: '洛阳', description: '神都', type: 'domestic' },
        { name: '开封', description: '菊城', type: 'domestic' },
        { name: '安阳', description: '文字之都', type: 'domestic' },
        { name: '南阳', description: '帝乡', type: 'domestic' },
        { name: '新乡', description: '牧野', type: 'domestic' },
        { name: '许昌', description: '魏都', type: 'domestic' },
      ],
    },
    {
      name: '河北',
      description: '燕赵大地',
      type: 'province',
      children: [
        { name: '石家庄', description: '国际庄', type: 'domestic' },
        { name: '唐山', description: '凤凰城', type: 'domestic' },
        { name: '秦皇岛', description: '港城', type: 'domestic' },
        { name: '保定', description: '古城', type: 'domestic' },
        { name: '邯郸', description: '成语之都', type: 'domestic' },
        { name: '张家口', description: '冬奥之城', type: 'domestic' },
        { name: '承德', description: '避暑胜地', type: 'domestic' },
      ],
    },
    {
      name: '辽宁',
      description: '共和国长子',
      type: 'province',
      children: [
        { name: '沈阳', description: '盛京', type: 'domestic' },
        { name: '大连', description: '滨城', type: 'domestic' },
        { name: '鞍山', description: '钢都', type: 'domestic' },
        { name: '抚顺', description: '煤都', type: 'domestic' },
        { name: '本溪', description: '山城', type: 'domestic' },
        { name: '丹东', description: '边境城市', type: 'domestic' },
        { name: '锦州', description: '咽喉之地', type: 'domestic' },
      ],
    },
    {
      name: '安徽',
      description: '徽文化发源地',
      type: 'province',
      children: [
        { name: '合肥', description: '庐州', type: 'domestic' },
        { name: '芜湖', description: '江城', type: 'domestic' },
        { name: '黄山', description: '天下第一奇山', type: 'domestic' },
        { name: '安庆', description: '宜城', type: 'domestic' },
        { name: '蚌埠', description: '珠城', type: 'domestic' },
        { name: '马鞍山', description: '钢城', type: 'domestic' },
        { name: '阜阳', description: '酒都', type: 'domestic' },
      ],
    },
    {
      name: '江西',
      description: '红色摇篮',
      type: 'province',
      children: [
        { name: '南昌', description: '洪都', type: 'domestic' },
        { name: '九江', description: '浔阳', type: 'domestic' },
        { name: '赣州', description: '宋城', type: 'domestic' },
        { name: '景德镇', description: '瓷都', type: 'domestic' },
        { name: '上饶', description: '信州', type: 'domestic' },
        { name: '宜春', description: '月都', type: 'domestic' },
        { name: '吉安', description: '庐陵', type: 'domestic' },
      ],
    },
    {
      name: '广西',
      description: '壮乡',
      type: 'province',
      children: [
        { name: '南宁', description: '绿城', type: 'domestic' },
        { name: '桂林', description: '山水甲天下', type: 'domestic' },
        { name: '柳州', description: '龙城', type: 'domestic' },
        { name: '北海', description: '珠城', type: 'domestic' },
        { name: '百色', description: '鹅城', type: 'domestic' },
        { name: '梧州', description: '山城', type: 'domestic' },
        { name: '玉林', description: '云天', type: 'domestic' },
      ],
    },
    {
      name: '海南',
      description: '椰风海韵',
      type: 'province',
      children: [
        { name: '海口', description: '椰城', type: 'domestic' },
        { name: '三亚', description: '鹿城', type: 'domestic' },
        { name: '儋州', description: '诗乡', type: 'domestic' },
        { name: '万宁', description: '长寿之乡', type: 'domestic' },
        { name: '文昌', description: '航天城', type: 'domestic' },
        { name: '琼海', description: '温泉之乡', type: 'domestic' },
      ],
    },
    {
      name: '贵州',
      description: '避暑大省',
      type: 'province',
      children: [
        { name: '贵阳', description: '林城', type: 'domestic' },
        { name: '遵义', description: '转折之城', type: 'domestic' },
        { name: '六盘水', description: '凉都', type: 'domestic' },
        { name: '安顺', description: '瀑乡', type: 'domestic' },
        { name: '毕节', description: '花海', type: 'domestic' },
        { name: '铜仁', description: '梵天净土', type: 'domestic' },
      ],
    },
    {
      name: '山西',
      description: '表里山河',
      type: 'province',
      children: [
        { name: '太原', description: '龙城', type: 'domestic' },
        { name: '大同', description: '煤都', type: 'domestic' },
        { name: '运城', description: '盐运之城', type: 'domestic' },
        { name: '晋中', description: '晋商故里', type: 'domestic' },
        { name: '长治', description: '上党', type: 'domestic' },
        { name: '临汾', description: '平阳', type: 'domestic' },
      ],
    },
    {
      name: '黑龙江',
      description: '北国风光',
      type: 'province',
      children: [
        { name: '哈尔滨', description: '冰城', type: 'domestic' },
        { name: '齐齐哈尔', description: '鹤城', type: 'domestic' },
        { name: '牡丹江', description: '雪乡', type: 'domestic' },
        { name: '佳木斯', description: '东极', type: 'domestic' },
        { name: '大庆', description: '油城', type: 'domestic' },
        { name: '伊春', description: '林都', type: 'domestic' },
      ],
    },
    {
      name: '吉林',
      description: '长白山下',
      type: 'province',
      children: [
        { name: '长春', description: '汽车城', type: 'domestic' },
        { name: '吉林市', description: '雾凇之都', type: 'domestic' },
        { name: '延边', description: '朝鲜族风情', type: 'domestic' },
        { name: '四平', description: '英雄城', type: 'domestic' },
        { name: '通化', description: '医药城', type: 'domestic' },
      ],
    },
    {
      name: '甘肃',
      description: '丝路明珠',
      type: 'province',
      children: [
        { name: '兰州', description: '金城', type: 'domestic' },
        { name: '天水', description: '羲皇故里', type: 'domestic' },
        { name: '酒泉', description: '航天城', type: 'domestic' },
        { name: '张掖', description: '七彩丹霞', type: 'domestic' },
        { name: '敦煌', description: '飞天', type: 'domestic' },
      ],
    },
     {
      name: '新疆',
      description: '西域风情',
      type: 'province',
      children: [
        { name: '乌鲁木齐', description: '亚心之都', type: 'domestic' },
        { name: '喀什', description: '丝路古镇', type: 'domestic' },
        { name: '伊犁', description: '塞外江南', type: 'domestic' },
        { name: '吐鲁番', description: '火洲', type: 'domestic' },
        { name: '阿勒泰', description: '雪都', type: 'domestic' },
      ],
    },
    {
      name: '内蒙古',
      description: '草原之都',
      type: 'province',
      children: [
        { name: '呼和浩特', description: '青城', type: 'domestic' },
        { name: '包头', description: '鹿城', type: 'domestic' },
        { name: '鄂尔多斯', description: '羊绒之都', type: 'domestic' },
        { name: '赤峰', description: '红山文化', type: 'domestic' },
        { name: '呼伦贝尔', description: '大草原', type: 'domestic' },
      ],
    },

    // --- 海外热门 (扁平化结构，无children) ---
    { name: '东京', description: '日本首都，繁华都市', type: 'overseas' },
    { name: '大阪', description: '日本关西美食中心', type: 'overseas' },
    { name: '京都', description: '日本古都，传统文化', type: 'overseas' },
    { name: '首尔', description: '韩国首都，时尚潮流', type: 'overseas' },
    { name: '济州岛', description: '韩国度假胜地', type: 'overseas' },
    { name: '曼谷', description: '泰国首都，佛教之都', type: 'overseas' },
    { name: '普吉岛', description: '泰国海岛天堂', type: 'overseas' },
    { name: '清迈', description: '泰北玫瑰', type: 'overseas' },
    { name: '新加坡', description: '花园城市', type: 'overseas' },
    { name: '吉隆坡', description: '马来西亚首都', type: 'overseas' },
    { name: '巴厘岛', description: '印尼度假天堂', type: 'overseas' },
    { name: '伦敦', description: '英国首都，历史名城', type: 'overseas' },
    { name: '巴黎', description: '法国首都，浪漫之都', type: 'overseas' },
    { name: '纽约', description: '美国最大城市', type: 'overseas' },
    { name: '洛杉矶', description: '天使之城，好莱坞', type: 'overseas' },
    { name: '旧金山', description: '湾区明珠', type: 'overseas' },
    { name: '悉尼', description: '澳洲最大城市', type: 'overseas' },
    { name: '墨尔本', description: '文化与艺术之都', type: 'overseas' },
    { name: '迪拜', description: '沙漠奇迹', type: 'overseas' },
    { name: '开罗', description: '金字塔之城', type: 'overseas' },
  ];


  for (const parentLoc of locationsData) {
    // 1. 创建父级 (省份/国家/区域)
    let parent = await prisma.location.findFirst({ where: { name: parentLoc.name } });
    
    if (!parent) {
      parent = await prisma.location.create({
        data: {
          name: parentLoc.name,
          description: parentLoc.description,
          type: parentLoc.type,
        },
      });
      console.log(`Created parent location: ${parentLoc.name}`);
    } else {
      console.log(`Parent location already exists: ${parentLoc.name}`);
    }

    // 2. 创建子级 (城市)
    if (parentLoc.children && parentLoc.children.length > 0) {
      for (const childLoc of parentLoc.children) {
        const existingChild = await prisma.location.findFirst({
           where: { name: childLoc.name, parentId: parent.id } // 检查同一父级下是否已存在
        });
        
        if (!existingChild) {
          await prisma.location.create({
            data: {
              name: childLoc.name,
              description: childLoc.description,
              type: childLoc.type,
              parentId: parent.id,
            },
          });
          console.log(`  -> Created child location: ${childLoc.name}`);
        } else {
          console.log(`  -> Child location already exists: ${childLoc.name}`);
        }
      }
    }
  }

  // --- 2. Tags (常用酒店标签) ---
  const tagsData = [
    '免费WiFi',
    '含早餐',
    '免费停车',
    '游泳池',
    '健身房',
    '亲子友好',
    '商务出差',
    '情侣约会',
    '度假胜地',
    '温泉酒店',
    '海景房',
    '靠近地铁',
    '接送机服务',
    '宠物友好',
    '24小时前台',
    '无烟房',
    '行政酒廊',
    '会议室',
    '洗衣服务',
    '行李寄存',
  ];

  for (const tagName of tagsData) {
    const existing = await prisma.tag.findUnique({ where: { name: tagName } });
    if (!existing) {
      await prisma.tag.create({ data: { name: tagName } });
      console.log(`Created tag: ${tagName}`);
    } else {
      console.log(`Tag already exists: ${tagName}`);
    }
  }

  // --- 3. Permissions (来自 PERMISSIONS.md) ---
  const permissionsData = [
    // 酒店管理
    { name: 'HOTEL_AUDIT', description: '允许审核酒店状态（如：批准上线、驳回、强制下线等）' },
    { name: 'HOTEL_DELETE', description: '允许删除任何酒店' },
    // 用户管理
    { name: 'USER_READ', description: '允许查看所有用户列表' },
    { name: 'USER_UPDATE', description: '允许修改其他用户的信息' },
    { name: 'USER_DELETE', description: '允许删除其他用户的账户' },
    // 标签管理
    { name: 'TAG_CREATE', description: '允许创建新的标签' },
    { name: 'TAG_UPDATE', description: '允许修改现有标签的名称' },
    { name: 'TAG_DELETE', description: '允许删除标签' },
    // 位置管理
    { name: 'LOCATION_CREATE', description: '允许创建新的地理位置' },
    { name: 'LOCATION_UPDATE', description: '允许修改现有位置的信息' },
    { name: 'LOCATION_DELETE', description: '允许删除地理位置' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: { name: perm.name, description: perm.description },
    });
    console.log(`Upserted permission: ${perm.name}`);
  }

  // --- 4. Roles & RolePermissions (User, Merchant, Admin) ---
  
  // 4.1 职员 (STAFF) — 原 USER 角色改造
  // 先尝试将已有的 USER 角色重命名为 STAFF
  await prisma.role.updateMany({
    where: { name: 'USER' },
    data: { name: 'STAFF', description: '职员，可以管理所属商户的酒店运营' },
  });
  await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: { description: '职员，可以管理所属商户的酒店运营' },
    create: { name: 'STAFF', description: '职员，可以管理所属商户的酒店运营' },
  });
  console.log('Upserted role: STAFF');

  // 4.2 商户 (MERCHANT)
  await prisma.role.upsert({
    where: { name: 'MERCHANT' },
    update: { description: '商户，可以创建和管理自己的酒店' },
    create: { name: 'MERCHANT', description: '商户，可以创建和管理自己的酒店' },
  });
  console.log('Upserted role: MERCHANT');

  // 4.3 管理员 (ADMIN) - 并分配所有权限
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: '超级管理员，拥有系统最高权限' },
    create: { name: 'ADMIN', description: '超级管理员，拥有系统最高权限' },
  });
  console.log('Upserted role: ADMIN');

  // 获取所有权限ID
  const allPermissions = await prisma.permission.findMany();
  
  // 为管理员分配所有权限
  for (const perm of allPermissions) {
    // 检查关联是否已存在，防止重复插入报错 (虽然 upsert role 不会删关联，但这里手动检查更稳)
    // Prisma 的 createMnay 或 upsert 在多对多关系中间表中操作需谨慎，这里用 safe check
    const existingRelation = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
    });

    if (!existingRelation) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
      console.log(`Assigned permission ${perm.name} to ADMIN`);
    }
  }

  // --- 5. Hotels (随机生成酒店数据) ---
  console.log('Seeding Hotels...');
  
  // 5.1 获取所有可用的底层位置 (domestic 城市 和 overseas 城市)
  // province 类型通常不作为具体酒店的 location
  const validLocations = await prisma.location.findMany({
    where: {
      OR: [
        { type: 'domestic' }, // 国内城市
        { type: 'overseas' }, // 海外城市
      ]
    }
  });

  if (validLocations.length === 0) {
    console.warn('No valid locations found for hotels. Skipping hotel seeding.');
  } else {
    // 5.2 获取所有标签
    const allTags = await prisma.tag.findMany();

    // 随机生成 50 家酒店
    const hotelCount = 50;
    const hotelTypes = ['hotel', 'homestay', 'hourly'];
    const hotelStatuses = ['published', 'pending', 'rejected', 'offline'];
    
    // 辅助函数：生成随机整数
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    // 辅助函数：从数组随机取一项
    const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    // 辅助函数：随机取多项
    const randomItems = <T>(arr: T[], count: number): T[] => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    for (let i = 1; i <= hotelCount; i++) {
        const location = randomItem(validLocations);
        const type = randomItem(hotelTypes);
        // 大部分是已发布，方便测试
        const status = Math.random() > 0.3 ? 'published' : randomItem(hotelStatuses);
        
        // 随机设施
        const facilitiesList = ['免费WiFi', '停车场', '餐厅', '健身房', '游泳池', '会议室', 'SPA', '接送机', '儿童乐园'];
        const randomFacilities = randomItems(facilitiesList, randomInt(3, 8));

        const hotelData: any = {
            merchantId: 1, // 统一为 1
            locationId: location.id,
            nameZh: `${location.name}${randomItem(['大酒店', '宾馆', '度假村', '客栈', '公寓', '民宿'])} No.${i}`,
            nameEn: `Grand ${location.name} Hotel No.${i}`,
            address: `${location.name}市某某区某某路${randomInt(1, 999)}号`,
            starRating: randomInt(3, 5),
            description: `这是一家位于${location.name}的优质${type === 'homestay' ? '民宿' : '酒店'}，环境优美，服务周到。`,
            facilities: JSON.stringify(randomFacilities),
            openingYear: randomInt(1990, 2023),
            images: JSON.stringify([`/hotels/hotel_cover_${(i - 1) % 20 + 1}.jpg`]), 
            latitude: null, // 保持为空
            longitude: null, // 保持为空
            status: status,
            score: null, // 保持为空
            type: type,
            rejectionReason: status === 'rejected' ? '图片清晰度不足' : null,
        };

        const createdHotel = await prisma.hotel.create({
            data: hotelData
        });
        console.log(`Created hotel: ${createdHotel.nameZh} (${createdHotel.status})`);

        // 5.3 为酒店关联随机标签
        if (allTags.length > 0) {
            const randomTags = randomItems(allTags, randomInt(2, 5));
            for (const tag of randomTags) {
                await prisma.hotelTag.create({
                    data: {
                        hotelId: createdHotel.id,
                        tagId: tag.id
                    }
                });
            }
        }
        
        // 5.4 为酒店创建几个房型 (RoomType) 以便能展示价格
         if (status === 'published') {
             const roomTypes = ['标准大床房', '双床房', '豪华套房', '海景房', '家庭房'];
             const roomImageMap: Record<string, { folder: string; count: number }> = {
                 '标准大床房': { folder: 'big_bed', count: 8 },
                 '双床房': { folder: 'double_bed', count: 9 },
                 '豪华套房': { folder: 'luxury_bed', count: 8 },
                 '海景房': { folder: 'sea_bed', count: 8 },
                 '家庭房': { folder: 'home_bed', count: 7 },
             };
             
             const selectedRoomTypes = randomItems(roomTypes, randomInt(2, 4));
             
             for (const rtName of selectedRoomTypes) {
                 const imageConfig = roomImageMap[rtName];
                 const imageCount = imageConfig ? imageConfig.count : 5;
                 const folderName = imageConfig ? imageConfig.folder : 'big_bed';
                 // 随机选择 1 到 max 的图片
                 const randomImageIndex = randomInt(1, imageCount);
                 const imagePath = `/roomtypes/${folderName}/${folderName}_${randomImageIndex}.webp`;

                 await prisma.roomType.create({
                     data: {
                         hotelId: createdHotel.id,
                         name: rtName,
                         description: `舒适的${rtName}，包含早餐`,
                         price: randomInt(200, 2000),
                         discount: 1.0,
                         stock: randomInt(5, 20),
                         amenities: JSON.stringify(randomItems(['WiFi', '以及', '电视', '空调', '热水壶'], 3)),
                         images: JSON.stringify([imagePath])
                     }
                 });
             }
         }
    }
  }

  // --- 6. Coupons (优惠券) ---
  console.log('Seeding Coupons...');
  const couponsData = [
    {
      code: 'WELCOME50',
      name: '新用户立减券',
      description: '新用户专享，无门槛立减50元',
      discount: 50.00,
      minSpend: 0.00,
      points: 0,
      validFrom: new Date(),
      validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1年有效
    },
    {
      code: 'NEWYEAR100',
      name: '新年特惠券',
      description: '满500减100',
      discount: 100.00,
      minSpend: 500.00,
      points: 10,
      validFrom: new Date(),
      validTo: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3个月有效
    },
    {
      code: 'VIP200',
      name: 'VIP尊享券',
      description: '满1000减200，仅限VIP',
      discount: 200.00,
      minSpend: 1000.00,
      points: 500, // 需要500积分兑换
      validFrom: new Date(),
      validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  ];

  for (const coupon of couponsData) {
      await prisma.coupon.upsert({
          where: { code: coupon.code },
          update: {},
          create: coupon,
      });
      console.log(`Upserted coupon: ${coupon.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
