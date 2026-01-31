# AI 辅助开发记录


git 不要提交任何有关Claude相关的内容
## 使用 AI 辅助的功能

 
### 2026-01-29 - MonoRepo 结构优化
- 删除空的 hotel-server 目录
- 创建根目录 package.json，添加统一启动脚本
- 提取共享的 ESLint 配置到根目录
- 为后端添加 nodemon 实现热重载
- 配置 concurrently 实现一键启动所有服务

### 工具和配置
- 使用 concurrently 管理多个服务的启动
- 使用 nodemon 实现后端热重载
- 统一的 ESLint 配置管理

---


