import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { Message } from '@arco-design/web-react';
import { requestCrossTabRefresh } from './session';

interface ApiResponse<T = any> {
  code: number;
  data: T;
  msg: string;
  success: boolean;
}

interface ApiError {
  code: number;
  msg: string;
  timestamp: number;
}

const instance: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Ensure only one refresh runs per tab; cross-tab coordination is handled by session.ts
let refreshPromise: Promise<void> | null = null;

// Request interceptor
instance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add request timestamp for debugging
    if (process.env.NODE_ENV === 'development') {
      console.info(
        `🚀 Request: ${config.method?.toUpperCase()} ${config.url}`,
        config.data || (config as any).params
      );
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(
        `✅ Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
        response.data
      );
    }

    const { data } = response;

    // Handle successful response
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code !== 1) {
        // API returned error but with 200 status
        const errorMessage = data.msg || 'Request failed';
        Message.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      return data.data !== undefined ? data.data : data;
    }

    // Return raw response if not in expected format
    return response.data;
  },
  async (error: AxiosError<ApiError>) => {
    console.error('❌ Response Error:', error);

    let errorMessage = 'Network Error';
    let errorCode = 0;
    const isLoginPage =
      typeof window !== 'undefined' && window.location?.pathname?.startsWith('/login');

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      errorCode = status;

      switch (status) {
        case 400:
          errorMessage = data?.msg || 'Bad Request';
          break;
        case 401: {
          const cfg: any = { ...(error.config || {}) };
          const failingUrl: string = (cfg.url as any) || (error as any)?.request?.responseURL || '';
          const isRefreshEndpoint =
            typeof failingUrl === 'string' && /\/api\/auth\/refresh\b/.test(failingUrl);
          if (isRefreshEndpoint) {
            errorMessage = 'Unauthorized';
            break;
          }

          if (cfg.__isRetryRequest || isLoginPage) {
            errorMessage = 'Unauthorized';
            break;
          }

          try {
            if (!refreshPromise) {
              refreshPromise = requestCrossTabRefresh().finally(() => {
                refreshPromise = null;
              });
            }
            await refreshPromise;
            cfg.__isRetryRequest = true;
            return instance.request(cfg);
          } catch {
            try {
              await axios.post('/api/auth/logout', undefined, { withCredentials: true });
            } catch {}
            errorMessage = 'Unauthorized';
            break;
          }
        }
        case 403:
          errorMessage = 'Forbidden - Access denied';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 422:
          errorMessage = data?.msg || 'Validation Error';
          break;
        case 500:
          errorMessage = 'Internal Server Error';
          break;
        case 502:
          errorMessage = 'Bad Gateway';
          break;
        case 503:
          errorMessage = 'Service Unavailable';
          break;
        default:
          errorMessage = data?.msg || `Error ${status}`;
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network Error - Please check your connection';
    } else {
      // Other error
      errorMessage = error.message || 'Unknown Error';
    }

    // Show error message to user
    if (typeof window !== 'undefined') {
      // Suppress noisy auth errors on login page or plain 401s
      if (!(errorCode === 401 || isLoginPage)) {
        Message.error(errorMessage);
      }
    }

    // Create enhanced error object
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).code = errorCode;
    (enhancedError as any).originalError = error;

    return Promise.reject(enhancedError);
  }
);

export default instance;

// Export types for use in components
export type { ApiResponse, ApiError };
