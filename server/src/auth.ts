import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { UserRole, SafeUser, AuthTokenPayload } from './types';

export const JWT_SECRET = process.env.JWT_SECRET || 'foodcovering_super_secure_jwt_secret_2026';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      userId?: string;
      tokenPayload?: AuthTokenPayload;
    }
  }
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const user = db.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User account no longer exists' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account disabled: Please contact system administrator' });
    }

    req.user = db.toSafeUser(user);
    req.userId = user.id;
    req.tokenPayload = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired: Please log in again' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token signature' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: Access requires ${allowedRoles.join(' or ')} permission`,
        userRole: req.user.role
      });
    }

    next();
  };
}

export function requireSupermarketScope(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Head Office Admin can view all
  if (req.user.role === 'HEAD_OFFICE_ADMIN') {
    return next();
  }

  // Supermarket official must belong to a supermarket
  if (req.user.role === 'SUPERMARKET_OFFICIAL') {
    if (!req.user.supermarketId) {
      return res.status(403).json({ error: 'Forbidden: Supermarket official is not assigned to any store' });
    }
    return next();
  }

  return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
}
