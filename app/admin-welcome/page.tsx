'use client';

import { Button, Card, Typography, Space } from 'antd';
import { SafetyOutlined, DashboardOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FeatureItem } from '../components/FeatureItem';

const { Title, Paragraph, Text } = Typography;

export default function AdminWelcome() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#e6f7ff] to-white">
      <Navbar variant="admin" />

      <main className="flex flex-1 flex-wrap items-center justify-center gap-16 p-12">
        {/* 左侧宣传语 */}
        <div className="max-w-[500px]">
          <Title className="!mb-6 !text-5xl !text-[#1f1f1f]">
            易宿管理<br />
            <span className="text-[#1677ff]">高效运营</span><br />
            全局掌控
          </Title>
          <Paragraph className="!mb-8 !text-lg !text-gray-500">
            易宿酒店管理员后台，审核酒店、管理标签与城市、
            <br />
            发放优惠券，一站式运营管理。
          </Paragraph>

          <Space size="large" className="mt-8">
            <FeatureItem
              icon={<SafetyOutlined />}
              title="审核管理"
              description="高效审核酒店入驻"
            />
            <FeatureItem
              icon={<DashboardOutlined />}
              title="运营中心"
              description="全局数据一目了然"
            />
          </Space>
        </div>

        {/* 右侧登录卡片 */}
        <Card
          className="w-[400px] !rounded-2xl !bg-white/50 !shadow-xl backdrop-blur-sm"
          variant="borderless"
        >
          <div className="mb-6 text-center">
            <Title level={3} className="!mb-2">管理员登录</Title>
            <Text type="secondary">登录管理员后台管理平台</Text>
          </div>

          <div className="flex flex-col gap-4">
            <Link href="/auth/admin-login" className="w-full">
              <Button type="primary" size="large" block className="!h-12 !text-base">
                管理员登录
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Text type="secondary" className="text-xs">
              登录即代表您同意易宿服务条款和隐私政策
            </Text>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
