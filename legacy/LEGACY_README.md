# Legacy 项目说明

此目录包含原有的 React + Vite 项目代码，已迁移到 Next.js。这些文件仅作为功能迁移的参考。

## 旧项目结构

- **hotel-admin**: 管理员和商户后台（React + Vite + Ant Design）
- **hotel-web**: 用户端网页（React + Vite + Ant Design）
- **hotel-mobile**: 移动端应用（Taro）
- **hotel-backend**: 后端 API（Express.js）

## 如何运行旧项目（仅用于参考）

### 1. 启动后端 API

```bash
cd legacy/hotel-backend
npm install
npm start
# 运行在 http://localhost:3001
```

### 2. 启动管理端

```bash
cd legacy/hotel-admin
npm install
npm run dev
# 运行在 http://localhost:5173
```

### 3. 启动用户端

```bash
cd legacy/hotel-web
npm install
npm run dev
# 运行在 http://localhost:5176
```

### 4. 启动移动端

```bash
cd legacy/hotel-mobile
npm install
npm run dev:h5
# 运行在对应端口
```

## 重要提示

⚠️ **不要在 legacy 目录中进行新功能开发**

- 所有新功能应该在根目录的 Next.js 项目中开发
- Legacy 代码仅作为迁移参考使用
- 从 legacy 迁移功能时，需要适配 Next.js 的 App Router 模式

## 功能迁移状态

### 已迁移到 Next.js

- ✅ 深色模式切换
- ✅ Ant Design 集成
- ✅ 中文语言包

### 待迁移

- ⏳ 用户认证（登录/注册）
- ⏳ 管理员功能
- ⏳ 商户功能
- ⏳ 用户端酒店浏览
- ⏳ 预订功能

## 参考文档

- [原项目说明](./README.md)
- [数据库设计](./docs/database.md)
- [开发计划](./docs/development-plan.md)
- [数据模型图](./docs/数据模型.jpg)
