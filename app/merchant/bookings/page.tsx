'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Drawer,
  Descriptions,
  Select,
  Input,
  DatePicker,
  App,
  Popconfirm,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { Booking, BookingStatus } from '@/app/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Search } = Input;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const { message } = App.useApp();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // TODO: 实际调用 API
      // const data = await getMyBookings();

      // 模拟数据
      const mockData: Booking[] = [
        {
          id: 1,
          hotel_id: 1,
          hotel_name: '北京国际大酒店',
          room_type: '豪华套房',
          customer_name: '张三',
          customer_phone: '13800138000',
          customer_email: 'zhangsan@example.com',
          check_in_date: '2026-02-01',
          check_out_date: '2026-02-03',
          room_count: 1,
          total_price: 1500,
          status: 'confirmed',
          created_at: '2026-01-25T10:30:00Z',
        },
        {
          id: 2,
          hotel_id: 1,
          hotel_name: '北京国际大酒店',
          room_type: '标准间',
          customer_name: '李四',
          customer_phone: '13900139000',
          check_in_date: '2026-02-05',
          check_out_date: '2026-02-07',
          room_count: 2,
          total_price: 1200,
          status: 'pending',
          special_requests: '需要安静的房间',
          created_at: '2026-01-26T14:20:00Z',
        },
        {
          id: 3,
          hotel_id: 1,
          hotel_name: '北京国际大酒店',
          room_type: '豪华套房',
          customer_name: '王五',
          customer_phone: '13700137000',
          check_in_date: '2026-01-28',
          check_out_date: '2026-01-30',
          room_count: 1,
          total_price: 1500,
          status: 'checked_in',
          created_at: '2026-01-20T09:15:00Z',
        },
      ];

      setBookings(mockData);
    } catch (error) {
      console.error('获取预订列表失败:', error);
      message.error('获取预订列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: Booking) => {
    setSelectedBooking(record);
    setDrawerVisible(true);
  };

  const handleStatusChange = async (id: number, newStatus: BookingStatus) => {
    try {
      // TODO: 调用 API 更新状态
      // await updateBookingStatus(id, newStatus);

      setBookings(bookings.map(b =>
        b.id === id ? { ...b, status: newStatus } : b
      ));
      message.success('状态更新成功');

      if (selectedBooking?.id === id) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (error: any) {
      console.error('更新状态失败:', error);
      message.error('更新状态失败');
    }
  };

  const getStatusColor = (status: BookingStatus): string => {
    const colorMap: Record<BookingStatus, string> = {
      pending: 'orange',
      confirmed: 'blue',
      checked_in: 'green',
      checked_out: 'default',
      cancelled: 'red',
    };
    return colorMap[status];
  };

  const getStatusText = (status: BookingStatus): string => {
    const textMap: Record<BookingStatus, string> = {
      pending: '待确认',
      confirmed: '已确认',
      checked_in: '已入住',
      checked_out: '已退房',
      cancelled: '已取消',
    };
    return textMap[status];
  };

  const filteredBookings = bookings.filter(booking => {
    const matchStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchSearch =
      booking.customer_name.includes(searchText) ||
      booking.customer_phone.includes(searchText) ||
      booking.hotel_name?.includes(searchText) ||
      false;
    return matchStatus && matchSearch;
  });

  const columns: TableColumnsType<Booking> = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '酒店名称',
      dataIndex: 'hotel_name',
      key: 'hotel_name',
    },
    {
      title: '房型',
      dataIndex: 'room_type',
      key: 'room_type',
    },
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '联系电话',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
    },
    {
      title: '入住日期',
      dataIndex: 'check_in_date',
      key: 'check_in_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '退房日期',
      dataIndex: 'check_out_date',
      key: 'check_out_date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '房间数',
      dataIndex: 'room_count',
      key: 'room_count',
      width: 80,
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: BookingStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>

          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确认此预订？"
                onConfirm={() => handleStatusChange(record.id!, 'confirmed')}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                >
                  确认
                </Button>
              </Popconfirm>
              <Popconfirm
                title="取消此预订？"
                onConfirm={() => handleStatusChange(record.id!, 'cancelled')}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                >
                  取消
                </Button>
              </Popconfirm>
            </>
          )}

          {record.status === 'confirmed' && (
            <Popconfirm
              title="办理入住？"
              onConfirm={() => handleStatusChange(record.id!, 'checked_in')}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                icon={<LoginOutlined />}
              >
                入住
              </Button>
            </Popconfirm>
          )}

          {record.status === 'checked_in' && (
            <Popconfirm
              title="办理退房？"
              onConfirm={() => handleStatusChange(record.id!, 'checked_out')}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                icon={<LogoutOutlined />}
              >
                退房
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Search
          placeholder="搜索客户姓名、电话、酒店"
          allowClear
          style={{ width: 300 }}
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select
          style={{ width: 150 }}
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Select.Option value="all">全部状态</Select.Option>
          <Select.Option value="pending">待确认</Select.Option>
          <Select.Option value="confirmed">已确认</Select.Option>
          <Select.Option value="checked_in">已入住</Select.Option>
          <Select.Option value="checked_out">已退房</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filteredBookings}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Drawer
        title="预订详情"
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          selectedBooking && (
            <Tag color={getStatusColor(selectedBooking.status)}>
              {getStatusText(selectedBooking.status)}
            </Tag>
          )
        }
      >
        {selectedBooking && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="订单号">{selectedBooking.id}</Descriptions.Item>
              <Descriptions.Item label="酒店名称">{selectedBooking.hotel_name}</Descriptions.Item>
              <Descriptions.Item label="房型">{selectedBooking.room_type}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{selectedBooking.customer_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedBooking.customer_phone}</Descriptions.Item>
              <Descriptions.Item label="电子邮箱">{selectedBooking.customer_email || '-'}</Descriptions.Item>
              <Descriptions.Item label="入住日期">
                {dayjs(selectedBooking.check_in_date).format('YYYY年MM月DD日')}
              </Descriptions.Item>
              <Descriptions.Item label="退房日期">
                {dayjs(selectedBooking.check_out_date).format('YYYY年MM月DD日')}
              </Descriptions.Item>
              <Descriptions.Item label="住宿天数">
                {dayjs(selectedBooking.check_out_date).diff(dayjs(selectedBooking.check_in_date), 'day')}天
              </Descriptions.Item>
              <Descriptions.Item label="房间数量">{selectedBooking.room_count}</Descriptions.Item>
              <Descriptions.Item label="总价">¥{selectedBooking.total_price}</Descriptions.Item>
              <Descriptions.Item label="特殊要求">
                {selectedBooking.special_requests || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedBooking.created_at ? dayjs(selectedBooking.created_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {selectedBooking.status === 'pending' && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleStatusChange(selectedBooking.id!, 'confirmed')}
                  >
                    确认预订
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleStatusChange(selectedBooking.id!, 'cancelled')}
                  >
                    取消预订
                  </Button>
                </>
              )}

              {selectedBooking.status === 'confirmed' && (
                <Button
                  type="primary"
                  icon={<LoginOutlined />}
                  onClick={() => handleStatusChange(selectedBooking.id!, 'checked_in')}
                >
                  办理入住
                </Button>
              )}

              {selectedBooking.status === 'checked_in' && (
                <Button
                  type="primary"
                  icon={<LogoutOutlined />}
                  onClick={() => handleStatusChange(selectedBooking.id!, 'checked_out')}
                >
                  办理退房
                </Button>
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
