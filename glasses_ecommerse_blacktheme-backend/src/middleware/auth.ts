import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'

interface JwtPayload {
  userId: string
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
    role: 'user' | 'admin' | 'vendor'
    vendorId?: string
  }
}

export interface AuthenticatedRequest extends AuthRequest {
  user: NonNullable<AuthRequest['user']>
}

export async function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = authHeader.split(' ')[1]
  try {
    const secret = process.env.JWT_SECRET || 'secret'
    const payload = jwt.verify(token, secret) as JwtPayload
    const user = await User.findById(payload.userId).select('-password')
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      vendorId: user.vendorId?.toString()
    }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const requireAuth = auth

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  next()
}

export function requireVendor(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Forbidden' })
  next()
}

export function requireVendorOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}
