// Mock data for notifications
import { addHours, format } from 'date-fns';

// Helper function to generate dates
const getDateTime = (hoursAgo: number) => {
  const date = addHours(new Date(), -hoursAgo);
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

// Define notification types
export const notificationTypes = {
  SYSTEM: "system",
  SWAP_REQUEST: "swap_request",
  SCHEDULE_CHANGE: "schedule_change",
  ADMIN: "admin"
};

// Generate notifications
export const notifications = [
  {
    id: 1,
    user_id: 8, // guest user
    type: notificationTypes.SYSTEM,
    title: "欢迎使用排班系统",
    content: "您正在以游客身份浏览排班系统，部分功能将不可用。",
    is_read: false,
    created_at: getDateTime(0),
    related_id: null
  },
  {
    id: 2,
    user_id: 8, // guest user
    type: notificationTypes.SYSTEM,
    title: "后端服务未启动",
    content: "系统检测到后端服务未启动，当前正在使用模拟数据。如需完整功能，请启动后端服务。",
    is_read: false,
    created_at: getDateTime(0),
    related_id: null
  },
  {
    id: 3,
    user_id: 2, // day_shift_1
    type: notificationTypes.SWAP_REQUEST,
    title: "新的调班申请",
    content: "您收到来自白班员工2的调班申请，请查看并回复。",
    is_read: false,
    created_at: getDateTime(5),
    related_id: 1
  },
  {
    id: 4,
    user_id: 4, // night_shift_1
    type: notificationTypes.SWAP_REQUEST,
    title: "调班申请已接受",
    content: "您的调班申请已被夜班员工2接受，等待管理员审批。",
    is_read: true,
    created_at: getDateTime(10),
    related_id: 2
  },
  {
    id: 5,
    user_id: 3, // day_shift_2
    type: notificationTypes.SWAP_REQUEST,
    title: "调班申请被拒绝",
    content: "您的调班申请已被白班员工1拒绝。",
    is_read: true,
    created_at: getDateTime(24),
    related_id: 3
  },
  {
    id: 6,
    user_id: 5, // night_shift_2
    type: notificationTypes.SWAP_REQUEST,
    title: "调班申请已批准",
    content: "您的调班申请已被管理员批准，排班表已更新。",
    is_read: false,
    created_at: getDateTime(36),
    related_id: 4
  },
  {
    id: 7,
    user_id: 1, // admin
    type: notificationTypes.ADMIN,
    title: "系统更新通知",
    content: "排班系统将于今晚22:00-23:00进行维护更新，请提前安排工作。",
    is_read: false,
    created_at: getDateTime(2),
    related_id: null
  },
  {
    id: 8,
    user_id: 6, // trainee_1
    type: notificationTypes.SCHEDULE_CHANGE,
    title: "排班变更通知",
    content: "您的排班已更新，请查看最新排班表。",
    is_read: false,
    created_at: getDateTime(12),
    related_id: null
  }
];

// Get user notifications by user ID
export const getUserNotifications = (userId: number) => {
  return notifications.filter(notification => notification.user_id === userId);
};
