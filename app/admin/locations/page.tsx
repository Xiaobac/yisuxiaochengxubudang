'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  App,
  Card,
  Row,
  Col
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getLocations, createLocation, updateLocation, deleteLocation } from '@/app/services/admin';
import type { Location } from '@/app/types';

export default function LocationManagementPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      if (editingLocation) {
        form.setFieldsValue({
            name: editingLocation.name,
            description: editingLocation.description,
            type: editingLocation.type
        });
      } else {
        form.resetFields();
        form.setFieldValue('type', 'domestic');
      }
    }
  }, [modalVisible, editingLocation, form]);

  const fetchLocations = async (params: { name?: string; type?: string } = {}) => {
    try {
      setLoading(true);
      const res = await getLocations(params);
      setLocations(res.data || []);
    } catch (error) {
      console.error('Fetch locations error:', error);
      message.error('获取位置列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    fetchLocations(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    fetchLocations();
  };

  const handleAdd = () => {
    setEditingLocation(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Location) => {
    setEditingLocation(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLocation(id);
      message.success('删除成功');
      fetchLocations();
    } catch (error: any) {
      console.error('Delete location error:', error);
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
        const values = await form.validateFields();
        if (editingLocation) {
            await updateLocation(editingLocation.id, values.name, values.description, values.type);
            message.success('更新成功');
        } else {
            await createLocation(values.name, values.description, values.type);
            message.success('创建成功');
        }
        setModalVisible(false);
        fetchLocations();
    } catch (error: any) {
        if (error.errorFields) return; // Form validation failed
        console.error('Submit location error:', error);
        message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns: TableColumnsType<Location> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '城市/区域名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
    },
    {
      title: '区域类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => type === 'overseas' ? '海外' : '国内',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个位置吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="text-xl font-bold">城市位置管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增位置
          </Button>
        </div>

        <Card size="small" style={{ marginBottom: 16 }}>
          <Form form={searchForm} layout="inline" onFinish={handleSearch}>
            <Form.Item name="name" label="城市名称">
              <Input placeholder="请输入城市名称" allowClear />
            </Form.Item>
            <Form.Item name="type" label="区域类型">
              <Select placeholder="请选择区域类型" allowClear style={{ width: 120 }}>
                <Select.Option value="domestic">国内</Select.Option>
                <Select.Option value="overseas">海外</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <Table
        columns={columns}
        dataSource={locations}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingLocation ? '编辑位置' : '新增位置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden={true}
      >
        <Form form={form} layout="vertical">
            <Form.Item 
                name="name" 
                label="名称" 
                rules={[{ required: true, message: '请输入位置名称' }]}
            >
                <Input placeholder="例如：北京" />
            </Form.Item>
            <Form.Item
                name="type"
                label="区域类型"
                rules={[{ required: true, message: '请选择区域类型' }]}
            >
                <Select>
                    <Select.Option value="domestic">国内</Select.Option>
                    <Select.Option value="overseas">海外</Select.Option>
                </Select>
            </Form.Item>
            <Form.Item 
                name="description" 
                label="描述" 
            >
                <Input.TextArea rows={3} placeholder="例如：中华人民共和国首都" />
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
