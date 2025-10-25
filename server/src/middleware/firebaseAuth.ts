import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebase';
import logger from '../utils/logger';

export interface User {
  uid: string;
  email?: string;
  [key: string]: any;
}

interface AuthRequest extends Request {
  user?: User;
}

export const firebaseAuthMiddleware = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
    return;
  } catch (error: unknown) {
    logger.error('Firebase auth middleware error:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};