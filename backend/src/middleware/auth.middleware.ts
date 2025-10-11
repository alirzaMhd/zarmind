// ==========================================
// ZARMIND - Authentication Middleware
// ==========================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/server';
import {
  ITokenPayload,
  UserRole,
  UnauthorizedError,
  ForbiddenError,
  IUser,
} from '../types';
import UserModel from '../models/User';
import logger, { logAuth, logSecurity } from '../utils/logger';

// ==========================================
// INTERFACES
// ==========================================

export interface AuthenticatedRequest extends Request {
  user?: ITokenPayload;
  currentUser?: Omit<IUser, 'password'>;
}

// ==========================================
// TOKEN EXTRACTION
// ==========================================

/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Check for "Bearer TOKEN" format
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] ?? null ;
};

/**
 * Extract token from cookies
 */
const extractTokenFromCookie = (req: Request): string | null => {
  return req.cookies?.token || req.signedCookies?.token || null;
};

/**
 * Extract token from request (header or cookie)
 */
const extractToken = (req: Request): string | null => {
  // Try header first
  let token = extractTokenFromHeader(req);

  // Fallback to cookie
  if (!token) {
    token = extractTokenFromCookie(req);
  }

  return token;
};

// ==========================================
// TOKEN VERIFICATION
// ==========================================

/**
 * Verify JWT token
 */
const verifyToken = (token: string): ITokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as ITokenPayload;

    // Validate required fields
    if (!decoded.userId || !decoded.username || !decoded.role) {
      throw new UnauthorizedError('توکن نامعتبر است');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('توکن منقضی شده است. لطفاً دوباره وارد شوید');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('توکن نامعتبر است');
    }

    throw error;
  }
};

/**
 * Generate access token
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: ITokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRE,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
  } as jwt.SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user: IUser): string => {
  const payload: ITokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  
  return jwt.sign(payload, JWT_CONFIG.REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_EXPIRE,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
  } as jwt.SignOptions);};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): ITokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_SECRET) as ITokenPayload;

    if (!decoded.userId || !decoded.username || !decoded.role) {
      throw new UnauthorizedError('توکن بازیابی نامعتبر است');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('توکن بازیابی منقضی شده است. لطفاً دوباره وارد شوید');
    }

    throw new UnauthorizedError('توکن بازیابی نامعتبر است');
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): ITokenPayload | null => {
  try {
    return jwt.decode(token) as ITokenPayload;
  } catch {
    return null;
  }
};

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

/**
 * Authenticate user - verify token and attach user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError('توکن احراز هویت یافت نشد');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists and is active
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('کاربر یافت نشد');
    }

    if (!user.is_active) {
      logSecurity('Inactive user attempted access', 'medium', {
        userId: user.id,
        username: user.username,
        ip: req.ip,
      });
      throw new UnauthorizedError('حساب کاربری غیرفعال است');
    }

    // Attach user info to request
    req.user = decoded;
    (req as AuthenticatedRequest).currentUser = UserModel.omitPassword(user);

    logger.debug('User authenticated', {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      path: req.path,
    });

    next();
  } catch (error) {
    // Log failed authentication attempt
    logSecurity('Failed authentication attempt', 'low', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
      error: (error as Error).message,
    });

    next(error);
  }
};

/**
 * Optional authentication - attach user if token exists, but don't require it
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyToken(token);
      const user = await UserModel.findById(decoded.userId);

      if (user && user.is_active) {
        req.user = decoded;
        (req as AuthenticatedRequest).currentUser = UserModel.omitPassword(user);
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// ==========================================
// AUTHORIZATION MIDDLEWARE
// ==========================================

/**
 * Authorize user based on roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('احراز هویت انجام نشده است');
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole as UserRole)) {
        logSecurity('Unauthorized access attempt', 'medium', {
          userId: req.user.userId,
          username: req.user.username,
          role: userRole,
          requiredRoles: allowedRoles,
          path: req.path,
          ip: req.ip,
        });

        throw new ForbiddenError('شما دسترسی به این بخش را ندارید');
      }

      logger.debug('User authorized', {
        userId: req.user.userId,
        role: userRole,
        allowedRoles,
        path: req.path,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize(UserRole.ADMIN);

/**
 * Check if user is admin or manager
 */
export const isAdminOrManager = authorize(UserRole.ADMIN, UserRole.MANAGER);

/**
 * Check if user is admin, manager, or employee
 */
export const isEmployee = authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE);

/**
 * Allow all authenticated users (any role)
 */
export const isAuthenticated = authenticate;

// ==========================================
// OWNERSHIP MIDDLEWARE
// ==========================================

/**
 * Check if user owns the resource (by user ID in params)
 */
export const isOwner = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('احراز هویت انجام نشده است');
    }

    const resourceUserId = req.params.userId || req.params.id;
    const currentUserId = req.user.userId;

    // Admin can access all resources
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Check ownership
    if (resourceUserId !== currentUserId) {
      logSecurity('Ownership check failed', 'medium', {
        userId: currentUserId,
        requestedResourceUserId: resourceUserId,
        path: req.path,
        ip: req.ip,
      });

      throw new ForbiddenError('شما فقط می‌توانید به اطلاعات خود دسترسی داشته باشید');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user owns resource or has admin/manager role
 */
export const isOwnerOrManager = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('احراز هویت انجام نشده است');
    }

    const resourceUserId = req.params.userId || req.params.id;
    const currentUserId = req.user.userId;
    const userRole = req.user.role as UserRole;

    // Admin or manager can access all resources
    if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      return next();
    }

    // Check ownership
    if (resourceUserId !== currentUserId) {
      throw new ForbiddenError('شما دسترسی به این منبع را ندارید');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CUSTOM AUTHORIZATION HELPERS
// ==========================================

/**
 * Check if user has specific permission
 */
export const hasPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('احراز هویت انجام نشده است');
      }

      // Define permissions by role
      const rolePermissions: Record<UserRole, string[]> = {
        [UserRole.ADMIN]: ['*'], // All permissions
        [UserRole.MANAGER]: [
          'users:read',
          'users:create',
          'users:update',
          'products:*',
          'customers:*',
          'sales:*',
          'reports:*',
        ],
        [UserRole.EMPLOYEE]: [
          'users:read:self',
          'products:read',
          'products:update',
          'customers:*',
          'sales:*',
        ],
        [UserRole.VIEWER]: [
          'users:read:self',
          'products:read',
          'customers:read',
          'sales:read',
          'reports:read',
        ],
      };

      const userRole = req.user.role as UserRole;
      const permissions = rolePermissions[userRole] || [];

      // Check if user has permission
      const hasAccess =
        permissions.includes('*') ||
        permissions.includes(permission) ||
        permissions.some((p) => {
          const [resource, action] = p.split(':');
          const [reqResource, reqAction] = permission.split(':');
          return resource === reqResource && (action === '*' || action === reqAction);
        });

      if (!hasAccess) {
        throw new ForbiddenError('شما دسترسی به این عملیات را ندارید');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can modify resource based on creator
 */
export const canModify = (createdByField: string = 'created_by') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('احراز هویت انجام نشده است');
      }

      const userRole = req.user.role as UserRole;
      const currentUserId = req.user.userId;

      // Admin can modify anything
      if (userRole === UserRole.ADMIN) {
        return next();
      }

      // For other roles, check if they created the resource
      // This should be implemented based on your resource logic
      // For now, managers can modify anything, others only their own
      if (userRole === UserRole.MANAGER) {
        return next();
      }

      // Employees can only modify their own resources
      // You would typically fetch the resource and check created_by
      // Example: const resource = await Model.findById(req.params.id);
      // if (resource[createdByField] !== currentUserId) { throw error }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ==========================================
// TOKEN BLACKLIST (Optional - for logout)
// ==========================================

// In-memory blacklist (in production, use Redis)
const tokenBlacklist = new Set<string>();

/**
 * Add token to blacklist
 */
export const blacklistToken = (token: string): void => {
  tokenBlacklist.add(token);
  logger.info('Token blacklisted', { token: token.substring(0, 20) + '...' });
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

/**
 * Middleware to check token blacklist
 */
export const checkBlacklist = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req);

    if (token && isTokenBlacklisted(token)) {
      throw new UnauthorizedError('توکن نامعتبر است');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LOGIN ATTEMPT TRACKING (Rate Limiting)
// ==========================================

// Track failed login attempts (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

/**
 * Track failed login attempt
 */
export const trackFailedLogin = (identifier: string): void => {
  const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
  attempts.count += 1;
  attempts.lastAttempt = new Date();
  loginAttempts.set(identifier, attempts);

  logSecurity('Failed login attempt', 'low', {
    identifier,
    attempts: attempts.count,
  });
};

/**
 * Reset login attempts on successful login
 */
export const resetLoginAttempts = (identifier: string): void => {
  loginAttempts.delete(identifier);
};

/**
 * Check if account is locked due to too many failed attempts
 */
export const isAccountLocked = (identifier: string): boolean => {
  const attempts = loginAttempts.get(identifier);

  if (!attempts) {
    return false;
  }

  // Lock after 5 failed attempts
  if (attempts.count >= 5) {
    // Check if lock period (15 minutes) has passed
    const lockDuration = 15 * 60 * 1000; // 15 minutes
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();

    if (timeSinceLastAttempt < lockDuration) {
      return true;
    } else {
      // Lock period expired, reset attempts
      loginAttempts.delete(identifier);
      return false;
    }
  }

  return false;
};

/**
 * Middleware to check account lock status
 */
export const checkAccountLock = (identifierField: string = 'username') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const identifier = req.body[identifierField];

      if (identifier && isAccountLocked(identifier)) {
        logSecurity('Locked account access attempt', 'high', {
          identifier,
          ip: req.ip,
        });

        throw new UnauthorizedError(
          'حساب کاربری به دلیل تلاش‌های متعدد ناموفق قفل شده است. لطفاً 15 دقیقه صبر کنید'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ==========================================
// MIDDLEWARE COMBINATIONS
// ==========================================

/**
 * Protect route - require authentication
 */
export const protect = authenticate;

/**
 * Protect route with role-based access
 */
export const protectWithRole = (...roles: UserRole[]) => {
  return [authenticate, authorize(...roles)];
};

/**
 * Protect route and check ownership
 */
export const protectOwn = [authenticate, isOwner];

/**
 * Protect route and check ownership or manager role
 */
export const protectOwnOrManager = [authenticate, isOwnerOrManager];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get current user from request
 */
export const getCurrentUser = (req: AuthenticatedRequest): ITokenPayload | undefined => {
  return req.user;
};

export const requireUserId = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }
  return userId;
};

/**
 * Get current user ID from request
 */
export const getCurrentUserId = (req: Request): string | undefined => {
  return req.user?.userId;
};

/**
 * Get current user role from request
 */
export const getCurrentUserRole = (req: Request): UserRole | undefined => {
  return req.user?.role as UserRole;
};

/**
 * Check if current user is admin
 */
export const isCurrentUserAdmin = (req: Request): boolean => {
  return req.user?.role === UserRole.ADMIN;
};

/**
 * Check if current user is manager or admin
 */
export const isCurrentUserManagerOrAdmin = (req: Request): boolean => {
  const role = req.user?.role as UserRole;
  return role === UserRole.ADMIN || role === UserRole.MANAGER;
};

// ==========================================
// EXPORTS
// ==========================================

export default {
  // Main middleware
  authenticate,
  optionalAuthenticate,
  authorize,
  
  // Role-based
  isAdmin,
  isAdminOrManager,
  isEmployee,
  isAuthenticated,
  
  // Ownership
  isOwner,
  isOwnerOrManager,
  
  // Custom
  hasPermission,
  canModify,
  
  // Blacklist
  checkBlacklist,
  blacklistToken,
  isTokenBlacklisted,
  
  // Login attempts
  checkAccountLock,
  trackFailedLogin,
  resetLoginAttempts,
  isAccountLocked,
  
  // Combinations
  protect,
  protectWithRole,
  protectOwn,
  protectOwnOrManager,
  
  // Token operations
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
  
  // Utilities
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserRole,
  requireUserId,
  isCurrentUserAdmin,
  isCurrentUserManagerOrAdmin,
};