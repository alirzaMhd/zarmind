// ==========================================
// ZARMIND - Audit Log Model
// ==========================================

import {
  query,
} from '../config/database';
import {
  IAuditLog,
  AuditAction,
  EntityType,
} from '../types';
import logger from '../utils/logger';

// ==========================================
// INTERFACES
// ==========================================

export interface ICreateAuditLog {
  user_id: string;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
}

export interface IAuditLogFilter {
  user_id?: string;
  action?: AuditAction;
  entity_type?: EntityType;
  entity_id?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface IAuditLogSummary {
  totalLogs: number;
  byAction: Record<AuditAction, number>;
  byEntityType: Record<EntityType, number>;
  recentActivities: IAuditLog[];
}

export interface IUserActivity {
  user_id: string;
  totalActions: number;
  lastActivity: Date;
  actionBreakdown: Record<AuditAction, number>;
}

// ==========================================
// AUDIT LOG MODEL
// ==========================================

class AuditLogModel {
  private tableName = 'audit_logs';

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Initialize action record with all enum values
   */
  private initializeActionRecord(): Record<AuditAction, number> {
    return Object.values(AuditAction).reduce((acc, action) => {
      acc[action] = 0;
      return acc;
    }, {} as Record<AuditAction, number>);
  }

  /**
   * Initialize entity type record with all enum values
   */
  private initializeEntityTypeRecord(): Record<EntityType, number> {
    return Object.values(EntityType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<EntityType, number>);
  }

  // ==========================================
  // CREATE
  // ==========================================

  /**
   * Create a new audit log entry
   */
  async create(auditData: ICreateAuditLog): Promise<IAuditLog> {
    try {
      const auditToInsert = {
        user_id: auditData.user_id,
        action: auditData.action,
        entity_type: auditData.entity_type,
        entity_id: auditData.entity_id,
        old_value: auditData.old_value ? JSON.stringify(auditData.old_value) : null,
        new_value: auditData.new_value ? JSON.stringify(auditData.new_value) : null,
        ip_address: auditData.ip_address || null,
        user_agent: auditData.user_agent || null,
      };

      const result = await query(
        `INSERT INTO ${this.tableName} 
        (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          auditToInsert.user_id,
          auditToInsert.action,
          auditToInsert.entity_type,
          auditToInsert.entity_id,
          auditToInsert.old_value,
          auditToInsert.new_value,
          auditToInsert.ip_address,
          auditToInsert.user_agent,
        ]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Log entity creation
   */
  async logCreate(
    user_id: string,
    entity_type: EntityType,
    entity_id: string,
    new_value: any,
    ip_address?: string,
    user_agent?: string
  ): Promise<IAuditLog> {
    return this.create({
      user_id,
      action: AuditAction.CREATE,
      entity_type,
      entity_id,
      new_value,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log entity update
   */
  async logUpdate(
    user_id: string,
    entity_type: EntityType,
    entity_id: string,
    old_value: any,
    new_value: any,
    ip_address?: string,
    user_agent?: string
  ): Promise<IAuditLog> {
    return this.create({
      user_id,
      action: AuditAction.UPDATE,
      entity_type,
      entity_id,
      old_value,
      new_value,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log entity deletion
   */
  async logDelete(
    user_id: string,
    entity_type: EntityType,
    entity_id: string,
    old_value: any,
    ip_address?: string,
    user_agent?: string
  ): Promise<IAuditLog> {
    return this.create({
      user_id,
      action: AuditAction.DELETE,
      entity_type,
      entity_id,
      old_value,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log entity view
   */
  async logView(
    user_id: string,
    entity_type: EntityType,
    entity_id: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<IAuditLog> {
    return this.create({
      user_id,
      action: AuditAction.VIEW,
      entity_type,
      entity_id,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log entity cancel
   */
  async logCancel(
    user_id: string,
    entity_type: EntityType,
    entity_id: string,
    old_value: any,
    ip_address?: string,
    user_agent?: string
  ): Promise<IAuditLog> {
    return this.create({
      user_id,
      action: AuditAction.CANCEL,
      entity_type,
      entity_id,
      old_value,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log entity restore
   */
  async logRestore(
    user_id: string,
    entity_type: EntityType,
    entity_id: string,
    new_value: any,
    ip_address?: string,
    user_agent?: string
  ): Promise<IAuditLog> {
    return this.create({
      user_id,
      action: AuditAction.RESTORE,
      entity_type,
      entity_id,
      new_value,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log login
   */
  async logLogin(
    user_id: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<IAuditLog> {
    return this.create({
      user_id,
      action: AuditAction.LOGIN,
      entity_type: EntityType.USER,
      entity_id: user_id,
      ip_address,
      user_agent,
    });
  }

  /**
   * Log logout
   */
  async logLogout(
    user_id: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<IAuditLog> {
    return this.create({
      user_id,
      action: AuditAction.LOGOUT,
      entity_type: EntityType.USER,
      entity_id: user_id,
      ip_address,
      user_agent,
    });
  }

  // ==========================================
  // READ
  // ==========================================

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<IAuditLog | null> {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all audit logs with optional filters
   */
  async findAll(filters?: IAuditLogFilter): Promise<IAuditLog[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters?.user_id) {
      sql += ` AND user_id = $${paramIndex}`;
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters?.action) {
      sql += ` AND action = $${paramIndex}`;
      params.push(filters.action);
      paramIndex++;
    }

    if (filters?.entity_type) {
      sql += ` AND entity_type = $${paramIndex}`;
      params.push(filters.entity_type);
      paramIndex++;
    }

    if (filters?.entity_id) {
      sql += ` AND entity_id = $${paramIndex}`;
      params.push(filters.entity_id);
      paramIndex++;
    }

    if (filters?.startDate) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      sql += ` AND created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters?.search) {
      sql += ` AND (
        entity_id ILIKE $${paramIndex} OR 
        ip_address ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get audit logs with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: IAuditLogFilter
  ): Promise<{ logs: IAuditLog[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    let countSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
    let dataSql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters (same as findAll)
    if (filters?.user_id) {
      const filter = ` AND user_id = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters?.action) {
      const filter = ` AND action = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.action);
      paramIndex++;
    }

    if (filters?.entity_type) {
      const filter = ` AND entity_type = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.entity_type);
      paramIndex++;
    }

    if (filters?.entity_id) {
      const filter = ` AND entity_id = $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.entity_id);
      paramIndex++;
    }

    if (filters?.startDate) {
      const filter = ` AND created_at >= $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      const filter = ` AND created_at <= $${paramIndex}`;
      countSql += filter;
      dataSql += filter;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters?.search) {
      const filter = ` AND (
        entity_id ILIKE $${paramIndex} OR 
        ip_address ILIKE $${paramIndex}
      )`;
      countSql += filter;
      dataSql += filter;
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
      logs: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Get audit logs by user
   */
  async findByUser(user_id: string, limit?: number): Promise<IAuditLog[]> {
    let sql = `SELECT * FROM ${this.tableName} 
               WHERE user_id = $1 
               ORDER BY created_at DESC`;
    const params: any[] = [user_id];

    if (limit) {
      sql += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get audit logs for specific entity
   */
  async findByEntity(entity_type: EntityType, entity_id: string): Promise<IAuditLog[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} 
       WHERE entity_type = $1 AND entity_id = $2 
       ORDER BY created_at ASC`,
      [entity_type, entity_id]
    );

    return result.rows;
  }

  /**
   * Get audit trail for entity (chronological history)
   */
  async getEntityAuditTrail(
    entity_type: EntityType,
    entity_id: string
  ): Promise<IAuditLog[]> {
    const result = await query(
      `SELECT al.*, u.username, u.full_name
       FROM ${this.tableName} al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type = $1 AND al.entity_id = $2 
       ORDER BY al.created_at ASC`,
      [entity_type, entity_id]
    );

    return result.rows;
  }

  /**
   * Get audit logs by action
   */
  async findByAction(action: AuditAction, limit?: number): Promise<IAuditLog[]> {
    let sql = `SELECT * FROM ${this.tableName} 
               WHERE action = $1 
               ORDER BY created_at DESC`;
    const params: any[] = [action];

    if (limit) {
      sql += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get recent audit logs
   */
  async findRecent(limit: number = 20): Promise<IAuditLog[]> {
    const result = await query(
      `SELECT al.*, u.username, u.full_name
       FROM ${this.tableName} al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get today's audit logs
   */
  async getTodayLogs(): Promise<IAuditLog[]> {
    const result = await query(
      `SELECT al.*, u.username, u.full_name
       FROM ${this.tableName} al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE DATE(al.created_at) = CURRENT_DATE 
       ORDER BY al.created_at DESC`
    );

    return result.rows;
  }

  /**
   * Get login history for user
   */
  async getUserLoginHistory(user_id: string, limit: number = 10): Promise<IAuditLog[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} 
       WHERE user_id = $1 AND action = 'login' 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [user_id, limit]
    );

    return result.rows;
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(user_id: string): Promise<IUserActivity> {
    const [activityResult, actionBreakdownResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as total_actions, MAX(created_at) as last_activity 
         FROM ${this.tableName} 
         WHERE user_id = $1`,
        [user_id]
      ),
      query(
        `SELECT action, COUNT(*) as count 
         FROM ${this.tableName} 
         WHERE user_id = $1 
         GROUP BY action`,
        [user_id]
      ),
    ]);

    const totalActions = parseInt(activityResult.rows[0]?.total_actions || '0', 10);
    const lastActivity = activityResult.rows[0]?.last_activity || new Date();

    // Use dynamic initialization
    const actionBreakdown = this.initializeActionRecord();

    actionBreakdownResult.rows.forEach((row) => {
      actionBreakdown[row.action as AuditAction] = parseInt(row.count, 10);
    });

    return {
      user_id,
      totalActions,
      lastActivity,
      actionBreakdown,
    };
  }

  // ==========================================
  // STATISTICS & REPORTS
  // ==========================================

  /**
   * Get audit log summary
   */
  async getSummary(startDate?: Date, endDate?: Date): Promise<IAuditLogSummary> {
    let whereClause = '';
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause = 'WHERE created_at BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    const [totalResult, byActionResult, byEntityResult, recentResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`,
        params
      ),
      query(
        `SELECT action, COUNT(*) as count 
         FROM ${this.tableName} ${whereClause}
         GROUP BY action`,
        params
      ),
      query(
        `SELECT entity_type, COUNT(*) as count 
         FROM ${this.tableName} ${whereClause}
         GROUP BY entity_type`,
        params
      ),
      query(
        `SELECT * FROM ${this.tableName} 
         ORDER BY created_at DESC 
         LIMIT 10`
      ),
    ]);

    const totalLogs = parseInt(totalResult.rows[0]?.count || '0', 10);

    // Use dynamic initialization
    const byAction = this.initializeActionRecord();

    byActionResult.rows.forEach((row) => {
      byAction[row.action as AuditAction] = parseInt(row.count, 10);
    });

    // Use dynamic initialization
    const byEntityType = this.initializeEntityTypeRecord();

    byEntityResult.rows.forEach((row) => {
      byEntityType[row.entity_type as EntityType] = parseInt(row.count, 10);
    });

    return {
      totalLogs,
      byAction,
      byEntityType,
      recentActivities: recentResult.rows,
    };
  }

  /**
   * Get most active users
   */
  async getMostActiveUsers(limit: number = 10): Promise<
    Array<{
      user_id: string;
      username?: string;
      full_name?: string;
      action_count: number;
    }>
  > {
    const result = await query(
      `SELECT al.user_id, u.username, u.full_name, COUNT(*) as action_count 
       FROM ${this.tableName} al
       LEFT JOIN users u ON al.user_id = u.id
       GROUP BY al.user_id, u.username, u.full_name 
       ORDER BY action_count DESC 
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      full_name: row.full_name,
      action_count: parseInt(row.action_count, 10),
    }));
  }

  /**
   * Get most accessed entities
   */
  async getMostAccessedEntities(
    entity_type: EntityType,
    limit: number = 10
  ): Promise<
    Array<{
      entity_id: string;
      access_count: number;
    }>
  > {
    const result = await query(
      `SELECT entity_id, COUNT(*) as access_count 
       FROM ${this.tableName} 
       WHERE entity_type = $1 
       GROUP BY entity_id 
       ORDER BY access_count DESC 
       LIMIT $2`,
      [entity_type, limit]
    );

    return result.rows.map((row) => ({
      entity_id: row.entity_id,
      access_count: parseInt(row.access_count, 10),
    }));
  }

  /**
   * Get changes made to entity
   */
  async getEntityChanges(
    entity_type: EntityType,
    entity_id: string
  ): Promise<
    Array<{
      action: AuditAction;
      old_value: any;
      new_value: any;
      changed_by: string;
      changed_at: Date;
    }>
  > {
    const result = await query(
      `SELECT al.action, al.old_value, al.new_value, al.user_id, u.username, al.created_at
       FROM ${this.tableName} al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type = $1 AND al.entity_id = $2 
       AND al.action IN ('create', 'update', 'delete')
       ORDER BY al.created_at ASC`,
      [entity_type, entity_id]
    );

    return result.rows.map((row) => ({
      action: row.action,
      old_value: row.old_value,
      new_value: row.new_value,
      changed_by: row.username,
      changed_at: row.created_at,
    }));
  }

  /**
   * Get suspicious activities (multiple failed attempts, etc.)
   */
  async getSuspiciousActivities(limit: number = 20): Promise<
    Array<{
      user_id: string;
      ip_address: string;
      action_count: number;
      last_activity: Date;
    }>
  > {
    // This is a placeholder - customize based on what you consider suspicious
    // For example: multiple deletes, access from different IPs, etc.
    const result = await query(
      `SELECT user_id, ip_address, COUNT(*) as action_count, MAX(created_at) as last_activity
       FROM ${this.tableName}
       WHERE action = 'delete' 
       AND created_at > NOW() - INTERVAL '24 hours'
       GROUP BY user_id, ip_address
       HAVING COUNT(*) > 5
       ORDER BY action_count DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      user_id: row.user_id,
      ip_address: row.ip_address,
      action_count: parseInt(row.action_count, 10),
      last_activity: row.last_activity,
    }));
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  /**
   * Delete old audit logs (for data retention)
   */
  async deleteOldLogs(daysToKeep: number = 365): Promise<number> {
    const result = await query(
      `DELETE FROM ${this.tableName} 
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`
    );

    const deletedCount = result.rowCount || 0;
    logger.info(`Deleted ${deletedCount} old audit logs (older than ${daysToKeep} days)`);

    return deletedCount;
  }

  /**
   * Archive old audit logs (move to archive table - placeholder)
   */
  async archiveOldLogs(_daysToKeep: number = 365): Promise<number> {
    // This would move old logs to an archive table
    // For now, just return 0
    logger.info('Archive functionality not implemented');
    return 0;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byAction: Record<AuditAction, number>;
    byEntityType: Record<EntityType, number>;
  }> {
    const [
      totalResult,
      todayResult,
      weekResult,
      monthResult,
      byActionResult,
      byEntityResult,
    ] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${this.tableName}`),
      query(
        `SELECT COUNT(*) as count FROM ${this.tableName} 
         WHERE DATE(created_at) = CURRENT_DATE`
      ),
      query(
        `SELECT COUNT(*) as count FROM ${this.tableName} 
         WHERE created_at >= NOW() - INTERVAL '7 days'`
      ),
      query(
        `SELECT COUNT(*) as count FROM ${this.tableName} 
         WHERE created_at >= NOW() - INTERVAL '30 days'`
      ),
      query(
        `SELECT action, COUNT(*) as count 
         FROM ${this.tableName} 
         GROUP BY action`
      ),
      query(
        `SELECT entity_type, COUNT(*) as count 
         FROM ${this.tableName} 
         GROUP BY entity_type`
      ),
    ]);

    // Use dynamic initialization
    const byAction = this.initializeActionRecord();

    byActionResult.rows.forEach((row) => {
      byAction[row.action as AuditAction] = parseInt(row.count, 10);
    });

    // Use dynamic initialization
    const byEntityType = this.initializeEntityTypeRecord();

    byEntityResult.rows.forEach((row) => {
      byEntityType[row.entity_type as EntityType] = parseInt(row.count, 10);
    });

    return {
      total: parseInt(totalResult.rows[0]?.count || '0', 10),
      today: parseInt(todayResult.rows[0]?.count || '0', 10),
      thisWeek: parseInt(weekResult.rows[0]?.count || '0', 10),
      thisMonth: parseInt(monthResult.rows[0]?.count || '0', 10),
      byAction,
      byEntityType,
    };
  }

  /**
   * Search audit logs
   */
  async search(searchTerm: string, limit: number = 20): Promise<IAuditLog[]> {
    const result = await query(
      `SELECT * FROM ${this.tableName} 
       WHERE entity_id ILIKE $1 OR ip_address ILIKE $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );

    return result.rows;
  }
}

// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================

export default new AuditLogModel();