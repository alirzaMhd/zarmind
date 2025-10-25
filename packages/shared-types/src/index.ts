// Export all types and enums from all files

import { UserRole } from './user.types';

export * from './financial.types';
export * from './inventory.types';
export * from './report.types';
export * from './transaction.types';
export * from './user.types';
export * from './employee.types'; // <-- ADD THIS LINE

// ===================================
// Other Shared System Types
// ===================================

export enum ReminderRecurrence { // <-- ENSURE THIS IS HERE
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface IAuditLog {
  id: string;
  userId: string;
  // user: Partial<IUser>; // Comment out to avoid circular dependency issues in simple setups
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: any | null; // JSON
  newValue?: any | null; // JSON
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export enum NotificationType {
  LOW_INVENTORY = 'LOW_INVENTORY',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  CHECK_DUE = 'CHECK_DUE',
  CHECK_BOUNCED = 'CHECK_BOUNCED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  EMPLOYEE_BIRTHDAY = 'EMPLOYEE_BIRTHDAY',
  CUSTOMER_BIRTHDAY = 'CUSTOMER_BIRTHDAY',
  CUSTOMER_ANNIVERSARY = 'CUSTOMER_ANNIVERSARY',
  WORK_ORDER_DUE = 'WORK_ORDER_DUE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  CUSTOM = 'CUSTOM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface INotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  userId?: string | null;
  roleTarget?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata?: any | null; // JSON
  expiresAt?: Date | null;
  createdAt: Date;
}

export enum SettingCategory {
  GENERAL = 'GENERAL',
  COMPANY = 'COMPANY',
  TAX = 'TAX',
  CURRENCY = 'CURRENCY',
  EMAIL = 'EMAIL',
  NOTIFICATION = 'NOTIFICATION',
  SECURITY = 'SECURITY',
  INTEGRATION = 'INTEGRATION',
  PRINTER = 'PRINTER',
  BACKUP = 'BACKUP',
}

export interface ISystemSetting {
  id: string;
  category: SettingCategory;
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  CONTRACT = 'CONTRACT',
  LICENSE = 'LICENSE',
  CERTIFICATE = 'CERTIFICATE',
  ID_DOCUMENT = 'ID_DOCUMENT',
  PRODUCT_IMAGE = 'PRODUCT_IMAGE',
  CHECK_IMAGE = 'CHECK_IMAGE',
  EXPENSE_RECEIPT = 'EXPENSE_RECEIPT',
  OTHER = 'OTHER',
}

export interface IDocument {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  type: DocumentType;
  relatedEntity?: string | null;
  relatedEntityId?: string | null;
  description?: string | null;
  tags: string[];
  uploadedBy?: string | null;
  uploadedAt: Date;
}