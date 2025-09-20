export interface FirebaseError {
  code: string;
  message: string;
}

export const getFirebaseErrorMessage = (error: any): string => {
  // Handle different error formats
  let errorCode = '';

  if (error?.code) {
    errorCode = error.code;
  } else if (error?.message) {
    // Extract error code from Firebase error message format: "Firebase: Error (auth/error-code)"
    const match = error.message.match(/\(([^)]+)\)/);
    if (match) {
      errorCode = match[1];
    }
  }

  // Map Firebase error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    // Authentication errors
    'auth/email-already-in-use': 'This email is already registered. Please try signing in instead or use a different email address.',
    'auth/weak-password': 'Please choose a stronger password. Use at least 6 characters with a mix of letters and numbers.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support for assistance.',
    'auth/user-not-found': 'No account found with this email. Please check your email or create a new account.',
    'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes before trying again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
    'auth/requires-recent-login': 'For security reasons, please sign in again to complete this action.',
    'auth/credential-already-in-use': 'This credential is already associated with another account.',
    'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
    'auth/invalid-verification-id': 'Invalid verification ID. Please restart the verification process.',
    'auth/missing-verification-code': 'Please enter the verification code.',
    'auth/missing-verification-id': 'Verification ID is missing. Please restart the verification process.',
    'auth/code-expired': 'The verification code has expired. Please request a new one.',
    'auth/captcha-check-failed': 'Please complete the captcha verification.',
    'auth/phone-number-already-exists': 'This phone number is already registered to another account.',
    'auth/invalid-phone-number': 'Please enter a valid phone number.',
    'auth/quota-exceeded': 'Too many requests. Please try again later.',
    'auth/app-deleted': 'This app has been deleted. Please contact support.',
    'auth/app-not-authorized': 'This app is not authorized. Please contact support.',
    'auth/argument-error': 'Invalid request. Please try again.',
    'auth/invalid-api-key': 'Invalid API key. Please contact support.',
    'auth/invalid-user-token': 'Your session has expired. Please sign in again.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/claims-too-large': 'The request contains too much data. Please try again with less information.',
    'auth/id-token-expired': 'Your session has expired. Please sign in again.',
    'auth/id-token-revoked': 'Your session has been revoked. Please sign in again.',
    'auth/insufficient-permission': 'You don\'t have permission to perform this action.',
    'auth/internal-error': 'An internal error occurred. Please try again later.',
    'auth/invalid-claims': 'Invalid request data. Please try again.',
    'auth/invalid-continue-uri': 'Invalid redirect URL. Please contact support.',
    'auth/invalid-creation-time': 'Invalid account creation time.',
    'auth/invalid-disabled-field': 'Invalid account status.',
    'auth/invalid-display-name': 'Please enter a valid display name.',
    'auth/invalid-dynamic-link-domain': 'Invalid link domain. Please contact support.',
    'auth/invalid-email-verified': 'Invalid email verification status.',
    'auth/invalid-hash-algorithm': 'Invalid security configuration. Please contact support.',
    'auth/invalid-hash-block-size': 'Invalid security configuration. Please contact support.',
    'auth/invalid-hash-derived-key-length': 'Invalid security configuration. Please contact support.',
    'auth/invalid-hash-key': 'Invalid security configuration. Please contact support.',
    'auth/invalid-hash-memory-cost': 'Invalid security configuration. Please contact support.',
    'auth/invalid-hash-parallelization': 'Invalid security configuration. Please contact support.',
    'auth/invalid-hash-rounds': 'Invalid security configuration. Please contact support.',
    'auth/invalid-hash-salt-separator': 'Invalid security configuration. Please contact support.',
    'auth/invalid-id-token': 'Invalid authentication token. Please sign in again.',
    'auth/invalid-last-sign-in-time': 'Invalid sign-in time.',
    'auth/invalid-page-token': 'Invalid page token. Please refresh and try again.',
    'auth/invalid-password': 'Invalid password format. Please choose a different password.',
    'auth/invalid-password-hash': 'Invalid password format.',
    'auth/invalid-password-salt': 'Invalid password format.',
    'auth/invalid-photo-url': 'Please enter a valid photo URL.',
    'auth/invalid-provider-data': 'Invalid provider data.',
    'auth/invalid-provider-id': 'Invalid authentication provider.',
    'auth/invalid-oauth-responsetype': 'Invalid OAuth response type.',
    'auth/invalid-session-cookie-duration': 'Invalid session duration.',
    'auth/invalid-uid': 'Invalid user ID.',
    'auth/invalid-user-import': 'Invalid user import data.',
    'auth/maximum-user-count-exceeded': 'Maximum user count exceeded. Please contact support.',
    'auth/missing-android-pkg-name': 'Missing Android package name.',
    'auth/missing-continue-uri': 'Missing redirect URL.',
    'auth/missing-hash-algorithm': 'Missing hash algorithm.',
    'auth/missing-ios-bundle-id': 'Missing iOS bundle ID.',
    'auth/missing-uid': 'Missing user ID.',
    'auth/missing-oauth-client-secret': 'Missing OAuth client secret.',
    'auth/unauthorized-continue-uri': 'Unauthorized redirect URL.',
    'auth/uid-already-exists': 'User ID already exists.',
    'auth/email-change-needs-verification': 'Email change requires verification. Please check your email.',
    'auth/email-already-exists': 'This email is already registered. Please use a different email or sign in.',
    'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/provider-already-linked': 'This account is already linked to another provider.',
    'auth/quota-exceeded': 'Service quota exceeded. Please try again later.',
    'auth/redirect-cancelled-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/redirect-operation-pending': 'A redirect operation is already pending.',
    'auth/rejected-credential': 'The credential was rejected. Please try again.',
    'auth/second-factor-already-in-use': 'This second factor is already in use.',
    'auth/maximum-second-factor-count-exceeded': 'Maximum number of second factors exceeded.',
    'auth/tenant-id-mismatch': 'Tenant ID mismatch. Please contact support.',
    'auth/timeout': 'The operation timed out. Please try again.',
    'auth/user-token-expired': 'Your session has expired. Please sign in again.',
    'auth/web-storage-unsupported': 'Web storage is not supported. Please enable cookies and try again.',
    'auth/already-initialized': 'Authentication already initialized.',
    'auth/recaptcha-not-enabled': 'reCAPTCHA is not enabled. Please contact support.',
    'auth/missing-recaptcha-token': 'Missing reCAPTCHA token. Please try again.',
    'auth/invalid-recaptcha-token': 'Invalid reCAPTCHA token. Please try again.',
    'auth/invalid-recaptcha-action': 'Invalid reCAPTCHA action.',
    'auth/missing-client-type': 'Missing client type.',
    'auth/missing-recaptcha-version': 'Missing reCAPTCHA version.',
    'auth/invalid-recaptcha-version': 'Invalid reCAPTCHA version.',
    'auth/invalid-req-type': 'Invalid request type.',
  };

  // Return user-friendly message if found, otherwise return a generic message
  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};

export const getAuthErrorMessage = (error: any): string => {
  // Handle network errors
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }

  // Handle specific error types
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Use Firebase error translation
  return getFirebaseErrorMessage(error);
};