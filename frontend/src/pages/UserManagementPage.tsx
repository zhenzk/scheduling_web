import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Space, Tag, Spin } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation, useActivateUserMutation } from '../services/api';
import moment from 'moment';

const { Option } = Select;

const UserManagementPage: React.FC = () => {
  const { data: users, isLoading, refetch } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [activateUser, { isLoading: isActivating }] = useActivateUserMutation();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [form] = Form.useForm();
  
  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => {
        const roleMap: {[key: string]: string} = {
          'admin': '管理员',
          'day_shift': '白班',
          'night_shift': '夜班',
        };
        return roleMap[text] || text;
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '激活' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '新人状态',
      key: 'trainee',
      render: (record: any) => (
        <>
          {record.is_trainee ? (
            <Tag color="blue">新人</Tag>
          ) : null}
          {record.mentor_id ? (
            <Tag color="purple">
              师傅: {users?.find(u => u.id === record.mentor_id)?.name || '未知'}
            </Tag>
          ) : null}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: any) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
          />
          <Button 
            icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />} 
            size="small" 
            onClick={() => handleToggleActive(record)}
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            size="small" 
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];
  
  const handleAdd = () => {
    setIsEditMode(false);
    setSelectedUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };
  
  const handleEdit = (user: any) => {
    setIsEditMode(true);
    setSelectedUser(user);
    
    // 预填充表单
    form.setFieldsValue({
      ...user,
      trainee_end_date: user.trainee_end_date ? moment(user.trainee_end_date) : undefined,
    });
    
    setIsModalVisible(true);
  };
  
  const handleDelete = async (user: any) => {
    try {
      await deleteUser(user.id).unwrap();
      message.success('用户删除成功');
      refetch();
    } catch (error) {
      message.error('删除用户失败');
    }
  };
  
  const handleToggleActive = async (user: any) => {
    try {
      await activateUser({ id: user.id, is_active: !user.is_active }).unwrap();
      message.success(`用户${user.is_active ? '禁用' : '激活'}成功`);
      refetch();
    } catch (error) {
      message.error(`${user.is_active ? '禁用' : '激活'}用户失败`);
    }
  };
  
  const handleSubmit = async (values: any) => {
    try {
      if (isEditMode && selectedUser) {
        // 更新用户
        await updateUser({
          id: selectedUser.id,
          ...values,
          trainee_end_date: values.trainee_end_date ? values.trainee_end_date.format('YYYY-MM-DD') : undefined,
        }).unwrap();
        message.success('用户更新成功');
      } else {
        // 创建用户
        await createUser({
          ...values,
          trainee_end_date: values.trainee_end_date ? values.trainee_end_date.format('YYYY-MM-DD') : undefined,
        }).unwrap();
        message.success('用户创建成功');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      refetch();
    } catch (error) {
      message.error(isEditMode ? '更新用户失败' : '创建用户失败');
    }
  };
  
  if (isLoading) {
    return <Spin size="large" className="flex justify-center items-center h-full" />;
  }
  
  return (
    <div className="user-management-page p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Button 
          type="primary" 
          icon={<UserAddOutlined />}
          onClick={handleAdd}
        >
          添加用户
        </Button>
      </div>
      
      <Table 
        dataSource={users} 
        columns={columns} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
      
      <Modal
        title={isEditMode ? '编辑用户' : '添加用户'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={isEditMode} />
          </Form.Item>
          
          {!isEditMode && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          
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
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="admin">管理员</Option>
              <Option value="day_shift">白班</Option>
              <Option value="night_shift">夜班</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="is_trainee"
            label="是否为新人"
            valuePropName="checked"
          >
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="mentor_id"
            label="师傅"
            dependencies={['is_trainee']}
          >
            <Select
              allowClear
              placeholder="请选择师傅"
              disabled={form.getFieldValue('is_trainee') !== true}
            >
              {users?.filter(u => !u.is_trainee).map(user => (
                <Option key={user.id} value={user.id}>{user.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="trainee_end_date"
            label="新人结束日期"
            dependencies={['is_trainee']}
          >
            <DatePicker 
              disabled={form.getFieldValue('is_trainee') !== true}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isCreating || isUpdating} 
              block
            >
              {isEditMode ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
