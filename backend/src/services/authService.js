"use strict";
// ==========================================
// ZARMIND - Authentication Service
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
var User_1 = require("../models/User");
var types_1 = require("../types");
var jsonwebtoken_1 = require("jsonwebtoken");
var auth_middleware_1 = require("../middleware/auth.middleware");
var logger_1 = require("../utils/logger");
var helpers_1 = require("../utils/helpers");
// ==========================================
// AUTHENTICATION SERVICE
// ==========================================
var AuthService = /** @class */ (function () {
    function AuthService() {
    }
    // ==========================================
    // LOGIN
    // ==========================================
    /**
     * Authenticate user and return tokens
     */
    AuthService.prototype.login = function (credentials, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function () {
            var username, password, rememberMe, sanitizedUsername, user, tokens, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        username = credentials.username, password = credentials.password, rememberMe = credentials.rememberMe;
                        sanitizedUsername = username.trim().toLowerCase();
                        // Check if account is locked
                        if ((0, auth_middleware_1.isAccountLocked)(sanitizedUsername)) {
                            (0, logger_1.logSecurity)('Locked account login attempt', 'medium', {
                                username: sanitizedUsername,
                                ip: ipAddress,
                            });
                            throw new types_1.UnauthorizedError('حساب کاربری شما به دلیل تلاش‌های متعدد ناموفق قفل شده است. لطفاً 15 دقیقه صبر کنید');
                        }
                        return [4 /*yield*/, User_1.default.verifyCredentials(sanitizedUsername, password)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            // Track failed login attempt
                            (0, auth_middleware_1.trackFailedLogin)(sanitizedUsername);
                            (0, logger_1.logAuth)('failed_login', sanitizedUsername, ipAddress, userAgent);
                            throw new types_1.UnauthorizedError('نام کاربری یا رمز عبور اشتباه است');
                        }
                        // Reset failed login attempts on successful login
                        (0, auth_middleware_1.resetLoginAttempts)(sanitizedUsername);
                        tokens = this.generateTokens(user, rememberMe);
                        // Log successful login
                        (0, logger_1.logAuth)('login', user.username, ipAddress, userAgent);
                        logger_1.default.info('User logged in successfully', {
                            userId: user.id,
                            username: user.username,
                            role: user.role,
                            ip: ipAddress,
                        });
                        return [2 /*return*/, {
                                user: User_1.default.omitPassword(user),
                                tokens: tokens,
                            }];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.default.error('Login error:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Login with email instead of username
     */
    AuthService.prototype.loginWithEmail = function (email, password, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function () {
            var sanitizedEmail, user, isPasswordValid, tokens, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        sanitizedEmail = email.trim().toLowerCase();
                        // Check if account is locked
                        if ((0, auth_middleware_1.isAccountLocked)(sanitizedEmail)) {
                            throw new types_1.UnauthorizedError('حساب کاربری شما به دلیل تلاش‌های متعدد ناموفق قفل شده است. لطفاً 15 دقیقه صبر کنید');
                        }
                        return [4 /*yield*/, User_1.default.findByEmail(sanitizedEmail)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            (0, auth_middleware_1.trackFailedLogin)(sanitizedEmail);
                            throw new types_1.UnauthorizedError('ایمیل یا رمز عبور اشتباه است');
                        }
                        return [4 /*yield*/, User_1.default.comparePassword(password, user.password)];
                    case 2:
                        isPasswordValid = _a.sent();
                        if (!isPasswordValid) {
                            (0, auth_middleware_1.trackFailedLogin)(sanitizedEmail);
                            throw new types_1.UnauthorizedError('ایمیل یا رمز عبور اشتباه است');
                        }
                        if (!user.is_active) {
                            throw new types_1.UnauthorizedError('حساب کاربری غیرفعال است');
                        }
                        // Reset failed attempts and update last login
                        (0, auth_middleware_1.resetLoginAttempts)(sanitizedEmail);
                        return [4 /*yield*/, User_1.default.updateLastLogin(user.id)];
                    case 3:
                        _a.sent();
                        tokens = this.generateTokens(user);
                        (0, logger_1.logAuth)('login', user.username, ipAddress, userAgent);
                        return [2 /*return*/, {
                                user: User_1.default.omitPassword(user),
                                tokens: tokens,
                            }];
                    case 4:
                        error_2 = _a.sent();
                        logger_1.default.error('Login with email error:', error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // REGISTER
    // ==========================================
    /**
     * Register new user
     */
    AuthService.prototype.register = function (registerData, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function () {
            var sanitizedData, usernameExists, emailExists, user, tokens, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        // Validate passwords match
                        if (registerData.password !== registerData.confirmPassword) {
                            throw new types_1.ValidationError('رمز عبور و تکرار آن مطابقت ندارند');
                        }
                        sanitizedData = {
                            username: registerData.username.trim().toLowerCase(),
                            email: registerData.email.trim().toLowerCase(),
                            password: registerData.password,
                            full_name: registerData.full_name.trim(),
                            role: registerData.role,
                            phone: registerData.phone ? (0, helpers_1.sanitizePhoneNumber)(registerData.phone) : undefined,
                            avatar: registerData.avatar,
                            is_active: registerData.is_active !== undefined ? registerData.is_active : true,
                        };
                        return [4 /*yield*/, User_1.default.findByUsername(sanitizedData.username)];
                    case 1:
                        usernameExists = _a.sent();
                        if (usernameExists) {
                            throw new types_1.ConflictError("\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \"".concat(sanitizedData.username, "\" \u0642\u0628\u0644\u0627\u064B \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A"));
                        }
                        return [4 /*yield*/, User_1.default.findByEmail(sanitizedData.email)];
                    case 2:
                        emailExists = _a.sent();
                        if (emailExists) {
                            throw new types_1.ConflictError("\u0627\u06CC\u0645\u06CC\u0644 \"".concat(sanitizedData.email, "\" \u0642\u0628\u0644\u0627\u064B \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A"));
                        }
                        return [4 /*yield*/, User_1.default.create(sanitizedData)];
                    case 3:
                        user = _a.sent();
                        tokens = this.generateTokens(user);
                        // Log registration
                        (0, logger_1.logAuth)('register', user.username, ipAddress, userAgent);
                        logger_1.default.info('User registered successfully', {
                            userId: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role,
                        });
                        return [2 /*return*/, {
                                user: User_1.default.omitPassword(user),
                                tokens: tokens,
                            }];
                    case 4:
                        error_3 = _a.sent();
                        logger_1.default.error('Registration error:', error_3);
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // LOGOUT
    // ==========================================
    /**
     * Logout user and blacklist token
     */
    AuthService.prototype.logout = function (accessToken, userId, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Add token to blacklist
                        if (accessToken) {
                            (0, auth_middleware_1.blacklistToken)(accessToken);
                        }
                        if (!userId) return [3 /*break*/, 2];
                        return [4 /*yield*/, User_1.default.findById(userId)];
                    case 1:
                        user = _a.sent();
                        if (user) {
                            (0, logger_1.logAuth)('logout', user.username, ipAddress, userAgent);
                        }
                        logger_1.default.info('User logged out', {
                            userId: userId,
                            ip: ipAddress,
                        });
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        logger_1.default.error('Logout error:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // TOKEN OPERATIONS
    // ==========================================
    /**
     * Generate access and refresh tokens
     */
    AuthService.prototype.generateTokens = function (user, rememberMe) {
        var accessToken = (0, auth_middleware_1.generateAccessToken)(user);
        var refreshToken = (0, auth_middleware_1.generateRefreshToken)(user);
        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
        };
    };
    /**
     * Refresh access token using refresh token
     */
    AuthService.prototype.refreshAccessToken = function (refreshTokenData) {
        return __awaiter(this, void 0, void 0, function () {
            var refreshToken, decoded, user, tokens, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        refreshToken = refreshTokenData.refreshToken;
                        decoded = (0, auth_middleware_1.verifyRefreshToken)(refreshToken);
                        return [4 /*yield*/, User_1.default.findById(decoded.userId)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new types_1.UnauthorizedError('کاربر یافت نشد');
                        }
                        if (!user.is_active) {
                            throw new types_1.UnauthorizedError('حساب کاربری غیرفعال است');
                        }
                        tokens = this.generateTokens(user);
                        logger_1.default.info('Access token refreshed', {
                            userId: user.id,
                            username: user.username,
                        });
                        return [2 /*return*/, tokens];
                    case 2:
                        error_5 = _a.sent();
                        logger_1.default.error('Token refresh error:', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate access token
     */
    AuthService.prototype.validateToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var jwt, JWT_CONFIG, decoded, user, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        jwt = require('jsonwebtoken');
                        JWT_CONFIG = require('../config/server').JWT_CONFIG;
                        decoded = jwt.verify(token, JWT_CONFIG.SECRET);
                        return [4 /*yield*/, User_1.default.findById(decoded.userId)];
                    case 1:
                        user = _a.sent();
                        if (!user || !user.is_active) {
                            throw new types_1.UnauthorizedError('توکن نامعتبر است');
                        }
                        return [2 /*return*/, decoded];
                    case 2:
                        error_6 = _a.sent();
                        throw new types_1.UnauthorizedError('توکن نامعتبر یا منقضی شده است');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // PASSWORD MANAGEMENT
    // ==========================================
    /**
     * Change user password
     */
    AuthService.prototype.changePassword = function (passwordData) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, currentPassword, newPassword, confirmPassword, user, isCurrentPasswordValid, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        userId = passwordData.userId, currentPassword = passwordData.currentPassword, newPassword = passwordData.newPassword, confirmPassword = passwordData.confirmPassword;
                        // Validate new passwords match
                        if (newPassword !== confirmPassword) {
                            throw new types_1.ValidationError('رمز عبور جدید و تکرار آن مطابقت ندارند');
                        }
                        // Validate new password is different from current
                        if (currentPassword === newPassword) {
                            throw new types_1.ValidationError('رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد');
                        }
                        return [4 /*yield*/, User_1.default.findById(userId)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new types_1.NotFoundError('کاربر یافت نشد');
                        }
                        return [4 /*yield*/, User_1.default.comparePassword(currentPassword, user.password)];
                    case 2:
                        isCurrentPasswordValid = _a.sent();
                        if (!isCurrentPasswordValid) {
                            throw new types_1.UnauthorizedError('رمز عبور فعلی اشتباه است');
                        }
                        // Update password
                        return [4 /*yield*/, User_1.default.updatePassword(userId, newPassword)];
                    case 3:
                        // Update password
                        _a.sent();
                        logger_1.default.info('Password changed successfully', {
                            userId: userId,
                            username: user.username,
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        error_7 = _a.sent();
                        logger_1.default.error('Change password error:', error_7);
                        throw error_7;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reset password (admin function - no current password required)
     */
    AuthService.prototype.resetPassword = function (resetData) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, newPassword, user, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        userId = resetData.userId, newPassword = resetData.newPassword;
                        return [4 /*yield*/, User_1.default.findById(userId)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new types_1.NotFoundError('کاربر یافت نشد');
                        }
                        // Update password
                        return [4 /*yield*/, User_1.default.updatePassword(userId, newPassword)];
                    case 2:
                        // Update password
                        _a.sent();
                        logger_1.default.warn('Password reset by admin', {
                            userId: userId,
                            username: user.username,
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        logger_1.default.error('Reset password error:', error_8);
                        throw error_8;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Request password reset (generate reset token)
     * Note: This is a placeholder - in production, you'd send an email with reset link
     */
    AuthService.prototype.requestPasswordReset = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var user, jwt, JWT_CONFIG, resetToken, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, User_1.default.findByEmail(email.trim().toLowerCase())];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            // Don't reveal if user exists
                            return [2 /*return*/, {
                                    message: 'اگر این ایمیل در سیستم موجود باشد، لینک بازیابی رمز عبور برای شما ارسال می‌شود',
                                }];
                        }
                        jwt = require('jsonwebtoken');
                        JWT_CONFIG = require('../config/server').JWT_CONFIG;
                        resetToken = jwt.sign({ userId: user.id, type: 'password_reset' }, JWT_CONFIG.SECRET, { expiresIn: '1h' });
                        // In production: Send email with reset link
                        // await emailService.sendPasswordResetEmail(user.email, resetToken);
                        logger_1.default.info('Password reset requested', {
                            userId: user.id,
                            email: user.email,
                        });
                        // In development, return token (remove in production)
                        if (process.env.NODE_ENV === 'development') {
                            return [2 /*return*/, {
                                    message: 'لینک بازیابی رمز عبور برای شما ارسال شد',
                                    resetToken: resetToken,
                                }];
                        }
                        return [2 /*return*/, {
                                message: 'لینک بازیابی رمز عبور برای شما ارسال شد',
                            }];
                    case 2:
                        error_9 = _a.sent();
                        logger_1.default.error('Request password reset error:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Confirm password reset with token
     */
    AuthService.prototype.confirmPasswordReset = function (resetToken, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var jwt, JWT_CONFIG, decoded, user, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        jwt = require('jsonwebtoken');
                        JWT_CONFIG = require('../config/server').JWT_CONFIG;
                        decoded = jwt.verify(resetToken, JWT_CONFIG.SECRET);
                        if (decoded.type !== 'password_reset') {
                            throw new types_1.UnauthorizedError('توکن بازیابی نامعتبر است');
                        }
                        return [4 /*yield*/, User_1.default.findById(decoded.userId)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new types_1.NotFoundError('کاربر یافت نشد');
                        }
                        // Update password
                        return [4 /*yield*/, User_1.default.updatePassword(decoded.userId, newPassword)];
                    case 2:
                        // Update password
                        _a.sent();
                        logger_1.default.info('Password reset confirmed', {
                            userId: user.id,
                            username: user.username,
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_10 = _a.sent();
                        if (error_10 instanceof jsonwebtoken_1.TokenExpiredError) {
                            throw new types_1.UnauthorizedError('لینک بازیابی منقضی شده است. لطفاً دوباره درخواست دهید');
                        }
                        logger_1.default.error('Confirm password reset error:', error_10);
                        throw error_10;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // USER PROFILE
    // ==========================================
    /**
     * Get current user profile
     */
    AuthService.prototype.getProfile = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, User_1.default.findByIdSafe(userId)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new types_1.NotFoundError('کاربر یافت نشد');
                        }
                        return [2 /*return*/, user];
                    case 2:
                        error_11 = _a.sent();
                        logger_1.default.error('Get profile error:', error_11);
                        throw error_11;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update user profile
     */
    AuthService.prototype.updateProfile = function (userId, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedUser, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Sanitize phone if provided
                        if (updateData.phone) {
                            updateData.phone = (0, helpers_1.sanitizePhoneNumber)(updateData.phone);
                        }
                        // Sanitize email if provided
                        if (updateData.email) {
                            updateData.email = updateData.email.trim().toLowerCase();
                        }
                        return [4 /*yield*/, User_1.default.update(userId, updateData)];
                    case 1:
                        updatedUser = _a.sent();
                        logger_1.default.info('Profile updated', {
                            userId: userId,
                            username: updatedUser.username,
                        });
                        return [2 /*return*/, User_1.default.omitPassword(updatedUser)];
                    case 2:
                        error_12 = _a.sent();
                        logger_1.default.error('Update profile error:', error_12);
                        throw error_12;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // ACCOUNT VERIFICATION
    // ==========================================
    /**
     * Check if username is available
     */
    AuthService.prototype.checkUsernameAvailability = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var sanitizedUsername;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sanitizedUsername = username.trim().toLowerCase();
                        return [4 /*yield*/, User_1.default.isUsernameAvailable(sanitizedUsername)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Check if email is available
     */
    AuthService.prototype.checkEmailAvailability = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var sanitizedEmail;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sanitizedEmail = email.trim().toLowerCase();
                        return [4 /*yield*/, User_1.default.isEmailAvailable(sanitizedEmail)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Verify user exists and is active
     */
    AuthService.prototype.verifyUserActive = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, User_1.default.findById(userId)];
                    case 1:
                        user = _a.sent();
                        return [2 /*return*/, user !== null && user.is_active];
                }
            });
        });
    };
    // ==========================================
    // SESSION MANAGEMENT
    // ==========================================
    /**
     * Get all active sessions for user (placeholder)
     * In production, track sessions in Redis
     */
    AuthService.prototype.getActiveSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would query Redis or session store
                // For now, return empty array
                return [2 /*return*/, []];
            });
        });
    };
    /**
     * Revoke all sessions for user (force logout everywhere)
     */
    AuthService.prototype.revokeAllSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // In production, clear all sessions from Redis
                    // and blacklist all active tokens
                    logger_1.default.warn('All sessions revoked for user', { userId: userId });
                }
                catch (error) {
                    logger_1.default.error('Revoke sessions error:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    // ==========================================
    // SECURITY
    // ==========================================
    /**
     * Get user's recent login history (placeholder)
     */
    AuthService.prototype.getLoginHistory = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, limit) {
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                // This would query audit logs
                // For now, return empty array
                return [2 /*return*/, []];
            });
        });
    };
    /**
     * Enable two-factor authentication (placeholder)
     */
    AuthService.prototype.enableTwoFactor = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would setup 2FA with libraries like speakeasy
                throw new Error('Two-factor authentication not implemented yet');
            });
        });
    };
    /**
     * Verify two-factor code (placeholder)
     */
    AuthService.prototype.verifyTwoFactor = function (userId, code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would verify 2FA code
                throw new Error('Two-factor authentication not implemented yet');
            });
        });
    };
    return AuthService;
}());
// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================
exports.default = new AuthService();
