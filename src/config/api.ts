// API Configuration - Environment Aware
const getApiBaseUrl = () => {
  // Check if we have an explicit env var set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Fallback based on environment
  if (import.meta.env.PROD) {
    // Production: Use your production API domain
    return 'https://api.equitle.com';
  } else {
    // Development: Use localhost
    return 'http://localhost:4001';
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
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