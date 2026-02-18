# 首页改动说明

> 依据 `home修改文档1.docx` 完成的所有代码修改记录。

---

## 1. 价格区间筛选（去除星级）

**文件：** `trip_front_end_taro/src/pages/home/index.jsx`

**改动：**
- 移除 `selectedStarRating` state 及相关的 `handleStarSelect` 函数
- `handleFilterSelect` 由原来弹出「选择价格 / 选择星级」二级菜单，改为直接弹出价格区间选项：
  - `不限` / `0-200元` / `200-400元` / `400-600元` / `600元以上`
- UI 文案由「价格/星级」改为「价格区间」
- `handleSearch` 中去掉 `starRating` 字段，保留 `minPrice` / `maxPrice`

---

## 2. 标签全量展示 + 多选

**文件：** `trip_front_end_taro/src/pages/home/index.jsx`

**改动：**
- `loadInitialData` 中标签处理从 `.slice(0, 3)` 改为 `setTags(tagsData)`，展示后端返回的全量标签
- 新增 `selectedTags` state（数组），记录用户选中的标签对象
- 新增 `handleToggleTag(tag)` 函数：点击标签切换选中 / 取消选中
- 标签渲染：选中的标签添加 `tag-active` class，视觉上区分已选状态
- `handleSearch` 中传入 `tags: selectedTags.map(t => t.id)` 数组到查询参数

> 以上改动同时覆盖「国内」「海外」「钟点房」「民宿」四个 tab，因为它们共用同一套组件逻辑。

---

## 3. 优惠券入口 Card

**文件：** `trip_front_end_taro/src/pages/home/index.jsx`
**文件：** `trip_front_end_taro/src/pages/home/index.css`

**改动：**
- 在「查询」按钮下方新增一个优惠券入口卡片
- 点击跳转至 `/pages/Coupon/index`（已有页面）
- 卡片内容：左侧图标 + 标题「领取优惠券」+ 副标题「精选酒店红包，限时领取」，右侧箭头
- 新增 CSS 类：`.coupon-entry-card` / `.coupon-entry-left` / `.coupon-entry-icon` / `.coupon-entry-title` / `.coupon-entry-desc` / `.coupon-entry-arrow`

---

## 4. 酒店列表页联动修复

**文件：** `trip_front_end_taro/src/pages/hotelList/index.jsx`

**改动：**
- `loadHotels` 中已有 `tags: params.tags` 传入 API，无需额外修改
- 修复筛选结果统计栏：`searchParams.tags` 为数组，改为显示「N个标签」，避免对数组调用 `.replace` 报错
- 移除已不再传入的 `searchParams.starRating` 标签显示

---

---

## 5. 价格区间改为弹出面板

**文件：** `trip_front_end_taro/src/pages/home/index.jsx`
**文件：** `trip_front_end_taro/src/pages/home/index.css`

**改动：**
- 原价格区间（ActionSheet 下拉菜单）改为底部弹出面板，交互风格参考携程
- 弹出面板包含：
  - 顶部双输入框（最低价 / 最高价），直接输入数字，实时联动滑块位置
  - 双滑块进度条：左滑块控制最低价，右滑块控制最高价，拖动时联动输入框
  - 刻度标注：¥0 ～ ¥4500+
  - 快捷价格标签：不限 / 200以下 / 200-500 / 500-1000 / 1000-2000 / 2000以上，点击一键设定区间
  - 底部重置 / 确定按钮
- 价格上限由 2000 元调整为 4500 元
- 入口行点击打开面板，确定后显示已选价格（如 `¥200-500`）
- 新增 state：`minPriceInput` / `maxPriceInput` / `isPricePanelVisible` / `sliderMin` / `sliderMax` / `panelMinInput` / `panelMaxInput`
- 新增 CSS 类：`.price-panel-content` / `.price-panel-inputs` / `.price-panel-input` / `.price-panel-sep` / `.price-panel-unit` / `.price-slider-wrap` / `.price-slider-track` / `.price-slider-fill` / `.price-thumb` / `.price-slider-labels` / `.price-quick-tags` / `.price-quick-tag`

---

## 6. 优惠券领取功能

**文件：** `app/api/coupons/[id]/claim/route.ts`（新建）
**文件：** `app/api/user/coupons/route.ts`（新建）
**文件：** `trip_front_end_taro/src/services/coupon.js`（新建）
**文件：** `trip_front_end_taro/src/pages/Coupon/index.jsx`
**文件：** `trip_front_end_taro/src/pages/Coupon/index.css`

**后端改动：**
- 新增 `POST /api/coupons/:id/claim`：用户领取优惠券，需登录；验证优惠券存在及有效期，写入 `UserCoupon` 表；重复领取返回 400
- 新增 `GET /api/user/coupons`：获取当前用户已领取的优惠券列表，需登录；返回 `UserCoupon` 含优惠券详情

**前端改动：**
- `services/coupon.js` 新增 `claimCoupon(couponId)` 和 `getUserCoupons()`
- 优惠券页面加载时并行请求全部券列表 + 已领取列表，构建 `claimedIds` Set
- 按钮状态：
  - 未领取 → **立即领取**（黄色）
  - 领取中 → **领取中**（半透明）
  - 已领取 → **已领取**（灰色）
  - 已过期 → **已过期**（灰色，卡片整体变暗）
- 新增 CSS 类：`.coupon-btn-claimed` / `.coupon-btn-disabled` / `.coupon-btn-loading` / `.coupon-card-expired` / `.coupon-desc-text` / `.tag-gray`

---

## 涉及文件清单

| 文件 | 改动类型 |
|------|----------|
| `src/pages/home/index.jsx` | 逻辑 + JSX 修改 |
| `src/pages/home/index.css` | 新增优惠券 Card 样式、价格面板样式 |
| `src/pages/hotelList/index.jsx` | 修复 tags 显示 bug |
| `src/pages/Coupon/index.jsx` | 接入领取逻辑、状态展示 |
| `src/pages/Coupon/index.css` | 新增按钮状态样式 |
| `src/services/coupon.js` | 新建，封装优惠券相关接口 |
| `app/api/coupons/[id]/claim/route.ts` | 新建，领取优惠券接口 |
| `app/api/user/coupons/route.ts` | 新建，用户已领优惠券查询接口 |
