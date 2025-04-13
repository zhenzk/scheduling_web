// Mock data for shifts
import { addDays, format } from 'date-fns';

// Helper function to generate dates
const getDate = (daysFromNow: number) => {
  const date = addDays(new Date(), daysFromNow);
  return format(date, "yyyy-MM-dd");
};

// Define shift types
export const shiftTypes = [
  {
    id: 1,
    name: "早班",
    start_time: "08:00:00",
    end_time: "16:00:00",
    color: "#1890ff"
  },
  {
    id: 2,
    name: "晚班",
    start_time: "16:00:00",
    end_time: "00:00:00",
    color: "#722ed1"
  },
  {
    id: 3,
    name: "夜班",
    start_time: "00:00:00",
    end_time: "08:00:00",
    color: "#eb2f96"
  },
  {
    id: 4,
    name: "全天班",
    start_time: "08:00:00",
    end_time: "08:00:00",
    color: "#fa8c16"
  }
];

// Generate shifts for the next 14 days
export const shifts = [];
for (let i = 0; i < 14; i++) {
  const date = getDate(i);
  const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
  
  // Add day shifts
  shifts.push({
    id: i * 4 + 1,
    date: date,
    shift_type_id: 1,
    is_holiday: isWeekend,
    required_staff_count: isWeekend ? 2 : 3,
    notes: isWeekend ? "周末班次" : ""
  });
  
  // Add evening shifts
  shifts.push({
    id: i * 4 + 2,
    date: date,
    shift_type_id: 2,
    is_holiday: isWeekend,
    required_staff_count: isWeekend ? 2 : 3,
    notes: isWeekend ? "周末班次" : ""
  });
  
  // Add night shifts
  shifts.push({
    id: i * 4 + 3,
    date: date,
    shift_type_id: 3,
    is_holiday: isWeekend,
    required_staff_count: isWeekend ? 1 : 2,
    notes: isWeekend ? "周末班次" : ""
  });
  
  // Add full day shifts for holidays
  if (isWeekend) {
    shifts.push({
      id: i * 4 + 4,
      date: date,
      shift_type_id: 4,
      is_holiday: true,
      required_staff_count: 1,
      notes: "假日全天班"
    });
  }
}

// Generate schedules (assigned shifts)
export const schedules = [];
let scheduleId = 1;

// Assign day staff to day shifts
for (let i = 0; i < 14; i += 2) {
  const dayShift = shifts.find(s => s.date === getDate(i) && s.shift_type_id === 1);
  if (dayShift) {
    schedules.push({
      id: scheduleId++,
      shift_id: dayShift.id,
      user_id: 2, // day_shift_1
      created_at: "2025-03-15T00:00:00",
      updated_at: "2025-03-15T00:00:00"
    });
  }
  
  const nextDayShift = shifts.find(s => s.date === getDate(i + 1) && s.shift_type_id === 1);
  if (nextDayShift) {
    schedules.push({
      id: scheduleId++,
      shift_id: nextDayShift.id,
      user_id: 3, // day_shift_2
      created_at: "2025-03-15T00:00:00",
      updated_at: "2025-03-15T00:00:00"
    });
  }
}

// Assign night staff to night shifts
for (let i = 0; i < 14; i += 2) {
  const nightShift = shifts.find(s => s.date === getDate(i) && s.shift_type_id === 3);
  if (nightShift) {
    schedules.push({
      id: scheduleId++,
      shift_id: nightShift.id,
      user_id: 4, // night_shift_1
      created_at: "2025-03-15T00:00:00",
      updated_at: "2025-03-15T00:00:00"
    });
  }
  
  const nextNightShift = shifts.find(s => s.date === getDate(i + 1) && s.shift_type_id === 3);
  if (nextNightShift) {
    schedules.push({
      id: scheduleId++,
      shift_id: nextNightShift.id,
      user_id: 5, // night_shift_2
      created_at: "2025-03-15T00:00:00",
      updated_at: "2025-03-15T00:00:00"
    });
  }
}

// Assign trainees with their mentors
for (let i = 0; i < 14; i += 4) {
  const dayShift = shifts.find(s => s.date === getDate(i) && s.shift_type_id === 1);
  if (dayShift) {
    schedules.push({
      id: scheduleId++,
      shift_id: dayShift.id,
      user_id: 6, // trainee_1 (with day_shift_1 as mentor)
      created_at: "2025-03-15T00:00:00",
      updated_at: "2025-03-15T00:00:00"
    });
  }
  
  const nightShift = shifts.find(s => s.date === getDate(i) && s.shift_type_id === 3);
  if (nightShift) {
    schedules.push({
      id: scheduleId++,
      shift_id: nightShift.id,
      user_id: 7, // trainee_2 (with night_shift_1 as mentor)
      created_at: "2025-03-15T00:00:00",
      updated_at: "2025-03-15T00:00:00"
    });
  }
}

// Get user schedule by user ID
export const getUserSchedule = (userId: number) => {
  return schedules.filter(schedule => schedule.user_id === userId);
};

// Get all schedules with shift and user details
export const getSchedulesWithDetails = () => {
  return schedules.map(schedule => {
    const shift = shifts.find(s => s.id === schedule.shift_id);
    const shiftType = shiftTypes.find(st => st.id === shift?.shift_type_id);
    return {
      ...schedule,
      shift: {
        ...shift,
        shift_type: shiftType
      }
    };
  });
};
