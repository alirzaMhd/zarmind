// ==========================================
// ZARMIND - Authentication Controller
// ==========================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import AuthService from '../services/authService';
import { getCurrentUserId, getCurrentUser, AuthenticatedRequest } from '../middleware/auth.middleware';
import { UnauthorizedError, ValidationError } from '../types';
import { COOKIE_CONFIG } from '../config/server';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Set authentication cookies
 */
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  // Access token cookie (short-lived)
  res.cookie('accessToken', accessToken, {
    ...COOKIE_CONFIG.OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Refresh token cookie (long-lived)
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_CONFIG.OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

/**
 * Extract access token from request
 */
const extractAccessToken = (req: Request): string | null => {
  // Try header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    return token || null;
  }

  // Try cookie
  return req.cookies?.accessToken || req.signedCookies?.accessToken || null;
};

// ==========================================
// AUTHENTICATION CONTROLLERS
// ==========================================

/**
 * @route   POST /api/auth/login
 * @desc    Login user with username/password
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, rememberMe } = req.body;

  // Validate input
  if (!username || !password) {
    throw new ValidationError('نام کاربری و رمز عبور الزامی است');
  }

  // Login user
  const result = await AuthService.login(
    { username, password, rememberMe },
    req.ip,
    req.get('user-agent')
  );

  // Set cookies
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

  // Send response
  res.sendSuccess(
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    },
    'ورود موفقیت‌آمیز بود'
  );
});

/**
 * @route   POST /api/auth/login-email
 * @desc    Login user with email/password
 * @access  Public
 */
export const loginWithEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ValidationError('ایمیل و رمز عبور الزامی است');
  }

  // Login user
  const result = await AuthService.loginWithEmail(
    email,
    password,
    req.ip,
    req.get('user-agent')
  );

  // Set cookies
  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

  // Send response
  res.sendSuccess(
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    },
    'ورود موفقیت‌آمیز بود'
  );
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (or Admin only for creating users)
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const registerData = req.body;

  // Register user
  const result = await AuthService.register(
    registerData,
    req.ip,
    req.get('user-agent')
  );

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
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and blacklist token
 * @access  Private
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  const accessToken = extractAccessToken(req);

  if (accessToken) {
    await AuthService.logout(accessToken, userId, req.ip, req.get('user-agent'));
  }

  // Clear cookies
  clearAuthCookies(res);

  res.sendSuccess(null, 'خروج با موفقیت انجام شد');
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('توکن بازیابی الزامی است');
  }

  // Refresh tokens
  const tokens = await AuthService.refreshAccessToken({ refreshToken });

  // Set new cookies
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.sendSuccess(
    {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    'توکن با موفقیت بازیابی شد'
  );
});

/**
 * @route   POST /api/auth/validate
 * @desc    Validate access token
 * @access  Public
 */
export const validateToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new ValidationError('توکن الزامی است');
  }

  const payload = await AuthService.validateToken(token);

  res.sendSuccess(
    {
      valid: true,
      payload,
    },
    'توکن معتبر است'
  );
});

// ==========================================
// PROFILE CONTROLLERS
// ==========================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  const profile = await AuthService.getProfile(userId);

  res.sendSuccess(profile, 'اطلاعات پروفایل دریافت شد');
});

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  const { full_name, phone, email, avatar } = req.body;

  const updatedProfile = await AuthService.updateProfile(userId, {
    full_name,
    phone,
    email,
    avatar,
  });

  res.sendSuccess(updatedProfile, 'پروفایل با موفقیت به‌روزرسانی شد');
});

/**
 * @route   PUT /api/auth/avatar
 * @desc    Update user avatar
 * @access  Private
 */
export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  // Avatar URL should come from file upload middleware
  const avatarUrl = req.body.avatar || req.file?.path;

  if (!avatarUrl) {
    throw new ValidationError('فایل تصویر الزامی است');
  }

  const updatedProfile = await AuthService.updateProfile(userId, {
    avatar: avatarUrl,
  });

  res.sendSuccess(updatedProfile, 'تصویر پروفایل با موفقیت به‌روزرسانی شد');
});

// ==========================================
// PASSWORD CONTROLLERS
// ==========================================

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password (requires current password)
 * @access  Private
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ValidationError('تمام فیلدها الزامی هستند');
  }

  await AuthService.changePassword({
    userId,
    currentPassword,
    newPassword,
    confirmPassword,
  });

  res.sendSuccess(null, 'رمز عبور با موفقیت تغییر کرد');
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (send reset email)
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('ایمیل الزامی است');
  }

  const result = await AuthService.requestPasswordReset(email);

  // In production, only send message (hide resetToken)
  if (process.env.NODE_ENV === 'development') {
    res.sendSuccess(result, result.message);
  } else {
    res.sendSuccess({ message: result.message }, result.message);
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with reset token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (!resetToken || !newPassword || !confirmPassword) {
    throw new ValidationError('تمام فیلدها الزامی هستند');
  }

  if (newPassword !== confirmPassword) {
    throw new ValidationError('رمز عبور جدید و تکرار آن مطابقت ندارند');
  }

  await AuthService.confirmPasswordReset(resetToken, newPassword);

  res.sendSuccess(null, 'رمز عبور با موفقیت بازیابی شد');
});

/**
 * @route   PUT /api/auth/reset-password/:userId
 * @desc    Admin reset user password (no current password required)
 * @access  Private (Admin only)
 */
export const adminResetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  // Validate userId exists
  if (!userId) {
    throw new ValidationError('شناسه کاربر الزامی است');
  }

  if (!newPassword) {
    throw new ValidationError('رمز عبور جدید الزامی است');
  }

  await AuthService.resetPassword({ userId, newPassword });

  res.sendSuccess(null, 'رمز عبور کاربر با موفقیت بازنشانی شد');
});
// ==========================================
// ACCOUNT VERIFICATION CONTROLLERS
// ==========================================

/**
 * @route   GET /api/auth/check-username/:username
 * @desc    Check if username is available
 * @access  Public
 */
export const checkUsername = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;

  if (!username) {
    throw new ValidationError('نام کاربری الزامی است');
  }

  const isAvailable = await AuthService.checkUsernameAvailability(username);

  res.sendSuccess(
    {
      username,
      available: isAvailable,
    },
    isAvailable ? 'نام کاربری در دسترس است' : 'نام کاربری قبلاً ثبت شده است'
  );
});

/**
 * @route   GET /api/auth/check-email/:email
 * @desc    Check if email is available
 * @access  Public
 */
export const checkEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.params;

  if (!email) {
    throw new ValidationError('ایمیل الزامی است');
  }

  const isAvailable = await AuthService.checkEmailAvailability(email);

  res.sendSuccess(
    {
      email,
      available: isAvailable,
    },
    isAvailable ? 'ایمیل در دسترس است' : 'ایمیل قبلاً ثبت شده است'
  );
});

/**
 * @route   POST /api/auth/check-availability
 * @desc    Check username and email availability
 * @access  Public
 */
export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { username, email } = req.body;

  const result: {
    username?: { value: string; available: boolean };
    email?: { value: string; available: boolean };
  } = {};

  if (username) {
    const usernameAvailable = await AuthService.checkUsernameAvailability(username);
    result.username = {
      value: username,
      available: usernameAvailable,
    };
  }

  if (email) {
    const emailAvailable = await AuthService.checkEmailAvailability(email);
    result.email = {
      value: email,
      available: emailAvailable,
    };
  }

  res.sendSuccess(result, 'بررسی در دسترس بودن انجام شد');
});

// ==========================================
// SESSION MANAGEMENT CONTROLLERS
// ==========================================

/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  const sessions = await AuthService.getActiveSessions(userId);

  res.sendSuccess(sessions, 'لیست نشست‌های فعال دریافت شد');
});

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Revoke all sessions (logout from all devices)
 * @access  Private
 */
export const revokeSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  await AuthService.revokeAllSessions(userId);

  // Clear current session cookies
  clearAuthCookies(res);

  res.sendSuccess(null, 'تمام نشست‌ها با موفقیت لغو شدند');
});

// ==========================================
// SECURITY CONTROLLERS
// ==========================================

/**
 * @route   GET /api/auth/login-history
 * @desc    Get user's recent login history
 * @access  Private
 */
export const getLoginHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  const limit = parseInt(req.query.limit as string) || 10;
  const history = await AuthService.getLoginHistory(userId, limit);

  res.sendSuccess(history, 'تاریخچه ورود دریافت شد');
});

/**
 * @route   POST /api/auth/enable-2fa
 * @desc    Enable two-factor authentication
 * @access  Private
 */
export const enableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  try {
    const result = await AuthService.enableTwoFactor(userId);
    res.sendSuccess(result, 'احراز هویت دو مرحله‌ای فعال شد');
  } catch (error) {
    res.sendSuccess(
      null,
      'احراز هویت دو مرحله‌ای هنوز پیاده‌سازی نشده است'
    );
  }
});

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify two-factor authentication code
 * @access  Private
 */
export const verifyTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  const { code } = req.body;

  if (!userId) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  if (!code) {
    throw new ValidationError('کد تایید الزامی است');
  }

  try {
    const isValid = await AuthService.verifyTwoFactor(userId, code);
    res.sendSuccess({ valid: isValid }, 'کد تایید معتبر است');
  } catch (error) {
    res.sendSuccess(
      null,
      'احراز هویت دو مرحله‌ای هنوز پیاده‌سازی نشده است'
    );
  }
});

// ==========================================
// UTILITY CONTROLLERS
// ==========================================

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if user is authenticated
 * @access  Private
 */
export const verifyAuthentication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = getCurrentUser(req);

  if (!user) {
    throw new UnauthorizedError('کاربر احراز هویت نشده است');
  }

  res.sendSuccess(
    {
      authenticated: true,
      user,
    },
    'کاربر احراز هویت شده است'
  );
});

/**
 * @route   GET /api/auth/status
 * @desc    Get authentication status and user info
 * @access  Public (with optional auth)
 */
export const getAuthStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = getCurrentUser(req);

  res.sendSuccess({
    authenticated: !!user,
    user: user || null,
  });
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  // Authentication
  login,
  loginWithEmail,
  register,
  logout,
  refreshToken,
  validateToken,

  // Profile
  getProfile,
  updateProfile,
  updateAvatar,

  // Password
  changePassword,
  forgotPassword,
  resetPassword,
  adminResetPassword,

  // Verification
  checkUsername,
  checkEmail,
  checkAvailability,

  // Sessions
  getSessions,
  revokeSessions,

  // Security
  getLoginHistory,
  enableTwoFactor,
  verifyTwoFactor,

  // Utility
  verifyAuthentication,
  getAuthStatus,
};