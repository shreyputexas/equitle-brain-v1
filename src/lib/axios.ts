import axios from 'axios';
import { auth } from './firebase';

// Create axios instance
const axiosInstance = axios.create();

// Request interceptor to add fresh token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Force token refresh if it's close to expiring
        const idToken = await currentUser.getIdToken(true);
        config.headers.Authorization = `Bearer ${idToken}`;
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
          originalRequest.headers.Authorization = `Bearer ${idToken}`;
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
