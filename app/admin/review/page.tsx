'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Drawer,
  Descriptions,
  Image,
  Modal,
  Input,
  Popconfirm,
  App,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import { getPendingHotels, reviewHotel, updateHotelStatus } from '@/app/services/review';
import type { Hotel } from '@/app/types';

const { TextArea } = Input;

export default function ReviewSystemPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingHotel, setRejectingHotel] = useState<Hotel | null>(null);
  const { message } = App.useApp();

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const data = await getPendingHotels();
      setHotels(data);
    } catch (error) {
      console.error('获取待审核酒店列表失败:', error);
      message.error('获取待审核酒店列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: Hotel) => {
    setSelectedHotel(record);
    setDrawerVisible(true);
  };

  const handleApprove = async (hotelId: number) => {
    try {
      await reviewHotel(hotelId, {
        status: 'approved',
      });
      message.success('审核通过');
      fetchHotels();
      setDrawerVisible(false);
    } catch (error: any) {
      console.error('审核失败:', error);
      message.error(error.response?.data?.message || '审核失败');
    }
  };

  const handleRejectClick = (hotel: Hotel) => {
    setRejectingHotel(hotel);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      message.error('请输入拒绝原因');
      return;
    }

    try {
      await reviewHotel(rejectingHotel!.id!, {
        status: 'rejected',
        reason: rejectReason,
      });
      message.success('已拒绝');
      setRejectModalVisible(false);
      fetchHotels();
      setDrawerVisible(false);
    } catch (error: any) {
      console.error('拒绝失败:', error);
      message.error(error.response?.data?.message || '拒绝失败');
    }
  };

  const handleOffline = async (hotelId: number) => {
    try {
      await updateHotelStatus(hotelId, 'offline');
      message.success('已下线');
      fetchHotels();
    } catch (error: any) {
      console.error('下线失败:', error);
      message.error(error.response?.data?.message || '下线失败');
    }
  };

  const handleOnline = async (hotelId: number) => {
    try {
      await updateHotelStatus(hotelId, 'published');
      message.success('已恢复上线');
      fetchHotels();
    } catch (error: any) {
      console.error('恢复失败:', error);
      message.error(error.response?.data?.message || '恢复失败');
    }
  };

  const columns: TableColumnsType<Hotel> = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '星级',
      dataIndex: 'star_rating',
      key: 'star_rating',
      render: (rating: number) => `${rating}星`,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          draft: { color: 'processing', text: '待审核' },
          published: { color: 'success', text: '已发布' },
          offline: { color: 'default', text: '已下线' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {record.status === 'draft' && (
            <>
              <Popconfirm
                title="确定通过审核吗？"
                onConfirm={() => handleApprove(record.id!)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" icon={<CheckOutlined />}>
                  通过
                </Button>
              </Popconfirm>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleRejectClick(record)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 'published' && (
            <Popconfirm
              title="确定要下线这个酒店吗？"
              onConfirm={() => handleOffline(record.id!)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<PoweroffOutlined />}>
                下线
              </Button>
            </Popconfirm>
          )}
          {record.status === 'offline' && (
            <Popconfirm
              title="确定要恢复上线吗？"
              onConfirm={() => handleOnline(record.id!)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" icon={<CheckOutlined />}>
                恢复
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={hotels}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title="酒店详情"
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          selectedHotel?.status === 'draft' && (
            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(selectedHotel.id!)}
              >
                通过
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => handleRejectClick(selectedHotel)}
              >
                拒绝
              </Button>
            </Space>
          )
        }
      >
        {selectedHotel && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="酒店名称">
                {selectedHotel.name}
              </Descriptions.Item>
              <Descriptions.Item label="英文名称">
                {selectedHotel.name_en || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="城市">
                {selectedHotel.city}
              </Descriptions.Item>
              <Descriptions.Item label="地址">
                {selectedHotel.address}
              </Descriptions.Item>
              <Descriptions.Item label="星级">
                {selectedHotel.star_rating}星
              </Descriptions.Item>
              <Descriptions.Item label="价格">
                ¥{selectedHotel.price}
              </Descriptions.Item>
              <Descriptions.Item label="设施">
                {selectedHotel.facilities?.join(', ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedHotel.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedHotel.status === 'draft' ? 'processing' : 'success'}>
                  {selectedHotel.status === 'draft' ? '待审核' : '已发布'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedHotel.images && selectedHotel.images.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>酒店图片</h4>
                <Image.PreviewGroup>
                  <Space wrap>
                    {selectedHotel.images.map((img, index) => (
                      <Image
                        key={index}
                        width={100}
                        src={img}
                        alt={`酒店图片${index + 1}`}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}

            {selectedHotel.Rooms && selectedHotel.Rooms.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>房型列表</h4>
                <Table
                  dataSource={selectedHotel.Rooms}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '房型', dataIndex: 'room_type', key: 'room_type' },
                    {
                      title: '价格',
                      dataIndex: 'price',
                      key: 'price',
                      render: (price: number) => `¥${price}`,
                    },
                    { title: '总数', dataIndex: 'total_count', key: 'total_count' },
                    { title: '可用', dataIndex: 'available_count', key: 'available_count' },
                  ]}
                />
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="拒绝原因"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
