'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  Tag,
  Popconfirm,
  Select,
  DatePicker,
  App,
  Card,
  Row,
  Col,
  Image,
  Drawer,
  List,
  Avatar,
  message
} from 'antd';
import type { TableColumnsType, UploadFile, UploadProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  CommentOutlined
} from '@ant-design/icons';
import { 
  getMyHotels, 
  createHotel, 
  updateHotel, 
  deleteHotel, 
  uploadImage,
  getLocations,
  getTags,
  createRoomType,
  updateRoomType,
  deleteRoomType
} from '@/app/services/hotel';
import { getCommentsByHotelId, deleteComment } from '@/app/services/comment';
import { getStoredUser } from '@/app/services/auth';
import type { Hotel, RoomType, Location, Tag as HotelTag, Comment } from '@/app/types';
import dayjs from 'dayjs';
import TencentMapSelector from '@/app/components/TencentMapSelector';

const { TextArea } = Input;
const { Option } = Select;

// 房型动态表单组件
interface RoomListProps {
  value?: RoomType[];
  onChange?: (value: RoomType[]) => void;
}

function RoomList({ value = [], onChange }: RoomListProps) {
  const handleAdd = () => {
    // @ts-ignore - Temporary ID for key handling if needed, though index is used usually
    onChange?.([...value, { name: '', price: 0, stock: 1, discount: 1, description: '' }]);
  };

  const handleRemove = (index: number) => {
    const newRooms = [...value];
    newRooms.splice(index, 1);
    onChange?.(newRooms);
  };

  const handleChange = (index: number, field: keyof RoomType, val: any) => {
    const newRooms = [...value];
    // @ts-ignore
    newRooms[index] = { ...newRooms[index], [field]: val };
    onChange?.(newRooms);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {value.map((room, index) => (
        <Card key={room.id ? `room-${room.id}` : `idx-${index}`} size="small" type="inner" title={`房型 ${index + 1}`} extra={
            <Button type="link" danger onClick={() => handleRemove(index)}>
                删除
            </Button>
        }>
            <Row gutter={16}>
                <Col span={8}>
                     <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
                        <span className="ant-input-group-addon">名称</span>
                        <Input
                           placeholder="房型名称"
                           value={room.name}
                           onChange={(e) => handleChange(index, 'name', e.target.value)}
                        />
                     </Space.Compact>
                </Col>
                <Col span={8}>
                    <InputNumber
                        placeholder="价格"
                        value={room.price}
                        onChange={(val) => handleChange(index, 'price', val)}
                        min={0}
                        prefix="价格"
                        style={{ width: '100%', marginBottom: 8 }}
                    />
                </Col>
                 <Col span={8}>
                    <InputNumber
                        placeholder="库存"
                        value={room.stock}
                        onChange={(val) => handleChange(index, 'stock', val)}
                        min={0}
                        prefix="库存"
                        style={{ width: '100%', marginBottom: 8 }}
                    />
                </Col>
                <Col span={24}>
                    <Space.Compact style={{ width: '100%' }}>
                        <span className="ant-input-group-addon">描述</span>
                        <Input
                            placeholder="房型描述（选填）"
                            value={room.description}
                            onChange={(e) => handleChange(index, 'description', e.target.value)}
                        />
                    </Space.Compact>
                </Col>
            </Row>
        </Card>
      ))}
      <Button type="dashed" onClick={handleAdd} block icon={<PlusOutlined />}>
        添加房型
      </Button>
    </div>
  );
}

export default function HotelManagementPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<HotelTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // Comments states
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [currentHotelId, setCurrentHotelId] = useState<number | null>(null);

  const { message } = App.useApp();

  useEffect(() => {
    fetchHotels(1, 10);
    fetchLocations();
    fetchTags();
  }, []);

  const fetchHotels = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const res = await getMyHotels({ page, limit: pageSize });
      // The service now returns { success: true, data: Hotel[], total: number, ... }
      // Or due to my change in service which returns "response" directly if `get` returns data.
      // Wait, `get` usually returns parsed JSON body.
      // My service change: `return get<HotelListResponse>(...)`.
      // So `res` is `HotelListResponse`.
      if (res.success && res.data) {
          setHotels(res.data);
          setPagination({
              current: page,
              pageSize: pageSize,
              total: res.total || 0
          });
      }
    } catch (error) {
      console.error('获取酒店列表失败:', error);
      message.error('获取酒店列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTableChange = (newPagination: any) => {
    fetchHotels(newPagination.current, newPagination.pageSize);
  };

  
  const fetchLocations = async () => {
    try {
        const res = await getLocations();
        // @ts-ignore
        setLocations(res.data || []);
    } catch(e) {
        console.error(e);
    }
  }

  const fetchTags = async () => {
      try {
          const res = await getTags();
          // @ts-ignore
          setTags(res.data || []);
      } catch(e) {
          console.error(e);
      }
  }

  const handleViewComments = async (hotelId: number) => {
    setCurrentHotelId(hotelId);
    setCommentsVisible(true);
    setCommentsLoading(true);
    try {
      const res = await getCommentsByHotelId(hotelId);
      if (res.success && res.data) {
        setComments(res.data);
      } else {
        message.warning(res.message || '获取评论失败');
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

  const handleAdd = () => {
    setEditingHotel(null);
    setFileList([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Hotel) => {
    setEditingHotel(record);

    // 转换日期字段
    const formData: any = {
      ...record,
      name: record.nameZh,
      name_en: record.nameEn,
      star_rating: record.starRating,
      opening_date: record.openingYear ? dayjs(`${record.openingYear}-01-01`) : null,
      locationId: record.locationId,
      // map hotelTags from [{ tag: { id, name } }] to [id, id]
      hotelTags: record.hotelTags?.map((ht: any) => ht.tagId || ht.tag?.id), 
      rooms: record.roomTypes || [],
      latitude: record.latitude,
      longitude: record.longitude,
    };

    form.setFieldsValue(formData);

    // 设置已有图片
    if (record.images && Array.isArray(record.images) && record.images.length > 0) {
      setFileList(
        (record.images as string[]).map((url, index) => ({
          uid: `-${index}`,
          name: `image-${index}`,
          status: 'done',
          url,
        }))
      );
    } else {
      setFileList([]);
    }
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteHotel(id);
      message.success('删除成功');
      fetchHotels();
    } catch (error: any) {
      console.error('删除失败:', error);
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      const result = await uploadImage(file as File);
      onSuccess?.(result);
      message.success('上传成功');
    } catch (error) {
      onError?.(error as Error);
      message.error('上传失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const currentUser = getStoredUser();
      
      if (!currentUser) {
         message.error("未登录或会话已过期");
         return;
      }

      // 收集图片 URL
      const images = fileList
        .filter((file) => file.status === 'done')
        .map((file) => file.url || (file.response as any)?.url)
        .filter(Boolean) as string[];

      // 1. 准备酒店数据
      const hotelData: any = {
        nameZh: values.name,
        nameEn: values.name_en,
        address: values.address,
        locationId: values.locationId,
        starRating: values.star_rating,
        description: values.description,
        openingYear: values.opening_date ? values.opening_date.year() : 2020,
        images,
        latitude: values.latitude,
        longitude: values.longitude,
        merchantId: currentUser.id,
        // Pass nested data for creation
        tagIds: values.hotelTags, 
        roomTypes: values.rooms, 
      };

      let savedHotelId: number;

      if (editingHotel && editingHotel.id) {
        // For updates, we still mostly use the loop logic for rooms as backend update might not support nested upsert easily
        // But we can update basic info
        await updateHotel(editingHotel.id, hotelData); // Note: tagIds might need special handling on update if backend supports it, otherwise ignored
        savedHotelId = editingHotel.id;
        message.success('酒店基本信息更新成功');
        
        // Handle Rooms for Edit Mode (Manually sync)
        if (values.rooms) {
           const currentRooms = values.rooms as RoomType[];
           const originalIds = editingHotel.roomTypes?.map(r => r.id) || [];
           // @ts-ignore
           const currentIds = currentRooms.map(r => r.id).filter(id => !!id);
           
           // Delete
           const toDelete = originalIds.filter(id => !currentIds.includes(id));
           for (const id of toDelete) {
               await deleteRoomType(id);
           }
            // Upsert
           for (const room of currentRooms) {
               if (room.id) {
                   await updateRoomType(room.id, room);
               } else {
                   await createRoomType(savedHotelId, room);
               }
           }
       }

      } else {
        // For Creation, Backend now supports nested roomTypes and tagIds!
        // So we just send it all at once.
        const res = await createHotel(hotelData);
        message.success('酒店创建成功');
      }

      setModalVisible(false);
      fetchHotels();
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error(error.message || '提交失败');
    }
  };

  const columns: TableColumnsType<Hotel> = [
    {
      title: '酒店信息',
      key: 'info',
      width: 300,
      render: (_, record) => (
        <Space align="start">
            {record.images && record.images.length > 0 ? (
                <Image
                    src={record.images[0]}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    preview={{ src: record.images[0] }}
                />
            ) : (
                <div style={{ width: 80, height: 80, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: '#999', fontSize: 12 }}>
                    暂无图片
                </div>
            )}
            <div>
                <div style={{ fontWeight: 'bold', fontSize: 15 }}>{record.nameZh}</div>
                {record.nameEn && <div style={{ fontSize: 12, color: '#666' }}>{record.nameEn}</div>}
                <div style={{ fontSize: 12, marginTop: 4 }}>
                   <span style={{ color: '#faad14' }}>{record.score ? `${record.score.toFixed(1)}分` : '暂无评分'}</span> 
                   <span style={{ margin: '0 4px', color: '#ddd' }}>|</span>
                   {record.openingYear ? `${record.openingYear}年开业` : '开业年份未知'}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{record.address}</div>
            </div>
        </Space>
      )
    },
    {
      title: '位置/标签',
      key: 'tags',
      width: 200,
      render: (_, record) => (
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
            <div>
                <Tag color="cyan">{record.location?.name || '未知城市'}</Tag>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                 {record.hotelTags?.map((item: any, index) => {
                     const tagName = item.tag ? item.tag.name : (item.name || '未知');
                     return <Tag key={index} color="blue" style={{ marginRight: 0 }}>{tagName}</Tag>
                 })}
                 {(!record.hotelTags || record.hotelTags.length === 0) && <span style={{ color: '#ccc', fontSize: 12 }}>无标签</span>}
            </div>
        </Space>
      )
    },
    {
      title: '房型概览',
      key: 'rooms',
      width: 250,
      render: (_, record) => {
          if (!record.roomTypes || record.roomTypes.length === 0) {
              return <span style={{ color: '#999' }}>暂无房型</span>;
          }
          return (
              <div style={{ maxHeight: 100, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4, padding: 4 }}>
                  {record.roomTypes.map(room => (
                      <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, borderBottom: '1px dashed #f0f0f0', paddingBottom: 2 }}>
                          <span style={{ fontWeight: 500 }}>{room.name}</span>
                          <span>
                              <span style={{ color: '#f50', fontWeight: 'bold' }}>¥{room.price}</span>
                              <span style={{ color: '#999', marginLeft: 8 }}>库存:{room.stock}</span>
                          </span>
                      </div>
                  ))}
              </div>
          )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'processing', text: '审核中' },
          rejected: { color: 'error', text: '已驳回' },
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
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<CommentOutlined />}
            onClick={() => handleViewComments(record.id)}
          >
            评论
          </Button>
          <Popconfirm
            title="确定要删除这个酒店吗？"
            onConfirm={() => handleDelete(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加酒店
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={hotels}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title={editingHotel ? '编辑酒店' : '添加酒店'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="提交"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            star_rating: 3,
            rooms: [{ name: '', price: 0, stock: 1 }],
          }}
        >
          <Form.Item
            label="酒店名称 (中文)"
            name="name"
            rules={[{ required: true, message: '请输入酒店名称' }]}
          >
            <Input placeholder="请输入酒店名称" />
          </Form.Item>

          <Form.Item label="英文名称" name="name_en">
            <Input placeholder="请输入英文名称（可选）" />
          </Form.Item>

          <Form.Item
            label="城市/位置"
            name="locationId"
            rules={[{ required: true, message: '请选择城市' }]}
          >
             <Select placeholder="请选择城市">
                {locations.map(loc => (
                    <Option key={loc.id} value={loc.id}>{loc.name}</Option>
                ))}
             </Select>
          </Form.Item>

          <Form.Item
            label="地址"
            name="address"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入详细地址" />
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.latitude !== curr.latitude || prev.longitude !== curr.longitude}>
            {({ getFieldValue, setFieldsValue }) => (
                <Form.Item label="地理位置">
                    <TencentMapSelector 
                        latitude={getFieldValue('latitude')} 
                        longitude={getFieldValue('longitude')}
                        onSelect={(loc) => {
                            setFieldsValue({
                                latitude: loc.latitude,
                                longitude: loc.longitude
                            });
                        }}
                    />
                    <Form.Item name="latitude" noStyle hidden><Input /></Form.Item>
                    <Form.Item name="longitude" noStyle hidden><Input /></Form.Item>
                </Form.Item>
            )}
          </Form.Item>

          <Form.Item
            label="星级"
            name="star_rating"
            rules={[{ required: true, message: '请选择星级' }]}
          >
            <Select>
              {[1, 2, 3, 4, 5].map((num) => (
                <Option key={num} value={num}>
                  {num}星
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="酒店开业时间"
            name="opening_date"
            rules={[{ required: true, message: '请选择酒店开业时间' }]}
          >
            <DatePicker
              picker="year"
              style={{ width: '100%' }}
              placeholder="请选择开业年份"
            />
          </Form.Item>

          <Form.Item label="标签" name="hotelTags">
            <Select
              mode="multiple"
              placeholder="请选择标签"
              style={{ width: '100%' }}
            >
              {tags.map(tag => (
                  <Option key={tag.id} value={tag.id}>{tag.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="酒店描述" name="description">
            <TextArea rows={4} placeholder="请输入酒店描述" />
          </Form.Item>

          <Form.Item label="酒店图片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleUpload}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              onRemove={(file) => {
                setFileList(fileList.filter((f) => f.uid !== file.uid));
              }}
            >
              {fileList.length >= 8 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            label="房型列表"
            name="rooms"
          >
            <RoomList />
          </Form.Item>
        </Form>
      </Modal>

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
                      <div className="text-gray-400 text-xs mt-1">{new Date(item.createdAt).toLocaleString()}</div>
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
