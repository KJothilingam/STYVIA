import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/apiBaseUrl';
import {
  refreshSessionTokens,
  clearSessionAndNotify,
  redirectAfterSessionInvalid,
  shouldSkipAuthRetry,
} from '@/services/sessionManager';

export { API_BASE_URL };

export type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // If error is 401 and we haven't tried to refresh yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipAuthRetry(originalRequest)
    ) {
      originalRequest._retry = true;

      try {
        const data = await refreshSessionTokens();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        clearSessionAndNotify();
        redirectAfterSessionInvalid();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

