const express = require('express');
const store = require('../data/store');
const { authenticateToken, requireRole, requireHotelOwnership } = require('../middleware/auth');

const router = express.Router();

// 获取所有酒店（公开接口，可筛选）
router.get('/', (req, res) => {
  try {
    const { city, status } = req.query;
    let hotels = store.hotels.getAll();

    // 筛选城市
    if (city) {
      hotels = hotels.filter(h => h.city === city);
    }

    // 筛选状态
    if (status) {
      hotels = hotels.filter(h => h.status === status);
    } else {
      // 默认只返回已发布的酒店
      hotels = hotels.filter(h => h.status === 'published');
    }

    // 关联房间信息
    hotels = hotels.map(hotel => ({
      ...hotel,
      Rooms: store.rooms.getByHotelId(hotel.id),
    }));

    res.json(hotels);
  } catch (error) {
    console.error('获取酒店列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个酒店详情
router.get('/:id', (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const hotel = store.hotels.getById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }

    // 关联房间信息
    const hotelWithRooms = {
      ...hotel,
      Rooms: store.rooms.getByHotelId(hotel.id),
    };

    res.json(hotelWithRooms);
  } catch (error) {
    console.error('获取酒店详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取我的酒店列表（商户）
router.get('/my/hotels', authenticateToken, requireRole('merchant'), (req, res) => {
  try {
    const hotels = store.hotels.getByMerchantId(req.user.id);

    // 关联房间信息
    const hotelsWithRooms = hotels.map(hotel => ({
      ...hotel,
      Rooms: store.rooms.getByHotelId(hotel.id),
    }));

    res.json(hotelsWithRooms);
  } catch (error) {
    console.error('获取我的酒店列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建酒店（商户）
router.post('/', authenticateToken, requireRole('merchant'), (req, res) => {
  try {
    const {
      name,
      name_en,
      city,
      address,
      star_rating,
      price,
      facilities,
      description,
      images,
      rooms,
      opening_date,
    } = req.body;

    // 验证必填字段
    if (!name || !city || !address || !star_rating || !price || !opening_date || !rooms || rooms.length === 0) {
      return res.status(400).json({ message: '请填写所有必填字段,包括酒店开业时间' });
    }

    // 创建酒店
    const hotel = store.hotels.create({
      merchant_id: req.user.id,
      name,
      name_en,
      city,
      address,
      star_rating,
      price,
      facilities: facilities || [],
      description,
      images: images || [],
      opening_date,
    });

    // 创建房间
    const createdRooms = store.rooms.createBatch(hotel.id, rooms);

    // 返回完整酒店信息
    const hotelWithRooms = {
      ...hotel,
      Rooms: createdRooms,
    };

    res.status(201).json(hotelWithRooms);
  } catch (error) {
    console.error('创建酒店错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新酒店（商户）
router.put('/:id', authenticateToken, requireRole('merchant'), requireHotelOwnership, (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const {
      name,
      name_en,
      city,
      address,
      star_rating,
      price,
      facilities,
      description,
      images,
      rooms,
    } = req.body;

    // 更新酒店基本信息
    const updatedHotel = store.hotels.update(hotelId, {
      name,
      name_en,
      city,
      address,
      star_rating,
      price,
      facilities,
      description,
      images,
    });

    if (!updatedHotel) {
      return res.status(404).json({ message: '酒店不存在' });
    }

    // 更新房间信息（删除旧的，创建新的）
    if (rooms && rooms.length > 0) {
      store.rooms.deleteByHotelId(hotelId);
      const createdRooms = store.rooms.createBatch(hotelId, rooms);
      updatedHotel.Rooms = createdRooms;
    } else {
      updatedHotel.Rooms = store.rooms.getByHotelId(hotelId);
    }

    res.json(updatedHotel);
  } catch (error) {
    console.error('更新酒店错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除酒店（商户）
router.delete('/:id', authenticateToken, requireRole('merchant'), requireHotelOwnership, (req, res) => {
  try {
    const hotelId = parseInt(req.params.id);
    const success = store.hotels.delete(hotelId);

    if (!success) {
      return res.status(404).json({ message: '酒店不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除酒店错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
