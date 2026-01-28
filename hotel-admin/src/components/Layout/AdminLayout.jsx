import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message } from 'antd';
import {
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('退出登录成功');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/admin/review',
      icon: <AuditOutlined />,
      label: '审核管理',
      onClick: () => navigate('/admin/review'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '14px' : '18px',
          fontWeight: 'bold',
        }}>
          {collapsed ? '易宿' : '易宿酒店管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 500 }}>
            管理员系统
          </div>
          <Dropdown menu={{ items: userMenuItems }}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.username}</span>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: '24px' }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            minHeight: 'calc(100vh - 112px)',
            borderRadius: '8px',
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
