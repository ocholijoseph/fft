import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type Role = 'FATHER' | 'MOTHER' | 'CHILD'

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string, role: Role, name?: string }
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string, role: Role, name?: string }
    req.auth = { userId: decoded.sub, role: decoded.role, name: decoded.name }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!req.auth) return res.status(401).json({ error: 'Unauthorized' })
      if (!roles.includes(req.auth.role)) return res.status(403).json({ error: 'Forbidden' })
      next()
    })
  }
}

