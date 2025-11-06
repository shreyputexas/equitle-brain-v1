// API Configuration - Environment Aware
const getApiBaseUrl = () => {
  // Check if we have an explicit env var set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Fallback based on environment
  if (import.meta.env.PROD) {
    // Production: Use your production API domain
    return 'https://equitle-api.onrender.com';
  } else {
    // Development: Use relative URL to leverage Vite proxy
    return '';
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // In development with empty base URL, just prepend /api/
  if (API_BASE_URL === '') {
    return `/api/${cleanEndpoint}`;
  }
  return `${API_BASE_URL}/api/${cleanEndpoint}`;
};

// WebSocket URL for real-time connections
export const getSocketUrl = () => {
  return API_BASE_URL;
};

// Debug info for development
if (import.meta.env.DEV) {
  console.log('🔗 API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: import.meta.env.PROD ? 'production' : 'development',
    explicitEnvVar: import.meta.env.VITE_API_BASE_URL
  });
}