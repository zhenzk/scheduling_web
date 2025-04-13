// Modified LoginPage with guest mode support
import React, { useState } from 'react';
import { Form, Input, Button, message, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation, checkBackendAvailability } from '../services/api';
import { setCredentials } from '../store/slices/authSlice';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  
  // 检查后端状态
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const isAvailable = await checkBackendAvailability();
        setBackendStatus(isAvailable ? 'available' : 'unavailable');
      } catch (error) {
        setBackendStatus('unavailable');
      }
    };
    
    checkBackend();
  }, []);
  
  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const result = await login(values).unwrap();
      dispatch(setCredentials({ token: result.access_token, user: result.user }));
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      if (error?.data?.detail) {
        message.error(error.data.detail);
      } else {
        message.error('登录失败，请检查用户名和密码');
      }
    }
  };
  
  const handleGuestLogin = async () => {
    try {
      const result = await login({ username: 'guest', password: 'guest' }).unwrap();
      dispatch(setCredentials({ token: result.access_token, user: result.user }));
      message.success('以游客身份登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error('游客登录失败');
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">用户登录</h2>
      
      {backendStatus === 'unavailable' && (
        <Alert
          message="后端服务未启动"
          description="检测到后端服务未启动，您可以以游客身份浏览系统，但部分功能将不可用。"
          type="warning"
          showIcon
          className="mb-4"
        />
      )}
      
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        size="large"
        className="max-w-md mx-auto"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="用户名" />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            登录
          </Button>
        </Form.Item>
        
        <Divider>或</Divider>
        
        <Button 
          type="default" 
          onClick={handleGuestLogin} 
          block
          className="mt-2"
        >
          以游客身份浏览
        </Button>
      </Form>
    </div>
  );
};

export default LoginPage;
