import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmploymentStatus, EmploymentType } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const employeeCode = dto.employeeCode ?? this.generateEmployeeCode();

    // Verify branch if provided
    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
        select: { id: true },
      });
      if (!branch) throw new BadRequestException('Branch not found');
    }

    // Check for duplicate employee code
    const existing = await this.prisma.employee.findUnique({
      where: { employeeCode },
    });
    if (existing) throw new BadRequestException('Employee code already exists');

    // Check for duplicate national ID if provided
    if (dto.nationalId) {
      const existingNationalId = await this.prisma.employee.findUnique({
        where: { nationalId: dto.nationalId },
      });
      if (existingNationalId) throw new BadRequestException('National ID already exists');
    }

    const data: any = {
      employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email ?? null,
      nationalId: dto.nationalId ?? null,
      position: dto.position,
      department: dto.department ?? null,
      employmentType: dto.employmentType,
      hireDate: new Date(dto.hireDate),
      terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : null,
      status: dto.status ?? EmploymentStatus.ACTIVE,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      baseSalary: dto.baseSalary ?? null,
      commissionRate: dto.commissionRate ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      emergencyContact: dto.emergencyContact ?? null,
      emergencyPhone: dto.emergencyPhone ?? null,
      notes: dto.notes ?? null,
    };

    const created = await this.prisma.employee.create({
      data,
      include: {
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return this.mapEmployee(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: EmploymentStatus;
    employmentType?: EmploymentType;
    department?: string;
    branchId?: string;
    sortBy?: 'createdAt' | 'hireDate' | 'firstName' | 'employeeCode';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      status,
      employmentType,
      department,
      branchId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      ...(status ? { status } : {}),
      ...(employmentType ? { employmentType } : {}),
      ...(department ? { department: { contains: department, mode: 'insensitive' } } : {}),
      ...(branchId ? { branchId } : {}),
      ...(search
        ? {
            OR: [
              { employeeCode: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { nationalId: { contains: search, mode: 'insensitive' } },
              { position: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
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
        },
      }),
    ]);

    const items = rows.map((e: any) => this.mapEmployee(e));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
          },
        },
      },
    });

    if (!employee) throw new NotFoundException('Employee not found');
    return this.mapEmployee(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

    // Check for duplicate employee code if changed
    if (dto.employeeCode && dto.employeeCode !== existing.employeeCode) {
      const duplicate = await this.prisma.employee.findUnique({
        where: { employeeCode: dto.employeeCode },
      });
      if (duplicate) throw new BadRequestException('Employee code already exists');
    }

    // Check for duplicate national ID if changed
    if (dto.nationalId && dto.nationalId !== existing.nationalId) {
      const duplicate = await this.prisma.employee.findUnique({
        where: { nationalId: dto.nationalId },
      });
      if (duplicate) throw new BadRequestException('National ID already exists');
    }

    // Verify branch if provided
    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
        select: { id: true },
      });
      if (!branch) throw new BadRequestException('Branch not found');
    }

    const data: any = {
      employeeCode: dto.employeeCode ?? undefined,
      firstName: dto.firstName ?? undefined,
      lastName: dto.lastName ?? undefined,
      phone: dto.phone ?? undefined,
      email: dto.email ?? undefined,
      nationalId: dto.nationalId ?? undefined,
      position: dto.position ?? undefined,
      department: dto.department ?? undefined,
      employmentType: dto.employmentType ?? undefined,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      terminationDate: dto.terminationDate ? new Date(dto.terminationDate) : undefined,
      status: dto.status ?? undefined,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      baseSalary: dto.baseSalary ?? undefined,
      commissionRate: dto.commissionRate ?? undefined,
      address: dto.address ?? undefined,
      city: dto.city ?? undefined,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      emergencyContact: dto.emergencyContact ?? undefined,
      emergencyPhone: dto.emergencyPhone ?? undefined,
      notes: dto.notes ?? undefined,
    };

    // Remove undefined values
    Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

    const updated = await this.prisma.employee.update({
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
      },
    });

    return this.mapEmployee(updated);
  }

  async getSummary() {
    const [totalEmployees, byStatus, byDepartment, byEmploymentType] = await Promise.all([
      this.prisma.employee.count(),

      this.prisma.employee.groupBy({
        by: ['status'],
        _count: true,
      }),

      this.prisma.employee.groupBy({
        by: ['department'],
        where: { department: { not: null } },
        _count: true,
      }),

      this.prisma.employee.groupBy({
        by: ['employmentType'],
        _count: true,
      }),
    ]);

    return {
      totalEmployees,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
      byDepartment: byDepartment.map((d: any) => ({ department: d.department, count: d._count })),
      byEmploymentType: byEmploymentType.map((t: any) => ({ type: t.employmentType, count: t._count })),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

    // Soft delete: mark as inactive/terminated
    await this.prisma.employee.update({
      where: { id },
      data: { status: EmploymentStatus.TERMINATED },
    });

    return { success: true, message: 'Employee marked as terminated' };
  }

  // Helpers

  private generateEmployeeCode(): string {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const t = Date.now().toString(36).toUpperCase();
    return `EMP-${y}${m}${d}-${t}`;
  }

  private decimalToNumber(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof (value as any).toNumber === 'function') {
      try {
        return (value as any).toNumber();
      } catch {
        // ignore
      }
    }
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  private mapEmployee(e: any) {
    return {
      id: e.id,
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      phone: e.phone,
      email: e.email,
      nationalId: e.nationalId,
      position: e.position,
      department: e.department,
      employmentType: e.employmentType,
      hireDate: e.hireDate,
      terminationDate: e.terminationDate,
      status: e.status,
      branchId: e.branchId,
      branch: e.branch ?? undefined,
      baseSalary: this.decimalToNumber(e.baseSalary),
      commissionRate: this.decimalToNumber(e.commissionRate),
      address: e.address,
      city: e.city,
      birthDate: e.birthDate,
      emergencyContact: e.emergencyContact,
      emergencyPhone: e.emergencyPhone,
      notes: e.notes,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}