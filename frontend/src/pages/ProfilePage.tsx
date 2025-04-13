import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, Avatar, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { useGetCurrentUserQuery, useUpdateUserMutation } from '../services/api';

const { TabPane } = Tabs;

const ProfilePage: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser);
  const { data: user, isLoading, refetch } = useGetCurrentUserQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  
  const handleUpdateProfile = async (values: any) => {
    try {
      await updateUser({
        id: currentUser?.id,
        ...values
      }).unwrap();
      
      message.success('个人信息更新成功');
      refetch();
    } catch (error) {
      message.error('更新个人信息失败');
    }
  };
  
  const handleUpdatePassword = async (values: any) => {
    try {
      await updateUser({
        id: currentUser?.id,
        password: values.password
      }).unwrap();
      
      message.success('密码更新成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('更新密码失败');
    }
  };
  
  if (isLoading) {
    return <Spin size="large" className="flex justify-center items-center h-full" />;
  }
  
  return (
    <div className="profile-page p-4">
      <h1 className="text-2xl font-bold mb-6">个人信息</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：用户信息卡片 */}
        <Card className="text-center">
          <Avatar size={80} icon={<UserOutlined />} className="mb-4" />
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-gray-500">{
            {
              'admin': '管理员',
              'day_shift': '白班人员',
              'night_shift': '夜班人员',
            }[user?.role] || user?.role
          }</p>
          
          {user?.is_trainee && (
            <div className="mt-4">
              <p className="text-blue-500 font-bold">新人</p>
              {user?.mentor_id && (
                <p>师傅：{user?.mentor?.name || '未知'}</p>
              )}
              {user?.trainee_end_date && (
                <p>培训结束日期：{new Date(user.trainee_end_date).toLocaleDateString()}</p>
              )}
            </div>
          )}
        </Card>
        
        {/* 右侧：信息编辑表单 */}
        <div className="col-span-2">
          <Card>
            <Tabs defaultActiveKey="profile">
              <TabPane tab="基本信息" key="profile">
                <Form
                  form={profileForm}
                  layout="vertical"
                  initialValues={{
                    name: user?.name,
                    email: user?.email,
                    phone: user?.phone,
                  }}
                  onFinish={handleUpdateProfile}
                >
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input />
                  </Form.Item>
                  
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input />
                  </Form.Item>
                  
                  <Form.Item
                    name="phone"
                    label="电话"
                  >
                    <Input />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isUpdating}>
                      更新信息
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
              
              <TabPane tab="修改密码" key="password">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleUpdatePassword}
                >
                  <Form.Item
                    name="password"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码长度不能少于6个字符' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>
                  
                  <Form.Item
                    name="confirm"
                    label="确认密码"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isUpdating}>
                      更新密码
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
