import { TokenPayload } from '../modules';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
