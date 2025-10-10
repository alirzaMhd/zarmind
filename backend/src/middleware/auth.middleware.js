"use strict";
// ==========================================
// ZARMIND - Authentication Middleware
// ==========================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCurrentUserManagerOrAdmin = exports.isCurrentUserAdmin = exports.getCurrentUserRole = exports.getCurrentUserId = exports.getCurrentUser = exports.protectOwnOrManager = exports.protectOwn = exports.protectWithRole = exports.protect = exports.checkAccountLock = exports.isAccountLocked = exports.resetLoginAttempts = exports.trackFailedLogin = exports.checkBlacklist = exports.isTokenBlacklisted = exports.blacklistToken = exports.canModify = exports.hasPermission = exports.isOwnerOrManager = exports.isOwner = exports.isAuthenticated = exports.isEmployee = exports.isAdminOrManager = exports.isAdmin = exports.authorize = exports.optionalAuthenticate = exports.authenticate = exports.decodeToken = exports.verifyRefreshToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var server_1 = require("../config/server");
var types_1 = require("../types");
var User_1 = require("../models/User");
var logger_1 = require("../utils/logger");
// ==========================================
// TOKEN EXTRACTION
// ==========================================
/**
 * Extract token from Authorization header
 */
var extractTokenFromHeader = function (req) {
    var authHeader = req.headers.authorization;
    if (!authHeader) {
        return null;
    }
    // Check for "Bearer TOKEN" format
    var parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
/**
 * Extract token from cookies
 */
var extractTokenFromCookie = function (req) {
    var _a, _b;
    return ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) || ((_b = req.signedCookies) === null || _b === void 0 ? void 0 : _b.token) || null;
};
/**
 * Extract token from request (header or cookie)
 */
var extractToken = function (req) {
    // Try header first
    var token = extractTokenFromHeader(req);
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
var verifyToken = function (token) {
    try {
        var decoded = jsonwebtoken_1.default.verify(token, server_1.JWT_CONFIG.SECRET);
        // Validate required fields
        if (!decoded.userId || !decoded.username || !decoded.role) {
            throw new types_1.UnauthorizedError('توکن نامعتبر است');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new types_1.UnauthorizedError('توکن منقضی شده است. لطفاً دوباره وارد شوید');
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new types_1.UnauthorizedError('توکن نامعتبر است');
        }
        throw error;
    }
};
/**
 * Generate access token
 */
var generateAccessToken = function (user) {
    var payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, server_1.JWT_CONFIG.SECRET, {
        expiresIn: server_1.JWT_CONFIG.EXPIRE,
        issuer: server_1.JWT_CONFIG.ISSUER,
        audience: server_1.JWT_CONFIG.AUDIENCE,
    });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generate refresh token
 */
var generateRefreshToken = function (user) {
    var payload = {
        userId: user.id,
        username: user.username,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, server_1.JWT_CONFIG.REFRESH_SECRET, {
        expiresIn: server_1.JWT_CONFIG.REFRESH_EXPIRE,
        issuer: server_1.JWT_CONFIG.ISSUER,
        audience: server_1.JWT_CONFIG.AUDIENCE,
    });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verify refresh token
 */
var verifyRefreshToken = function (token) {
    try {
        var decoded = jsonwebtoken_1.default.verify(token, server_1.JWT_CONFIG.REFRESH_SECRET);
        if (!decoded.userId || !decoded.username || !decoded.role) {
            throw new types_1.UnauthorizedError('توکن بازیابی نامعتبر است');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new types_1.UnauthorizedError('توکن بازیابی منقضی شده است. لطفاً دوباره وارد شوید');
        }
        throw new types_1.UnauthorizedError('توکن بازیابی نامعتبر است');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Decode token without verification (for debugging)
 */
var decodeToken = function (token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (_a) {
        return null;
    }
};
exports.decodeToken = decodeToken;
// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
/**
 * Authenticate user - verify token and attach user to request
 */
var authenticate = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, decoded, user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                token = extractToken(req);
                if (!token) {
                    throw new types_1.UnauthorizedError('توکن احراز هویت یافت نشد');
                }
                decoded = verifyToken(token);
                return [4 /*yield*/, User_1.default.findById(decoded.userId)];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new types_1.UnauthorizedError('کاربر یافت نشد');
                }
                if (!user.is_active) {
                    (0, logger_1.logSecurity)('Inactive user attempted access', 'medium', {
                        userId: user.id,
                        username: user.username,
                        ip: req.ip,
                    });
                    throw new types_1.UnauthorizedError('حساب کاربری غیرفعال است');
                }
                // Attach user info to request
                req.user = decoded;
                req.currentUser = User_1.default.omitPassword(user);
                logger_1.default.debug('User authenticated', {
                    userId: decoded.userId,
                    username: decoded.username,
                    role: decoded.role,
                    path: req.path,
                });
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                // Log failed authentication attempt
                (0, logger_1.logSecurity)('Failed authentication attempt', 'low', {
                    ip: req.ip,
                    path: req.path,
                    userAgent: req.get('user-agent'),
                    error: error_1.message,
                });
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.authenticate = authenticate;
/**
 * Optional authentication - attach user if token exists, but don't require it
 */
var optionalAuthenticate = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, decoded, user, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                token = extractToken(req);
                if (!token) return [3 /*break*/, 2];
                decoded = verifyToken(token);
                return [4 /*yield*/, User_1.default.findById(decoded.userId)];
            case 1:
                user = _a.sent();
                if (user && user.is_active) {
                    req.user = decoded;
                    req.currentUser = User_1.default.omitPassword(user);
                }
                _a.label = 2;
            case 2:
                next();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                // Silently fail for optional auth
                next();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.optionalAuthenticate = optionalAuthenticate;
// ==========================================
// AUTHORIZATION MIDDLEWARE
// ==========================================
/**
 * Authorize user based on roles
 */
var authorize = function () {
    var allowedRoles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        allowedRoles[_i] = arguments[_i];
    }
    return function (req, res, next) {
        try {
            if (!req.user) {
                throw new types_1.UnauthorizedError('احراز هویت انجام نشده است');
            }
            var userRole = req.user.role;
            if (!allowedRoles.includes(userRole)) {
                (0, logger_1.logSecurity)('Unauthorized access attempt', 'medium', {
                    userId: req.user.userId,
                    username: req.user.username,
                    role: userRole,
                    requiredRoles: allowedRoles,
                    path: req.path,
                    ip: req.ip,
                });
                throw new types_1.ForbiddenError('شما دسترسی به این بخش را ندارید');
            }
            logger_1.default.debug('User authorized', {
                userId: req.user.userId,
                role: userRole,
                allowedRoles: allowedRoles,
                path: req.path,
            });
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
/**
 * Check if user is admin
 */
exports.isAdmin = (0, exports.authorize)(types_1.UserRole.ADMIN);
/**
 * Check if user is admin or manager
 */
exports.isAdminOrManager = (0, exports.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER);
/**
 * Check if user is admin, manager, or employee
 */
exports.isEmployee = (0, exports.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER, types_1.UserRole.EMPLOYEE);
/**
 * Allow all authenticated users (any role)
 */
exports.isAuthenticated = exports.authenticate;
// ==========================================
// OWNERSHIP MIDDLEWARE
// ==========================================
/**
 * Check if user owns the resource (by user ID in params)
 */
var isOwner = function (req, res, next) {
    try {
        if (!req.user) {
            throw new types_1.UnauthorizedError('احراز هویت انجام نشده است');
        }
        var resourceUserId = req.params.userId || req.params.id;
        var currentUserId = req.user.userId;
        // Admin can access all resources
        if (req.user.role === types_1.UserRole.ADMIN) {
            return next();
        }
        // Check ownership
        if (resourceUserId !== currentUserId) {
            (0, logger_1.logSecurity)('Ownership check failed', 'medium', {
                userId: currentUserId,
                requestedResourceUserId: resourceUserId,
                path: req.path,
                ip: req.ip,
            });
            throw new types_1.ForbiddenError('شما فقط می‌توانید به اطلاعات خود دسترسی داشته باشید');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.isOwner = isOwner;
/**
 * Check if user owns resource or has admin/manager role
 */
var isOwnerOrManager = function (req, res, next) {
    try {
        if (!req.user) {
            throw new types_1.UnauthorizedError('احراز هویت انجام نشده است');
        }
        var resourceUserId = req.params.userId || req.params.id;
        var currentUserId = req.user.userId;
        var userRole = req.user.role;
        // Admin or manager can access all resources
        if (userRole === types_1.UserRole.ADMIN || userRole === types_1.UserRole.MANAGER) {
            return next();
        }
        // Check ownership
        if (resourceUserId !== currentUserId) {
            throw new types_1.ForbiddenError('شما دسترسی به این منبع را ندارید');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.isOwnerOrManager = isOwnerOrManager;
// ==========================================
// CUSTOM AUTHORIZATION HELPERS
// ==========================================
/**
 * Check if user has specific permission
 */
var hasPermission = function (permission) {
    return function (req, res, next) {
        var _a;
        try {
            if (!req.user) {
                throw new types_1.UnauthorizedError('احراز هویت انجام نشده است');
            }
            // Define permissions by role
            var rolePermissions = (_a = {},
                _a[types_1.UserRole.ADMIN] = ['*'],
                _a[types_1.UserRole.MANAGER] = [
                    'users:read',
                    'users:create',
                    'users:update',
                    'products:*',
                    'customers:*',
                    'sales:*',
                    'reports:*',
                ],
                _a[types_1.UserRole.EMPLOYEE] = [
                    'users:read:self',
                    'products:read',
                    'products:update',
                    'customers:*',
                    'sales:*',
                ],
                _a[types_1.UserRole.VIEWER] = [
                    'users:read:self',
                    'products:read',
                    'customers:read',
                    'sales:read',
                    'reports:read',
                ],
                _a);
            var userRole = req.user.role;
            var permissions = rolePermissions[userRole] || [];
            // Check if user has permission
            var hasAccess = permissions.includes('*') ||
                permissions.includes(permission) ||
                permissions.some(function (p) {
                    var _a = p.split(':'), resource = _a[0], action = _a[1];
                    var _b = permission.split(':'), reqResource = _b[0], reqAction = _b[1];
                    return resource === reqResource && (action === '*' || action === reqAction);
                });
            if (!hasAccess) {
                throw new types_1.ForbiddenError('شما دسترسی به این عملیات را ندارید');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.hasPermission = hasPermission;
/**
 * Check if user can modify resource based on creator
 */
var canModify = function (createdByField) {
    if (createdByField === void 0) { createdByField = 'created_by'; }
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var userRole, currentUserId;
        return __generator(this, function (_a) {
            try {
                if (!req.user) {
                    throw new types_1.UnauthorizedError('احراز هویت انجام نشده است');
                }
                userRole = req.user.role;
                currentUserId = req.user.userId;
                // Admin can modify anything
                if (userRole === types_1.UserRole.ADMIN) {
                    return [2 /*return*/, next()];
                }
                // For other roles, check if they created the resource
                // This should be implemented based on your resource logic
                // For now, managers can modify anything, others only their own
                if (userRole === types_1.UserRole.MANAGER) {
                    return [2 /*return*/, next()];
                }
                // Employees can only modify their own resources
                // You would typically fetch the resource and check created_by
                // Example: const resource = await Model.findById(req.params.id);
                // if (resource[createdByField] !== currentUserId) { throw error }
                next();
            }
            catch (error) {
                next(error);
            }
            return [2 /*return*/];
        });
    }); };
};
exports.canModify = canModify;
// ==========================================
// TOKEN BLACKLIST (Optional - for logout)
// ==========================================
// In-memory blacklist (in production, use Redis)
var tokenBlacklist = new Set();
/**
 * Add token to blacklist
 */
var blacklistToken = function (token) {
    tokenBlacklist.add(token);
    logger_1.default.info('Token blacklisted', { token: token.substring(0, 20) + '...' });
};
exports.blacklistToken = blacklistToken;
/**
 * Check if token is blacklisted
 */
var isTokenBlacklisted = function (token) {
    return tokenBlacklist.has(token);
};
exports.isTokenBlacklisted = isTokenBlacklisted;
/**
 * Middleware to check token blacklist
 */
var checkBlacklist = function (req, res, next) {
    try {
        var token = extractToken(req);
        if (token && (0, exports.isTokenBlacklisted)(token)) {
            throw new types_1.UnauthorizedError('توکن نامعتبر است');
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.checkBlacklist = checkBlacklist;
// ==========================================
// LOGIN ATTEMPT TRACKING (Rate Limiting)
// ==========================================
// Track failed login attempts (in production, use Redis)
var loginAttempts = new Map();
/**
 * Track failed login attempt
 */
var trackFailedLogin = function (identifier) {
    var attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    attempts.count += 1;
    attempts.lastAttempt = new Date();
    loginAttempts.set(identifier, attempts);
    (0, logger_1.logSecurity)('Failed login attempt', 'low', {
        identifier: identifier,
        attempts: attempts.count,
    });
};
exports.trackFailedLogin = trackFailedLogin;
/**
 * Reset login attempts on successful login
 */
var resetLoginAttempts = function (identifier) {
    loginAttempts.delete(identifier);
};
exports.resetLoginAttempts = resetLoginAttempts;
/**
 * Check if account is locked due to too many failed attempts
 */
var isAccountLocked = function (identifier) {
    var attempts = loginAttempts.get(identifier);
    if (!attempts) {
        return false;
    }
    // Lock after 5 failed attempts
    if (attempts.count >= 5) {
        // Check if lock period (15 minutes) has passed
        var lockDuration = 15 * 60 * 1000; // 15 minutes
        var timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
        if (timeSinceLastAttempt < lockDuration) {
            return true;
        }
        else {
            // Lock period expired, reset attempts
            loginAttempts.delete(identifier);
            return false;
        }
    }
    return false;
};
exports.isAccountLocked = isAccountLocked;
/**
 * Middleware to check account lock status
 */
var checkAccountLock = function (identifierField) {
    if (identifierField === void 0) { identifierField = 'username'; }
    return function (req, res, next) {
        try {
            var identifier = req.body[identifierField];
            if (identifier && (0, exports.isAccountLocked)(identifier)) {
                (0, logger_1.logSecurity)('Locked account access attempt', 'high', {
                    identifier: identifier,
                    ip: req.ip,
                });
                throw new types_1.UnauthorizedError('حساب کاربری به دلیل تلاش‌های متعدد ناموفق قفل شده است. لطفاً 15 دقیقه صبر کنید');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkAccountLock = checkAccountLock;
// ==========================================
// MIDDLEWARE COMBINATIONS
// ==========================================
/**
 * Protect route - require authentication
 */
exports.protect = exports.authenticate;
/**
 * Protect route with role-based access
 */
var protectWithRole = function () {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return [exports.authenticate, exports.authorize.apply(void 0, roles)];
};
exports.protectWithRole = protectWithRole;
/**
 * Protect route and check ownership
 */
exports.protectOwn = [exports.authenticate, exports.isOwner];
/**
 * Protect route and check ownership or manager role
 */
exports.protectOwnOrManager = [exports.authenticate, exports.isOwnerOrManager];
// ==========================================
// UTILITY FUNCTIONS
// ==========================================
/**
 * Get current user from request
 */
var getCurrentUser = function (req) {
    return req.user;
};
exports.getCurrentUser = getCurrentUser;
/**
 * Get current user ID from request
 */
var getCurrentUserId = function (req) {
    var _a;
    return (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
};
exports.getCurrentUserId = getCurrentUserId;
/**
 * Get current user role from request
 */
var getCurrentUserRole = function (req) {
    var _a;
    return (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
};
exports.getCurrentUserRole = getCurrentUserRole;
/**
 * Check if current user is admin
 */
var isCurrentUserAdmin = function (req) {
    var _a;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === types_1.UserRole.ADMIN;
};
exports.isCurrentUserAdmin = isCurrentUserAdmin;
/**
 * Check if current user is manager or admin
 */
var isCurrentUserManagerOrAdmin = function (req) {
    var _a;
    var role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    return role === types_1.UserRole.ADMIN || role === types_1.UserRole.MANAGER;
};
exports.isCurrentUserManagerOrAdmin = isCurrentUserManagerOrAdmin;
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    // Main middleware
    authenticate: exports.authenticate,
    optionalAuthenticate: exports.optionalAuthenticate,
    authorize: exports.authorize,
    // Role-based
    isAdmin: exports.isAdmin,
    isAdminOrManager: exports.isAdminOrManager,
    isEmployee: exports.isEmployee,
    isAuthenticated: exports.isAuthenticated,
    // Ownership
    isOwner: exports.isOwner,
    isOwnerOrManager: exports.isOwnerOrManager,
    // Custom
    hasPermission: exports.hasPermission,
    canModify: exports.canModify,
    // Blacklist
    checkBlacklist: exports.checkBlacklist,
    blacklistToken: exports.blacklistToken,
    isTokenBlacklisted: exports.isTokenBlacklisted,
    // Login attempts
    checkAccountLock: exports.checkAccountLock,
    trackFailedLogin: exports.trackFailedLogin,
    resetLoginAttempts: exports.resetLoginAttempts,
    isAccountLocked: exports.isAccountLocked,
    // Combinations
    protect: exports.protect,
    protectWithRole: exports.protectWithRole,
    protectOwn: exports.protectOwn,
    protectOwnOrManager: exports.protectOwnOrManager,
    // Token operations
    generateAccessToken: exports.generateAccessToken,
    generateRefreshToken: exports.generateRefreshToken,
    verifyRefreshToken: exports.verifyRefreshToken,
    decodeToken: exports.decodeToken,
    // Utilities
    getCurrentUser: exports.getCurrentUser,
    getCurrentUserId: exports.getCurrentUserId,
    getCurrentUserRole: exports.getCurrentUserRole,
    isCurrentUserAdmin: exports.isCurrentUserAdmin,
    isCurrentUserManagerOrAdmin: exports.isCurrentUserManagerOrAdmin,
};
