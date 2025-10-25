/**
 * Centralized utility to get the current user ID consistently across the app
 *
 * This ensures all Firebase operations use the same userId, preventing data from
 * being stored in different locations or appearing to "disappear"
 */

/**
 * Get the current user ID from localStorage with fallback to development default
 *
 * Priority order:
 * 1. userId from localStorage (set by AuthContext)
 * 2. Fallback to 'dev-user-123' for development
 *
 * @returns The current user ID
 */
export const getUserId = (): string => {
  const userId = localStorage.getItem('userId');

  if (userId) {
    console.log('✅ getUserId: Found userId in localStorage:', userId);
    return userId;
  }

  // Fallback to development default
  const defaultUserId = 'dev-user-123';
  console.warn('⚠️ getUserId: No userId in localStorage, using default:', defaultUserId);
  console.warn('⚠️ This should only happen during initial load before auth is ready');

  return defaultUserId;
};

/**
 * Check if a user is currently authenticated
 * @returns true if userId exists in localStorage
 */
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('userId') !== null;
};

/**
 * Clear all authentication data from localStorage
 * This is a helper for logout operations
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  console.log('🧹 clearAuthData: Cleared all auth data from localStorage');
};
