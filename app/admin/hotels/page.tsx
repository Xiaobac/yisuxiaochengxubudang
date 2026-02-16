'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Popconfirm,
  App,
  Form,
  Drawer,
  Descriptions,
  Image,
  List,
  Avatar
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  SearchOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  CheckOutlined,
  CommentOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { getHotels } from '@/app/services/hotel';
import { getCommentsByHotelId, deleteComment } from '@/app/services/comment';
import { updateHotelStatus } from '@/app/services/review';
import { getLocations } from '@/app/services/admin';
import type { Hotel, Location, Comment, ApiResponse } from '@/app/types';

export default function HotelManagementPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  
  // Drawer states
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  // Comments states
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [currentHotelId, setCurrentHotelId] = useState<number | null>(null);

  const { message } = App.useApp();

  useEffect(() => {
    fetchLocations();
    fetchHotels();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await getLocations();
      setLocations(res.data || []);
    } catch (error) {
      console.error('Fetch locations error:', error);
    }
  };

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchText) params.keyword = searchText;
      if (selectedLocation) params.locationId = selectedLocation;
      if (selectedStatus) params.status = selectedStatus;

      const res = await getHotels(params);
      setHotels(res.data || []);
    } catch (error) {
      console.error('获取酒店列表失败:', error);
      message.error('获取酒店列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchHotels();
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedLocation(undefined);
    setSelectedStatus(undefined);
    // Needed to trigger re-fetch with empty params, but state update is async.
    // Better to just call fetch with empty directly or rely on useEffect deps if we used them (but we don't automatedly).
    // Let's just manually refetch next tick or directly.
    getHotels({}).then(res => setHotels(res.data || [])).finally(()=>setLoading(false));
  };

  const handleView = (record: Hotel) => {
    setSelectedHotel(record);
    setDrawerVisible(true);
  };
  
  const handleViewComments = async (hotelId: number) => {
    setCurrentHotelId(hotelId);
    setCommentsVisible(true);
    setCommentsLoading(true);
    try {
      const res = await getCommentsByHotelId(hotelId);
      if (res.success && res.data) {
        setComments(res.data);
      } else {
        message.error(res.message || '获取评论失败');
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
      message.error('获取评论失败');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const res = await deleteComment(commentId);
      if (res.success) {
        message.success('删除评论成功');
        setComments(comments.filter(c => c.id !== commentId));
      } else {
        message.error(res.message || '删除评论失败');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      message.error('删除评论失败');
    }
  };

  const handleStatusChange = async (hotelId: number, newStatus: string) => {
    try {
      await updateHotelStatus(hotelId, newStatus);
      message.success('状态更新成功');
      fetchHotels();
    } catch (error: any) {
      console.error('状态更新失败:', error);
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const columns: TableColumnsType<Hotel> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '酒店名称',
      dataIndex: 'nameZh',
      key: 'nameZh',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-400 text-xs">{record.nameEn}</div>
        </div>
      ),
    },
    {
      title: '城市',
      key: 'location',
      render: (_, record) => record.location?.name || '未知',
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      render: (score) => score ? `${score.toFixed(1)}分` : '暂无评分',
    },
    {
      title: '商户',
      key: 'merchant',
      render: (_, record) => record.merchant?.name || record.merchant?.email || '未知',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = 
            status === 'published' ? 'success' :
            status === 'pending' ? 'processing' :
            status === 'rejected' ? 'error' :
            'default';
        const text = 
            status === 'published' ? '已发布' :
            status === 'pending' ? '待审核' :
            status === 'rejected' ? '已拒绝' :
            '已下线';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
           <Button icon={<EyeOutlined />} type="link" onClick={() => handleView(record)}>查看</Button>
           <Button icon={<CommentOutlined />} type="link" onClick={() => handleViewComments(record.id)}>评论</Button>
           {record.status === 'published' && (
            <>
              <Popconfirm
                  title="确定要强制下线该酒店吗？"
                  description="下线后用户将无法检索到该酒店"
                  onConfirm={() => handleStatusChange(record.id, 'offline')}
                  okText="确定"
                  cancelText="取消"
              >
                  <Button type="link" danger icon={<PoweroffOutlined />}>
                  下线
                  </Button>
              </Popconfirm>
              <Popconfirm
                  title="确定要驳回该酒店吗？"
                  description="酒店状态将变为已拒绝，商户需重新提交"
                  onConfirm={() => handleStatusChange(record.id, 'rejected')}
                  okText="确定"
                  cancelText="取消"
              >
                  <Button type="link" danger icon={<StopOutlined />}>
                  驳回
                  </Button>
              </Popconfirm>
            </>
           )}
           {record.status === 'offline' && (
             <Popconfirm
                title="确定要恢复该酒店上线吗？"
                onConfirm={() => handleStatusChange(record.id, 'published')}
                okText="确定"
                cancelText="取消"
             >
                 <Button type="link" style={{color: 'green'}} icon={<CheckOutlined />}>
                 上线
                 </Button>
             </Popconfirm>
           )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }} className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
        <Form layout="inline">
            <Form.Item label="搜索">
                <Input 
                    placeholder="酒店名称/地址" 
                    value={searchText} 
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 200 }} 
                />
            </Form.Item>
            <Form.Item label="城市">
                <Select
                    allowClear
                    placeholder="选择城市"
                    style={{ width: 150 }}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    options={locations.map(loc => ({ label: loc.name, value: loc.id }))}
                />
            </Form.Item>
            <Form.Item label="状态">
                <Select
                    allowClear
                    placeholder="状态"
                    style={{ width: 120 }}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={[
                        { label: '已发布', value: 'published' },
                        { label: '待审核', value: 'pending' },
                        { label: '已下线', value: 'offline' },
                        { label: '已拒绝', value: 'rejected' },
                    ]}
                />
            </Form.Item>
            <Form.Item>
                <Space>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                </Space>
            </Form.Item>
        </Form>
      </div>

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
        size="large"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedHotel && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="酒店名称">
                {selectedHotel.nameZh}
              </Descriptions.Item>
              <Descriptions.Item label="英文名称">
                {selectedHotel.nameEn || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="城市">
                {selectedHotel.location?.name || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="地址">
                {selectedHotel.address}
              </Descriptions.Item>
              <Descriptions.Item label="地理位置">
                {selectedHotel.latitude && selectedHotel.longitude ? `${selectedHotel.latitude}, ${selectedHotel.longitude}` : '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="星级">
                {selectedHotel.starRating}星
              </Descriptions.Item>
              <Descriptions.Item label="设施">
                {Array.isArray(selectedHotel.facilities) ? selectedHotel.facilities.join(', ') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedHotel.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedHotel.status === 'published' ? 'success' : selectedHotel.status === 'pending' ? 'processing' : 'default'}>
                  {selectedHotel.status === 'published' ? '已发布' : selectedHotel.status === 'pending' ? '待审核' : selectedHotel.status}
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

            {selectedHotel.roomTypes && selectedHotel.roomTypes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>房型列表</h4>
                <Table
                  dataSource={selectedHotel.roomTypes}
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

      <Drawer
        title="酒店评论"
        placement="right"
        size={500}
        onClose={() => setCommentsVisible(false)}
        open={commentsVisible}
      >
        {commentsLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无评论</div>
        ) : (
          <div className="flex flex-col gap-4">
            {comments.map((item) => (
              <div key={item.id} className="border-b last:border-0 pb-4 flex gap-3">
                <Avatar>{item.user.name?.[0] || 'U'}</Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.user.name || '匿名用户'}</div>
                      <div className="text-gray-400 text-xs mt-1">
                          {new Date(item.createdAt).toLocaleString()}
                          {item.score && <span className="ml-2 text-yellow-500">{item.score.toFixed(1)}分</span>}
                      </div>
                    </div>
                    <Popconfirm
                      title="确定删除这条评论吗？"
                      onConfirm={() => handleDeleteComment(item.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                  </div>
                  <div className="mt-2 text-gray-600">
                    {item.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
