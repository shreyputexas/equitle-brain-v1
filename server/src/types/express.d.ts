import type { FirebaseUser } from '../middleware/firebaseAuth';
import type { TokenPayload } from '../services/auth.service';

declare global {
  namespace Express {
    interface User extends TokenPayload {}
    interface Request {
      user?: FirebaseUser | TokenPayload;
      userId?: string;
      file?: any;
      files?: any;
    }
  }
}

export {};