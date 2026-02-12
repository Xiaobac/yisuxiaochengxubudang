'use client';

import { useState, useEffect } from 'react';
import { Calendar, Badge, Select, Card, Drawer, Table, Tag, App, Button, Modal, Form, InputNumber, Switch, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import type { BadgeProps } from 'antd';
import dayjs from 'dayjs';
import { getMyHotels } from '@/app/services/hotel';
import { getHotelRoomTypes, getRoomAvailability, updateRoomAvailability, getRoomAvailabilityByDate, type RoomType, type RoomAvailability as ApiRoomAvailability } from '@/app/services/room';
import type { Hotel } from '@/app/types';

const { Option } = Select;

interface RoomAvailability {
  roomTypeId: number;
  room_type: string;
  total_count: number;
  available_count: number;
  booked_count: number;
  price: number;
  isClosed: boolean;
}

interface DayAvailability {
  date: string;
  rooms: RoomAvailability[];
}

export default function CalendarPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  // Availability map: date -> single room availability details
  const [availabilityData, setAvailabilityData] = useState<Map<string, RoomAvailability>>(new Map());
  const [dailyRoomDetails, setDailyRoomDetails] = useState<RoomAvailability[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomAvailability | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
        fetchRoomTypes();
    }
  }, [selectedHotel]);

  useEffect(() => {
    if (selectedRoomTypeId) {
        fetchAvailability();
    }
  }, [selectedRoomTypeId]);

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

  const fetchRoomTypes = async () => {
    if (!selectedHotel) return;
    try {
        const roomTypesData = await getHotelRoomTypes(selectedHotel);
        setRoomTypes(roomTypesData);
        if (roomTypesData.length > 0) {
            setSelectedRoomTypeId(roomTypesData[0].id);
        } else {
            setSelectedRoomTypeId(null);
            setAvailabilityData(new Map());
        }
    } catch (error) {
        console.error('获取房型失败:', error);
    }
  };

  // 获取单个房型的可用性数据
  const fetchAvailability = async () => {
    if (!selectedRoomTypeId) return;

    try {
      setLoading(true);

      // 获取未来45天的可用性数据 (覆盖日历视图)
      const today = dayjs();
      const startDate = today.startOf('month').format('YYYY-MM-DD');
      const endDate = today.add(2, 'month').endOf('month').format('YYYY-MM-DD');

      const availabilityList = await getRoomAvailability(selectedRoomTypeId, startDate, endDate);
      const roomType = roomTypes.find(r => r.id === selectedRoomTypeId);
      
      if (!roomType) return;

      const data = new Map<string, RoomAvailability>();

      // 构建日期映射
      // 这里的逻辑稍微调整：不需要遍历每一天填充，只处理有数据的，或者在渲染时处理默认值
      // 为了日历渲染方便，我们还是预处理一下更好，或者只存有数据的Map
      
      availabilityList.forEach((a: ApiRoomAvailability) => {
         const date = dayjs(a.date).format('YYYY-MM-DD');
         data.set(date, {
            roomTypeId: roomType.id,
            room_type: roomType.name,
            total_count: a.quota,
            available_count: a.quota - a.booked,
            booked_count: a.booked,
            price: a.price,
            isClosed: a.isClosed
         });
      });

      setAvailabilityData(data);
    } catch (error) {
      console.error('获取房型可用性失败:', error);
      message.error('获取房型可用性失败');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityForDate = (date: Dayjs): RoomAvailability | null => {
    const dateStr = date.format('YYYY-MM-DD');
    const item = availabilityData.get(dateStr);
    
    // 如果没有特定日期的记录，返回默认值
    if (!item && selectedRoomTypeId) {
        const roomType = roomTypes.find(r => r.id === selectedRoomTypeId);
        if (roomType) {
            return {
                roomTypeId: roomType.id,
                room_type: roomType.name,
                total_count: roomType.stock,
                available_count: roomType.stock,
                booked_count: 0,
                price: roomType.price,
                isClosed: false
            };
        }
    }
    
    return item || null;
  };

  const getAvailabilityRate = (available: number, total: number): number => {
    return total > 0 ? (available / total) * 100 : 0;
  };

  const getStatusColor = (isClosed: boolean, rate: number): string => {
    if (isClosed) return '#ff4d4f'; // red
    if (rate >= 50) return '#52c41a'; // green
    if (rate > 0) return '#faad14'; // orange
    return '#ff7875'; // light red
  };

  const dateCellRender = (date: Dayjs) => {
    const room = getAvailabilityForDate(date);
    if (!room) return null;

    const rate = getAvailabilityRate(room.available_count, room.total_count);
    let bgColor = 'transparent';
    let statusColor = '#52c41a'; // Default green (Success)

    if (room.isClosed) {
      bgColor = '#fff1f0'; // Light red background
      statusColor = '#7a7878'; // Red dot
    } else if (room.available_count === 0) {
      bgColor = '#fff2e8'; // Light orange background
      statusColor = '#cf1322'; // Red dot
    } else if (rate < 50) {
      bgColor = '#fffbe6'; // Light yellow background
      statusColor = '#faad14'; // Orange/Yellow dot
    }

    return (
      <div style={{ padding: '4px', background: bgColor, height: '100%', borderRadius: '4px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#1677ff' }}>¥{room.price}</span>
            {room.isClosed && <Tag color="red" style={{ margin: 0, fontSize: '10px', lineHeight: '18px' }}>关</Tag>}
         </div>
         
         {!room.isClosed && (
            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                {room.available_count === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                         <Badge color={statusColor} />
                         <span style={{ marginLeft: 5, fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.88)' }}>已售罄</span>
                    </div>
                ) : (
                   <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Badge color={statusColor} />
                        <span style={{ marginLeft: 5, color: 'rgba(0, 0, 0, 0.88)' }}>
                            余{room.available_count} <span style={{ color: '#d9d9d9', margin: '0 2px' }}>/</span> {room.total_count}
                        </span>
                   </div>
                )}
            </div>
         )}
      </div>
    );
  };

  const onSelect = async (date: Dayjs, { source }: { source: 'year' | 'month' | 'date' | 'customize' }) => {
    // 只有当用户直接点击日期时才触发详情，切换月份不触发
    if (source !== 'date') return;

    setSelectedDate(date);
    setDrawerVisible(true);
    
    // Load daily details from API
    if (selectedHotel) {
        try {
            setLoading(true);
            const data = await getRoomAvailabilityByDate(selectedHotel, date.format('YYYY-MM-DD'));
            setDailyRoomDetails(data);
        } catch (e) {
            message.error('加载详情失败');
        } finally {
            setLoading(false);
        }
    }
  };


  const handleEdit = (record: RoomAvailability) => {
    setEditingRoom(record);
    form.setFieldsValue({
      price: record.price,
      quota: record.total_count,
      isClosed: record.isClosed,
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingRoom || !selectedDate) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const dateStr = selectedDate.format('YYYY-MM-DD');
      await updateRoomAvailability(editingRoom.roomTypeId, [{
        date: dateStr,
        price: values.price,
        quota: values.quota,
        isClosed: values.isClosed,
      }]);

      message.success('更新成功');
      setEditModalVisible(false);
      setEditingRoom(null);
      
      // Refresh calendar view
      fetchAvailability();
      
      // Refresh daily details list if open
      if (selectedDate && selectedHotel) {
        const data = await getRoomAvailabilityByDate(selectedHotel, selectedDate.format('YYYY-MM-DD'));
        setDailyRoomDetails(data);
      }
    } catch (error) {
      console.error('更新失败:', error);
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '房型',
      dataIndex: 'room_type',
      key: 'room_type',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '状态',
      dataIndex: 'isClosed',
      key: 'isClosed',
      render: (isClosed: boolean) => (
        <Tag color={isClosed ? 'red' : 'green'}>
          {isClosed ? '已关闭' : '开放中'}
        </Tag>
      ),
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
      title: '操作',
      key: 'action',
      render: (_: any, record: RoomAvailability) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          设置
        </Button>
      ),
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
                  {hotel.nameZh}
                </Option>
              ))}
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="选择房型"
              value={selectedRoomTypeId}
              onChange={setSelectedRoomTypeId}
            >
              {roomTypes.map(room => (
                <Option key={room.id} value={room.id}>
                  {room.name}
                </Option>
              ))}
            </Select>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Badge color="#52c41a" text="充足 (≥50%)" />
            <Badge color="#faad14" text="紧张 (<50%)" />
            <Badge color="#f5222d" text="满房 (0)" />
            <Badge color="#7a7878" text="已关闭" />
          </Space>
        </div>

        <Calendar
          cellRender={dateCellRender}
          onSelect={onSelect}
        />
      </Card>

      <Drawer
        title={selectedDate ? `${selectedDate.format('YYYY年MM月DD日')} 房间详情` : ''}
        placement="right"
        size={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        <Table
          dataSource={dailyRoomDetails}
          columns={columns}
          rowKey="roomTypeId"
          loading={loading}
          pagination={false}
        />
      </Drawer>

      <Modal
        title={`设置房型: ${editingRoom?.room_type}`}
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="¥"
              min={0}
            />
          </Form.Item>
          
          <Form.Item
            name="quota"
            label="房间库存"
            rules={[{ required: true, message: '请输入房间库存' }]}
            help="注意：修改库存不会影响已预订的订单"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={0}
            />
          </Form.Item>
          
          <Form.Item
            name="isClosed"
            label="房型状态"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="已关闭"
              unCheckedChildren="开放中"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
