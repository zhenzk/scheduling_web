// Modified API service with mock data support for guest mode
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import * as mockData from '../mock';

// 定义API基础URL
const baseUrl = 'http://localhost:8000/api/v1';

// 创建一个函数来检查后端服务是否可用
export const checkBackendAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl}/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Short timeout to quickly determine if backend is available
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    console.log('Backend service unavailable:', error);
    return false;
  }
};

// 创建API服务
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      // 从状态中获取token
      const token = (getState() as RootState).auth.token;
      
      // 如果有token，添加到请求头
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: ['Users', 'Shifts', 'SwapRequests', 'Notifications', 'Settings'],
  endpoints: (builder) => ({
    // 认证相关API
    login: builder.mutation({
      queryFn: async (credentials, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        // 如果后端不可用，且用户尝试以游客身份登录
        if (!isBackendAvailable && 
            (credentials.username === 'guest' || credentials.username === '游客')) {
          // 模拟延迟，使体验更真实
          await mockData.simulateDelay(500);
          return { data: mockData.mockLoginResponse };
        }
        
        // 如果后端不可用，且用户尝试以其他身份登录
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，请启动后端服务或以游客身份登录' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        try {
          const result = await baseQuery({
            url: '/auth/login',
            method: 'POST',
            body: credentials,
          });
          return result;
        } catch (error) {
          return {
            error: {
              status: 500,
              data: { detail: '登录请求失败' }
            }
          };
        }
      }
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    
    // 用户相关API
    getUsers: builder.query({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.users };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery('/users');
      },
      providesTags: ['Users'],
    }),
    getUserById: builder.query({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          const user = mockData.users.find(u => u.id === id);
          return user ? { data: user } : { error: { status: 404, data: { detail: '用户不存在' } } };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery(`/users/${id}`);
      },
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    getCurrentUser: builder.query({
      queryFn: async (_arg, { getState }, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.currentUser };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery('/users/me');
      },
      providesTags: ['Users'],
    }),
    createUser: builder.mutation({
      queryFn: async (user, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法创建用户' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/users',
          method: 'POST',
          body: user,
        });
      },
      invalidatesTags: ['Users'],
    }),
    updateUser: builder.mutation({
      queryFn: async ({ id, ...patch }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法更新用户' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/users/${id}`,
          method: 'PUT',
          body: patch,
        });
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Users', id }],
    }),
    deleteUser: builder.mutation({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法删除用户' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/users/${id}`,
          method: 'DELETE',
        });
      },
      invalidatesTags: ['Users'],
    }),
    activateUser: builder.mutation({
      queryFn: async ({ id, is_active }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法激活/停用用户' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/users/${id}/activate`,
          method: 'PATCH',
          body: { is_active },
        });
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Users', id }],
    }),
    getTrainees: builder.query({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.trainees };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery('/users/trainees');
      },
      providesTags: ['Users'],
    }),
    getMentors: builder.query({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.mentors };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery('/users/mentors');
      },
      providesTags: ['Users'],
    }),
    assignMentor: builder.mutation({
      queryFn: async ({ trainee_id, mentor_id }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法分配导师' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/users/${trainee_id}/assign-mentor/${mentor_id}`,
          method: 'POST',
        });
      },
      invalidatesTags: ['Users'],
    }),
    
    // 班次相关API
    getShifts: builder.query({
      queryFn: async (params, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.shifts };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/shifts',
          params,
        });
      },
      providesTags: ['Shifts'],
    }),
    getShiftById: builder.query({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          const shift = mockData.shifts.find(s => s.id === id);
          return shift ? { data: shift } : { error: { status: 404, data: { detail: '班次不存在' } } };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery(`/shifts/${id}`);
      },
      providesTags: (result, error, id) => [{ type: 'Shifts', id }],
    }),
    createShift: builder.mutation({
      queryFn: async (shift, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法创建班次' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/shifts',
          method: 'POST',
          body: shift,
        });
      },
      invalidatesTags: ['Shifts'],
    }),
    updateShift: builder.mutation({
      queryFn: async ({ id, ...patch }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法更新班次' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/shifts/${id}`,
          method: 'PUT',
          body: patch,
        });
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Shifts', id }],
    }),
    deleteShift: builder.mutation({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法删除班次' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/shifts/${id}`,
          method: 'DELETE',
        });
      },
      invalidatesTags: ['Shifts'],
    }),
    getSchedules: builder.query({
      queryFn: async (params, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.getSchedulesWithDetails() };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/shifts/schedules',
          params,
        });
      },
      providesTags: ['Shifts'],
    }),
    generateSchedule: builder.mutation({
      queryFn: async (params, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法生成排班表' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/shifts/schedules/generate',
          method: 'POST',
          params,
        });
      },
      invalidatesTags: ['Shifts'],
    }),
    getUserSchedule: builder.query({
      queryFn: async ({ user_id, ...params }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.getUserSchedule(user_id) };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/shifts/schedules/user/${user_id}`,
          params,
        });
      },
      providesTags: (result, error, { user_id }) => [{ type: 'Shifts', id: `user-${user_id}` }],
    }),
    assignSchedule: builder.mutation({
      queryFn: async (assignment, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法分配排班' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/shifts/schedules/assign',
          method: 'POST',
          body: assignment,
        });
      },
      invalidatesTags: ['Shifts'],
    }),
    deleteScheduleAssignment: builder.mutation({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法删除排班分配' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/shifts/schedules/${id}`,
          method: 'DELETE',
        });
      },
      invalidatesTags: ['Shifts'],
    }),
    
    // 调班申请相关API
    getSwapRequests: builder.query({
      queryFn: async (params, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.swapRequests };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/swap-requests',
          params,
        });
      },
      providesTags: ['SwapRequests'],
    }),
    getSwapRequestById: builder.query({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          const request = mockData.swapRequests.find(r => r.id === id);
          return request ? { data: request } : { error: { status: 404, data: { detail: '调班申请不存在' } } };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery(`/swap-requests/${id}`);
      },
      providesTags: (result, error, id) => [{ type: 'SwapRequests', id }],
    }),
    createSwapRequest: builder.mutation({
      queryFn: async (request, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法创建调班申请' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/swap-requests',
          method: 'POST',
          body: request,
        });
      },
      invalidatesTags: ['SwapRequests'],
    }),
    respondToSwapRequest: builder.mutation({
      queryFn: async ({ id, response }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法回应调班申请' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/swap-requests/${id}/respond`,
          method: 'PATCH',
          body: { response },
        });
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'SwapRequests', id }],
    }),
    approveSwapRequest: builder.mutation({
      queryFn: async ({ id, approval, comment }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法审批调班申请' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/swap-requests/${id}/approve`,
          method: 'PATCH',
          body: { approval, comment },
        });
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'SwapRequests', id },
        'Shifts',
      ],
    }),
    getUserSwapRequests: builder.query({
      queryFn: async ({ user_id, ...params }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.getUserSwapRequests(user_id) };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/swap-requests/user/${user_id}`,
          params,
        });
      },
      providesTags: (result, error, { user_id }) => [{ type: 'SwapRequests', id: `user-${user_id}` }],
    }),
    
    // 通知相关API
    getNotifications: builder.query({
      queryFn: async (params, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.notifications.filter(n => n.user_id === 8) }; // 只返回游客用户的通知
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/notifications',
          params,
        });
      },
      providesTags: ['Notifications'],
    }),
    markNotificationAsRead: builder.mutation({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法标记通知为已读' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/notifications/${id}/read`,
          method: 'PATCH',
        });
      },
      invalidatesTags: (result, error, id) => [{ type: 'Notifications', id }],
    }),
    markAllNotificationsAsRead: builder.mutation({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法标记所有通知为已读' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: '/notifications/read-all',
          method: 'PATCH',
        });
      },
      invalidatesTags: ['Notifications'],
    }),
    
    // 系统设置相关API
    getSettings: builder.query({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          return { data: mockData.settings };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery('/settings');
      },
      providesTags: ['Settings'],
    }),
    getSettingByKey: builder.query({
      queryFn: async (key, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          // 使用模拟数据
          await mockData.simulateDelay();
          const setting = mockData.getSettingByKey(key);
          return setting ? { data: setting } : { error: { status: 404, data: { detail: '设置不存在' } } };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery(`/settings/${key}`);
      },
      providesTags: (result, error, key) => [{ type: 'Settings', id: key }],
    }),
    updateSetting: builder.mutation({
      queryFn: async ({ key, ...patch }, _api, _extraOptions, baseQuery) => {
        // 检查后端服务是否可用
        const isBackendAvailable = await checkBackendAvailability();
        
        if (!isBackendAvailable) {
          return {
            error: {
              status: 503,
              data: { detail: '后端服务不可用，无法更新设置' }
            }
          };
        }
        
        // 如果后端可用，正常发送请求
        return baseQuery({
          url: `/settings/${key}`,
          method: 'PUT',
          body: patch,
        });
      },
      invalidatesTags: (result, error, { key }) => [{ type: 'Settings', id: key }],
    }),
    
    // 健康检查API
    checkHealth: builder.query({
      query: () => '/health',
      keepUnusedDataFor: 5, // 只保留5秒，以便频繁刷新
    }),
  }),
});

// 导出生成的hooks
export const {
  // 认证相关
  useLoginMutation,
  useRefreshTokenMutation,
  
  // 用户相关
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetCurrentUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useActivateUserMutation,
  useGetTraineesQuery,
  useGetMentorsQuery,
  useAssignMentorMutation,
  
  // 班次相关
  useGetShiftsQuery,
  useGetShiftByIdQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useGetSchedulesQuery,
  useGenerateScheduleMutation,
  useGetUserScheduleQuery,
  useAssignScheduleMutation,
  useDeleteScheduleAssignmentMutation,
  
  // 调班申请相关
  useGetSwapRequestsQuery,
  useGetSwapRequestByIdQuery,
  useCreateSwapRequestMutation,
  useRespondToSwapRequestMutation,
  useApproveSwapRequestMutation,
  useGetUserSwapRequestsQuery,
  
  // 通知相关
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  
  // 系统设置相关
  useGetSettingsQuery,
  useGetSettingByKeyQuery,
  useUpdateSettingMutation,
  
  // 健康检查
  useCheckHealthQuery,
} = api;
