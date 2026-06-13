import { apiClient } from './client';
import type { LoginResponse, ApiResponse } from '@/types/api';
import type { User } from '@/types/user';

export const authApi = {
  register: (data: { username: string; email: string; password: string; referralCode?: string }) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),

  getMe: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
};
