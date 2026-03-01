'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  App,
  Empty,
  Tag,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMyStaff, createStaff, updateStaff, deleteStaff } from '@/app/services/staff';
import { getStoredUser } from '@/app/services/auth';
import type { User } from '@/app/types';
import dayjs from 'dayjs';

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const currentUser = getStoredUser();
  const isMerchant = currentUser?.role?.name?.toUpperCase() === 'MERCHANT';

  useEffect(() => {
    if (isMerchant) {
      fetchStaff();
    }
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await getMyStaff();
      if (res.success && res.data) {
        setStaff(res.data);
      }
    } catch (error) {
      message.error('获取职员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStaff(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingStaff(record);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteStaff(id);
      if (res.success) {
        message.success('删除成功');
        setStaff(staff.filter(s => s.id !== id));
      } else {
        message.error(res.error || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingStaff) {
        const res = await updateStaff(editingStaff.id, {
          name: values.name,
          phone: values.phone,
        });
        if (res.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchStaff();
        } else {
          message.error(res.error || '更新失败');
        }
      } else {
        const res = await createStaff({
          email: values.email,
          password: values.password,
          name: values.name,
          phone: values.phone,
          merchantId: currentUser!.id,
        });
        if (res.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchStaff();
        } else {
          message.error(res.error || '创建失败');
        }
      }
    } catch {
      // form validation error
    }
  };

  const columns: TableColumnsType<User> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => name || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: '角色',
      key: 'role',
      render: () => <Tag color="blue">职员</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该职员？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!isMerchant) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty description="无权访问职员管理" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>职员管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          添加职员
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={staff}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="暂无职员" /> }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingStaff ? '编辑职员' : '添加职员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        forceRender
      >
        <Form form={form} layout="vertical">
          {!editingStaff && (
            <>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          )}
          <Form.Item label="姓名" name="name">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item label="手机" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
