import type { FirebaseUser } from '../middleware/firebaseAuth';

declare global {
  namespace Express {
    interface Request {
      // Firebase-authenticated user injected by firebaseAuthMiddleware
      user?: FirebaseUser;
      userId?: string;
      // Multer-processed uploads
      file?: any;
      files?: any;
    }
  }
}

export {};