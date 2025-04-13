import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

const AuthLayout: React.FC = () => {
  return (
    <Layout className="h-screen bg-gray-100">
      <Content className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">排班系统</h1>
            <p className="text-gray-500">管理您的排班和调班申请</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <Outlet />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default AuthLayout;
