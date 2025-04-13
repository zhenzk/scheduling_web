import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';

// 定义认证状态接口
interface AuthState {
  token: string | null;
  user: any | null;
}

// 初始状态
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
};

// 创建认证切片
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 设置认证凭据
    setCredentials: (state, action: PayloadAction<{ token: string; user: any }>) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      
      // 保存到本地存储
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    
    // 退出登录
    logout: (state) => {
      state.token = null;
      state.user = null;
      
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

// 导出actions
export const { setCredentials, logout } = authSlice.actions;

// 导出选择器
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;

// 导出reducer
export default authSlice.reducer;
