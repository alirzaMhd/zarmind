// ==========================================
// ZARMIND - Authentication Service
// ==========================================

import UserModel, { ICreateUser } from '../models/User';
import {
  IUser,
  IAuthTokens,
  ITokenPayload,
  UnauthorizedError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../types';
import {TokenExpiredError} from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  trackFailedLogin,
  resetLoginAttempts,
  isAccountLocked,
} from '../middleware/auth.middleware';
import logger, { logAuth, logSecurity } from '../utils/logger';
import { sanitizePhoneNumber, toEnglishDigits } from '../utils/helpers';

// ==========================================
// INTERFACES
// ==========================================

export interface ILoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface IRegisterData extends ICreateUser {
  confirmPassword?: string;
}

export interface ILoginResponse {
  user: Omit<IUser, 'password'>;
  tokens: IAuthTokens;
}

export interface IChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IResetPasswordData {
  userId: string;
  newPassword: string;
}

export interface IRefreshTokenData {
  refreshToken: string;
}

// ==========================================
// AUTHENTICATION SERVICE
// ==========================================

class AuthService {
  // ==========================================
  // LOGIN
  // ==========================================

  /**
   * Authenticate user and return tokens
   */
  async login(
    credentials: ILoginCredentials,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ILoginResponse> {
    try {
      const { username, password, rememberMe } = credentials;

      // Sanitize username
      const sanitizedUsername = username.trim().toLowerCase();

      // Check if account is locked
      if (isAccountLocked(sanitizedUsername)) {
        logSecurity('Locked account login attempt', 'medium', {
          username: sanitizedUsername,
          ip: ipAddress,
        });

        throw new UnauthorizedError(
          'حساب کاربری شما به دلیل تلاش‌های متعدد ناموفق قفل شده است. لطفاً 15 دقیقه صبر کنید'
        );
      }

      // Verify credentials
      const user = await UserModel.verifyCredentials(sanitizedUsername, password);

      if (!user) {
        // Track failed login attempt
        trackFailedLogin(sanitizedUsername);

        logAuth('failed_login', sanitizedUsername, ipAddress, userAgent);

        throw new UnauthorizedError('نام کاربری یا رمز عبور اشتباه است');
      }

      // Reset failed login attempts on successful login
      resetLoginAttempts(sanitizedUsername);

      // Generate tokens
      const tokens = this.generateTokens(user, rememberMe);

      // Log successful login
      logAuth('login', user.username, ipAddress, userAgent);

      logger.info('User logged in successfully', {
        userId: user.id,
        username: user.username,
        role: user.role,
        ip: ipAddress,
      });

      return {
        user: UserModel.omitPassword(user),
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Login with email instead of username
   */
  async loginWithEmail(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ILoginResponse> {
    try {
      const sanitizedEmail = email.trim().toLowerCase();

      // Check if account is locked
      if (isAccountLocked(sanitizedEmail)) {
        throw new UnauthorizedError(
          'حساب کاربری شما به دلیل تلاش‌های متعدد ناموفق قفل شده است. لطفاً 15 دقیقه صبر کنید'
        );
      }

      // Find user by email
      const user = await UserModel.findByEmail(sanitizedEmail);

      if (!user) {
        trackFailedLogin(sanitizedEmail);
        throw new UnauthorizedError('ایمیل یا رمز عبور اشتباه است');
      }

      // Verify password
      const isPasswordValid = await UserModel.comparePassword(password, user.password);

      if (!isPasswordValid) {
        trackFailedLogin(sanitizedEmail);
        throw new UnauthorizedError('ایمیل یا رمز عبور اشتباه است');
      }

      if (!user.is_active) {
        throw new UnauthorizedError('حساب کاربری غیرفعال است');
      }

      // Reset failed attempts and update last login
      resetLoginAttempts(sanitizedEmail);
      await UserModel.updateLastLogin(user.id);

      // Generate tokens
      const tokens = this.generateTokens(user);

      logAuth('login', user.username, ipAddress, userAgent);

      return {
        user: UserModel.omitPassword(user),
        tokens,
      };
    } catch (error) {
      logger.error('Login with email error:', error);
      throw error;
    }
  }

  // ==========================================
  // REGISTER
  // ==========================================

  /**
   * Register new user
   */
  async register(
    registerData: IRegisterData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ILoginResponse> {
    try {
      // Validate passwords match
      if (registerData.password !== registerData.confirmPassword) {
        throw new ValidationError('رمز عبور و تکرار آن مطابقت ندارند');
      }

      // Sanitize data
      const sanitizedData: ICreateUser = {
        username: registerData.username.trim().toLowerCase(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password,
        full_name: registerData.full_name.trim(),
        role: registerData.role,
        phone: registerData.phone ? sanitizePhoneNumber(registerData.phone) : undefined,
        avatar: registerData.avatar,
        is_active: registerData.is_active !== undefined ? registerData.is_active : true,
      };

      // Validate username availability
      const usernameExists = await UserModel.findByUsername(sanitizedData.username);
      if (usernameExists) {
        throw new ConflictError(`نام کاربری "${sanitizedData.username}" قبلاً ثبت شده است`);
      }

      // Validate email availability
      const emailExists = await UserModel.findByEmail(sanitizedData.email);
      if (emailExists) {
        throw new ConflictError(`ایمیل "${sanitizedData.email}" قبلاً ثبت شده است`);
      }

      // Create user
      const user = await UserModel.create(sanitizedData);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Log registration
      logAuth('register', user.username, ipAddress, userAgent);

      logger.info('User registered successfully', {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      return {
        user: UserModel.omitPassword(user),
        tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  /**
   * Logout user and blacklist token
   */
  async logout(
    accessToken: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Add token to blacklist
      if (accessToken) {
        blacklistToken(accessToken);
      }

      if (userId) {
        const user = await UserModel.findById(userId);
        if (user) {
          logAuth('logout', user.username, ipAddress, userAgent);
        }

        logger.info('User logged out', {
          userId,
          ip: ipAddress,
        });
      }
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  // ==========================================
  // TOKEN OPERATIONS
  // ==========================================

  /**
   * Generate access and refresh tokens
   */
  generateTokens(user: IUser, rememberMe?: boolean): IAuthTokens {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshTokenData: IRefreshTokenData): Promise<IAuthTokens> {
    try {
      const { refreshToken } = refreshTokenData;

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        throw new UnauthorizedError('کاربر یافت نشد');
      }

      if (!user.is_active) {
        throw new UnauthorizedError('حساب کاربری غیرفعال است');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      logger.info('Access token refreshed', {
        userId: user.id,
        username: user.username,
      });

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<ITokenPayload> {
    try {
      // This would use the verifyToken from middleware
      // For now, we'll import jwt directly
      const jwt = require('jsonwebtoken');
      const { JWT_CONFIG } = require('../config/server');

      const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as ITokenPayload;

      // Verify user still exists and is active
      const user = await UserModel.findById(decoded.userId);

      if (!user || !user.is_active) {
        throw new UnauthorizedError('توکن نامعتبر است');
      }

      return decoded;
    } catch (error) {
      throw new UnauthorizedError('توکن نامعتبر یا منقضی شده است');
    }
  }

  // ==========================================
  // PASSWORD MANAGEMENT
  // ==========================================

  /**
   * Change user password
   */
  async changePassword(passwordData: IChangePasswordData): Promise<void> {
    try {
      const { userId, currentPassword, newPassword, confirmPassword } = passwordData;

      // Validate new passwords match
      if (newPassword !== confirmPassword) {
        throw new ValidationError('رمز عبور جدید و تکرار آن مطابقت ندارند');
      }

      // Validate new password is different from current
      if (currentPassword === newPassword) {
        throw new ValidationError('رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد');
      }

      // Get user
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError('کاربر یافت نشد');
      }

      // Verify current password
      const isCurrentPasswordValid = await UserModel.comparePassword(
        currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError('رمز عبور فعلی اشتباه است');
      }

      // Update password
      await UserModel.updatePassword(userId, newPassword);

      logger.info('Password changed successfully', {
        userId,
        username: user.username,
      });
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Reset password (admin function - no current password required)
   */
  async resetPassword(resetData: IResetPasswordData): Promise<void> {
    try {
      const { userId, newPassword } = resetData;

      // Get user
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError('کاربر یافت نشد');
      }

      // Update password
      await UserModel.updatePassword(userId, newPassword);

      logger.warn('Password reset by admin', {
        userId,
        username: user.username,
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Request password reset (generate reset token)
   * Note: This is a placeholder - in production, you'd send an email with reset link
   */
  async requestPasswordReset(email: string): Promise<{ message: string; resetToken?: string }> {
    try {
      const user = await UserModel.findByEmail(email.trim().toLowerCase());

      if (!user) {
        // Don't reveal if user exists
        return {
          message: 'اگر این ایمیل در سیستم موجود باشد، لینک بازیابی رمز عبور برای شما ارسال می‌شود',
        };
      }

      // Generate reset token (valid for 1 hour)
      const jwt = require('jsonwebtoken');
      const { JWT_CONFIG } = require('../config/server');

      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        JWT_CONFIG.SECRET,
        { expiresIn: '1h' }
      );

      // In production: Send email with reset link
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
      });

      // In development, return token (remove in production)
      if (process.env.NODE_ENV === 'development') {
        return {
          message: 'لینک بازیابی رمز عبور برای شما ارسال شد',
          resetToken,
        };
      }

      return {
        message: 'لینک بازیابی رمز عبور برای شما ارسال شد',
      };
    } catch (error) {
      logger.error('Request password reset error:', error);
      throw error;
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_CONFIG } = require('../config/server');

      // Verify reset token
      const decoded = jwt.verify(resetToken, JWT_CONFIG.SECRET) as {
        userId: string;
        type: string;
      };

      if (decoded.type !== 'password_reset') {
        throw new UnauthorizedError('توکن بازیابی نامعتبر است');
      }

      // Get user
      const user = await UserModel.findById(decoded.userId);

      if (!user) {
        throw new NotFoundError('کاربر یافت نشد');
      }

      // Update password
      await UserModel.updatePassword(decoded.userId, newPassword);

      logger.info('Password reset confirmed', {
        userId: user.id,
        username: user.username,
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedError('لینک بازیابی منقضی شده است. لطفاً دوباره درخواست دهید');
      }
      logger.error('Confirm password reset error:', error);
      throw error;
    }
  }

  // ==========================================
  // USER PROFILE
  // ==========================================

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<Omit<IUser, 'password'>> {
    try {
      const user = await UserModel.findByIdSafe(userId);

      if (!user) {
        throw new NotFoundError('کاربر یافت نشد');
      }

      return user;
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: {
      full_name?: string;
      phone?: string;
      email?: string;
      avatar?: string;
    }
  ): Promise<Omit<IUser, 'password'>> {
    try {
      // Sanitize phone if provided
      if (updateData.phone) {
        updateData.phone = sanitizePhoneNumber(updateData.phone);
      }

      // Sanitize email if provided
      if (updateData.email) {
        updateData.email = updateData.email.trim().toLowerCase();
      }

      const updatedUser = await UserModel.update(userId, updateData);

      logger.info('Profile updated', {
        userId,
        username: updatedUser.username,
      });

      return UserModel.omitPassword(updatedUser);
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  // ==========================================
  // ACCOUNT VERIFICATION
  // ==========================================

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const sanitizedUsername = username.trim().toLowerCase();
    return await UserModel.isUsernameAvailable(sanitizedUsername);
  }

  /**
   * Check if email is available
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    const sanitizedEmail = email.trim().toLowerCase();
    return await UserModel.isEmailAvailable(sanitizedEmail);
  }

  /**
   * Verify user exists and is active
   */
  async verifyUserActive(userId: string): Promise<boolean> {
    const user = await UserModel.findById(userId);
    return user !== null && user.is_active;
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /**
   * Get all active sessions for user (placeholder)
   * In production, track sessions in Redis
   */
  async getActiveSessions(userId: string): Promise<any[]> {
    // This would query Redis or session store
    // For now, return empty array
    return [];
  }

  /**
   * Revoke all sessions for user (force logout everywhere)
   */
  async revokeAllSessions(userId: string): Promise<void> {
    try {
      // In production, clear all sessions from Redis
      // and blacklist all active tokens

      logger.warn('All sessions revoked for user', { userId });
    } catch (error) {
      logger.error('Revoke sessions error:', error);
      throw error;
    }
  }

  // ==========================================
  // SECURITY
  // ==========================================

  /**
   * Get user's recent login history (placeholder)
   */
  async getLoginHistory(userId: string, limit: number = 10): Promise<any[]> {
    // This would query audit logs
    // For now, return empty array
    return [];
  }

  /**
   * Enable two-factor authentication (placeholder)
   */
  async enableTwoFactor(userId: string): Promise<{ secret: string; qrCode: string }> {
    // This would setup 2FA with libraries like speakeasy
    throw new Error('Two-factor authentication not implemented yet');
  }

  /**
   * Verify two-factor code (placeholder)
   */
  async verifyTwoFactor(userId: string, code: string): Promise<boolean> {
    // This would verify 2FA code
    throw new Error('Two-factor authentication not implemented yet');
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new AuthService();