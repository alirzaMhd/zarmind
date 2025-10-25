import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import { CashTransactionType } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCashTransactionDto, createdByUserId: string) {
    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      select: { id: true },
    });
    if (!branch) throw new BadRequestException('Branch not found');

    const data: any = {
      type: dto.type,
      amount: dto.amount,
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
      branch: { connect: { id: dto.branchId } },
      user: { connect: { id: createdByUserId } },
      category: dto.category ?? null,
      referenceType: dto.referenceType ?? null,
      referenceId: dto.referenceId ?? null,
      description: dto.description ?? null,
      receiptNumber: dto.receiptNumber ?? null,
    };

    const created = await this.prisma.cashTransaction.create({
      data,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return this.mapCashTransaction(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    branchId?: string;
    type?: CashTransactionType;
    category?: string;
    userId?: string;
    from?: string;
    to?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'transactionDate' | 'amount';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      branchId,
      type,
      category,
      userId,
      from,
      to,
      minAmount,
      maxAmount,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      ...(branchId ? { branchId } : {}),
      ...(type ? { type } : {}),
      ...(category ? { category } : {}),
      ...(userId ? { userId } : {}),
      ...(from || to
        ? {
            transactionDate: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
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
              { description: { contains: search, mode: 'insensitive' } },
              { receiptNumber: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.cashTransaction.count({ where }),
      this.prisma.cashTransaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: { select: { id: true, code: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const items = rows.map((r: any) => this.mapCashTransaction(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.cashTransaction.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!transaction) throw new NotFoundException('Cash transaction not found');
    return this.mapCashTransaction(transaction);
  }

  async update(id: string, dto: UpdateCashTransactionDto) {
    const existing = await this.prisma.cashTransaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cash transaction not found');

    const data: any = {
      type: dto.type ?? undefined,
      amount: dto.amount ?? undefined,
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
      category: dto.category ?? undefined,
      referenceType: dto.referenceType ?? undefined,
      referenceId: dto.referenceId ?? undefined,
      description: dto.description ?? undefined,
      receiptNumber: dto.receiptNumber ?? undefined,
    };

    const updated = await this.prisma.cashTransaction.update({
      where: { id },
      data,
    });

    return this.mapCashTransaction(updated);
  }

  async getSummary(from?: string, to?: string, branchId?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const where: any = {
      transactionDate: { gte: fromDate, lte: toDate },
      ...(branchId ? { branchId } : {}),
    };

    const [cashIn, cashOut, byCategoryIn, byCategoryOut, byUser] = await Promise.all([
      this.prisma.cashTransaction.aggregate({
        where: { ...where, type: 'CASH_IN' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.cashTransaction.aggregate({
        where: { ...where, type: 'CASH_OUT' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.cashTransaction.groupBy({
        by: ['category'],
        where: { ...where, type: 'CASH_IN', category: { not: null } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.cashTransaction.groupBy({
        by: ['category'],
        where: { ...where, type: 'CASH_OUT', category: { not: null } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.cashTransaction.groupBy({
        by: ['userId'],
        where,
        _count: true,
      }),
    ]);

    const totalCashIn = this.decimalToNumber(cashIn._sum.amount);
    const totalCashOut = this.decimalToNumber(cashOut._sum.amount);
    const netCashFlow = totalCashIn - totalCashOut;

    return {
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      branchId: branchId ?? 'ALL',
      totalCashIn,
      totalCashOut,
      netCashFlow,
      totalTransactions: (cashIn._count ?? 0) + (cashOut._count ?? 0),
      byCategoryIn: byCategoryIn.map((c: any) => ({
        category: c.category,
        amount: this.decimalToNumber(c._sum.amount),
        count: c._count,
      })),
      byCategoryOut: byCategoryOut.map((c: any) => ({
        category: c.category,
        amount: this.decimalToNumber(c._sum.amount),
        count: c._count,
      })),
      byUser: byUser.map((u: any) => ({
        userId: u.userId,
        count: u._count,
      })),
    };
  }

  async getCurrentBalance(branchId?: string) {
    const where: any = branchId ? { branchId } : {};

    const aggregates = await this.prisma.cashTransaction.aggregate({
      where: {
        ...where,
        type: { in: [CashTransactionType.CASH_IN, CashTransactionType.CASH_OUT] },
      },
      _sum: {
        amount: true,
      },
    });

    // This is not an accurate balance, need to sum cash_in and subtract cash_out
    const cashInResult = await this.prisma.cashTransaction.aggregate({
      where: { ...where, type: CashTransactionType.CASH_IN },
      _sum: { amount: true },
    });
    const cashOutResult = await this.prisma.cashTransaction.aggregate({
      where: { ...where, type: CashTransactionType.CASH_OUT },
      _sum: { amount: true },
    });

    const cashIn = this.decimalToNumber(cashInResult._sum.amount);
    const cashOut = this.decimalToNumber(cashOutResult._sum.amount);

    return {
      branchId: branchId ?? 'ALL',
      currentBalance: cashIn - cashOut,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.cashTransaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cash transaction not found');

    await this.prisma.cashTransaction.delete({ where: { id } });
    return { success: true, message: 'Cash transaction deleted' };
  }

  // Helper methods

  private parseDateRange(from?: string, to?: string): { fromDate: Date; toDate: Date } {
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);
    return { fromDate, toDate };
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

  private mapCashTransaction(t: any) {
    return {
      id: t.id,
      type: t.type,
      amount: this.decimalToNumber(t.amount),
      transactionDate: t.transactionDate,
      branchId: t.branchId,
      branch: t.branch ?? undefined,
      userId: t.userId,
      user: t.user ?? undefined,
      category: t.category,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      description: t.description,
      receiptNumber: t.receiptNumber,
      createdAt: t.createdAt,
    };
  }
}