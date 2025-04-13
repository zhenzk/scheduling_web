// Modified SchedulePage with backend status handling and guest mode restrictions
import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, Form, Select, DatePicker, Button, message, Alert } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useGetShiftsQuery, useGetUsersQuery, useCreateShiftMutation, useAssignScheduleMutation, checkBackendAvailability } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const { Option } = Select;

const SchedulePage: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'assign'>('create');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [form] = Form.useForm();
  
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
  }, []);
  
  // 获取数据
  const { data: shifts = [] } = useGetShiftsQuery({});
  const { data: users = [] } = useGetUsersQuery({});
  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [assignSchedule, { isLoading: isAssigning }] = useAssignScheduleMutation();
  
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
  
  // 日期选择处理
  const handleDateSelect = (date: Dayjs) => {
    if (currentUser?.role === 'guest') {
      message.info('游客模式下无法创建或分配班次');
      return;
    }
    
    if (!backendAvailable) {
      message.error('后端服务未启动，无法创建或分配班次');
      return;
    }
    
    const formattedDate = date.format('YYYY-MM-DD');
    setSelectedDate(formattedDate);
    setModalType('create');
    form.setFieldsValue({ date: date });
    setIsModalVisible(true);
  };
  
  // 创建班次
  const handleCreateShift = async (values: any) => {
    if (currentUser?.role === 'guest' || !backendAvailable) {
      message.error('无法执行此操作');
      return;
    }
    
    try {
      const shiftData = {
        date: values.date.format('YYYY-MM-DD'),
        shift_type_id: values.shift_type_id,
        is_holiday: values.is_holiday,
        required_staff_count: values.required_staff_count,
        notes: values.notes || '',
      };
      
      await createShift(shiftData).unwrap();
      message.success('班次创建成功');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      if (error?.data?.detail) {
        message.error(error.data.detail);
      } else {
        message.error('创建班次失败');
      }
    }
  };
  
  // 分配班次
  const handleAssignSchedule = async (values: any) => {
    if (currentUser?.role === 'guest' || !backendAvailable) {
      message.error('无法执行此操作');
      return;
    }
    
    try {
      const assignmentData = {
        shift_id: values.shift_id,
        user_id: values.user_id,
      };
      
      await assignSchedule(assignmentData).unwrap();
      message.success('班次分配成功');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      if (error?.data?.detail) {
        message.error(error.data.detail);
      } else {
        message.error('分配班次失败');
      }
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">排班日历</h2>
      
      {backendAvailable === false && (
        <Alert
          message="后端服务未启动"
          description={
            currentUser?.role === 'guest' 
              ? "您正在以游客身份浏览系统，使用的是模拟数据。创建和分配班次功能不可用。"
              : "检测到后端服务未启动，系统正在使用模拟数据。如需完整功能，请启动后端服务。"
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}
      
      <div className="mb-4">
        <Button 
          type="primary" 
          onClick={() => {
            if (currentUser?.role === 'guest' || !backendAvailable) {
              message.info('游客模式或后端未连接时无法创建班次');
              return;
            }
            setModalType('create');
            form.resetFields();
            form.setFieldsValue({ date: dayjs() });
            setIsModalVisible(true);
          }}
          disabled={currentUser?.role === 'guest' || !backendAvailable}
        >
          创建班次
        </Button>
        <Button 
          className="ml-2" 
          onClick={() => {
            if (currentUser?.role === 'guest' || !backendAvailable) {
              message.info('游客模式或后端未连接时无法分配班次');
              return;
            }
            setModalType('assign');
            form.resetFields();
            setIsModalVisible(true);
          }}
          disabled={currentUser?.role === 'guest' || !backendAvailable}
        >
          分配班次
        </Button>
      </div>
      
      <Calendar 
        dateCellRender={dateCellRender} 
        onSelect={handleDateSelect}
      />
      
      {/* 创建/分配班次模态框 */}
      <Modal
        title={modalType === 'create' ? '创建班次' : '分配班次'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={modalType === 'create' ? handleCreateShift : handleAssignSchedule}
        >
          {modalType === 'create' ? (
            <>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="shift_type_id"
                label="班次类型"
                rules={[{ required: true, message: '请选择班次类型' }]}
              >
                <Select placeholder="选择班次类型">
                  <Option value={1}>早班 (08:00-16:00)</Option>
                  <Option value={2}>晚班 (16:00-00:00)</Option>
                  <Option value={3}>夜班 (00:00-08:00)</Option>
                  <Option value={4}>全天班 (08:00-08:00)</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="is_holiday"
                label="是否假期"
                initialValue={false}
              >
                <Select>
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="required_staff_count"
                label="所需人数"
                initialValue={2}
                rules={[{ required: true, message: '请输入所需人数' }]}
              >
                <Select>
                  {[1, 2, 3, 4, 5].map(num => (
                    <Option key={num} value={num}>{num}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="notes"
                label="备注"
              >
                <Select placeholder="选择备注类型">
                  <Option value="">无</Option>
                  <Option value="周末班次">周末班次</Option>
                  <Option value="节假日班次">节假日班次</Option>
                  <Option value="特殊班次">特殊班次</Option>
                </Select>
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="shift_id"
                label="班次"
                rules={[{ required: true, message: '请选择班次' }]}
              >
                <Select placeholder="选择班次">
                  {shifts.map(shift => (
                    <Option key={shift.id} value={shift.id}>
                      {`${shift.date} - 班次 #${shift.id}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="user_id"
                label="用户"
                rules={[{ required: true, message: '请选择用户' }]}
              >
                <Select placeholder="选择用户">
                  {users
                    .filter(user => user.is_active)
                    .map(user => (
                      <Option key={user.id} value={user.id}>
                        {`${user.full_name} (${user.role === 'admin' ? '管理员' : user.shift_type === 'day' ? '白班' : '夜班'})`}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </>
          )}
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={modalType === 'create' ? isCreating : isAssigning}>
              提交
            </Button>
            <Button className="ml-2" onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchedulePage;
