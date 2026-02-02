'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { login, saveAuth } from '@/app/services/auth';
import type { LoginData } from '@/app/types';

const { Title } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { message } = App.useApp();
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const onFinish = async (values: LoginData) => {
    try {
      setLoading(true);
      const result = await login(values);

      // 保存 token 和用户信息
      saveAuth(result.token, result.user);

      message.success('登录成功');

      // 根据角色跳转
      const roleName = result.user.role?.name;
      if (roleName === 'MERCHANT') {
        router.push('/merchant/dashboard');
      } else if (roleName === 'ADMIN') {
        router.push('/admin/review');
      } else {
        // 普通用户跳转到首页（待实现）
        message.info('普通用户端暂未开放');
        router.push('/');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  // 只在客户端挂载后才使用主题，避免 SSR 不一致
  const isDark = mounted ? theme === 'dark' : false;

  return (
    <div
      suppressHydrationWarning
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <Card
        suppressHydrationWarning
        style={{
          width: '100%',
          maxWidth: 450,
          margin: 20,
          boxShadow: isDark
            ? '0 8px 24px rgba(0, 0, 0, 0.4)'
            : '0 8px 24px rgba(0, 0, 0, 0.15)',
          borderRadius: 8,
        }}
        styles={{
          body: { padding: 40 },
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          易宿酒店管理系统
        </Title>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 'normal' }}>
          登录
        </Title>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
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
            还没有账号？ <Link href="/auth/register">立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
