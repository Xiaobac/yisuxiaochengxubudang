'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, App } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  DollarOutlined,
  ShopOutlined,
  CalendarOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Booking, BookingStatus } from '@/app/types';
import dayjs from 'dayjs';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    monthRevenue: 0,
    occupancyRate: 0,
    totalRooms: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  // 营收趋势数据（最近7天）
  const [revenueData, setRevenueData] = useState<Array<{ date: string; revenue: number }>>([]);

  // 预订量数据（最近7天）
  const [bookingData, setBookingData] = useState<Array<{ date: string; count: number }>>([]);

  // 房型占比数据
  const [roomTypeData, setRoomTypeData] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      setStats({
        todayBookings: 12,
        monthRevenue: 156000,
        occupancyRate: 78,
        totalRooms: 50,
      });

      // 模拟营收趋势数据
      const mockRevenueData = [
        { date: '01-25', revenue: 18000 },
        { date: '01-26', revenue: 22000 },
        { date: '01-27', revenue: 19500 },
        { date: '01-28', revenue: 25000 },
        { date: '01-29', revenue: 21000 },
        { date: '01-30', revenue: 27000 },
        { date: '01-31', revenue: 23500 },
      ];
      setRevenueData(mockRevenueData);

      // 模拟预订量数据
      const mockBookingData = [
        { date: '01-25', count: 8 },
        { date: '01-26', count: 12 },
        { date: '01-27', count: 10 },
        { date: '01-28', count: 15 },
        { date: '01-29', count: 11 },
        { date: '01-30', count: 14 },
        { date: '01-31', count: 13 },
      ];
      setBookingData(mockBookingData);

      // 模拟房型占比数据
      const mockRoomTypeData = [
        { name: '标准间', value: 45 },
        { name: '豪华套房', value: 30 },
        { name: '商务单间', value: 25 },
      ];
      setRoomTypeData(mockRoomTypeData);

      const mockBookings: Booking[] = [
        {
          id: 1,
          hotel_id: 1,
          hotel_name: '北京国际大酒店',
          room_type: '豪华套房',
          customer_name: '张三',
          customer_phone: '13800138000',
          check_in_date: '2026-02-01',
          check_out_date: '2026-02-03',
          room_count: 1,
          total_price: 1500,
          status: 'confirmed',
          created_at: '2026-01-31T10:30:00Z',
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
          created_at: '2026-01-31T14:20:00Z',
        },
        {
          id: 3,
          hotel_id: 1,
          hotel_name: '北京国际大酒店',
          room_type: '商务单间',
          customer_name: '王五',
          customer_phone: '13700137000',
          check_in_date: '2026-02-10',
          check_out_date: '2026-02-12',
          room_count: 1,
          total_price: 800,
          status: 'confirmed',
          created_at: '2026-01-31T09:15:00Z',
        },
      ];

      setRecentBookings(mockBookings);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      message.error('获取仪表盘数据失败');
    } finally {
      setLoading(false);
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

  const columns: TableColumnsType<Booking> = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '房型',
      dataIndex: 'room_type',
      key: 'room_type',
    },
    {
      title: '入住日期',
      dataIndex: 'check_in_date',
      key: 'check_in_date',
      render: (date: string) => dayjs(date).format('MM-DD'),
    },
    {
      title: '退房日期',
      dataIndex: 'check_out_date',
      key: 'check_out_date',
      render: (date: string) => dayjs(date).format('MM-DD'),
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
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日预订"
              value={stats.todayBookings}
              prefix={<CalendarOutlined />}
              suffix="单"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月营收"
              value={stats.monthRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="入住率"
              value={stats.occupancyRate}
              prefix={<RiseOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总房间数"
              value={stats.totalRooms}
              prefix={<ShopOutlined />}
              suffix="间"
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 营收趋势 */}
        <Col xs={24} lg={12}>
          <Card title="营收趋势（近7天）" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `¥${value}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1890ff"
                  strokeWidth={2}
                  name="营收（元）"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 预订量统计 */}
        <Col xs={24} lg={12}>
          <Card title="预订量统计（近7天）" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#52c41a" name="预订数量" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 房型占比 */}
        <Col xs={24} lg={12}>
          <Card title="房型预订占比" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roomTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 近期预订列表 */}
        <Col xs={24} lg={12}>
          <Card
            title="近期预订"
            extra={<a href="/merchant/bookings">查看全部</a>}
          >
            <Table
              columns={columns}
              dataSource={recentBookings}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
