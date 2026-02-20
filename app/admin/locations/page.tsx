'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Tag
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

interface LocationNode extends Location {
  key: string | number;
  children?: LocationNode[];
  isRoot?: boolean;
}

export default function LocationManagementPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const { message } = App.useApp();
  
  // Watch for type changes to control parentId field visibility
  const typeValue = Form.useWatch('type', form);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      if (editingLocation) {
        form.setFieldsValue({
            name: editingLocation.name,
            description: editingLocation.description,
            type: editingLocation.type,
            parentId: editingLocation.parentId
        });
      } else {
        form.resetFields();
        // Default to domestic city
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

  // Build the tree structure
  const treeData = useMemo(() => {
    if (!locations.length) return [];

    // Separate locations by type
    const provinces = locations.filter(l => l.type === 'province');
    const domesticCities = locations.filter(l => l.type === 'domestic');
    const overseasCities = locations.filter(l => l.type === 'overseas');

    // Build Domestic Tree
    const domesticTree: LocationNode[] = [];
    
    // 1. Add Provinces
    provinces.forEach(province => {
      const provinceNode: LocationNode = {
        ...province,
        key: province.id,
        children: []
      };
      
      // Find cities belonging to this province
      const provinceCities = domesticCities.filter(c => c.parentId === province.id);
      if (provinceCities.length > 0) {
        provinceNode.children = provinceCities.map(city => ({
          ...city,
          key: city.id,
          children: undefined // Explicitly set children to undefined to match LocationNode type or avoid conflict
        }));
      }
      
      domesticTree.push(provinceNode);
    });

    // 2. Add Domestic Cities without parent (or invalid parent)
    const orphanedDomestic = domesticCities.filter(c => !c.parentId || !provinces.find(p => p.id === c.parentId));
    orphanedDomestic.forEach(city => {
      domesticTree.push({
        ...city,
        key: city.id,
        children: undefined // Explicitly set children to undefined
      });
    });

    // Build Overseas Tree
    const overseasTree: LocationNode[] = overseasCities.map(city => ({
      ...city,
      key: city.id,
      children: undefined // Explicitly set children to undefined
    }));

    // Construct Root Nodes
    const roots: LocationNode[] = [
      {
        id: -1, // Virtual ID
        name: '国内',
        type: 'root',
        key: 'domestic_root',
        children: domesticTree,
        description: '国内城市及省份'
      },
      {
        id: -2, // Virtual ID
        name: '海外',
        type: 'root',
        key: 'overseas_root',
        children: overseasTree,
        description: '海外国家及城市'
      }
    ];

    return roots;
  }, [locations]);

  const availableProvinces = useMemo(() => {
    return locations.filter(l => l.type === 'province');
  }, [locations]);

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

  const handleEdit = (record: LocationNode) => {
    // Prevent editing root nodes
    if (record.isRoot || typeof record.key === 'string') return;
    
    setEditingLocation(record as Location);
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
        // If type is not domestic, clear parentId just in case
        if (values.type !== 'domestic') {
          values.parentId = undefined;
        }

        if (editingLocation) {
            await updateLocation(editingLocation.id, values.name, values.description, values.type, values.parentId);
            message.success('更新成功');
        } else {
            await createLocation(values.name, values.description, values.type, values.parentId);
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

  const columns: TableColumnsType<LocationNode> = [
    {
      title: '城市/区域名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => {
        switch(type) {
            case 'root': return <Tag color="blue">区域分类</Tag>;
            case 'province': return <Tag color="geekblue">省份</Tag>;
            case 'domestic': return <Tag color="green">国内城市</Tag>;
            case 'overseas': return <Tag color="purple">海外城市</Tag>;
            default: return type;
        }
      }
    },
    {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        // Don't show actions for virtual root nodes
        if (typeof record.key === 'string' && record.key.endsWith('_root')) return null;
        
        return (
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
              description={record.type === 'province' && record.children && record.children.length > 0 ? "删除省份将同时影响其下属城市，确定继续？" : "确定要删除这个位置吗？"}
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
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
            <Form.Item name="name" label="名称">
              <Input placeholder="请输入名称" allowClear />
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
        dataSource={treeData}
        rowKey="key"
        loading={loading}
        pagination={false}
        defaultExpandAllRows={true}
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
                <Input placeholder="例如：北京、广东省" />
            </Form.Item>
            <Form.Item
                name="type"
                label="区域类型"
                rules={[{ required: true, message: '请选择区域类型' }]}
            >
                <Select>
                    <Select.Option value="domestic">国内城市</Select.Option>
                    <Select.Option value="province">省份</Select.Option>
                    <Select.Option value="overseas">海外城市</Select.Option>
                </Select>
            </Form.Item>
            
            {typeValue === 'domestic' && (
                <Form.Item
                    name="parentId"
                    label="所属省份"
                    rules={[{ required: true, message: '请选择所属省份' }]}
                >
                    <Select placeholder="请选择所属省份" allowClear>
                        {availableProvinces.map(p => (
                            <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            )}

            <Form.Item 
                name="description" 
                label="描述" 
            >
                <Input.TextArea rows={3} placeholder="备注信息" />
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
