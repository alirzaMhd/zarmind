import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole, UserStatus } from '@zarmind/shared-types';
import * as bcrypt from 'bcryptjs';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

type SafeUser = {
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
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Verify branch exists if provided
    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
        select: { id: true },
      });
      if (!branch) throw new BadRequestException('Branch not found');
    }

    // Verify employee exists if provided
    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true },
      });
      if (!employee) throw new BadRequestException('Employee not found');

      // Check if employee is already linked to another user
      const existingUser = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (existingUser) {
        throw new ConflictException('Employee is already linked to another user');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const data: any = {
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      role: dto.role ?? UserRole.SALES_STAFF,
      status: dto.status ?? UserStatus.ACTIVE,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
    };

    const created = await this.prisma.user.create({
      data,
      include: {
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    return this.mapUser(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    branchId?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<SafeUser>> {
    const {
      page,
      limit,
      search,
      role,
      status,
      branchId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(branchId ? { branchId } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
        },
      }),
    ]);

    const items = rows.map((r: any) => this.mapUser(r));
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            city: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            position: true,
            department: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.mapUser(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    // Check if email is being changed and already exists
    if (dto.email && dto.email !== existing.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if username is being changed and already exists
    if (dto.username && dto.username !== existing.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    // Verify branch if being updated
    if (dto.branchId && dto.branchId !== existing.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
        select: { id: true },
      });
      if (!branch) throw new BadRequestException('Branch not found');
    }

    // Verify employee if being updated
    if (dto.employeeId && dto.employeeId !== existing.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true },
      });
      if (!employee) throw new BadRequestException('Employee not found');

      // Check if employee is already linked to another user
      const existingUser = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Employee is already linked to another user');
      }
    }

    const data: any = {
      email: dto.email ?? undefined,
      username: dto.username ?? undefined,
      firstName: dto.firstName ?? undefined,
      lastName: dto.lastName ?? undefined,
      phone: dto.phone ?? undefined,
      role: dto.role ?? undefined,
      status: dto.status ?? undefined,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      employee: dto.employeeId ? { connect: { id: dto.employeeId } } : undefined,
    };

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    });

    return this.mapUser(updated);
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password reset successfully',
      userId: id,
    };
  }

  async updateStatus(id: string, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    return {
      success: true,
      message: `User status updated to ${status}`,
      userId: id,
      status: updated.status,
    };
  }

  async updateRole(id: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    return {
      success: true,
      message: `User role updated to ${role}`,
      userId: id,
      role: updated.role,
    };
  }

  async getSummary() {
    const [totalUsers, byRole, byStatus, recentLogins] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),

      this.prisma.user.groupBy({
        by: ['status'],
        _count: true,
      }),

      this.prisma.user.findMany({
        where: { lastLoginAt: { not: null } },
        orderBy: { lastLoginAt: 'desc' },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          lastLoginAt: true,
        },
      }),
    ]);

    return {
      totalUsers,
      byRole: byRole.map((r: any) => ({ role: r.role, count: r._count })),
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
      recentLogins,
    };
  }

  async getActivity(id: string, from?: string, to?: string, limit: number = 50) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    const { fromDate, toDate } = this.parseDateRange(from, to);

    const [auditLogs, sales, purchases] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          userId: id,
          createdAt: { gte: fromDate, lte: toDate },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),

      this.prisma.sale.count({
        where: {
          userId: id,
          saleDate: { gte: fromDate, lte: toDate },
        },
      }),

      this.prisma.purchase.count({
        where: {
          userId: id,
          purchaseDate: { gte: fromDate, lte: toDate },
        },
      }),
    ]);

    return {
      userId: id,
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      salesCount: sales,
      purchasesCount: purchases,
      recentActivity: auditLogs,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    if (existing.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete super admin user');
    }

    // Soft delete: mark as inactive
    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
    });

    return { success: true, message: 'User marked as inactive' };
  }

  // Helper methods

  private parseDateRange(from?: string, to?: string): { fromDate: Date; toDate: Date } {
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);
    return { fromDate, toDate };
  }

  private mapUser(u: any): SafeUser {
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      role: u.role,
      status: u.status,
      branchId: u.branchId,
      employeeId: u.employeeId,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      branch: u.branch ?? undefined,
      employee: u.employee ?? undefined,
    } as any;
  }
}