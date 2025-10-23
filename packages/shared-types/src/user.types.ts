// ===================================
// User & Employee Types
// ===================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES_STAFF = 'SALES_STAFF',
  ACCOUNTANT = 'ACCOUNTANT',
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface IUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  branchId?: string | null;
  employeeId?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  RESIGNED = 'RESIGNED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
}

export interface IEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  nationalId?: string | null;
  position: string;
  department?: string | null;
  employmentType: EmploymentType;
  hireDate: Date;
  terminationDate?: Date | null;
  status: EmploymentStatus;
  branchId?: string | null;
  baseSalary?: number | null;
  commissionRate?: number | null;
  address?: string | null;
  city?: string | null;
  birthDate?: Date | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  contractDocument?: string | null;
  idDocument?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: Partial<IUser>;
}

// ===================================
// Branch Types
// ===================================

export interface IBranch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  isMainBranch: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===================================
// Customer (CRM) & Supplier Types
// ===================================

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
}

export interface ICustomer {
  id: string;
  code: string;
  type: CustomerType;
  status: CustomerStatus;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  phone: string;
  email?: string | null;
  nationalId?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  creditLimit?: number | null;
  currentBalance: number;
  notes?: string | null;
  birthDate?: Date | null;
  anniversary?: Date | null;
  loyaltyPoints: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
}

export interface ISupplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  paymentTerms?: string | null;
  rating?: number | null;
  categories: string[];
  licenseNumber?: string | null;
  taxId?: string | null;
  notes?: string | null;
  website?: string | null;
  status: SupplierStatus;
  createdAt: Date;
  updatedAt: Date;
}