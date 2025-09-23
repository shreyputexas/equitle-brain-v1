import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebase';
import logger from '../utils/logger';

export interface FirebaseUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime?: string;
  };
  customClaims?: Record<string, any>;
}

export interface FirebaseAuthRequest extends Request {
  user?: FirebaseUser;
  userId?: string;
}

export const firebaseAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization header must start with "Bearer "'
      });
    }

    const idToken = authHeader.replace('Bearer ', '');

    // Development mode: accept mock tokens
    if (process.env.NODE_ENV !== 'production' && (idToken === 'mock-token' || idToken === 'Bearer mock-token')) {
      // Create a mock user for development
      (req as FirebaseAuthRequest).user = {
        uid: 'dev-user-123',
        email: 'dev@example.com',
        emailVerified: true,
        displayName: 'Development User',
        photoURL: undefined,
        disabled: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        },
        customClaims: {}
      };
      (req as FirebaseAuthRequest).userId = 'dev-user-123';
      
      logger.debug('Development mode: using mock user', {
        uid: 'dev-user-123',
        email: 'dev@example.com'
      });
      
      return next();
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get full user data from Firebase Auth
    const userRecord = await auth.getUser(decodedToken.uid);

    // Attach user data to request
    (req as FirebaseAuthRequest).user = {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      metadata: userRecord.metadata,
      customClaims: userRecord.customClaims,
    };
    (req as FirebaseAuthRequest).userId = userRecord.uid;

    logger.debug('Firebase auth successful', {
      uid: userRecord.uid,
      email: userRecord.email
    });

    next();
  } catch (error: any) {
    logger.error('Firebase auth middleware error:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });

    // Handle different Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: 'Token revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (error.code === 'auth/user-disabled') {
      return res.status(401).json({
        success: false,
        error: 'User account disabled',
        code: 'USER_DISABLED'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Role-based access control using custom claims
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as FirebaseAuthRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userRole = user.customClaims?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        requiredRoles: roles,
        userRole
      });
    }

    next();
  };
};

// Check if user email is verified
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as FirebaseAuthRequest).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated'
    });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email not verified',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

// Admin only access
export const requireAdmin = requireRole(['admin']);

// Manager or admin access
export const requireManager = requireRole(['admin', 'manager']);

export default firebaseAuthMiddleware;