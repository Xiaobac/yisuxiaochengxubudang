'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, saveAuth } from '@/app/services/auth';
import type { LoginData } from '@/app/types';

const { Title } = Typography;

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { message } = App.useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  const onFinish = async (values: LoginData) => {
    try {
      setLoading(true);
      const result = await login(values);

      if (result.success && result.accessToken) {
        const roleName = result.user.role?.name?.toLowerCase();

        // 校验必须是管理员角色
        if (roleName !== 'admin' && roleName !== 'administrator') {
          message.error('该账号不是管理员，请使用商户登录');
          return;
        }

        saveAuth(result.accessToken, result.refreshToken, result.user);
        message.success('登录成功');
        router.push('/admin/review');
      } else {
        message.error('登录异常：未获取到有效 Token');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error.response?.data?.error || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Card
        suppressHydrationWarning
        style={{
          width: '100%',
          maxWidth: 450,
          margin: 20,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          borderRadius: 8,
        }}
        styles={{
          body: { padding: 40 },
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          易宿酒店管理员版
        </Title>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 'normal' }}>
          管理员登录
        </Title>

        <Form
          name="admin-login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="管理员邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link href="/auth/login">返回商户登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
