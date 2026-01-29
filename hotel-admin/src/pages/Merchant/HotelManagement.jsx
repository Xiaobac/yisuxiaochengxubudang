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
  message,
  Tag,
  Popconfirm,
  Select,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { getMyHotels, createHotel, updateHotel, deleteHotel, uploadImage } from '../../services/hotel';

const { TextArea } = Input;
const { Option } = Select;

// 房型动态表单组件
function RoomList({ value = [], onChange }) {
  const handleAdd = () => {
    onChange([...value, { room_type: '', price: '', total_count: 1 }]);
  };

  const handleRemove = (index) => {
    const newRooms = [...value];
    newRooms.splice(index, 1);
    onChange(newRooms);
  };

  const handleChange = (index, field, val) => {
    const newRooms = [...value];
    newRooms[index][field] = val;
    onChange(newRooms);
  };

  return (
    <div>
      {value.map((room, index) => (
        <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
          <Input
            placeholder="房型名称"
            value={room.room_type}
            onChange={(e) => handleChange(index, 'room_type', e.target.value)}
            style={{ width: 150 }}
          />
          <InputNumber
            placeholder="价格"
            value={room.price}
            onChange={(val) => handleChange(index, 'price', val)}
            min={0}
            style={{ width: 120 }}
          />
          <InputNumber
            placeholder="数量"
            value={room.total_count}
            onChange={(val) => handleChange(index, 'total_count', val)}
            min={1}
            style={{ width: 100 }}
          />
          <Button type="link" danger onClick={() => handleRemove(index)}>
            删除
          </Button>
        </Space>
      ))}
      <Button type="dashed" onClick={handleAdd} block icon={<PlusOutlined />}>
        添加房型
      </Button>
    </div>
  );
}

function HotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const data = await getMyHotels();
      setHotels(data);
    } catch (error) {
      console.error('获取酒店列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingHotel(null);
    setFileList([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingHotel(record);
    form.setFieldsValue({
      ...record,
      rooms: record.Rooms || [],
    });
    // 设置已有图片
    if (record.images && record.images.length > 0) {
      setFileList(record.images.map((url, index) => ({
        uid: `-${index}`,
        name: `image-${index}`,
        status: 'done',
        url,
      })));
    } else {
      setFileList([]);
    }
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteHotel(id);
      message.success('删除成功');
      fetchHotels();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      const result = await uploadImage(file);
      onSuccess(result);
      message.success('上传成功');
    } catch (error) {
      onError(error);
      message.error('上传失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 收集图片 URL
      const images = fileList
        .filter(file => file.status === 'done')
        .map(file => file.url || file.response?.url);

      const hotelData = {
        ...values,
        images,
      };

      if (editingHotel) {
        await updateHotel(editingHotel.id, hotelData);
        message.success('更新成功');
      } else {
        await createHotel(hotelData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchHotels();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const columns = [
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
      render: (rating) => `${rating}星`,
    },
    {
      title: '起始价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          published: { color: 'success', text: '已发布' },
          offline: { color: 'error', text: '已下线' },
        };
        const { color, text } = statusMap[status] || {};
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
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个酒店吗？"
            onConfirm={() => handleDelete(record.id)}
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
        pagination={{ pageSize: 10 }}
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
          initialValues={{ star_rating: 3, rooms: [{ room_type: '', price: '', total_count: 1 }] }}
        >
          <Form.Item
            label="酒店名称"
            name="name"
            rules={[{ required: true, message: '请输入酒店名称' }]}
          >
            <Input placeholder="请输入酒店名称" />
          </Form.Item>

          <Form.Item
            label="英文名称"
            name="name_en"
          >
            <Input placeholder="请输入英文名称（可选）" />
          </Form.Item>

          <Form.Item
            label="城市"
            name="city"
            rules={[{ required: true, message: '请输入城市' }]}
          >
            <Input placeholder="请输入城市" />
          </Form.Item>

          <Form.Item
            label="地址"
            name="address"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入详细地址" />
          </Form.Item>

          <Form.Item
            label="星级"
            name="star_rating"
            rules={[{ required: true, message: '请选择星级' }]}
          >
            <Select>
              {[1, 2, 3, 4, 5].map(num => (
                <Option key={num} value={num}>{num}星</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="起始价格"
            name="price"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入起始价格"
            />
          </Form.Item>

          <Form.Item
            label="酒店开业时间"
            name="opening_date"
            rules={[{ required: true, message: '请选择酒店开业时间' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择开业时间"
            />
          </Form.Item>

          <Form.Item
            label="设施"
            name="facilities"
          >
            <Select
              mode="tags"
              placeholder="输入设施名称后按回车"
              style={{ width: '100%' }}
            >
              <Option value="WiFi">WiFi</Option>
              <Option value="停车场">停车场</Option>
              <Option value="游泳池">游泳池</Option>
              <Option value="健身房">健身房</Option>
              <Option value="餐厅">餐厅</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="酒店描述"
            name="description"
          >
            <TextArea rows={4} placeholder="请输入酒店描述" />
          </Form.Item>

          <Form.Item label="酒店图片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleUpload}
              onChange={({ fileList }) => setFileList(fileList)}
              onRemove={(file) => {
                setFileList(fileList.filter(f => f.uid !== file.uid));
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
            rules={[{ required: true, message: '请至少添加一个房型' }]}
          >
            <RoomList />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default HotelManagement;
