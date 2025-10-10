// ==========================================
// ZARMIND - Authentication Routes
// ==========================================

import { Router } from 'express';
import authController from '../controllers/authController';
import { validators, validate } from '../middleware/validation.middleware';
import {
  authenticate,
  optionalAuthenticate,
  isAdmin,
  checkAccountLock,
} from '../middleware/auth.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// ==========================================

/**
 * @route   POST /api/auth/login
 * @desc    Login with username and password
 * @access  Public
 */
router.post(
  '/login',
  checkAccountLock('username'),
  validators.login,
  validate,
  authController.login
);

/**
 * @route   POST /api/auth/login-email
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login-email',
  checkAccountLock('email'),
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('ایمیل نامعتبر است')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('رمز عبور الزامی است'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .toBoolean(),
  ],
  validate,
  authController.loginWithEmail
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (or can be restricted to Admin only)
 */
router.post(
  '/register',
  validators.register,
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('توکن بازیابی الزامی است'),
  ],
  validate,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/validate
 * @desc    Validate access token
 * @access  Public
 */
router.post(
  '/validate',
  [
    body('token')
      .notEmpty()
      .withMessage('توکن الزامی است'),
  ],
  validate,
  authController.validateToken
);

/**
 * @route   GET /api/auth/status
 * @desc    Get authentication status
 * @access  Public (with optional authentication)
 */
router.get(
  '/status',
  optionalAuthenticate,
  authController.getAuthStatus
);

// ==========================================
// PASSWORD RESET ROUTES (Public)
// ==========================================

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (sends email with reset token)
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('ایمیل نامعتبر است')
      .normalizeEmail(),
  ],
  validate,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('resetToken')
      .notEmpty()
      .withMessage('توکن بازیابی الزامی است'),
    body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('رمز عبور جدید باید بین 6 تا 128 کاراکتر باشد'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('تکرار رمز عبور مطابقت ندارد');
        }
        return true;
      }),
  ],
  validate,
  authController.resetPassword
);

// ==========================================
// AVAILABILITY CHECK ROUTES (Public)
// ==========================================

/**
 * @route   GET /api/auth/check-username/:username
 * @desc    Check if username is available
 * @access  Public
 */
router.get(
  '/check-username/:username',
  [
    param('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('نام کاربری باید بین 3 تا 50 کاراکتر باشد'),
  ],
  validate,
  authController.checkUsername
);

/**
 * @route   GET /api/auth/check-email/:email
 * @desc    Check if email is available
 * @access  Public
 */
router.get(
  '/check-email/:email',
  [
    param('email')
      .trim()
      .isEmail()
      .withMessage('ایمیل نامعتبر است'),
  ],
  validate,
  authController.checkEmail
);

/**
 * @route   POST /api/auth/check-availability
 * @desc    Check username and/or email availability
 * @access  Public
 */
router.post(
  '/check-availability',
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('نام کاربری باید بین 3 تا 50 کاراکتر باشد'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('ایمیل نامعتبر است'),
  ],
  validate,
  authController.checkAvailability
);

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout and blacklist token
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if user is authenticated
 * @access  Private
 */
router.get(
  '/verify',
  authenticate,
  authController.verifyAuthentication
);

// ==========================================
// PROFILE ROUTES (Private)
// ==========================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/me',
  authenticate,
  [
    body('full_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('نام کامل باید بین 2 تا 255 کاراکتر باشد'),
    body('phone')
      .optional()
      .trim()
      .isMobilePhone('fa-IR')
      .withMessage('شماره تلفن نامعتبر است'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('ایمیل نامعتبر است')
      .normalizeEmail(),
    body('avatar')
      .optional()
      .trim()
      .isURL()
      .withMessage('آدرس تصویر نامعتبر است'),
  ],
  validate,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.put(
  '/avatar',
  authenticate,
  // File upload middleware would go here
  [
    body('avatar')
      .optional()
      .trim()
      .isURL()
      .withMessage('آدرس تصویر نامعتبر است'),
  ],
  validate,
  authController.updateAvatar
);

// ==========================================
// PASSWORD MANAGEMENT ROUTES (Private)
// ==========================================

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password (requires current password)
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  validators.updatePassword,
  validate,
  authController.changePassword
);

// ==========================================
// SESSION MANAGEMENT ROUTES (Private)
// ==========================================

/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions
 * @access  Private
 */
router.get(
  '/sessions',
  authenticate,
  authController.getSessions
);

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Logout from all devices
 * @access  Private
 */
router.delete(
  '/sessions',
  authenticate,
  authController.revokeSessions
);

// ==========================================
// SECURITY ROUTES (Private)
// ==========================================

/**
 * @route   GET /api/auth/login-history
 * @desc    Get login history
 * @access  Private
 */
router.get(
  '/login-history',
  authenticate,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('حد مجاز باید بین 1 تا 100 باشد')
      .toInt(),
  ],
  validate,
  authController.getLoginHistory
);

/**
 * @route   POST /api/auth/enable-2fa
 * @desc    Enable two-factor authentication
 * @access  Private
 */
router.post(
  '/enable-2fa',
  authenticate,
  authController.enableTwoFactor
);

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify two-factor authentication code
 * @access  Private
 */
router.post(
  '/verify-2fa',
  authenticate,
  [
    body('code')
      .notEmpty()
      .withMessage('کد تایید الزامی است')
      .isLength({ min: 6, max: 6 })
      .withMessage('کد تایید باید 6 رقم باشد'),
  ],
  validate,
  authController.verifyTwoFactor
);

// ==========================================
// ADMIN ROUTES (Admin Only)
// ==========================================

/**
 * @route   PUT /api/auth/reset-password/:userId
 * @desc    Admin reset user password
 * @access  Private (Admin only)
 */
router.put(
  '/reset-password/:userId',
  authenticate,
  isAdmin,
  [
    param('userId')
      .isUUID()
      .withMessage('شناسه کاربر نامعتبر است'),
    body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('رمز عبور جدید باید بین 6 تا 128 کاراکتر باشد'),
  ],
  validate,
  authController.adminResetPassword
);

// ==========================================
// EXPORTS
// ==========================================

export default router;