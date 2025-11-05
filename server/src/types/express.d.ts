import type { FirebaseUser } from '../middleware/firebaseAuth';

declare global {
  namespace Express {
    interface Request {
      user?: FirebaseUser;
      userId?: string;
    }
  }
}

export {};

import { TokenPayload } from '../services/auth.service';

declare global {
  namespace Express {
    interface User extends TokenPayload {}
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};