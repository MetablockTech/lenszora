import { AuthRequest } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthRequest['user'];
    }
  }
}
