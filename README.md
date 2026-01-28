# 易宿酒店预订平台

> 第五期前端训练营大作业 | 单人开发 | 2026.01.29 - 2026.02.26

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速启动](#快速启动)
- [核心任务](#核心任务)
- [功能清单](#功能清单)
- [开发规范](#开发规范)
- [参考资源](#参考资源)

## 项目概述

智慧出行酒店预订平台，包含**移动端用户预订流程**和**PC端商户管理系统**。

### 核心页面（6个 = 60分）

**移动端（3个页面 - 35分）**
1. **酒店查询页**（5分）- Banner轮播、日期选择、筛选条件
2. **酒店列表页**（15分）- 无限滚动、多条件筛选、排序
3. **酒店详情页**（15分）- 图片轮播、房型列表、价格排序

**PC管理端（3个页面 - 25分）**
4. **登录/注册页**（5分）- 商户/管理员角色
5. **酒店信息管理**（10分）- 商户创建/编辑酒店
6. **审核发布系统**（10分）- 管理员审核/发布/下线

### 评分标准（100分）

| 评分项 | 分数 | 关键点 |
|--------|------|--------|
| **功能完成度** | 60 | 6个页面全部实现，核心功能无遗漏 |
| **技术复杂度** | 10 | MySQL事务、虚拟滚动、图片优化 |
| **用户体验** | 10 | 响应式布局、流畅动画、Loading状态 |
| **代码质量** | 10 | Sequelize ORM、组件复用、注释规范 |
| **项目创新** | 10 | Taro跨端、日历组件、审核工作流 |

**目标分数：93-95分**

## 技术栈

### 选定方案：Taro + React + Node.js + MySQL

```
移动端:  Taro 3.x + React + Taro UI         (H5/小程序跨端)
PC端:    React 18 + Vite + Ant Design       (管理后台)
后端:    Node.js + Express + MySQL          (RESTful API)
数据库:  MySQL 8.0 + Sequelize ORM          (参考携程架构)
部署:    Vercel/Railway                      (前后端分离)
```

### 选型理由

- ✅ **符合官方要求**：React + Node.js
- ✅ **行业标准**：MySQL 是携程等 OTA 平台主流数据库
- ✅ **跨端能力**：Taro 一次开发，H5 + 小程序多端运行
- ✅ **事务支持**：MySQL ACID 保证订单、库存一致性
- ✅ **关系型结构**：适合酒店、房型、订单的复杂关系查询

## 项目结构

```
hotel-booking/
├── hotel-server/          # 后端项目
│   ├── config/           # 数据库配置
│   ├── models/           # Sequelize 模型
│   ├── routes/           # API 路由
│   ├── middleware/       # 中间件（JWT验证）
│   ├── uploads/          # 图片上传目录
│   ├── server.js         # 入口文件
│   └── .env              # 环境变量
├── hotel-mobile/         # 移动端项目（Taro）
│   ├── src/
│   │   ├── pages/        # 页面（搜索/列表/详情）
│   │   ├── components/   # 组件
│   │   └── utils/        # 工具函数
│   └── project.config.json
└── hotel-admin/          # PC端项目（React）
    ├── src/
    │   ├── pages/        # 页面（登录/管理/审核）
    │   ├── components/   # 组件
    │   └── utils/        # 工具函数
    └── vite.config.js
```

详细结构请查看 [项目结构文档](./docs/project-structure.md)

1. 审核系统 API（管理员审核/下线/恢复）

**详细说明：** [后端开发指南](./docs/backend-guide.md)

**验收标准：**
- [ ] 12 个 API 接口全部实现
- [ ] Postman 测试通过
- [ ] JWT 权限验证生效
- [ ] 数据库表自动创建

---

### 任务二：移动端开发（Taro）

**目标：** 实现 3 个移动端页面

#### 2.1 酒店查询页（5分）

**功能需求：**
- Banner 轮播（至少 3 张图）
- 城市选择（Picker）
- 日期选择（日历组件）
- 筛选标签（星级、价格、设施）
- 搜索按钮跳转列表页

**技术要点：**
- 使用 Taro Swiper 实现轮播
- 使用 Taro UI Calendar 日历组件
- 筛选参数通过路由传递

**详细说明：** [移动端-搜索页](./docs/mobile-search.md)

#### 2.2 酒店列表页（15分）

**功能需求：**
- 筛选头（显示城市、日期、间夜）
- 酒店卡片列表（名称/评分/地址/价格）
- 无限滚动加载（分页）
- 多条件筛选（价格范围、星级、设施）
- 排序（价格/评分）

**技术要点：**
- 使用 `onReachBottom` 实现无限滚动
- 使用 `useState` 管理筛选条件
- 调用 GET /api/hotels 接口

**详细说明：** [移动端-列表页](./docs/mobile-list.md)

#### 2.3 酒店详情页（15分）

**功能需求：**
- 大图轮播（左右滑动）
- 酒店基础信息（名称/星级/设施/地址）
- 日历组件（选择入住/退房日期）
- 房型列表（价格从低到高）
- 返回按钮

**技术要点：**
- Swiper 支持左右滑动
- 房型按 price 字段排序
- 调用 GET /api/hotels/:id 接口

**详细说明：** [移动端-详情页](./docs/mobile-detail.md)

---

### 任务三：PC 管理端开发（React）

**目标：** 实现 3 个管理端页面

#### 3.1 登录/注册页（5分）

**功能需求：**
- 登录表单（用户名/密码）
- 注册表单（用户名/密码/邮箱/角色）
- 角色选择（商户/管理员）
- Token 存储（localStorage）
- 路由跳转（根据角色跳转不同页面）

**技术要点：**
- Ant Design Form 组件
- 表单验证
- JWT Token 存储
- React Router 路由守卫

**详细说明：** [PC端-登录注册](./docs/admin-auth.md)

#### 3.2 酒店信息管理（10分 - 商户角色）

**功能需求：**
- 我的酒店列表（Table）
- 创建/编辑酒店（Modal 表单）
- 必填字段：名称、地址、星级、房型、价格
- 图片上传（多图）
- 房型动态管理（添加/删除多个房型）
- 删除酒店（确认提示）

**技术要点：**
- Ant Design Table、Modal、Form、Upload
- 动态表单项（房型列表）
- 权限控制（只能管理自己的酒店）

**详细说明：** [PC端-酒店管理](./docs/admin-hotels.md)

#### 3.3 审核发布系统（10分 - 管理员角色）

**功能需求：**
- 待审核酒店列表（状态筛选）
- 酒店详情预览（Drawer）
- 审核操作（通过/拒绝）
- 拒绝原因输入
- 下线/恢复功能
- 审核记录展示

**技术要点：**
- Ant Design Table、Drawer、Modal
- 状态管理（draft/published/offline）
- 事务操作（审核 + 更新状态）

**详细说明：** [PC端-审核系统](./docs/admin-review.md)

---

### 任务四：性能优化（加分项）

**目标：** 提升技术复杂度评分（7分 → 10分）

**优化项：**
1. **虚拟滚动**（+2分）
   - 长列表（1000+ 数据）性能优化
   - 使用 react-window 或 Taro 虚拟列表

2. **图片懒加载**（+1分）
   - Intersection Observer API
   - 占位图 + 渐进加载

3. **请求优化**（+0.5分）
   - 防抖处理（搜索输入）
   - 请求缓存（避免重复请求）

4. **Loading 状态**（+0.5分）
   - 统一 Loading 组件
   - 骨架屏

**详细说明：** [性能优化指南](./docs/optimization.md)

---

### 任务五：部署上线

**目标：** 三个应用部署到线上

**部署方案：**
1. **后端**：Railway/Render
2. **数据库**：PlanetScale/Railway MySQL
3. **移动端 H5**：Vercel
4. **PC 端**：Vercel

**详细步骤：** [部署指南](./docs/deployment.md)

---

## 功能清单

### 后端 API（12个接口）

**认证模块：**
- [ ] POST /api/auth/register - 注册
- [ ] POST /api/auth/login - 登录

**酒店模块：**
- [ ] GET /api/hotels - 查询酒店（支持筛选）
- [ ] GET /api/hotels/:id - 酒店详情
- [ ] GET /api/hotels/my/hotels - 我的酒店（商户）
- [ ] POST /api/hotels - 创建酒店（商户）
- [ ] PUT /api/hotels/:id - 更新酒店（商户）
- [ ] DELETE /api/hotels/:id - 删除酒店（商户）

**审核模块：**
- [ ] GET /api/reviews/pending - 待审核列表（管理员）
- [ ] POST /api/reviews - 审核酒店（管理员）
- [ ] PUT /api/hotels/:id/status - 更新状态（管理员）

**上传模块：**
- [ ] POST /api/upload - 图片上传

### 移动端功能

**搜索页：**
- [ ] Banner 轮播
- [ ] 城市选择
- [ ] 日历组件（入住/退房日期）
- [ ] 筛选标签（星级/价格/设施）
- [ ] 搜索按钮跳转

**列表页：**
- [ ] 酒店卡片列表
- [ ] 无限滚动加载
- [ ] 多条件筛选
- [ ] 排序功能（价格/评分）

**详情页：**
- [ ] 图片轮播（左右滑动）
- [ ] 酒店基础信息
- [ ] 日历组件
- [ ] 房型价格列表（排序）
- [ ] 返回按钮

### PC 端功能

**登录注册：**
- [ ] 登录表单
- [ ] 注册表单（角色选择）
- [ ] Token 存储
- [ ] 路由守卫

**商户端：**
- [ ] 我的酒店列表
- [ ] 创建/编辑酒店表单
- [ ] 图片上传（多图）
- [ ] 房型动态管理
- [ ] 删除酒店

**管理员端：**
- [ ] 待审核酒店列表
- [ ] 酒店详情预览
- [ ] 审核操作（通过/拒绝/原因）
- [ ] 下线/恢复功能
- [ ] 审核记录

### 加分项（可选）

- [ ] 虚拟滚动优化
- [ ] 图片懒加载
- [ ] 请求防抖
- [ ] 骨架屏
- [ ] 响应式布局
- [ ] 过渡动画
- [ ] Taro 编译到小程序

## 开发规范

### Git 提交规范

**提交格式：**
```bash
<type>: <description>

# 类型（type）
feat:     新功能
fix:      Bug 修复
perf:     性能优化
style:    UI 美化
refactor: 重构
docs:     文档更新
test:     测试
chore:    构建/工具链

# 示例
git commit -m "feat: 实现用户登录接口"
git commit -m "fix: 修复列表页无限滚动bug"
git commit -m "perf: 添加虚拟滚动优化"
```

**建议提交节点（至少 20 次）：**
- 项目初始化
- 每个 API 接口完成
- 每个页面完成
- 每个功能模块完成
- Bug 修复
- 性能优化
- 部署配置

详细规范请查看 [开发规范文档](./docs/conventions.md)

### 代码规范

- **命名规范**：驼峰命名（camelCase）、组件大驼峰（PascalCase）
- **注释规范**：关键函数添加注释、复杂逻辑说明
- **组件复用**：提取公共组件、避免重复代码
- **API 封装**：统一 axios 实例、错误处理

### 目录规范

详见 [项目结构文档](./docs/project-structure.md)

## 参考资源

### 官方文档

- [Taro 官方文档](https://taro-docs.jd.com/)
- [React 官方文档](https://react.dev/)
- [Ant Design](https://ant.design/)
- [Sequelize ORM](https://sequelize.org/)
- [MySQL 文档](https://dev.mysql.com/doc/)
- [Taro UI 组件库](https://taro-ui.jd.com/)

### 学习资源

- [Node.js Express 教程](https://expressjs.com/zh-cn/starter/installing.html)
- [JWT 认证教程](https://jwt.io/introduction)
- [Sequelize 快速入门](https://sequelize.org/docs/v6/getting-started/)
- [Taro 快速上手](https://taro-docs.jd.com/docs/GETTING-STARTED)

### 工具推荐

- **API 测试**：Postman / Insomnia
- **数据库管理**：Sequel Pro / DBeaver / MySQL Workbench
- **代码编辑器**：VS Code
- **Git GUI**：SourceTree / GitHub Desktop

## 相关文档

- [数据库设计](./docs/database.md) - MySQL 表结构、索引优化
- [开发计划](./docs/development-plan.md) - 28天任务分解
- [后端开发指南](./docs/backend-guide.md) - 完整后端代码示例
- [移动端开发指南](./docs/mobile-development.md) - Taro 页面实现
- [PC端开发指南](./docs/admin-development.md) - React 管理后台
- [部署指南](./docs/deployment.md) - 线上部署步骤
- [答辩准备](./docs/presentation.md) - PPT、演示视频

## License

MIT

---

**预估分数：93-95分 | 单人开发 4 周完成**
