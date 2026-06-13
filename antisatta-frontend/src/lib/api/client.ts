import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add the access token
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error status is 401 and there is no originalRequest._retry flag,
    // it means the token has expired and we need to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();
        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, null, {
          headers: {
            Authorization: `Bearer ${refreshToken}`
          }
        });
        
        const tokenData = response.data?.data || response.data;
        const { accessToken, refreshToken: newRefreshToken } = tokenData || {};
        
        if (!accessToken || !newRefreshToken) {
          throw new Error('Invalid tokens received from refresh endpoint');
        }
        setTokens(accessToken, newRefreshToken);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token is expired or invalid
        const { logout } = useAuthStore.getState();
        logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
