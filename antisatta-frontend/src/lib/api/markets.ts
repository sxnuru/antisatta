import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Market, CreateMarketInput } from '@/types/market';

export const marketsApi = {
  list: (params?: { status?: string; type?: string; category?: string; search?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string; featured?: boolean }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Market>>>('/markets', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Market>>(`/markets/${id}`),

  create: (data: CreateMarketInput) =>
    apiClient.post<ApiResponse<Market>>('/markets', data),

  update: (id: string, data: Partial<CreateMarketInput>) =>
    apiClient.patch<ApiResponse<Market>>(`/markets/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/markets/${id}`),

  getTrending: () =>
    apiClient.get<ApiResponse<Market[]>>('/markets/trending'),

  getFeatured: () =>
    apiClient.get<ApiResponse<Market[]>>('/markets/featured'),

  getLive: () =>
    apiClient.get<ApiResponse<Market[]>>('/markets/live'),

  getUpcoming: () =>
    apiClient.get<ApiResponse<Market[]>>('/markets/upcoming'),

  getCommunity: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Market>>>('/markets/community', { params }),

  getPredictions: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<any>>>(`/markets/${id}/predictions`, { params }),
};
