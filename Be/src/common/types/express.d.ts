import { TokenPayload } from './jwt.type';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
