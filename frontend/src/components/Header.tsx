// Modified Header component with backend status indicator
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Badge, Avatar, Button } from 'antd';
import { 
  BellOutlined, 
  UserOutlined, 
  LogoutOutlined,
  SettingOutlined,
  CalendarOutlined,
  TeamOutlined,
  SwapOutlined,
  DashboardOutlined,
  DisconnectOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '../store/slices/authSlice';
import { useGetNotificationsQuery, checkBackendAvailability } from '../services/api';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  
  // 检查后端状态
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isAvailable = await checkBackendAvailability();
        setBackendAvailable(isAvailable);
      } catch (error) {
        setBackendAvailable(false);
      }
    };
    
    checkBackend();
    // 每60秒检查一次后端状态
    const interval = setInterval(checkBackend, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // 获取通知数据
  const { data: notifications = [] } = useGetNotificationsQuery({});
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  // 处理退出登录
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  // 通知菜单
  const notificationMenu = (
    <Menu>
      <Menu.Item key="notifications-link">
        <Link to="/notifications">查看所有通知</Link>
      </Menu.Item>
      {notifications.slice(0, 5).map(notification => (
        <Menu.Item key={`notification-${notification.id}`}>
          <div className="max-w-xs truncate">
            {notification.is_read ? notification.title : <strong>{notification.title}</strong>}
          </div>
        </Menu.Item>
      ))}
    </Menu>
  );
  
  // 用户菜单
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/profile">个人资料</Link>
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        <Link to="/settings">系统设置</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );
  
  return (
    <AntHeader className="bg-white flex justify-between items-center px-6 shadow-sm">
      <div className="flex items-center">
        <h1 className="text-xl font-bold m-0 mr-8">排班系统</h1>
        <Menu mode="horizontal" defaultSelectedKeys={['dashboard']} className="border-0">
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            <Link to="/dashboard">控制面板</Link>
          </Menu.Item>
          <Menu.Item key="schedule" icon={<CalendarOutlined />}>
            <Link to="/schedule">排班日历</Link>
          </Menu.Item>
          <Menu.Item key="swap-requests" icon={<SwapOutlined />}>
            <Link to="/swap-requests">调班申请</Link>
          </Menu.Item>
          {currentUser?.role === 'admin' && (
            <Menu.Item key="users" icon={<TeamOutlined />}>
              <Link to="/users">用户管理</Link>
            </Menu.Item>
          )}
        </Menu>
      </div>
      
      <div className="flex items-center">
        {/* 后端状态指示器 */}
        {backendAvailable !== null && (
          <Button 
            type="text" 
            icon={backendAvailable ? <CheckCircleOutlined style={{ color: 'green' }} /> : <DisconnectOutlined style={{ color: 'red' }} />}
            className="mr-2"
          >
            {backendAvailable ? '后端已连接' : '后端未连接'}
          </Button>
        )}
        
        {/* 游客模式指示器 */}
        {currentUser?.role === 'guest' && (
          <Button type="text" className="mr-2">
            游客模式
          </Button>
        )}
        
        <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
          <Badge count={unreadCount} className="mr-4 cursor-pointer">
            <BellOutlined style={{ fontSize: '18px' }} />
          </Badge>
        </Dropdown>
        
        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
          <div className="flex items-center cursor-pointer">
            <Avatar icon={<UserOutlined />} />
            <span className="ml-2">{currentUser?.full_name || currentUser?.username}</span>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
