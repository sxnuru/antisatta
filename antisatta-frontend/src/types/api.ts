/** Standard API response envelope */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/** Authentication tokens */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Login response */
export interface LoginResponse {
  user: import('./user').User;
  tokens: AuthTokens;
}

/** API error response */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}
