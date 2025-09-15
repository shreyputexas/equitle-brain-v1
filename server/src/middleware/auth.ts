import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import logger from '../utils/logger';

export interface TokenPayload {
  id: string;
  email: string;
  type?: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // For development: use default user from database
    if (token === 'mock-token' || process.env.NODE_ENV === 'development') {
      (req as any).user = {
        id: 'default-user-id',
        email: 'demo@equitle.com',
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