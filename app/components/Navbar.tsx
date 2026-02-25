'use client';

import { ShopOutlined, UserOutlined, CrownOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import Link from 'next/link';

const { Title } = Typography;

interface NavbarProps {
  variant?: 'merchant' | 'admin';
}

export function Navbar({ variant = 'merchant' }: NavbarProps) {
  const isAdmin = variant === 'admin';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur-md md:px-12">
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <CrownOutlined className="text-2xl text-[#1677ff]" />
        ) : (
          <ShopOutlined className="text-2xl text-[#1677ff]" />
        )}
        <Title level={4} style={{ margin: 0 }} className="!text-[#1677ff]">
          {isAdmin ? '易宿酒店管理员版' : '易宿酒店商户版'}
        </Title>
      </div>
      {isAdmin ? (
        <Link href="/" className="text-sm text-gray-600 hover:text-[#1677ff]">
          商户入口 <ShopOutlined />
        </Link>
      ) : (
        <Link href="/admin-welcome" className="text-sm text-gray-600 hover:text-[#1677ff]">
          管理员入口 <UserOutlined />
        </Link>
      )}
    </header>
  );
}
