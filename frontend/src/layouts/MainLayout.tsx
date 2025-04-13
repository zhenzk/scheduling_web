import React from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  SwapOutlined, 
  BellOutlined, 
  SettingOutlined 
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import Header from '../components/Header';

const { Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useSelector(selectCurrentUser);
  
  // 获取当前路径
  const currentPath = location.pathname.split('/')[1];
  
  // 菜单项
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '控制面板',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'schedule',
      icon: <CalendarOutlined />,
      label: '排班日历',
      onClick: () => navigate('/schedule'),
    },
    {
      key: 'swap-requests',
      icon: <SwapOutlined />,
      label: '调班申请',
      onClick: () => navigate('/swap-requests'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '通知中心',
      onClick: () => navigate('/notifications'),
    },
  ];
  
  // 管理员菜单项
  if (currentUser?.role === 'admin') {
    menuItems.push(
      {
        key: 'users',
        icon: <UserOutlined />,
        label: '用户管理',
        onClick: () => navigate('/users'),
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '系统设置',
        onClick: () => navigate('/settings'),
      }
    );
  }
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      
      <Layout>
        <Sider width={200} className="bg-white">
          <Menu
            mode="inline"
            selectedKeys={[currentPath]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        
        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            className="bg-white mt-6 p-6"
            style={{
              margin: 0,
              minHeight: 280,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
