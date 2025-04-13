// Index file for all mock data
import { users, currentUser, trainees, mentors } from './users';
import { shifts, shiftTypes, schedules, getUserSchedule, getSchedulesWithDetails } from './shifts';
import { swapRequests, swapRequestStatuses, getUserSwapRequests } from './swapRequests';
import { notifications, notificationTypes, getUserNotifications } from './notifications';
import { settings, getSettingByKey } from './settings';

// Export all mock data
export {
  // Users
  users,
  currentUser,
  trainees,
  mentors,
  
  // Shifts and Schedules
  shifts,
  shiftTypes,
  schedules,
  getUserSchedule,
  getSchedulesWithDetails,
  
  // Swap Requests
  swapRequests,
  swapRequestStatuses,
  getUserSwapRequests,
  
  // Notifications
  notifications,
  notificationTypes,
  getUserNotifications,
  
  // Settings
  settings,
  getSettingByKey
};

// Mock login response
export const mockLoginResponse = {
  access_token: "mock_access_token_for_guest_user",
  token_type: "bearer",
  user: currentUser
};

// Helper function to simulate API delay
export const simulateDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));
