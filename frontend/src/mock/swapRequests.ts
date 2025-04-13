// Mock data for swap requests
import { addDays, format } from 'date-fns';
import { shifts } from './shifts';

// Helper function to generate dates
const getDate = (daysFromNow: number) => {
  const date = addDays(new Date(), daysFromNow);
  return format(date, "yyyy-MM-dd");
};

// Define swap request statuses
export const swapRequestStatuses = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  APPROVED: "approved",
  DENIED: "denied"
};

// Generate swap requests
export const swapRequests = [
  {
    id: 1,
    requester_id: 2, // day_shift_1
    requester_shift_id: shifts.find(s => s.date === getDate(2) && s.shift_type_id === 1)?.id,
    responder_id: 3, // day_shift_2
    responder_shift_id: shifts.find(s => s.date === getDate(3) && s.shift_type_id === 1)?.id,
    status: swapRequestStatuses.PENDING,
    reason: "个人事务需要调班",
    response_message: null,
    admin_comment: null,
    created_at: "2025-04-10T10:00:00",
    updated_at: "2025-04-10T10:00:00"
  },
  {
    id: 2,
    requester_id: 4, // night_shift_1
    requester_shift_id: shifts.find(s => s.date === getDate(1) && s.shift_type_id === 3)?.id,
    responder_id: 5, // night_shift_2
    responder_shift_id: shifts.find(s => s.date === getDate(2) && s.shift_type_id === 3)?.id,
    status: swapRequestStatuses.ACCEPTED,
    reason: "家庭原因需要调班",
    response_message: "同意调班",
    admin_comment: "已批准",
    created_at: "2025-04-09T15:30:00",
    updated_at: "2025-04-09T18:45:00"
  },
  {
    id: 3,
    requester_id: 3, // day_shift_2
    requester_shift_id: shifts.find(s => s.date === getDate(5) && s.shift_type_id === 1)?.id,
    responder_id: 2, // day_shift_1
    responder_shift_id: shifts.find(s => s.date === getDate(6) && s.shift_type_id === 1)?.id,
    status: swapRequestStatuses.REJECTED,
    reason: "医院预约需要调班",
    response_message: "抱歉，当天有重要会议无法调班",
    admin_comment: null,
    created_at: "2025-04-08T09:15:00",
    updated_at: "2025-04-08T11:20:00"
  },
  {
    id: 4,
    requester_id: 5, // night_shift_2
    requester_shift_id: shifts.find(s => s.date === getDate(4) && s.shift_type_id === 3)?.id,
    responder_id: 4, // night_shift_1
    responder_shift_id: shifts.find(s => s.date === getDate(5) && s.shift_type_id === 3)?.id,
    status: swapRequestStatuses.APPROVED,
    reason: "个人事务需要调班",
    response_message: "可以调班",
    admin_comment: "已批准调班申请",
    created_at: "2025-04-07T20:00:00",
    updated_at: "2025-04-08T10:30:00"
  },
  {
    id: 5,
    requester_id: 6, // trainee_1
    requester_shift_id: shifts.find(s => s.date === getDate(0) && s.shift_type_id === 1)?.id,
    responder_id: 2, // day_shift_1 (mentor)
    responder_shift_id: shifts.find(s => s.date === getDate(0) && s.shift_type_id === 1)?.id,
    status: swapRequestStatuses.DENIED,
    reason: "需要请假",
    response_message: "同意",
    admin_comment: "新人不能独自值班，拒绝申请",
    created_at: "2025-04-12T08:00:00",
    updated_at: "2025-04-12T10:15:00"
  }
];

// Get user swap requests by user ID
export const getUserSwapRequests = (userId: number) => {
  return swapRequests.filter(
    request => request.requester_id === userId || request.responder_id === userId
  );
};
