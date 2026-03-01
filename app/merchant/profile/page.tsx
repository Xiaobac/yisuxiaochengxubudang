'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  App,
  Spin,
  Tag,
  Space,
} from 'antd';
import { EditOutlined, LockOutlined } from '@ant-design/icons';
import { getProfile, updateProfile, changePassword } from '@/app/services/staff';
import { authStorage } from '@/app/lib/auth-storage';
import type { User } from '@/app/types';
import dayjs from 'dayjs';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch {
      message.error('获取个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = () => {
    editForm.setFieldsValue({
      name: user?.name,
      phone: user?.phone,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const res = await updateProfile(user!.id, {
        name: values.name,
        phone: values.phone,
      });
      if (res.success && res.data) {
        message.success('更新成功');
        const updatedUser = { ...user!, name: res.data.name, phone: res.data.phone };
        setUser(updatedUser);
        // 同步 localStorage
        const stored = authStorage.getUser();
        if (stored) {
          authStorage.setUser({ ...stored, name: res.data.name, phone: res.data.phone });
        }
        setEditModalVisible(false);
      } else {
        message.error(res.error || '更新失败');
      }
    } catch {
      // form validation
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      const res = await changePassword(user!.id, {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (res.success) {
        message.success('密码修改成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      } else {
        message.error(res.error || '密码修改失败');
      }
    } catch {
      // form validation
    }
  };

  const getRoleLabel = (roleName?: string) => {
    switch (roleName?.toUpperCase()) {
      case 'MERCHANT': return { text: '商户', color: 'gold' };
      case 'STAFF': return { text: '职员', color: 'blue' };
      case 'ADMIN': return { text: '管理员', color: 'red' };
      default: return { text: roleName || '-', color: 'default' };
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return null;

  const roleInfo = getRoleLabel(user.role?.name);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>个人信息</h2>

      <Card>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          <Descriptions.Item label="姓名">{user.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="手机">{user.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">
            <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="积分">{user.points ?? 0}</Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {user.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>

        <Space style={{ marginTop: 24 }}>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEditOpen}>
            编辑信息
          </Button>
          <Button icon={<LockOutlined />} onClick={() => {
            passwordForm.resetFields();
            setPasswordModalVisible(true);
          }}>
            修改密码
          </Button>
        </Space>
      </Card>

      <Modal
        title="编辑个人信息"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        forceRender
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="姓名" name="name">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item label="手机" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={() => setPasswordModalVisible(false)}
        forceRender
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label="旧密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
