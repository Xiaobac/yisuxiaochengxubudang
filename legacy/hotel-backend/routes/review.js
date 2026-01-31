const express = require('express');
const store = require('../data/store');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 获取待审核酒店列表（管理员）
router.get('/pending', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    // 获取所有酒店（包括待审核、已发布、已下线）
    const hotels = store.hotels.getAll();

    // 关联房间信息
    const hotelsWithRooms = hotels.map(hotel => ({
      ...hotel,
      Rooms: store.rooms.getByHotelId(hotel.id),
    }));

    res.json(hotelsWithRooms);
  } catch (error) {
    console.error('获取待审核酒店列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 审核酒店（管理员）
router.post('/hotels/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const { status, reason } = req.body;

    // 验证状态
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '无效的审核状态' });
    }

    // 如果是拒绝，必须提供原因
    if (status === 'rejected' && !reason) {
      return res.status(400).json({ message: '拒绝时必须提供原因' });
    }

    const hotel = store.hotels.getById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }

    // 更新酒店状态
    const newStatus = status === 'approved' ? 'published' : 'offline';
    const updatedHotel = store.hotels.update(hotelId, {
      status: newStatus,
      review_reason: reason || null,
      reviewed_at: new Date().toISOString(),
    });

    res.json({
      message: status === 'approved' ? '审核通过' : '已拒绝',
      hotel: updatedHotel,
    });
  } catch (error) {
    console.error('审核酒店错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新酒店状态（管理员 - 上线/下线）
router.patch('/hotels/:id/status', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const { status } = req.body;

    // 验证状态
    if (!['published', 'offline'].includes(status)) {
      return res.status(400).json({ message: '无效的状态' });
    }

    const hotel = store.hotels.getById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }

    // 更新状态
    const updatedHotel = store.hotels.update(hotelId, {
      status,
      updated_at: new Date().toISOString(),
    });

    res.json({
      message: status === 'published' ? '已上线' : '已下线',
      hotel: updatedHotel,
    });
  } catch (error) {
    console.error('更新酒店状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
