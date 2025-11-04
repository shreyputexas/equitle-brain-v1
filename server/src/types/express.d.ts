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