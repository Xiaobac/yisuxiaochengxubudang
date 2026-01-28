# 数据库设计文档

## MySQL 数据库架构

### 数据库选型理由

1. **行业标准**：携程、美团等 OTA 平台主流数据库
2. **事务支持**：ACID 保证订单、库存一致性
3. **关系型结构**：适合酒店、房型、订单的复杂关系
4. **成熟稳定**：经过海量数据验证

## 核心表结构

### 1. users - 用户表

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  email VARCHAR(100) COMMENT '邮箱',
  role ENUM('user', 'merchant', 'admin') DEFAULT 'user' COMMENT '角色',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

**字段说明：**
- `role`: user(普通用户), merchant(商户), admin(管理员)
- `password`: 使用 bcryptjs 加密存储

### 2. hotels - 酒店表

```sql
CREATE TABLE hotels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '酒店名称',
  name_en VARCHAR(100) COMMENT '英文名称',
  address VARCHAR(255) NOT NULL COMMENT '地址',
  city VARCHAR(50) NOT NULL COMMENT '城市',
  star_rating INT DEFAULT 3 COMMENT '星级 (1-5)',
  price DECIMAL(10,2) NOT NULL COMMENT '起始价格',
  images JSON COMMENT '图片数组 ["url1", "url2"]',
  facilities JSON COMMENT '设施 ["WiFi", "停车场"]',
  description TEXT COMMENT '描述',
  status ENUM('draft', 'published', 'offline') DEFAULT 'draft' COMMENT '状态',
  merchant_id INT NOT NULL COMMENT '商户ID',
  rating FLOAT DEFAULT 5.0 COMMENT '评分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_city (city),
  INDEX idx_price (price),
  INDEX idx_status (status),
  INDEX idx_merchant_id (merchant_id),
  FOREIGN KEY (merchant_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='酒店表';
```

**字段说明：**
- `status`: draft(草稿), published(已发布), offline(已下线)
- `images/facilities`: 使用 JSON 类型存储数组数据

### 3. rooms - 房型表

```sql
CREATE TABLE rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL COMMENT '酒店ID',
  room_type VARCHAR(50) NOT NULL COMMENT '房型名称（大床房/双床房）',
  price DECIMAL(10,2) NOT NULL COMMENT '价格',
  total_count INT DEFAULT 1 COMMENT '总数',
  available_count INT DEFAULT 1 COMMENT '可用数量',
  description TEXT COMMENT '描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotel_id (hotel_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房型表';
```

### 4. reviews - 审核记录表

```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL COMMENT '酒店ID',
  admin_id INT NOT NULL COMMENT '管理员ID',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '状态',
  reason TEXT COMMENT '拒绝原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '审核时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_status (status),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核记录表';
```

### 5. orders - 订单表（扩展功能）

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL COMMENT '酒店ID',
  room_id INT NOT NULL COMMENT '房型ID',
  user_id INT NOT NULL COMMENT '用户ID',
  check_in DATE NOT NULL COMMENT '入住日期',
  check_out DATE NOT NULL COMMENT '退房日期',
  total_price DECIMAL(10,2) NOT NULL COMMENT '总价',
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_check_in (check_in),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
```

## 数据库关系图

```
users (商户)
  └── 1:N → hotels (酒店)
                └── 1:N → rooms (房型)
                └── 1:N → reviews (审核记录)

users (管理员)
  └── 1:N → reviews (审核记录)

users (用户)
  └── 1:N → orders (订单)
```

## 索引优化

### 查询场景与索引

1. **按城市查询**：`idx_city` on hotels(city)
2. **价格范围筛选**：`idx_price` on hotels(price)
3. **状态筛选**：`idx_status` on hotels(status)
4. **商户查询自己的酒店**：`idx_merchant_id` on hotels(merchant_id)

### 复合索引（可选优化）

```sql
-- 城市+价格复合查询优化
CREATE INDEX idx_city_price ON hotels(city, price);

-- 城市+状态复合查询优化
CREATE INDEX idx_city_status ON hotels(city, status);
```

## 初始化数据

### 创建测试用户

```sql
-- 管理员账号（密码: admin123，需要用 bcrypt 加密）
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2a$10$encrypted_password_here', 'admin@hotel.com', 'admin');

-- 商户账号（密码: merchant123）
INSERT INTO users (username, password, email, role) VALUES
('merchant', '$2a$10$encrypted_password_here', 'merchant@hotel.com', 'merchant');
```

### 创建测试酒店数据

```sql
INSERT INTO hotels (name, name_en, address, city, star_rating, price, images, facilities, status, merchant_id) VALUES
('希尔顿酒店', 'Hilton Hotel', '北京市朝阳区建国门外大街1号', '北京', 5, 688.00,
 '["https://example.com/img1.jpg"]',
 '["WiFi", "停车场", "游泳池", "健身房"]',
 'published', 2);

INSERT INTO rooms (hotel_id, room_type, price, total_count, available_count) VALUES
(1, '豪华大床房', 688.00, 10, 8),
(1, '豪华双床房', 788.00, 8, 6),
(1, '行政套房', 1288.00, 5, 3);
```

## 性能优化建议

1. **使用连接池**：Sequelize pool 配置（max: 5, min: 0）
2. **查询优化**：使用 EXPLAIN 分析慢查询
3. **JSON 字段**：images 和 facilities 使用 JSON 类型，减少关联查询
4. **分页查询**：使用 LIMIT + OFFSET，避免全表扫描
5. **缓存层**（可选）：Redis 缓存热门酒店数据

## 备份策略

```bash
# 导出数据库
mysqldump -u root -p hotel_booking > backup.sql

# 导入数据库
mysql -u root -p hotel_booking < backup.sql
```
