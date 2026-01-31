const jwt = require('jsonwebtoken');
const store = require('../data/store');

// JWT 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: '令牌无效或已过期' });
  }
};

// 角色验证中间件
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未认证' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '权限不足' });
    }

    next();
  };
};

// 验证商户是否拥有该酒店
const requireHotelOwnership = (req, res, next) => {
  const hotelId = parseInt(req.params.id);
  const hotel = store.hotels.getById(hotelId);

  if (!hotel) {
    return res.status(404).json({ message: '酒店不存在' });
  }

  if (hotel.merchant_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: '无权操作此酒店' });
  }

  req.hotel = hotel;
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireHotelOwnership,
};
