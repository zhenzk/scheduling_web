import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, List, Card, Empty, Spin, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation, useMarkAllNotificationsAsReadMutation } from '../services/api';
import moment from 'moment';

const NotificationsPage: React.FC = () => {
  const { data: notifications, isLoading, refetch } = useGetNotificationsQuery();
  const [markAsRead, { isLoading: isMarking }] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
      message.success('通知已标记为已读');
      refetch();
    } catch (error) {
      message.error('操作失败');
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      message.success('所有通知已标记为已读');
      refetch();
    } catch (error) {
      message.error('操作失败');
    }
  };
  
  if (isLoading) {
    return <Spin size="large" className="flex justify-center items-center h-full" />;
  }
  
  return (
    <div className="notifications-page p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">通知中心</h1>
        <Button 
          type="primary" 
          icon={<CheckOutlined />}
          onClick={handleMarkAllAsRead}
          loading={isMarkingAll}
          disabled={!notifications?.some(n => !n.is_read)}
        >
          全部标记为已读
        </Button>
      </div>
      
      {notifications?.length ? (
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                !item.is_read && (
                  <Button 
                    size="small" 
                    onClick={() => handleMarkAsRead(item.id)}
                    loading={isMarking}
                  >
                    标记为已读
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center">
                    {!item.is_read && <Badge status="processing" className="mr-2" />}
                    <span className={!item.is_read ? 'font-bold' : ''}>{item.title}</span>
                  </div>
                }
                description={
                  <div>
                    <p>{item.content}</p>
                    <p className="text-xs text-gray-500">{moment(item.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无通知" />
      )}
    </div>
  );
};

export default NotificationsPage;
