import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Prediction, PlacePredictionInput } from '@/types/prediction';

export const predictionsApi = {
  place: (data: PlacePredictionInput) =>
    apiClient.post<ApiResponse<Prediction>>('/predictions', data),

  getActive: () =>
    apiClient.get<ApiResponse<Prediction[]>>('/predictions/active'),

  getHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Prediction>>>('/predictions/history', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Prediction>>(`/predictions/${id}`),
};
