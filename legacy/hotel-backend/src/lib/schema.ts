// lib/schema.ts
import { pgTable, text, serial, integer, decimal, timestamp, jsonb, boolean, varchar, primaryKey, unique } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

// 权限表
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(), // e.g. 'manage_hotels'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

// 角色表
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // 'user', 'merchant', 'admin'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

// 角色-权限关联表
export const rolePermissions = pgTable('role_permissions', {
  roleId: integer('role_id').references(() => roles.id).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}))

// 位置表
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

// 标签表
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
})

// 用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  password: varchar('password', { length: 255 }).notNull(),
  roleId: integer('role_id').references(() => roles.id),
  name: varchar('name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
})

// 酒店表
export const hotels = pgTable('hotels', {
  id: serial('id').primaryKey(),
  merchantId: integer('merchant_id').references(() => users.id),
  locationId: integer('location_id').references(() => locations.id),
  nameZh: varchar('name_zh', { length: 200 }).notNull(),
  nameEn: varchar('name_en', { length: 200 }),
  address: text('address').notNull(),
  starRating: integer('star_rating'),
  description: text('description'),
  facilities: jsonb('facilities').$type<string[]>(),
  openingYear: integer('opening_year'),
  images: jsonb('images').$type<string[]>(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending'（待审核）, 'published'（已发布）, 'rejected'（已拒绝）, 'offline'（已下线）
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// 酒店审核日志表
export const hotelAuditLogs = pgTable('hotel_audit_logs', {
  id: serial('id').primaryKey(),
  hotelId: integer('hotel_id').references(() => hotels.id).notNull(),
  operatorId: integer('operator_id').references(() => users.id), // 操作人ID（管理员）
  oldStatus: varchar('old_status', { length: 20 }),
  newStatus: varchar('new_status', { length: 20 }).notNull(),
  comment: text('comment'), // 审核意见/拒绝理由/下线原因
  createdAt: timestamp('created_at').defaultNow(),
})

// 酒店-标签关联表
export const hotelTags = pgTable('hotel_tags', {
  hotelId: integer('hotel_id').references(() => hotels.id).notNull(),
  tagId: integer('tag_id').references(() => tags.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.hotelId, t.tagId] }),
}))

// 用户收藏表
export const favorites = pgTable('favorites', {
  userId: integer('user_id').references(() => users.id).notNull(),
  hotelId: integer('hotel_id').references(() => hotels.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.hotelId] }),
}))

// 房型表
export const roomTypes = pgTable('room_types', {
  id: serial('id').primaryKey(),
  hotelId: integer('hotel_id').references(() => hotels.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 3, scale: 2 }).default('1.00'),
  amenities: jsonb('amenities').$type<string[]>(),
  images: jsonb('images').$type<string[]>(),
  stock: integer('stock').notNull().default(0),
})

// 酒店每日房量与价格表（用于特定日期的库存/价格控制）
export const roomAvailability = pgTable('room_availability', {
  id: serial('id').primaryKey(),
  roomTypeId: integer('room_type_id').references(() => roomTypes.id).notNull(),
  date: timestamp('date').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }), // 当日特定价格
  quota: integer('quota'), // 当日特定库存上限（覆盖房型默认库存）
  booked: integer('booked').notNull().default(0), // 当日已预订数量
  isClosed: boolean('is_closed').default(false), // 当日是否关闭预订
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  // 确保同一房型同一天只有一条记录
  unq: unique().on(t.roomTypeId, t.date),
}))

// 订单表
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  hotelId: integer('hotel_id').references(() => hotels.id),
  roomTypeId: integer('room_type_id').references(() => roomTypes.id),
  checkInDate: timestamp('check_in_date').notNull(),
  checkOutDate: timestamp('check_out_date').notNull(),
  guestCount: integer('guest_count').notNull().default(1),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'confirmed', 'cancelled', 'completed'
  guestInfo: jsonb('guest_info').$type<{ name: string; phone: string }>(),
  createdAt: timestamp('created_at').defaultNow(),
})

// 数据验证模式
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("无效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
}).omit({ id: true, createdAt: true })

export const insertHotelSchema = createInsertSchema(hotels, {
  nameZh: z.string().min(1, "酒店名称不能为空"),
  address: z.string().min(1, "地址不能为空"),
  starRating: z.number().min(1).max(5).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true })

export const insertRoomTypeSchema = createInsertSchema(roomTypes, {
  name: z.string().min(1, "房型名称不能为空"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "价格格式必须为数字或两位小数"),
  stock: z.number().int().min(0, "库存不能为负数"),
}).omit({ id: true })

export const insertBookingSchema = createInsertSchema(bookings, {
  guestCount: z.number().int().min(1, "入住人数至少为1人"),
  checkInDate: z.date({ required_error: "请选择入住日期" }), // Zod date schema expects Date object
  checkOutDate: z.date({ required_error: "请选择退房日期" }),
}).omit({ id: true, createdAt: true, status: true, totalPrice: true }).refine((data) => data.checkOutDate > data.checkInDate, {
  message: "退房日期必须晚于入住日期",
  path: ["checkOutDate"],
})

export const insertRoomAvailabilitySchema = createInsertSchema(roomAvailability).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  booked: true 
})