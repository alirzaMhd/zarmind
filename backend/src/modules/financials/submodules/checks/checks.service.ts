import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateCheckDto } from './dto/create-check.dto';
import { UpdateCheckDto } from './dto/update-check.dto';
import { UpdateCheckStatusDto } from './dto/update-check-status.dto';
import { Prisma, CheckType, CheckStatus } from '@prisma/client';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class ChecksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCheckDto) {
    // Validate related customer/supplier if provided
    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) throw new BadRequestException('Customer not found');
    }
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) throw new BadRequestException('Supplier not found');
    }

    const data: Prisma.CheckCreateInput = {
      checkNumber: dto.checkNumber,
      type: dto.type,
      status: dto.status ?? CheckStatus.PENDING,
      amount: dto.amount,
      issueDate: new Date(dto.issueDate),
      dueDate: new Date(dto.dueDate),
      bankName: dto.bankName,
      branchName: dto.branchName ?? null,
      accountNumber: dto.accountNumber ?? null,
      issuerName: dto.issuerName ?? null,
      customerId: dto.customerId ?? null,
      supplierId: dto.supplierId ?? null,
      payeeName: dto.payeeName ?? null,
      checkImages: dto.checkImages ?? [],
      notes: dto.notes ?? null,
    };

    const created = await this.prisma.check.create({ data });
    return this.mapCheck(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    type?: CheckType;
    status?: CheckStatus;
    fromDueDate?: string;
    toDueDate?: string;
    bankName?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: 'createdAt' | 'dueDate' | 'issueDate' | 'amount';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      type,
      status,
      fromDueDate,
      toDueDate,
      bankName,
      minAmount,
      maxAmount,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = params;

    const where: Prisma.CheckWhereInput = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(bankName ? { bankName: { contains: bankName, mode: 'insensitive' } } : {}),
      ...(fromDueDate || toDueDate
        ? {
            dueDate: {
              gte: fromDueDate ? new Date(fromDueDate) : undefined,
              lte: toDueDate ? new Date(toDueDate) : undefined,
            },
          }
        : {}),
      ...(minAmount !== undefined || maxAmount !== undefined
        ? {
            amount: {
              gte: minAmount,
              lte: maxAmount,
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { checkNumber: { contains: search, mode: 'insensitive' } },
              { issuerName: { contains: search, mode: 'insensitive' } },
              { payeeName: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.check.count({ where }),
      this.prisma.check.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const items = rows.map((r) => this.mapCheck(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const check = await this.prisma.check.findUnique({
      where: { id },
    });

    if (!check) throw new NotFoundException('Check not found');
    return this.mapCheck(check);
  }

  async update(id: string, dto: UpdateCheckDto) {
    const existing = await this.prisma.check.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Check not found');

    if (existing.status === CheckStatus.CLEARED || existing.status === CheckStatus.CASHED) {
      throw new BadRequestException('Cannot update a cleared or cashed check');
    }

    const data: Prisma.CheckUpdateInput = {
      checkNumber: dto.checkNumber ?? undefined,
      type: dto.type ?? undefined,
      amount: dto.amount ?? undefined,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      bankName: dto.bankName ?? undefined,
      branchName: dto.branchName ?? undefined,
      accountNumber: dto.accountNumber ?? undefined,
      issuerName: dto.issuerName ?? undefined,
      customerId: dto.customerId ?? undefined,
      supplierId: dto.supplierId ?? undefined,
      payeeName: dto.payeeName ?? undefined,
      checkImages: dto.checkImages ?? undefined,
      notes: dto.notes ?? undefined,
    };

    const updated = await this.prisma.check.update({
      where: { id },
      data,
    });

    return this.mapCheck(updated);
  }

  async updateStatus(id: string, dto: UpdateCheckStatusDto) {
    const existing = await this.prisma.check.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Check not found');

    const updateDate = dto.date ? new Date(dto.date) : new Date();

    const data: Prisma.CheckUpdateInput = { status: dto.status };

    switch (dto.status) {
      case CheckStatus.DEPOSITED:
        data.depositedDate = updateDate;
        break;
      case CheckStatus.CLEARED:
        data.clearedDate = updateDate;
        data.depositedDate = data.depositedDate ?? updateDate;
        break;
      case CheckStatus.BOUNCED:
        if (!dto.reason) {
          throw new BadRequestException('Reason is required for bounced checks');
        }
        data.bouncedDate = updateDate;
        data.bouncedReason = dto.reason;
        break;
      case CheckStatus.CANCELLED:
      case CheckStatus.TRANSFERRED:
        // No specific date field for these, but can be logged in notes if needed
        break;
    }

    const updated = await this.prisma.check.update({
      where: { id },
      data,
    });

    return this.mapCheck(updated);
  }

  async getSummary(type?: CheckType) {
    const where: Prisma.CheckWhereInput = { ...(type ? { type } : {}) };

    const [byStatus, upcomingDue, overdue] = await Promise.all([
      this.prisma.check.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { amount: true },
      }),

      this.prisma.check.aggregate({
        where: {
          ...where,
          status: { in: [CheckStatus.PENDING, CheckStatus.DEPOSITED] },
          dueDate: {
            gte: new Date(),
            lte: new Date(new Date().setDate(new Date().getDate() + 7)),
          },
        },
        _count: true,
        _sum: { amount: true },
      }),

      this.prisma.check.aggregate({
        where: {
          ...where,
          status: { in: [CheckStatus.PENDING, CheckStatus.DEPOSITED] },
          dueDate: { lt: new Date() },
        },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      type: type ?? 'ALL',
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        totalAmount: this.decimalToNumber(s._sum.amount),
      })),
      upcomingDue: {
        count: upcomingDue._count,
        totalAmount: this.decimalToNumber(upcomingDue._sum.amount),
      },
      overdue: {
        count: overdue._count,
        totalAmount: this.decimalToNumber(overdue._sum.amount),
      },
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.check.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Check not found');

    if (
      existing.status === CheckStatus.CLEARED ||
      existing.status === CheckStatus.CASHED ||
      existing.status === CheckStatus.DEPOSITED
    ) {
      throw new BadRequestException('Cannot delete a check that has been processed. Cancel it instead.');
    }

    await this.prisma.check.delete({ where: { id } });
    return { success: true, message: 'Check deleted' };
  }

  // Helper methods

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

  private mapCheck(c: any) {
    return {
      id: c.id,
      checkNumber: c.checkNumber,
      type: c.type,
      status: c.status,
      amount: this.decimalToNumber(c.amount),
      issueDate: c.issueDate,
      dueDate: c.dueDate,
      bankName: c.bankName,
      branchName: c.branchName,
      accountNumber: c.accountNumber,
      issuerName: c.issuerName,
      customerId: c.customerId,
      supplierId: c.supplierId,
      payeeName: c.payeeName,
      checkImages: Array.isArray(c.checkImages) ? c.checkImages : [],
      notes: c.notes,
      depositedDate: c.depositedDate,
      clearedDate: c.clearedDate,
      bouncedDate: c.bouncedDate,
      bouncedReason: c.bouncedReason,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}