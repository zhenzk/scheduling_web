// Mock data for settings
export const settings = [
  {
    id: 1,
    key: "system_name",
    value: "排班管理系统",
    description: "系统名称",
    created_at: "2025-01-01T00:00:00",
    updated_at: "2025-01-01T00:00:00"
  },
  {
    id: 2,
    key: "company_name",
    value: "示例公司",
    description: "公司名称",
    created_at: "2025-01-01T00:00:00",
    updated_at: "2025-01-01T00:00:00"
  },
  {
    id: 3,
    key: "auto_schedule",
    value: "true",
    description: "是否启用自动排班",
    created_at: "2025-01-01T00:00:00",
    updated_at: "2025-01-01T00:00:00"
  },
  {
    id: 4,
    key: "max_consecutive_shifts",
    value: "5",
    description: "最大连续排班天数",
    created_at: "2025-01-01T00:00:00",
    updated_at: "2025-01-01T00:00:00"
  },
  {
    id: 5,
    key: "min_rest_hours",
    value: "12",
    description: "最小休息时间（小时）",
    created_at: "2025-01-01T00:00:00",
    updated_at: "2025-01-01T00:00:00"
  },
  {
    id: 6,
    key: "swap_request_approval_required",
    value: "true",
    description: "调班申请是否需要管理员审批",
    created_at: "2025-01-01T00:00:00",
    updated_at: "2025-01-01T00:00:00"
  },
  {
    id: 7,
    key: "trainee_solo_shift_allowed",
    value: "false",
    description: "新人是否允许独自值班",
    created_at: "2025-01-01T00:00:00",
    updated_at: "2025-01-01T00:00:00"
  },
  {
    id: 8,
    key: "notification_expiry_days",
    value: "30",
    description: "通知过期天数",
    created_at: "2025-01-01T00:00:00",
    updated_at: "2025-01-01T00:00:00"
  }
];

// Get setting by key
export const getSettingByKey = (key: string) => {
  return settings.find(setting => setting.key === key);
};
