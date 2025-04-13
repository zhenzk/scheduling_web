// Modified DashboardPage with backend status indicator
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Calendar, Badge, Alert } from 'antd';
import { UserOutlined, ClockCircleOutlined, SwapOutlined, BellOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useGetUsersQuery, useGetShiftsQuery, useGetSwapRequestsQuery, useGetNotificationsQuery, checkBackendAvailability } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const DashboardPage: React.FC = () => {
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
  
  // 获取数据
  const { data: users = [] } = useGetUsersQuery({});
  const { data: shifts = [] } = useGetShiftsQuery({});
  const { data: swapRequests = [] } = useGetSwapRequestsQuery({});
  const { data: notifications = [] } = useGetNotificationsQuery({});
  
  // 统计数据
  const activeUsers = users.filter(user => user.is_active).length;
  const pendingSwapRequests = swapRequests.filter(req => req.status === 'pending').length;
  const unreadNotifications = notifications.filter(notif => !notif.is_read).length;
  const todayShifts = shifts.filter(shift => {
    const today = new Date().toISOString().split('T')[0];
    return shift.date === today;
  }).length;
  
  // 日历数据获取函数
  const getListData = (value: Dayjs) => {
    const date = value.format('YYYY-MM-DD');
    const dayShifts = shifts.filter(shift => shift.date === date);
    
    return dayShifts.map(shift => ({
      type: shift.is_holiday ? 'error' : 'success',
      content: `班次 #${shift.id}`,
    }));
  };
  
  // 日历单元格渲染
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type as any} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">控制面板</h2>
      
      {backendAvailable === false && (
        <Alert
          message="后端服务未启动"
          description={
            currentUser?.role === 'guest' 
              ? "您正在以游客身份浏览系统，使用的是模拟数据。部分功能（如创建、更新、删除操作）将不可用。"
              : "检测到后端服务未启动，系统正在使用模拟数据。如需完整功能，请启动后端服务。"
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={activeUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日班次"
              value={todayShifts}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理调班申请"
              value={pendingSwapRequests}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="未读通知"
              value={unreadNotifications}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="排班日历" className="mb-6">
        <Calendar dateCellRender={dateCellRender} />
      </Card>
    </div>
  );
};

export default DashboardPage;
