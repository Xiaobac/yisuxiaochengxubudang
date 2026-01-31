'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import * as AntdComponents from 'antd';
import * as AntdIcons from '@ant-design/icons';

const { Button, Card, Typography, Switch } = AntdComponents;
const { BulbOutlined, BulbFilled } = AntdIcons;
const { Title, Paragraph } = Typography;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Switch
      checked={theme === 'dark'}
      onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      checkedChildren={<BulbFilled />}
      unCheckedChildren={<BulbOutlined />}
    />
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 顶部标题和主题切换 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>易宿酒店管理系统</Title>
          <ThemeToggle />
        </div>

        {/* 欢迎卡片 */}
        <Card>
          <Title level={3}>欢迎来到 Next.js 版本!</Title>
          <Paragraph>
            深色模式功能已成功迁移到 Next.js 项目中。点击右上角的开关切换主题。
          </Paragraph>
          <Paragraph>
            <strong>技术栈:</strong>
            <ul>
              <li>Next.js 16.1.6 (App Router)</li>
              <li>React 19.2.3</li>
              <li>Ant Design 6.2.2</li>
              <li>next-themes (深色模式)</li>
              <li>TypeScript</li>
            </ul>
          </Paragraph>
        </Card>

        {/* 功能演示卡片 */}
        <Card title="Ant Design 组件演示">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="primary">主要按钮</Button>
            <Button>默认按钮</Button>
            <Button type="dashed">虚线按钮</Button>
            <Button type="link">链接按钮</Button>
          </div>
        </Card>

        {/* 快速导航 */}
        <Card title="快速导航">
          <Paragraph>
            <strong>已完成功能:</strong>
          </Paragraph>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <Button type="link" href="/auth/login">前往登录</Button>
              <span> - 登录商户或管理员后台</span>
            </div>
            <div>
              <Button type="link" href="/auth/register">前往注册</Button>
              <span> - 注册商户或管理员账号</span>
            </div>
          </div>
          <Paragraph style={{ marginTop: 16 }}>
            <strong>后台系统:</strong>
          </Paragraph>
          <ul>
            <li>商户后台: /merchant/hotels (需登录)</li>
            <li>管理员后台: /admin/review (需登录)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
