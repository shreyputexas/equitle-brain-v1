import axios from 'axios';
import { auth } from './firebase';
import { API_BASE_URL } from '../config/api';

// Create axios instance with proper base URL
const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

// Request interceptor to add fresh token to every request
axiosInstance.interceptors.request.use(
  async (config: any) => {
    try {
      const currentUser = auth.currentUser;
      console.log('Current user in axios interceptor:', currentUser?.email || 'Not logged in');
      if (currentUser) {
        // Force token refresh if it's close to expiring
        const idToken = await currentUser.getIdToken(true);
        console.log('Got Firebase token:', idToken ? `${idToken.substring(0, 20)}...` : 'null');
        if (config.headers) {
          config.headers.Authorization = `Bearer ${idToken}`;
        }
      } else {
        console.warn('No current user - request will be unauthenticated');
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Get a fresh token
          const idToken = await currentUser.getIdToken(true);

          // Update the authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${idToken}`;
          }
          axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          localStorage.setItem('token', idToken);

          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login or handle auth failure
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
