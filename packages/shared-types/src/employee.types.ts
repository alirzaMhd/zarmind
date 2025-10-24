import { PaymentMethod } from './financial.types';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
  HOLIDAY = 'HOLIDAY',
  SICK = 'SICK',
}

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  UNPAID = 'UNPAID',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface IAttendance {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date | null;
  checkOut?: Date | null;
  hoursWorked?: number | null;
  overtime?: number | null;
  status: AttendanceStatus;
  notes?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeave {
  id: string;
  employeeId: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string | null;
  appliedAt: Date;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayroll {
  id: string;
  employeeId: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  payDate: Date;
  baseSalary: number;
  commission: number;
  bonus: number;
  overtime: number;
  allowances: number;
  tax: number;
  insurance: number;
  loan: number;
  otherDeductions: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  paymentMethod?: PaymentMethod | null;
  paid: boolean;
  paidAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPerformance {
  id: string;
  employeeId: string;
  reviewPeriod: string;
  reviewDate: Date;
  totalSales?: number | null;
  targetSales?: number | null;
  achievementRate?: number | null;
  customersServed?: number | null;
  qualityScore?: number | null;
  punctualityScore?: number | null;
  teamworkScore?: number | null;
  overallRating?: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
  feedback?: string | null;
  goals?: string | null;
  reviewedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}