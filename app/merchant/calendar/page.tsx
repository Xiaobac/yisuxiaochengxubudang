'use client';

import { useState, useEffect } from 'react';
import { Calendar, Badge, Select, Card, Drawer, Table, Tag, App } from 'antd';
import type { Dayjs } from 'dayjs';
import type { BadgeProps } from 'antd';
import dayjs from 'dayjs';
import { getMyHotels } from '@/app/services/hotel';
import type { Hotel, Room } from '@/app/types';

const { Option } = Select;

interface RoomAvailability {
  room_type: string;
  total_count: number;
  available_count: number;
  booked_count: number;
}

interface DayAvailability {
  date: string;
  rooms: RoomAvailability[];
}

export default function CalendarPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [availabilityData, setAvailabilityData] = useState<Map<string, DayAvailability>>(new Map());
  const { message } = App.useApp();

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      generateMockAvailabilityData();
    }
  }, [selectedHotel]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const data = await getMyHotels();
      setHotels(data);
      if (data.length > 0) {
        setSelectedHotel(data[0].id!);
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error);
      message.error('获取酒店列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成模拟的可用性数据
  const generateMockAvailabilityData = () => {
    const hotel = hotels.find(h => h.id === selectedHotel);
    if (!hotel || !hotel.Rooms) return;

    const data = new Map<string, DayAvailability>();
    const today = dayjs();

    // 生成未来30天的数据
    for (let i = 0; i < 30; i++) {
      const date = today.add(i, 'day').format('YYYY-MM-DD');
      const rooms: RoomAvailability[] = hotel.Rooms.map(room => {
        // 随机生成已预订数量
        const booked = Math.floor(Math.random() * room.total_count);
        return {
          room_type: room.room_type,
          total_count: room.total_count,
          available_count: room.total_count - booked,
          booked_count: booked,
        };
      });
      data.set(date, { date, rooms });
    }

    setAvailabilityData(data);
  };

  const getCurrentHotel = () => {
    return hotels.find(h => h.id === selectedHotel);
  };

  const getRoomTypes = () => {
    const hotel = getCurrentHotel();
    return hotel?.Rooms || [];
  };

  const getAvailabilityForDate = (date: Dayjs): RoomAvailability[] => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayData = availabilityData.get(dateStr);

    if (!dayData) return [];

    if (selectedRoomType === 'all') {
      return dayData.rooms;
    }

    return dayData.rooms.filter(r => r.room_type === selectedRoomType);
  };

  const getAvailabilityRate = (available: number, total: number): number => {
    return total > 0 ? (available / total) * 100 : 0;
  };

  const getStatusColor = (rate: number): BadgeProps['status'] => {
    if (rate >= 70) return 'success';
    if (rate >= 30) return 'warning';
    return 'error';
  };

  const dateCellRender = (date: Dayjs) => {
    const rooms = getAvailabilityForDate(date);
    if (rooms.length === 0) return null;

    return (
      <div style={{ fontSize: '12px', lineHeight: '1.2' }}>
        {rooms.map((room, index) => {
          const rate = getAvailabilityRate(room.available_count, room.total_count);
          return (
            <div key={index} style={{ marginBottom: '2px' }}>
              <Badge
                status={getStatusColor(rate)}
                text={`${room.room_type}: ${room.available_count}/${room.total_count}`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setDrawerVisible(true);
  };

  const getSelectedDateData = () => {
    if (!selectedDate) return [];
    return getAvailabilityForDate(selectedDate);
  };

  const columns = [
    {
      title: '房型',
      dataIndex: 'room_type',
      key: 'room_type',
    },
    {
      title: '总数',
      dataIndex: 'total_count',
      key: 'total_count',
    },
    {
      title: '可用',
      dataIndex: 'available_count',
      key: 'available_count',
      render: (available: number, record: RoomAvailability) => {
        const rate = getAvailabilityRate(available, record.total_count);
        const color = rate >= 70 ? 'green' : rate >= 30 ? 'orange' : 'red';
        return <Tag color={color}>{available}</Tag>;
      },
    },
    {
      title: '已订',
      dataIndex: 'booked_count',
      key: 'booked_count',
    },
    {
      title: '可用率',
      key: 'rate',
      render: (_: any, record: RoomAvailability) => {
        const rate = getAvailabilityRate(record.available_count, record.total_count);
        return `${rate.toFixed(0)}%`;
      },
    },
  ];

  return (
    <div>
      <Card
        title="房间日历"
        extra={
          <div style={{ display: 'flex', gap: '16px' }}>
            <Select
              style={{ width: 200 }}
              placeholder="选择酒店"
              value={selectedHotel}
              onChange={setSelectedHotel}
              loading={loading}
            >
              {hotels.map(hotel => (
                <Option key={hotel.id} value={hotel.id!}>
                  {hotel.name}
                </Option>
              ))}
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="房型筛选"
              value={selectedRoomType}
              onChange={setSelectedRoomType}
            >
              <Option value="all">全部房型</Option>
              {getRoomTypes().map(room => (
                <Option key={room.room_type} value={room.room_type}>
                  {room.room_type}
                </Option>
              ))}
            </Select>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Badge status="success" text="充足 (可用率 ≥ 70%)" style={{ marginRight: 16 }} />
          <Badge status="warning" text="紧张 (可用率 30%-70%)" style={{ marginRight: 16 }} />
          <Badge status="error" text="满房 (可用率 < 30%)" />
        </div>

        <Calendar
          dateCellRender={dateCellRender}
          onSelect={onSelect}
        />
      </Card>

      <Drawer
        title={selectedDate ? `${selectedDate.format('YYYY年MM月DD日')} 房间详情` : ''}
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        <Table
          dataSource={getSelectedDateData()}
          columns={columns}
          rowKey="room_type"
          pagination={false}
        />
      </Drawer>
    </div>
  );
}
