"use strict";
// ==========================================
// ZARMIND - Authentication Routes
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var authController_1 = require("../controllers/authController");
var validation_middleware_1 = require("../middleware/validation.middleware");
var auth_middleware_1 = require("../middleware/auth.middleware");
var express_validator_1 = require("express-validator");
var router = (0, express_1.Router)();
// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================
/**
 * @route   POST /api/auth/login
 * @desc    Login with username and password
 * @access  Public
 */
router.post('/login', (0, auth_middleware_1.checkAccountLock)('username'), validation_middleware_1.validators.login, validation_middleware_1.validate, authController_1.default.login);
/**
 * @route   POST /api/auth/login-email
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login-email', (0, auth_middleware_1.checkAccountLock)('email'), [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('ایمیل نامعتبر است')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('رمز عبور الزامی است'),
    (0, express_validator_1.body)('rememberMe')
        .optional()
        .isBoolean()
        .toBoolean(),
], validation_middleware_1.validate, authController_1.default.loginWithEmail);
/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (or can be restricted to Admin only)
 */
router.post('/register', validation_middleware_1.validators.register, validation_middleware_1.validate, authController_1.default.register);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', [
    (0, express_validator_1.body)('refreshToken')
        .notEmpty()
        .withMessage('توکن بازیابی الزامی است'),
], validation_middleware_1.validate, authController_1.default.refreshToken);
/**
 * @route   POST /api/auth/validate
 * @desc    Validate access token
 * @access  Public
 */
router.post('/validate', [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .withMessage('توکن الزامی است'),
], validation_middleware_1.validate, authController_1.default.validateToken);
/**
 * @route   GET /api/auth/status
 * @desc    Get authentication status
 * @access  Public (with optional authentication)
 */
router.get('/status', auth_middleware_1.optionalAuthenticate, authController_1.default.getAuthStatus);
// ==========================================
// PASSWORD RESET ROUTES (Public)
// ==========================================
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (sends email with reset token)
 * @access  Public
 */
router.post('/forgot-password', [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('ایمیل نامعتبر است')
        .normalizeEmail(),
], validation_middleware_1.validate, authController_1.default.forgotPassword);
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post('/reset-password', [
    (0, express_validator_1.body)('resetToken')
        .notEmpty()
        .withMessage('توکن بازیابی الزامی است'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6, max: 128 })
        .withMessage('رمز عبور جدید باید بین 6 تا 128 کاراکتر باشد'),
    (0, express_validator_1.body)('confirmPassword')
        .custom(function (value, _a) {
        var req = _a.req;
        if (value !== req.body.newPassword) {
            throw new Error('تکرار رمز عبور مطابقت ندارد');
        }
        return true;
    }),
], validation_middleware_1.validate, authController_1.default.resetPassword);
// ==========================================
// AVAILABILITY CHECK ROUTES (Public)
// ==========================================
/**
 * @route   GET /api/auth/check-username/:username
 * @desc    Check if username is available
 * @access  Public
 */
router.get('/check-username/:username', [
    (0, express_validator_1.param)('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('نام کاربری باید بین 3 تا 50 کاراکتر باشد'),
], validation_middleware_1.validate, authController_1.default.checkUsername);
/**
 * @route   GET /api/auth/check-email/:email
 * @desc    Check if email is available
 * @access  Public
 */
router.get('/check-email/:email', [
    (0, express_validator_1.param)('email')
        .trim()
        .isEmail()
        .withMessage('ایمیل نامعتبر است'),
], validation_middleware_1.validate, authController_1.default.checkEmail);
/**
 * @route   POST /api/auth/check-availability
 * @desc    Check username and/or email availability
 * @access  Public
 */
router.post('/check-availability', [
    (0, express_validator_1.body)('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('نام کاربری باید بین 3 تا 50 کاراکتر باشد'),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('ایمیل نامعتبر است'),
], validation_middleware_1.validate, authController_1.default.checkAvailability);
// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================
/**
 * @route   POST /api/auth/logout
 * @desc    Logout and blacklist token
 * @access  Private
 */
router.post('/logout', auth_middleware_1.authenticate, authController_1.default.logout);
/**
 * @route   GET /api/auth/verify
 * @desc    Verify if user is authenticated
 * @access  Private
 */
router.get('/verify', auth_middleware_1.authenticate, authController_1.default.verifyAuthentication);
// ==========================================
// PROFILE ROUTES (Private)
// ==========================================
/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth_middleware_1.authenticate, authController_1.default.getProfile);
/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', auth_middleware_1.authenticate, [
    (0, express_validator_1.body)('full_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('نام کامل باید بین 2 تا 255 کاراکتر باشد'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .isMobilePhone('fa-IR')
        .withMessage('شماره تلفن نامعتبر است'),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('ایمیل نامعتبر است')
        .normalizeEmail(),
    (0, express_validator_1.body)('avatar')
        .optional()
        .trim()
        .isURL()
        .withMessage('آدرس تصویر نامعتبر است'),
], validation_middleware_1.validate, authController_1.default.updateProfile);
/**
 * @route   PUT /api/auth/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.put('/avatar', auth_middleware_1.authenticate, 
// File upload middleware would go here
[
    (0, express_validator_1.body)('avatar')
        .optional()
        .trim()
        .isURL()
        .withMessage('آدرس تصویر نامعتبر است'),
], validation_middleware_1.validate, authController_1.default.updateAvatar);
// ==========================================
// PASSWORD MANAGEMENT ROUTES (Private)
// ==========================================
/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password (requires current password)
 * @access  Private
 */
router.put('/change-password', auth_middleware_1.authenticate, validation_middleware_1.validators.updatePassword, validation_middleware_1.validate, authController_1.default.changePassword);
// ==========================================
// SESSION MANAGEMENT ROUTES (Private)
// ==========================================
/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions
 * @access  Private
 */
router.get('/sessions', auth_middleware_1.authenticate, authController_1.default.getSessions);
/**
 * @route   DELETE /api/auth/sessions
 * @desc    Logout from all devices
 * @access  Private
 */
router.delete('/sessions', auth_middleware_1.authenticate, authController_1.default.revokeSessions);
// ==========================================
// SECURITY ROUTES (Private)
// ==========================================
/**
 * @route   GET /api/auth/login-history
 * @desc    Get login history
 * @access  Private
 */
router.get('/login-history', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('حد مجاز باید بین 1 تا 100 باشد')
        .toInt(),
], validation_middleware_1.validate, authController_1.default.getLoginHistory);
/**
 * @route   POST /api/auth/enable-2fa
 * @desc    Enable two-factor authentication
 * @access  Private
 */
router.post('/enable-2fa', auth_middleware_1.authenticate, authController_1.default.enableTwoFactor);
/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify two-factor authentication code
 * @access  Private
 */
router.post('/verify-2fa', auth_middleware_1.authenticate, [
    (0, express_validator_1.body)('code')
        .notEmpty()
        .withMessage('کد تایید الزامی است')
        .isLength({ min: 6, max: 6 })
        .withMessage('کد تایید باید 6 رقم باشد'),
], validation_middleware_1.validate, authController_1.default.verifyTwoFactor);
// ==========================================
// ADMIN ROUTES (Admin Only)
// ==========================================
/**
 * @route   PUT /api/auth/reset-password/:userId
 * @desc    Admin reset user password
 * @access  Private (Admin only)
 */
router.put('/reset-password/:userId', auth_middleware_1.authenticate, auth_middleware_1.isAdmin, [
    (0, express_validator_1.param)('userId')
        .isUUID()
        .withMessage('شناسه کاربر نامعتبر است'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6, max: 128 })
        .withMessage('رمز عبور جدید باید بین 6 تا 128 کاراکتر باشد'),
], validation_middleware_1.validate, authController_1.default.adminResetPassword);
// ==========================================
// EXPORTS
// ==========================================
exports.default = router;
