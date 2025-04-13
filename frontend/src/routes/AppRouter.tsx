import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectToken } from '../store/slices/authSlice';

// 布局组件
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// 页面组件
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import SchedulePage from '../pages/SchedulePage';
import UserManagementPage from '../pages/UserManagementPage';
import SwapRequestPage from '../pages/SwapRequestPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';

// 受保护的路由组件
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useSelector(selectToken);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// 应用路由器
const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 认证路由 */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route index element={<Navigate to="/login" replace />} />
        </Route>
        
        {/* 主应用路由 */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="swap-requests" element={<SwapRequestPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        
        {/* 404路由 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
