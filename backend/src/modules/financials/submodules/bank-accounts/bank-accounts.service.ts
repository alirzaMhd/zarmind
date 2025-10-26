import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { RecordTransactionDto } from './dto/record-transaction.dto';
import { BankTransactionType } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBankAccountDto) {
    // Check if account number already exists
    const existing = await this.prisma.bankAccount.findUnique({
      where: { accountNumber: dto.accountNumber },
    });

    if (existing) {
      throw new BadRequestException('شماره حساب قبلاً وجود دارد');
    }

    // Verify branch exists if provided
    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
        select: { id: true },
      });
      if (!branch) throw new BadRequestException('شعبه یافت نشد');
    }

    const data: any = {
      accountName: dto.accountName,
      accountNumber: dto.accountNumber,
      bankName: dto.bankName,
      branchName: dto.branchName ?? null,
      iban: dto.iban ?? null,
      swiftCode: dto.swiftCode ?? null,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      balance: dto.initialBalance ?? 0,
      currency: dto.currency ?? 'IRR',
      accountType: dto.accountType ?? null,
      isActive: dto.isActive ?? true,
      notes: dto.notes ?? null,
    };

    const created = await this.prisma.bankAccount.create({ data });

    // If there's an initial balance, create opening balance transaction
    if (dto.initialBalance && dto.initialBalance > 0) {
      await this.prisma.bankTransaction.create({
        data: {
          bankAccountId: created.id,
          type: BankTransactionType.DEPOSIT,
          amount: dto.initialBalance,
          transactionDate: new Date(),
          description: 'مانده افتتاحیه',
          balanceAfter: dto.initialBalance,
          reconciled: true,
        },
      });
    }

    return this.mapBankAccount(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    branchId?: string;
    isActive?: boolean;
    accountType?: string;
    currency?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'accountName' | 'balance';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      branchId,
      isActive,
      accountType,
      currency,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      ...(branchId ? { branchId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(accountType ? { accountType } : {}),
      ...(currency ? { currency } : {}),
      ...(search
        ? {
            OR: [
              { accountName: { contains: search, mode: 'insensitive' } },
              { accountNumber: { contains: search, mode: 'insensitive' } },
              { bankName: { contains: search, mode: 'insensitive' } },
              { iban: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.bankAccount.count({ where }),
      this.prisma.bankAccount.findMany({
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

    const items = rows.map((r: any) => this.mapBankAccount(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const account = await this.prisma.bankAccount.findUnique({
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
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!account) throw new NotFoundException('حساب بانکی یافت نشد');
    return this.mapBankAccount(account);
  }

  async update(id: string, dto: UpdateBankAccountDto) {
    const existing = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('حساب بانکی یافت نشد');

    // Check if account number is being changed and already exists
    if (dto.accountNumber && dto.accountNumber !== existing.accountNumber) {
      const duplicate = await this.prisma.bankAccount.findUnique({
        where: { accountNumber: dto.accountNumber },
      });
      if (duplicate) {
        throw new BadRequestException('شماره حساب قبلاً وجود دارد');
      }
    }

    // Verify branch if being updated
    if (dto.branchId && dto.branchId !== existing.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
        select: { id: true },
      });
      if (!branch) throw new BadRequestException('شعبه یافت نشد');
    }

    const data: any = {
      accountName: dto.accountName ?? undefined,
      accountNumber: dto.accountNumber ?? undefined,
      bankName: dto.bankName ?? undefined,
      branchName: dto.branchName ?? undefined,
      iban: dto.iban ?? undefined,
      swiftCode: dto.swiftCode ?? undefined,
      branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
      currency: dto.currency ?? undefined,
      accountType: dto.accountType ?? undefined,
      isActive: dto.isActive ?? undefined,
      notes: dto.notes ?? undefined,
    };

    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data,
    });

    return this.mapBankAccount(updated);
  }

  async recordTransaction(id: string, dto: RecordTransactionDto) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('حساب بانکی یافت نشد');

    if (!account.isActive) {
      throw new BadRequestException('امکان ثبت تراکنش در حساب غیرفعال وجود ندارد');
    }

    const currentBalance = this.decimalToNumber(account.balance);
    let newBalance = currentBalance;

    // Calculate new balance based on transaction type
    switch (dto.type) {
      case BankTransactionType.DEPOSIT:
      case BankTransactionType.TRANSFER_IN:
      case BankTransactionType.INTEREST:
        newBalance += dto.amount;
        break;
      case BankTransactionType.WITHDRAWAL:
      case BankTransactionType.TRANSFER_OUT:
      case BankTransactionType.FEE:
      case BankTransactionType.CHECK_WITHDRAWAL:
        newBalance -= dto.amount;
        break;
      case BankTransactionType.CHECK_DEPOSIT:
        newBalance += dto.amount;
        break;
    }

    if (newBalance < 0 && !dto.allowNegative) {
      throw new BadRequestException('تراکنش منجر به مانده منفی می‌شود');
    }

    // Create transaction
    const transaction = await this.prisma.bankTransaction.create({
      data: {
        bankAccountId: id,
        type: dto.type,
        amount: dto.amount,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
        referenceNumber: dto.referenceNumber ?? null,
        description: dto.description ?? null,
        category: dto.category ?? null,
        balanceAfter: newBalance,
        reconciled: false,
      },
    });

    // Update account balance
    await this.prisma.bankAccount.update({
      where: { id },
      data: { balance: newBalance },
    });

    return {
      success: true,
      message: 'تراکنش با موفقیت ثبت شد',
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: this.decimalToNumber(transaction.amount),
        transactionDate: transaction.transactionDate,
        balanceAfter: this.decimalToNumber(transaction.balanceAfter),
      },
      newBalance,
    };
  }

  async getTransactions(
    id: string,
    params: {
      from?: string;
      to?: string;
      type?: string;
      reconciled?: boolean;
      page: number;
      limit: number;
    },
  ) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!account) throw new NotFoundException('حساب بانکی یافت نشد');

    const { from, to, type, reconciled, page, limit } = params;

    const where: any = {
      bankAccountId: id,
      ...(type ? { type: type as BankTransactionType } : {}),
      ...(reconciled !== undefined ? { reconciled } : {}),
      ...(from || to
        ? {
            transactionDate: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {}),
    };

    const [total, transactions] = await this.prisma.$transaction([
      this.prisma.bankTransaction.count({ where }),
      this.prisma.bankTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: this.decimalToNumber(t.amount),
        transactionDate: t.transactionDate,
        referenceNumber: t.referenceNumber,
        description: t.description,
        category: t.category,
        balanceAfter: this.decimalToNumber(t.balanceAfter),
        reconciled: t.reconciled,
        reconciledDate: t.reconciledDate,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async reconcileTransactions(id: string, transactionIds: string[], reconciledDate?: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!account) throw new NotFoundException('حساب بانکی یافت نشد');

    const date = reconciledDate ? new Date(reconciledDate) : new Date();

    await this.prisma.bankTransaction.updateMany({
      where: {
        id: { in: transactionIds },
        bankAccountId: id,
      },
      data: {
        reconciled: true,
        reconciledDate: date,
      },
    });

    return {
      success: true,
      message: `${transactionIds.length} تراکنش تطبیق داده شد`,
      count: transactionIds.length,
    };
  }

  async toggleActive(id: string, isActive: boolean) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('حساب بانکی یافت نشد');

    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data: { isActive },
    });

    return {
      success: true,
      message: `حساب بانکی ${isActive ? 'فعال' : 'غیرفعال'} شد`,
      isActive: updated.isActive,
    };
  }

  async getSummary(branchId?: string, currency?: string) {
    const where:any = {
      ...(branchId ? { branchId } : {}),
      ...(currency ? { currency } : {}),
      isActive: true,
    };

    const [totalBalance, byCurrency, byBranch, recentTransactions] = await Promise.all([
      this.prisma.bankAccount.aggregate({
        where,
        _sum: { balance: true },
        _count: true,
      }),

      this.prisma.bankAccount.groupBy({
        by: ['currency'],
        where,
        _sum: { balance: true },
        _count: true,
      }),

      branchId
        ? null
        : this.prisma.bankAccount.groupBy({
            by: ['branchId'],
            where,
            _sum: { balance: true },
            _count: true,
          }),

      this.prisma.bankTransaction.findMany({
        where: {
          bankAccount: where,
          reconciled: false,
        },
        orderBy: { transactionDate: 'desc' },
        take: 10,
        include: {
          bankAccount: {
            select: {
              id: true,
              accountName: true,
              accountNumber: true,
            },
          },
        },
      }),
    ]);

    return {
      totalAccounts: totalBalance._count,
      totalBalance: this.decimalToNumber(totalBalance._sum.balance),
      byCurrency: byCurrency.map((c: any) => ({
        currency: c.currency,
        count: c._count,
        balance: this.decimalToNumber(c._sum.balance),
      })),
      byBranch: byBranch
        ? byBranch.map((b:any) => ({
            branchId: b.branchId,
            count: b._count,
            balance: this.decimalToNumber(b._sum.balance),
          }))
        : undefined,
      unreconciledTransactions: recentTransactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: this.decimalToNumber(t.amount),
        transactionDate: t.transactionDate,
        account: t.bankAccount,
      })),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.bankAccount.findUnique({
      where: { id },
      include: { transactions: true },
    });

    if (!existing) throw new NotFoundException('حساب بانکی یافت نشد');

    if (existing.transactions.length > 0) {
      throw new BadRequestException(
        'امکان حذف حساب بانکی با سوابق تراکنش وجود ندارد. به جای آن آن را غیرفعال کنید.',
      );
    }

    await this.prisma.bankAccount.delete({ where: { id } });
    return { success: true, message: 'حساب بانکی حذف شد' };
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

  private mapBankAccount(a: any) {
    return {
      id: a.id,
      accountName: a.accountName,
      accountNumber: a.accountNumber,
      bankName: a.bankName,
      branchName: a.branchName,
      iban: a.iban,
      swiftCode: a.swiftCode,
      branchId: a.branchId,
      branch: a.branch ?? undefined,
      balance: this.decimalToNumber(a.balance),
      currency: a.currency,
      accountType: a.accountType,
      isActive: a.isActive,
      notes: a.notes,
      transactions: a.transactions
        ? a.transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: this.decimalToNumber(t.amount),
            transactionDate: t.transactionDate,
            description: t.description,
            balanceAfter: this.decimalToNumber(t.balanceAfter),
            reconciled: t.reconciled,
          }))
        : undefined,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}