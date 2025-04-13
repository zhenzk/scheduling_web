// Add React import to fix the error
import React from 'react';
import { Alert } from 'antd';
import { checkBackendAvailability } from '../services/api';

// 创建一个自定义Hook来检查后端状态
export const useBackendStatus = () => {
  const [status, setStatus] = React.useState<'checking' | 'available' | 'unavailable'>('checking');
  
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const isAvailable = await checkBackendAvailability();
        setStatus(isAvailable ? 'available' : 'unavailable');
      } catch (error) {
        setStatus('unavailable');
      }
    };
    
    checkStatus();
    // 每60秒检查一次后端状态
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return status;
};

// 创建一个组件来显示后端状态警告
export const BackendStatusAlert = ({ currentUser }: { currentUser: any }) => {
  const backendStatus = useBackendStatus();
  
  if (backendStatus !== 'unavailable') {
    return null;
  }
  
  return (
    <Alert
      message="后端服务未启动"
      description={
        currentUser?.role === 'guest' 
          ? "您正在以游客身份浏览系统，使用的是模拟数据。创建、更新和删除等操作功能不可用。"
          : "检测到后端服务未启动，系统正在使用模拟数据。如需完整功能，请启动后端服务。"
      }
      type="warning"
      showIcon
      className="mb-4"
    />
  );
};
