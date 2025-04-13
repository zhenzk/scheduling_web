import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import { useGetSettingsQuery, useUpdateSettingMutation } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const SettingsPage: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser);
  const { data: settings, isLoading, refetch } = useGetSettingsQuery();
  const [updateSetting, { isLoading: isUpdating }] = useUpdateSettingMutation();
  
  const [form] = Form.useForm();
  
  // 只有管理员可以访问此页面
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-4">
        <Card>
          <div className="text-center p-6">
            <h2 className="text-xl font-bold mb-2">权限不足</h2>
            <p>只有管理员可以访问系统设置页面</p>
          </div>
        </Card>
      </div>
    );
  }
  
  const handleUpdateSetting = async (key: string, value: string, description: string) => {
    try {
      await updateSetting({
        key,
        value,
        description
      }).unwrap();
      
      message.success('设置更新成功');
      refetch();
    } catch (error) {
      message.error('更新设置失败');
    }
  };
  
  if (isLoading) {
    return <Spin size="large" className="flex justify-center items-center h-full" />;
  }
  
  return (
    <div className="settings-page p-4">
      <h1 className="text-2xl font-bold mb-6">系统设置</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 排班规则设置 */}
        <Card title="排班规则设置" className="mb-6">
          <Form layout="vertical">
            <Form.Item label="每月最大调班次数">
              <div className="flex">
                <Input 
                  defaultValue={settings?.find((s: any) => s.key === 'max_swap_requests_per_month')?.value || '3'}
                  type="number"
                  min={1}
                  max={10}
                />
                <Button 
                  type="primary" 
                  className="ml-2"
                  onClick={() => {
                    const value = form.getFieldValue('max_swap_requests_per_month');
                    handleUpdateSetting(
                      'max_swap_requests_per_month',
                      value,
                      '每月最大调班次数'
                    );
                  }}
                >
                  保存
                </Button>
              </div>
            </Form.Item>
            
            <Form.Item label="新人培训期限（天）">
              <div className="flex">
                <Input 
                  defaultValue={settings?.find((s: any) => s.key === 'trainee_period_days')?.value || '90'}
                  type="number"
                  min={1}
                />
                <Button 
                  type="primary" 
                  className="ml-2"
                  onClick={() => {
                    const value = form.getFieldValue('trainee_period_days');
                    handleUpdateSetting(
                      'trainee_period_days',
                      value,
                      '新人培训期限（天）'
                    );
                  }}
                >
                  保存
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
        
        {/* 通知设置 */}
        <Card title="通知设置" className="mb-6">
          <Form layout="vertical">
            <Form.Item label="是否启用邮件通知">
              <div className="flex">
                <select
                  className="w-full border rounded p-2"
                  defaultValue={settings?.find((s: any) => s.key === 'enable_email_notifications')?.value || 'false'}
                >
                  <option value="true">启用</option>
                  <option value="false">禁用</option>
                </select>
                <Button 
                  type="primary" 
                  className="ml-2"
                  onClick={() => {
                    const value = form.getFieldValue('enable_email_notifications');
                    handleUpdateSetting(
                      'enable_email_notifications',
                      value,
                      '是否启用邮件通知'
                    );
                  }}
                >
                  保存
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
        
        {/* 系统信息 */}
        <Card title="系统信息" className="mb-6">
          <p><strong>系统版本：</strong> 1.0.0</p>
          <p><strong>最后更新：</strong> {new Date().toLocaleDateString()}</p>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
