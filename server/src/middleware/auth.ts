import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import logger from '../utils/logger';

export interface TokenPayload {
  id: string;
  email: string;
  type?: string;
  role?: string;
}

// Do not augment Express Request here to avoid conflicts with Firebase user typing.
// Access auth payload via (req as any).user in handlers.

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // For development: use specific mock tokens
    if (token === 'mock-token') {
      (req as any).user = {
        id: 'default-user-id',
        email: 'demo@equitle.com',
        role: 'admin',
        type: 'access'
      };
      next();
      return;
    }

    if (token === 'user2-token') {
      (req as any).user = {
        id: 'user2-id',
        email: 'user2@equitle.com',
        role: 'admin',
        type: 'access'
      };
      next();
      return;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = AuthService.verifyToken(token);
    (req as any).user = decoded;
    next();
    return;
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !user.role || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
    return;
  };
};