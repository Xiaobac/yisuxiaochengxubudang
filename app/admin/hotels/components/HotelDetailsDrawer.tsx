'use client';

import { Drawer, Descriptions, Image, Space, Table, Tag } from 'antd';
import type { Hotel } from '@/app/types';
import TencentMapSelector from '@/app/components/TencentMapSelector';

interface HotelDetailsDrawerProps {
  visible: boolean;
  hotel: Hotel | null;
  onClose: () => void;
}

export function HotelDetailsDrawer({ visible, hotel, onClose }: HotelDetailsDrawerProps) {
  return (
    <Drawer
      title="酒店详情"
      placement="right"
      size="large"
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      {hotel && (
        <>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="酒店名称">
              {hotel.nameZh}
            </Descriptions.Item>
            <Descriptions.Item label="英文名称">
              {hotel.nameEn || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="城市">
              {hotel.location?.name || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="地址">
              {hotel.address}
            </Descriptions.Item>
            <Descriptions.Item label="地理位置">
              {hotel.latitude && hotel.longitude ? (
                <TencentMapSelector
                  latitude={hotel.latitude}
                  longitude={hotel.longitude}
                  readOnly
                />
              ) : '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="星级">
              {hotel.starRating}星
            </Descriptions.Item>
            <Descriptions.Item label="设施">
              {Array.isArray(hotel.facilities) ? hotel.facilities.join(', ') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              {hotel.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={hotel.status === 'published' ? 'success' : hotel.status === 'pending' ? 'processing' : 'default'}>
                {hotel.status === 'published' ? '已发布' : hotel.status === 'pending' ? '待审核' : hotel.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          {hotel.images && hotel.images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>酒店图片</h4>
              <Image.PreviewGroup>
                <Space wrap>
                  {hotel.images.map((img, index) => (
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

          {hotel.roomTypes && hotel.roomTypes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>房型列表</h4>
              <Table
                dataSource={hotel.roomTypes}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '房型', dataIndex: 'name', key: 'name' },
                  {
                    title: '价格',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => `¥${price}`,
                  },
                  { title: '库存', dataIndex: 'stock', key: 'stock' }
                ]}
              />
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
