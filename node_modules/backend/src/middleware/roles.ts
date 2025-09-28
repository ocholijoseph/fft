import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.js';
import { User } from '@prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Access token is required',
      },
    });
  }

  try {
    const user = await AuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
      },
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
      });
    }

    if (!AuthService.hasRole(req.user, allowedRoles)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
};

/**
 * Father role only middleware
 */
export const requireFather = requireRole(['FATHER']);

/**
 * Parent role middleware (Father or Mother)
 */
export const requireParent = requireRole(['FATHER', 'MOTHER']);

/**
 * Family member middleware (any authenticated family member)
 */
export const requireFamilyMember = requireRole(['FATHER', 'MOTHER', 'CHILD']);

/**
 * Family access middleware - ensures user can access family data
 */
export const requireFamilyAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      },
    });
  }

  const familyId = req.params.familyId || req.body.familyId;
  
  if (familyId && !AuthService.canAccessFamily(req.user, familyId)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FAMILY_ACCESS_DENIED',
        message: 'Access denied to family data',
      },
    });
  }

  next();
};

/**
 * Expense access middleware - ensures user can access expense data
 */
export const requireExpenseAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      },
    });
  }

  const expenseUserId = req.params.userId || req.body.userId;
  
  if (expenseUserId && !(await AuthService.canAccessExpense(req.user, expenseUserId))) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'EXPENSE_ACCESS_DENIED',
        message: 'Access denied to expense data',
      },
    });
  }

  next();
};

/**
 * Budget management middleware - Father role only
 */
export const requireBudgetManagement = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      },
    });
  }

  if (!AuthService.canManageBudgets(req.user)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'BUDGET_ACCESS_DENIED',
        message: 'Only Father can manage budgets',
      },
    });
  }

  next();
};

/**
 * Family management middleware - Parent role only
 */
export const requireFamilyManagement = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      },
    });
  }

  if (!AuthService.canManageFamily(req.user)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FAMILY_MANAGEMENT_DENIED',
        message: 'Only parents can manage family members',
      },
    });
  }

  next();
};

/**
 * Optional authentication middleware - adds user if token is valid
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const user = await AuthService.getUserFromToken(token);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore authentication errors for optional auth
      console.warn('Optional auth failed:', error);
    }
  }

  next();
};
