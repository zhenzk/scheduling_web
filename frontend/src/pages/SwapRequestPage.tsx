// Modified SwapRequestPage with backend status handling and guest mode restrictions
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, Tag, message, Alert } from 'antd';
import { 
  useGetSwapRequestsQuery, 
  useGetShiftsQuery, 
  useGetUsersQuery, 
  useCreateSwapRequestMutation, 
  useRespondToSwapRequestMutation, 
  useApproveSwapRequestMutation,
  checkBackendAvailability
} from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const { Option } = Select;
const { TextArea } = Input;

const SwapRequestPage: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'respond' | 'approve'>('create');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
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
  const { data: swapRequests = [] } = useGetSwapRequestsQuery({});
  const { data: shifts = [] } = useGetShiftsQuery({});
  const { data: users = [] } = useGetUsersQuery({});
  const [createSwapRequest, { isLoading: isCreating }] = useCreateSwapRequestMutation();
  const [respondToSwapRequest, { isLoading: isResponding }] = useRespondToSwapRequestMutation();
  const [approveSwapRequest, { isLoading: isApproving }] = useApproveSwapRequestMutation();
  
  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="blue">待处理</Tag>;
      case 'accepted':
        return <Tag color="green">已接受</Tag>;
      case 'rejected':
        return <Tag color="red">已拒绝</Tag>;
      case 'approved':
        return <Tag color="green">已批准</Tag>;
      case 'denied':
        return <Tag color="red">已驳回</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };
  
  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '申请人',
      dataIndex: 'requester_id',
      key: 'requester_id',
      render: (id: number) => {
        const user = users.find(u => u.id === id);
        return user ? user.full_name : id;
      },
    },
    {
      title: '申请班次',
      dataIndex: 'requester_shift_id',
      key: 'requester_shift_id',
      render: (id: number) => {
        const shift = shifts.find(s => s.id === id);
        return shift ? `${shift.date} 班次#${id}` : id;
      },
    },
    {
      title: '响应人',
      dataIndex: 'responder_id',
      key: 'responder_id',
      render: (id: number) => {
        const user = users.find(u => u.id === id);
        return user ? user.full_name : id;
      },
    },
    {
      title: '响应班次',
      dataIndex: 'responder_shift_id',
      key: 'responder_shift_id',
      render: (id: number) => {
        const shift = shifts.find(s => s.id === id);
        return shift ? `${shift.date} 班次#${id}` : id;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => {
        // 游客模式或后端未连接时禁用操作
        if (currentUser?.role === 'guest' || !backendAvailable) {
          return <span className="text-gray-400">无法操作</span>;
        }
        
        // 根据当前用户角色和申请状态显示不同操作
        if (currentUser?.role === 'admin' && record.status === 'accepted') {
          return (
            <Button 
              type="link" 
              onClick={() => {
                setSelectedRequest(record);
                setModalType('approve');
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              审批
            </Button>
          );
        }
        
        if (record.responder_id === currentUser?.id && record.status === 'pending') {
          return (
            <Button 
              type="link" 
              onClick={() => {
                setSelectedRequest(record);
                setModalType('respond');
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              回应
            </Button>
          );
        }
        
        return null;
      },
    },
  ];
  
  // 创建调班申请
  const handleCreateSwapRequest = async (values: any) => {
    if (currentUser?.role === 'guest' || !backendAvailable) {
      message.error('无法执行此操作');
      return;
    }
    
    try {
      const requestData = {
        requester_id: currentUser?.id,
        requester_shift_id: values.requester_shift_id,
        responder_id: values.responder_id,
        responder_shift_id: values.responder_shift_id,
        reason: values.reason,
      };
      
      await createSwapRequest(requestData).unwrap();
      message.success('调班申请创建成功');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      if (error?.data?.detail) {
        message.error(error.data.detail);
      } else {
        message.error('创建调班申请失败');
      }
    }
  };
  
  // 回应调班申请
  const handleRespondToSwapRequest = async (values: any) => {
    if (currentUser?.role === 'guest' || !backendAvailable) {
      message.error('无法执行此操作');
      return;
    }
    
    try {
      const responseData = {
        id: selectedRequest.id,
        response: {
          accepted: values.accepted,
          message: values.response_message,
        },
      };
      
      await respondToSwapRequest(responseData).unwrap();
      message.success('已回应调班申请');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      if (error?.data?.detail) {
        message.error(error.data.detail);
      } else {
        message.error('回应调班申请失败');
      }
    }
  };
  
  // 审批调班申请
  const handleApproveSwapRequest = async (values: any) => {
    if (currentUser?.role === 'guest' || !backendAvailable) {
      message.error('无法执行此操作');
      return;
    }
    
    try {
      const approvalData = {
        id: selectedRequest.id,
        approval: values.approval,
        comment: values.comment,
      };
      
      await approveSwapRequest(approvalData).unwrap();
      message.success('已审批调班申请');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      if (error?.data?.detail) {
        message.error(error.data.detail);
      } else {
        message.error('审批调班申请失败');
      }
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">调班申请</h2>
      
      {backendAvailable === false && (
        <Alert
          message="后端服务未启动"
          description={
            currentUser?.role === 'guest' 
              ? "您正在以游客身份浏览系统，使用的是模拟数据。创建和处理调班申请功能不可用。"
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
              message.info('游客模式或后端未连接时无法创建调班申请');
              return;
            }
            setModalType('create');
            form.resetFields();
            setIsModalVisible(true);
          }}
          disabled={currentUser?.role === 'guest' || !backendAvailable}
        >
          创建调班申请
        </Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={swapRequests} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
      
      {/* 创建/回应/审批调班申请模态框 */}
      <Modal
        title={
          modalType === 'create' 
            ? '创建调班申请' 
            : modalType === 'respond' 
              ? '回应调班申请' 
              : '审批调班申请'
        }
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={
            modalType === 'create' 
              ? handleCreateSwapRequest 
              : modalType === 'respond' 
                ? handleRespondToSwapRequest 
                : handleApproveSwapRequest
          }
        >
          {modalType === 'create' ? (
            <>
              <Form.Item
                name="requester_shift_id"
                label="您的班次"
                rules={[{ required: true, message: '请选择您的班次' }]}
              >
                <Select placeholder="选择您的班次">
                  {shifts.map(shift => (
                    <Option key={shift.id} value={shift.id}>
                      {`${shift.date} - 班次 #${shift.id}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="responder_id"
                label="调班对象"
                rules={[{ required: true, message: '请选择调班对象' }]}
              >
                <Select placeholder="选择调班对象">
                  {users
                    .filter(user => user.is_active && user.id !== currentUser?.id)
                    .map(user => (
                      <Option key={user.id} value={user.id}>
                        {`${user.full_name} (${user.role === 'admin' ? '管理员' : user.shift_type === 'day' ? '白班' : '夜班'})`}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="responder_shift_id"
                label="对方班次"
                rules={[{ required: true, message: '请选择对方班次' }]}
              >
                <Select placeholder="选择对方班次">
                  {shifts.map(shift => (
                    <Option key={shift.id} value={shift.id}>
                      {`${shift.date} - 班次 #${shift.id}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="reason"
                label="申请原因"
                rules={[{ required: true, message: '请输入申请原因' }]}
              >
                <TextArea rows={4} placeholder="请输入申请原因" />
              </Form.Item>
            </>
          ) : modalType === 'respond' ? (
            <>
              <Form.Item
                name="accepted"
                label="是否接受调班申请"
                rules={[{ required: true, message: '请选择是否接受' }]}
              >
                <Select placeholder="选择是否接受">
                  <Option value={true}>接受</Option>
                  <Option value={false}>拒绝</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="response_message"
                label="回应消息"
              >
                <TextArea rows={4} placeholder="请输入回应消息" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="approval"
                label="是否批准调班申请"
                rules={[{ required: true, message: '请选择是否批准' }]}
              >
                <Select placeholder="选择是否批准">
                  <Option value={true}>批准</Option>
                  <Option value={false}>驳回</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="comment"
                label="审批意见"
              >
                <TextArea rows={4} placeholder="请输入审批意见" />
              </Form.Item>
            </>
          )}
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={
                modalType === 'create' 
                  ? isCreating 
                  : modalType === 'respond' 
                    ? isResponding 
                    : isApproving
              }
            >
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

export default SwapRequestPage;
