// ==========================================
// ZARMIND - User Model
// ==========================================

import { query } from '../config/database';
import { IUser, UserRole } from '../types';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_CONFIG } from '../config/server';
import { NotFoundError, ConflictError, ValidationError } from '../types';
import logger from '../utils/logger';

// ==========================================
// INTERFACES
// ==========================================

export interface ICreateUser {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
  phone?: string;
  avatar?: string;
  is_active?: boolean;
}

export interface IUpdateUser {
  email?: string;
  full_name?: string;
  role?: UserRole;
  phone?: string;
  avatar?: string;
  is_active?: boolean;
}

export interface IUserFilter {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
}

// ==========================================
// USER MODEL
// ==========================================

class UserModel {
  private tableName = 'users';

  // ==========================================
  // CREATE
  // ==========================================

  /**
   * Create a new user
   */
  async create(userData: ICreateUser): Promise<IUser> {
    try {
      // Check if username already exists
      const existingUsername = await this.findByUsername(userData.username);
      if (existingUsername) {
        throw new ConflictError(`نام کاربری "${userData.username}" قبلاً ثبت شده است`);
      }

      // Check if email already exists
      const existingEmail = await this.findByEmail(userData.email);
      if (existingEmail) {
        throw new ConflictError(`ایمیل "${userData.email}" قبلاً ثبت شده است`);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Prepare user data
      const userToInsert = {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        full_name: userData.full_name,
        role: userData.role || UserRole.EMPLOYEE,
        phone: userData.phone || null,
        avatar: userData.avatar || null,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
      };

      // Insert user
      const result = await query(
        `INSERT INTO ${this.tableName} 
        (username, email, password, full_name, role, phone, avatar, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          userToInsert.username,
          userToInsert.email,
          userToInsert.password,
          userToInsert.full_name,
          userToInsert.role,
          userToInsert.phone,
          userToInsert.avatar,
          userToInsert.is_active,
        ]
      );

      const user = result.rows[0];
      logger.info(`User created: ${user.username} (${user.id})`);

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // ==========================================
  // READ
  // ==========================================

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<IUser | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE username = $1`,
      [username]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE email = $1`,
      [email]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all users with optional filters
   */
  async findAll(filters?: IUserFilter): Promise<IUser[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.role) {
      sql += ` AND role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters?.is_active !== undefined) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(filters.is_active);
      paramIndex++;
    }

    if (filters?.search) {
      sql += ` AND (
        username ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        full_name ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get users with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: IUserFilter
  ): Promise<{ users: IUser[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    let countSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
    let dataSql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.role) {
      const roleFilter = ` AND role = $${paramIndex}`;
      countSql += roleFilter;
      dataSql += roleFilter;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters?.is_active !== undefined) {
      const activeFilter = ` AND is_active = $${paramIndex}`;
      countSql += activeFilter;
      dataSql += activeFilter;
      params.push(filters.is_active);
      paramIndex++;
    }

    if (filters?.search) {
      const searchFilter = ` AND (
        username ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        full_name ILIKE $${paramIndex}
      )`;
      countSql += searchFilter;
      dataSql += searchFilter;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    dataSql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataParams = [...params, limit, offset];

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      query(countSql, params),
      query(dataSql, dataParams),
    ]);

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    return {
      users: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole): Promise<IUser[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE role = $1 ORDER BY created_at DESC`,
      [role]
    );

    return result.rows;
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount(): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_active = true`
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Get users count by role
   */
  async getUsersCountByRole(): Promise<Record<UserRole, number>> {
    const result = await query(
      `SELECT role, COUNT(*) as count 
     FROM ${this.tableName} 
     GROUP BY role`
    );

    const counts: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.MANAGER]: 0,
      [UserRole.EMPLOYEE]: 0,
      [UserRole.VIEWER]: 0,
    };

    result.rows.forEach((row: { role: string; count: string }) => {
      const role = row.role as UserRole;
      if (role in counts) {
        counts[role] = parseInt(row.count, 10);
      }
    });

    return counts;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  /**
   * Update user by ID
   */
  async update(id: string, updateData: IUpdateUser): Promise<IUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('کاربر یافت نشد');
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await this.findByEmail(updateData.email);
      if (existingEmail) {
        throw new ConflictError(`ایمیل "${updateData.email}" قبلاً ثبت شده است`);
      }
    }

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(updateData.email);
      paramIndex++;
    }

    if (updateData.full_name !== undefined) {
      fields.push(`full_name = $${paramIndex}`);
      values.push(updateData.full_name);
      paramIndex++;
    }

    if (updateData.role !== undefined) {
      fields.push(`role = $${paramIndex}`);
      values.push(updateData.role);
      paramIndex++;
    }

    if (updateData.phone !== undefined) {
      fields.push(`phone = $${paramIndex}`);
      values.push(updateData.phone);
      paramIndex++;
    }

    if (updateData.avatar !== undefined) {
      fields.push(`avatar = $${paramIndex}`);
      values.push(updateData.avatar);
      paramIndex++;
    }

    if (updateData.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex}`);
      values.push(updateData.is_active);
      paramIndex++;
    }

    if (fields.length === 0) {
      return user; // No changes
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `
      UPDATE ${this.tableName} 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);
    const updatedUser = result.rows[0];

    logger.info(`User updated: ${updatedUser.username} (${updatedUser.id})`);

    return updatedUser;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);

    await query(
      `UPDATE ${this.tableName} 
       SET password = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [hashedPassword, id]
    );

    logger.info(`Password updated for user ID: ${id}`);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await query(
      `UPDATE ${this.tableName} 
       SET last_login = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Update user avatar
   */
  async updateAvatar(id: string, avatarUrl: string): Promise<IUser> {
    const result = await query(
      `UPDATE ${this.tableName} 
       SET avatar = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [avatarUrl, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('کاربر یافت نشد');
    }

    return result.rows[0];
  }

  /**
   * Activate/Deactivate user
   */
  async setActiveStatus(id: string, isActive: boolean): Promise<IUser> {
    const result = await query(
      `UPDATE ${this.tableName} 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2
       RETURNING *`,
      [isActive, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('کاربر یافت نشد');
    }

    const user = result.rows[0];
    logger.info(`User ${isActive ? 'activated' : 'deactivated'}: ${user.username} (${user.id})`);

    return user;
  }

  // ==========================================
  // DELETE
  // ==========================================

  /**
   * Delete user by ID (soft delete - deactivate)
   */
  async softDelete(id: string): Promise<void> {
    await this.setActiveStatus(id, false);
  }

  /**
   * Delete user by ID (hard delete - permanent)
   */
  async hardDelete(id: string): Promise<void> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id, username`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('کاربر یافت نشد');
    }

    logger.warn(`User permanently deleted: ${result.rows[0].username} (${id})`);
  }

  // ==========================================
  // AUTHENTICATION HELPERS
  // ==========================================

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_CONFIG.ROUNDS);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(username: string, password: string): Promise<IUser | null> {
    const user = await this.findByUsername(username);

    if (!user) {
      return null;
    }

    if (!user.is_active) {
      throw new ValidationError('حساب کاربری غیرفعال است');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    await this.updateLastLogin(user.id);

    return user;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if user exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await query(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`,
      [id]
    );

    return result.rows[0]?.exists || false;
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return !user;
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !user;
  }

  /**
   * Get user without password field
   */
  async findByIdSafe(id: string): Promise<Omit<IUser, 'password'> | null> {
    const result = await query(
      `SELECT id, username, email, full_name, role, phone, avatar, 
              is_active, last_login, created_at, updated_at 
       FROM ${this.tableName} 
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all users without password field
   */
  async findAllSafe(filters?: IUserFilter): Promise<Omit<IUser, 'password'>[]> {
    const users = await this.findAll(filters);
    return users.map((user) => this.omitPassword(user));
  }

  /**
   * Remove password from user object
   */
  omitPassword(user: IUser): Omit<IUser, 'password'> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  }> {
    const [totalResult, activeResult, byRoleResult] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${this.tableName}`),
      query(
        `SELECT COUNT(*) as count FROM ${this.tableName} WHERE is_active = true`
      ),
      this.getUsersCountByRole(),
    ]);

    const total = parseInt(totalResult.rows[0]?.count || '0', 10);
    const active = parseInt(activeResult.rows[0]?.count || '0', 10);

    return {
      total,
      active,
      inactive: total - active,
      byRole: byRoleResult,
    };
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new UserModel();