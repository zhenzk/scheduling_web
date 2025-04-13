// Mock data for users
export const users = [
  {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    full_name: "管理员",
    role: "admin",
    shift_type: null,
    is_active: true,
    created_at: "2025-01-01T00:00:00",
    mentor_id: null
  },
  {
    id: 2,
    username: "day_shift_1",
    email: "day1@example.com",
    full_name: "白班员工1",
    role: "staff",
    shift_type: "day",
    is_active: true,
    created_at: "2025-01-02T00:00:00",
    mentor_id: null
  },
  {
    id: 3,
    username: "day_shift_2",
    email: "day2@example.com",
    full_name: "白班员工2",
    role: "staff",
    shift_type: "day",
    is_active: true,
    created_at: "2025-01-03T00:00:00",
    mentor_id: null
  },
  {
    id: 4,
    username: "night_shift_1",
    email: "night1@example.com",
    full_name: "夜班员工1",
    role: "staff",
    shift_type: "night",
    is_active: true,
    created_at: "2025-01-04T00:00:00",
    mentor_id: null
  },
  {
    id: 5,
    username: "night_shift_2",
    email: "night2@example.com",
    full_name: "夜班员工2",
    role: "staff",
    shift_type: "night",
    is_active: true,
    created_at: "2025-01-05T00:00:00",
    mentor_id: null
  },
  {
    id: 6,
    username: "trainee_1",
    email: "trainee1@example.com",
    full_name: "新人1",
    role: "trainee",
    shift_type: "day",
    is_active: true,
    created_at: "2025-02-01T00:00:00",
    mentor_id: 2
  },
  {
    id: 7,
    username: "trainee_2",
    email: "trainee2@example.com",
    full_name: "新人2",
    role: "trainee",
    shift_type: "night",
    is_active: true,
    created_at: "2025-02-02T00:00:00",
    mentor_id: 4
  },
  {
    id: 8,
    username: "guest",
    email: "guest@example.com",
    full_name: "游客用户",
    role: "guest",
    shift_type: null,
    is_active: true,
    created_at: "2025-04-13T00:00:00",
    mentor_id: null
  }
];

// Mock data for current user (guest)
export const currentUser = {
  id: 8,
  username: "guest",
  email: "guest@example.com",
  full_name: "游客用户",
  role: "guest",
  shift_type: null,
  is_active: true,
  created_at: "2025-04-13T00:00:00",
  mentor_id: null
};

// Mock data for trainees
export const trainees = users.filter(user => user.role === "trainee");

// Mock data for mentors
export const mentors = users.filter(user => user.role === "staff");
