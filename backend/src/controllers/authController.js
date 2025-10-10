"use strict";
// ==========================================
// ZARMIND - Authentication Controller
// ==========================================
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.getAuthStatus = exports.verifyAuthentication = exports.verifyTwoFactor = exports.enableTwoFactor = exports.getLoginHistory = exports.revokeSessions = exports.getSessions = exports.checkAvailability = exports.checkEmail = exports.checkUsername = exports.adminResetPassword = exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.updateAvatar = exports.updateProfile = exports.getProfile = exports.validateToken = exports.refreshToken = exports.logout = exports.register = exports.loginWithEmail = exports.login = void 0;
var error_middleware_1 = require("../middleware/error.middleware");
var authService_1 = require("../services/authService");
var auth_middleware_1 = require("../middleware/auth.middleware");
var types_1 = require("../types");
var server_1 = require("../config/server");
// ==========================================
// HELPER FUNCTIONS
// ==========================================
/**
 * Set authentication cookies
 */
var setAuthCookies = function (res, accessToken, refreshToken) {
    // Access token cookie (short-lived)
    res.cookie('accessToken', accessToken, __assign(__assign({}, server_1.COOKIE_CONFIG.OPTIONS), { maxAge: 7 * 24 * 60 * 60 * 1000 }));
    // Refresh token cookie (long-lived)
    res.cookie('refreshToken', refreshToken, __assign(__assign({}, server_1.COOKIE_CONFIG.OPTIONS), { maxAge: 30 * 24 * 60 * 60 * 1000 }));
};
/**
 * Clear authentication cookies
 */
var clearAuthCookies = function (res) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};
/**
 * Extract access token from request
 */
var extractAccessToken = function (req) {
    var _a, _b;
    // Try header first
    var authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    // Try cookie
    return ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) || ((_b = req.signedCookies) === null || _b === void 0 ? void 0 : _b.accessToken) || null;
};
// ==========================================
// AUTHENTICATION CONTROLLERS
// ==========================================
/**
 * @route   POST /api/auth/login
 * @desc    Login user with username/password
 * @access  Public
 */
exports.login = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, rememberMe, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, username = _a.username, password = _a.password, rememberMe = _a.rememberMe;
                // Validate input
                if (!username || !password) {
                    throw new types_1.ValidationError('نام کاربری و رمز عبور الزامی است');
                }
                return [4 /*yield*/, authService_1.default.login({ username: username, password: password, rememberMe: rememberMe }, req.ip, req.get('user-agent'))];
            case 1:
                result = _b.sent();
                // Set cookies
                setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
                // Send response
                res.sendSuccess({
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    refreshToken: result.tokens.refreshToken,
                }, 'ورود موفقیت‌آمیز بود');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/login-email
 * @desc    Login user with email/password
 * @access  Public
 */
exports.loginWithEmail = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, rememberMe, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password, rememberMe = _a.rememberMe;
                // Validate input
                if (!email || !password) {
                    throw new types_1.ValidationError('ایمیل و رمز عبور الزامی است');
                }
                return [4 /*yield*/, authService_1.default.loginWithEmail(email, password, req.ip, req.get('user-agent'))];
            case 1:
                result = _b.sent();
                // Set cookies
                setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
                // Send response
                res.sendSuccess({
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    refreshToken: result.tokens.refreshToken,
                }, 'ورود موفقیت‌آمیز بود');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (or Admin only for creating users)
 */
exports.register = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var registerData, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                registerData = req.body;
                return [4 /*yield*/, authService_1.default.register(registerData, req.ip, req.get('user-agent'))];
            case 1:
                result = _a.sent();
                // Set cookies
                setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
                // Send response
                res.status(201).json({
                    success: true,
                    message: 'ثبت‌نام با موفقیت انجام شد',
                    data: {
                        user: result.user,
                        accessToken: result.tokens.accessToken,
                        refreshToken: result.tokens.refreshToken,
                    },
                });
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and blacklist token
 * @access  Private
 */
exports.logout = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, accessToken;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                accessToken = extractAccessToken(req);
                if (!accessToken) return [3 /*break*/, 2];
                return [4 /*yield*/, authService_1.default.logout(accessToken, userId, req.ip, req.get('user-agent'))];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                // Clear cookies
                clearAuthCookies(res);
                res.sendSuccess(null, 'خروج با موفقیت انجام شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
exports.refreshToken = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken, tokens;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                refreshToken = req.body.refreshToken;
                if (!refreshToken) {
                    throw new types_1.ValidationError('توکن بازیابی الزامی است');
                }
                return [4 /*yield*/, authService_1.default.refreshAccessToken({ refreshToken: refreshToken })];
            case 1:
                tokens = _a.sent();
                // Set new cookies
                setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
                res.sendSuccess({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                }, 'توکن با موفقیت بازیابی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/validate
 * @desc    Validate access token
 * @access  Public
 */
exports.validateToken = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, payload;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = req.body.token;
                if (!token) {
                    throw new types_1.ValidationError('توکن الزامی است');
                }
                return [4 /*yield*/, authService_1.default.validateToken(token)];
            case 1:
                payload = _a.sent();
                res.sendSuccess({
                    valid: true,
                    payload: payload,
                }, 'توکن معتبر است');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// PROFILE CONTROLLERS
// ==========================================
/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
exports.getProfile = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, profile;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                return [4 /*yield*/, authService_1.default.getProfile(userId)];
            case 1:
                profile = _a.sent();
                res.sendSuccess(profile, 'اطلاعات پروفایل دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
exports.updateProfile = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, full_name, phone, email, avatar, updatedProfile;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                _a = req.body, full_name = _a.full_name, phone = _a.phone, email = _a.email, avatar = _a.avatar;
                return [4 /*yield*/, authService_1.default.updateProfile(userId, {
                        full_name: full_name,
                        phone: phone,
                        email: email,
                        avatar: avatar,
                    })];
            case 1:
                updatedProfile = _b.sent();
                res.sendSuccess(updatedProfile, 'پروفایل با موفقیت به‌روزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   PUT /api/auth/avatar
 * @desc    Update user avatar
 * @access  Private
 */
exports.updateAvatar = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, avatarUrl, updatedProfile;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                avatarUrl = req.body.avatar || ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path);
                if (!avatarUrl) {
                    throw new types_1.ValidationError('فایل تصویر الزامی است');
                }
                return [4 /*yield*/, authService_1.default.updateProfile(userId, {
                        avatar: avatarUrl,
                    })];
            case 1:
                updatedProfile = _b.sent();
                res.sendSuccess(updatedProfile, 'تصویر پروفایل با موفقیت به‌روزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// PASSWORD CONTROLLERS
// ==========================================
/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password (requires current password)
 * @access  Private
 */
exports.changePassword = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, currentPassword, newPassword, confirmPassword;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                _a = req.body, currentPassword = _a.currentPassword, newPassword = _a.newPassword, confirmPassword = _a.confirmPassword;
                // Validate input
                if (!currentPassword || !newPassword || !confirmPassword) {
                    throw new types_1.ValidationError('تمام فیلدها الزامی هستند');
                }
                return [4 /*yield*/, authService_1.default.changePassword({
                        userId: userId,
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword,
                    })];
            case 1:
                _b.sent();
                res.sendSuccess(null, 'رمز عبور با موفقیت تغییر کرد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (send reset email)
 * @access  Public
 */
exports.forgotPassword = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var email, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                email = req.body.email;
                if (!email) {
                    throw new types_1.ValidationError('ایمیل الزامی است');
                }
                return [4 /*yield*/, authService_1.default.requestPasswordReset(email)];
            case 1:
                result = _a.sent();
                // In production, only send message (hide resetToken)
                if (process.env.NODE_ENV === 'development') {
                    res.sendSuccess(result, result.message);
                }
                else {
                    res.sendSuccess({ message: result.message }, result.message);
                }
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with reset token
 * @access  Public
 */
exports.resetPassword = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, resetToken, newPassword, confirmPassword;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, resetToken = _a.resetToken, newPassword = _a.newPassword, confirmPassword = _a.confirmPassword;
                if (!resetToken || !newPassword || !confirmPassword) {
                    throw new types_1.ValidationError('تمام فیلدها الزامی هستند');
                }
                if (newPassword !== confirmPassword) {
                    throw new types_1.ValidationError('رمز عبور جدید و تکرار آن مطابقت ندارند');
                }
                return [4 /*yield*/, authService_1.default.confirmPasswordReset(resetToken, newPassword)];
            case 1:
                _b.sent();
                res.sendSuccess(null, 'رمز عبور با موفقیت بازیابی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   PUT /api/auth/reset-password/:userId
 * @desc    Admin reset user password (no current password required)
 * @access  Private (Admin only)
 */
exports.adminResetPassword = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, newPassword;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.params.userId;
                newPassword = req.body.newPassword;
                if (!newPassword) {
                    throw new types_1.ValidationError('رمز عبور جدید الزامی است');
                }
                return [4 /*yield*/, authService_1.default.resetPassword({ userId: userId, newPassword: newPassword })];
            case 1:
                _a.sent();
                res.sendSuccess(null, 'رمز عبور کاربر با موفقیت بازنشانی شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// ACCOUNT VERIFICATION CONTROLLERS
// ==========================================
/**
 * @route   GET /api/auth/check-username/:username
 * @desc    Check if username is available
 * @access  Public
 */
exports.checkUsername = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var username, isAvailable;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                username = req.params.username;
                if (!username) {
                    throw new types_1.ValidationError('نام کاربری الزامی است');
                }
                return [4 /*yield*/, authService_1.default.checkUsernameAvailability(username)];
            case 1:
                isAvailable = _a.sent();
                res.sendSuccess({
                    username: username,
                    available: isAvailable,
                }, isAvailable ? 'نام کاربری در دسترس است' : 'نام کاربری قبلاً ثبت شده است');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   GET /api/auth/check-email/:email
 * @desc    Check if email is available
 * @access  Public
 */
exports.checkEmail = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var email, isAvailable;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                email = req.params.email;
                if (!email) {
                    throw new types_1.ValidationError('ایمیل الزامی است');
                }
                return [4 /*yield*/, authService_1.default.checkEmailAvailability(email)];
            case 1:
                isAvailable = _a.sent();
                res.sendSuccess({
                    email: email,
                    available: isAvailable,
                }, isAvailable ? 'ایمیل در دسترس است' : 'ایمیل قبلاً ثبت شده است');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/check-availability
 * @desc    Check username and email availability
 * @access  Public
 */
exports.checkAvailability = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, email, result, usernameAvailable, emailAvailable;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, username = _a.username, email = _a.email;
                result = {};
                if (!username) return [3 /*break*/, 2];
                return [4 /*yield*/, authService_1.default.checkUsernameAvailability(username)];
            case 1:
                usernameAvailable = _b.sent();
                result.username = {
                    value: username,
                    available: usernameAvailable,
                };
                _b.label = 2;
            case 2:
                if (!email) return [3 /*break*/, 4];
                return [4 /*yield*/, authService_1.default.checkEmailAvailability(email)];
            case 3:
                emailAvailable = _b.sent();
                result.email = {
                    value: email,
                    available: emailAvailable,
                };
                _b.label = 4;
            case 4:
                res.sendSuccess(result, 'بررسی در دسترس بودن انجام شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// SESSION MANAGEMENT CONTROLLERS
// ==========================================
/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
exports.getSessions = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, sessions;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                return [4 /*yield*/, authService_1.default.getActiveSessions(userId)];
            case 1:
                sessions = _a.sent();
                res.sendSuccess(sessions, 'لیست نشست‌های فعال دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   DELETE /api/auth/sessions
 * @desc    Revoke all sessions (logout from all devices)
 * @access  Private
 */
exports.revokeSessions = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                return [4 /*yield*/, authService_1.default.revokeAllSessions(userId)];
            case 1:
                _a.sent();
                // Clear current session cookies
                clearAuthCookies(res);
                res.sendSuccess(null, 'تمام نشست‌ها با موفقیت لغو شدند');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// SECURITY CONTROLLERS
// ==========================================
/**
 * @route   GET /api/auth/login-history
 * @desc    Get user's recent login history
 * @access  Private
 */
exports.getLoginHistory = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, limit, history;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                limit = parseInt(req.query.limit) || 10;
                return [4 /*yield*/, authService_1.default.getLoginHistory(userId, limit)];
            case 1:
                history = _a.sent();
                res.sendSuccess(history, 'تاریخچه ورود دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/enable-2fa
 * @desc    Enable two-factor authentication
 * @access  Private
 */
exports.enableTwoFactor = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, authService_1.default.enableTwoFactor(userId)];
            case 2:
                result = _a.sent();
                res.sendSuccess(result, 'احراز هویت دو مرحله‌ای فعال شد');
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                res.sendSuccess(null, 'احراز هویت دو مرحله‌ای هنوز پیاده‌سازی نشده است');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify two-factor authentication code
 * @access  Private
 */
exports.verifyTwoFactor = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, code, isValid, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                code = req.body.code;
                if (!userId) {
                    throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
                }
                if (!code) {
                    throw new types_1.ValidationError('کد تایید الزامی است');
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, authService_1.default.verifyTwoFactor(userId, code)];
            case 2:
                isValid = _a.sent();
                res.sendSuccess({ valid: isValid }, 'کد تایید معتبر است');
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                res.sendSuccess(null, 'احراز هویت دو مرحله‌ای هنوز پیاده‌سازی نشده است');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// ==========================================
// UTILITY CONTROLLERS
// ==========================================
/**
 * @route   GET /api/auth/verify
 * @desc    Verify if user is authenticated
 * @access  Private
 */
exports.verifyAuthentication = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user;
    return __generator(this, function (_a) {
        user = (0, auth_middleware_1.getCurrentUser)(req);
        if (!user) {
            throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
        }
        res.sendSuccess({
            authenticated: true,
            user: user,
        }, 'کاربر احراز هویت شده است');
        return [2 /*return*/];
    });
}); });
/**
 * @route   GET /api/auth/status
 * @desc    Get authentication status and user info
 * @access  Public (with optional auth)
 */
exports.getAuthStatus = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user;
    return __generator(this, function (_a) {
        user = (0, auth_middleware_1.getCurrentUser)(req);
        res.sendSuccess({
            authenticated: !!user,
            user: user || null,
        });
        return [2 /*return*/];
    });
}); });
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    // Authentication
    login: exports.login,
    loginWithEmail: exports.loginWithEmail,
    register: exports.register,
    logout: exports.logout,
    refreshToken: exports.refreshToken,
    validateToken: exports.validateToken,
    // Profile
    getProfile: exports.getProfile,
    updateProfile: exports.updateProfile,
    updateAvatar: exports.updateAvatar,
    // Password
    changePassword: exports.changePassword,
    forgotPassword: exports.forgotPassword,
    resetPassword: exports.resetPassword,
    adminResetPassword: exports.adminResetPassword,
    // Verification
    checkUsername: exports.checkUsername,
    checkEmail: exports.checkEmail,
    checkAvailability: exports.checkAvailability,
    // Sessions
    getSessions: exports.getSessions,
    revokeSessions: exports.revokeSessions,
    // Security
    getLoginHistory: exports.getLoginHistory,
    enableTwoFactor: exports.enableTwoFactor,
    verifyTwoFactor: exports.verifyTwoFactor,
    // Utility
    verifyAuthentication: exports.verifyAuthentication,
    getAuthStatus: exports.getAuthStatus,
};
