// 内存数据存储（用于开发测试）
// 生产环境应该使用真实数据库

let users = [];
let hotels = [];
let rooms = [];

let userIdCounter = 1;
let hotelIdCounter = 1;
let roomIdCounter = 1;

module.exports = {
  // 用户相关
  users: {
    getAll: () => users,
    getById: (id) => users.find(u => u.id === id),
    getByUsername: (username) => users.find(u => u.username === username),
    getByEmail: (email) => users.find(u => u.email === email),
    create: (userData) => {
      const user = {
        id: userIdCounter++,
        ...userData,
        created_at: new Date().toISOString(),
      };
      users.push(user);
      return user;
    },
    update: (id, userData) => {
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...userData };
        return users[index];
      }
      return null;
    },
  },

  // 酒店相关
  hotels: {
    getAll: () => hotels,
    getById: (id) => hotels.find(h => h.id === id),
    getByMerchantId: (merchantId) => hotels.filter(h => h.merchant_id === merchantId),
    getByStatus: (status) => hotels.filter(h => h.status === status),
    create: (hotelData) => {
      const hotel = {
        id: hotelIdCounter++,
        ...hotelData,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      hotels.push(hotel);
      return hotel;
    },
    update: (id, hotelData) => {
      const index = hotels.findIndex(h => h.id === id);
      if (index !== -1) {
        hotels[index] = {
          ...hotels[index],
          ...hotelData,
          updated_at: new Date().toISOString(),
        };
        return hotels[index];
      }
      return null;
    },
    delete: (id) => {
      const index = hotels.findIndex(h => h.id === id);
      if (index !== -1) {
        // 同时删除关联的房间
        rooms = rooms.filter(r => r.hotel_id !== id);
        hotels.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  // 房间相关
  rooms: {
    getAll: () => rooms,
    getById: (id) => rooms.find(r => r.id === id),
    getByHotelId: (hotelId) => rooms.filter(r => r.hotel_id === hotelId),
    create: (roomData) => {
      const room = {
        id: roomIdCounter++,
        ...roomData,
        available_count: roomData.total_count,
        created_at: new Date().toISOString(),
      };
      rooms.push(room);
      return room;
    },
    createBatch: (hotelId, roomsData) => {
      const createdRooms = roomsData.map(roomData => {
        const room = {
          id: roomIdCounter++,
          hotel_id: hotelId,
          ...roomData,
          available_count: roomData.total_count,
          created_at: new Date().toISOString(),
        };
        rooms.push(room);
        return room;
      });
      return createdRooms;
    },
    deleteByHotelId: (hotelId) => {
      rooms = rooms.filter(r => r.hotel_id !== hotelId);
    },
    update: (id, roomData) => {
      const index = rooms.findIndex(r => r.id === id);
      if (index !== -1) {
        rooms[index] = { ...rooms[index], ...roomData };
        return rooms[index];
      }
      return null;
    },
  },
};
