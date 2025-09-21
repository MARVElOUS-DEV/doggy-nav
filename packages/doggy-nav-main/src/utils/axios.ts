import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { Message } from '@arco-design/web-react';

interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

interface ApiError {
  code: number;
  message: string;
  timestamp: number;
}

const instance: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
instance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    if (process.env.NODE_ENV === 'development') {
      console.info(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || (config as any).params);
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
      console.info(`✅ Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    const { data } = response;

    // Handle successful response
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code !== 1) {
        // API returned error but with 200 status
        const errorMessage = data.message || 'Request failed';
        Message.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      // Return the actual data for successful API responses
      return data.data !== undefined ? data.data : data;
    }

    // Return raw response if not in expected format
    return response.data;
  },
  (error: AxiosError<ApiError>) => {
    console.error('❌ Response Error:', error);

    let errorMessage = 'Network Error';
    let errorCode = 0;

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      errorCode = status;

      switch (status) {
        case 400:
          errorMessage = data?.message || 'Bad Request';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please login';
          // Redirect to login if needed
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            // You can add router redirect here if needed
          }
          break;
        case 403:
          errorMessage = 'Forbidden - Access denied';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 422:
          errorMessage = data?.message || 'Validation Error';
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
          errorMessage = data?.message || `Error ${status}`;
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
      Message.error(errorMessage);
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
