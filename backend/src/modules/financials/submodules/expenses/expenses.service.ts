import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { Prisma, PaymentMethod } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================
  // Expense Categories
  // ======================

  async createCategory(dto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({
      data: {
        name: dto.name,
        nameEn: dto.nameEn ?? null,
        description: dto.description ?? null,
        parentId: dto.parentId ?? null,
        isActive: true,
      },
    });
  }

  async findAllCategories(search?: string) {
    const where: Prisma.ExpenseCategoryWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.prisma.expenseCategory.findMany({
      where: { ...where, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateCategory(id: string, dto: UpdateExpenseCategoryDto) {
    const existing = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Expense category not found');

    return this.prisma.expenseCategory.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        nameEn: dto.nameEn ?? undefined,
        description: dto.description ?? undefined,
        parentId: dto.parentId ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async removeCategory(id: string) {
    const existing = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Expense category not found');

    const expenses = await this.prisma.expense.count({ where: { categoryId: id } });
    if (expenses > 0) {
      throw new BadRequestException('Cannot delete category with associated expenses');
    }

    await this.prisma.expenseCategory.delete({ where: { id } });
    return { success: true, message: 'Expense category deleted' };
  }

  // ======================
  // Expenses
  // ======================

  async create(dto: CreateExpenseDto) {
    const category = await this.prisma.expenseCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Expense category not found');

    const data: Prisma.ExpenseCreateInput = {
      category: { connect: { id: dto.categoryId } },
      amount: dto.amount,
      expenseDate: new Date(dto.expenseDate),
      title: dto.title,
      description: dto.description ?? null,
      vendor: dto.vendor ?? null,
      invoiceNumber: dto.invoiceNumber ?? null,
      receiptImages: dto.receiptImages ?? [],
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber ?? null,
      isRecurring: dto.isRecurring ?? false,
      recurringPattern: dto.recurringPattern ?? null,
    };

    const created = await this.prisma.expense.create({
      data,
      include: { category: true },
    });

    return this.mapExpense(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    from?: string;
    to?: string;
    vendor?: string;
    minAmount?: number;
    maxAmount?: number;
    isRecurring?: boolean;
    sortBy?: 'createdAt' | 'expenseDate' | 'amount' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      categoryId,
      from,
      to,
      vendor,
      minAmount,
      maxAmount,
      isRecurring,
      sortBy = 'expenseDate',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ExpenseWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(vendor ? { vendor: { contains: vendor, mode: 'insensitive' } } : {}),
      ...(isRecurring !== undefined ? { isRecurring } : {}),
      ...(from || to
        ? {
            expenseDate: {
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
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { vendor: { contains: search, mode: 'insensitive' } },
              { invoiceNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
    ]);

    const items = rows.map((r) => this.mapExpense(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!expense) throw new NotFoundException('Expense not found');
    return this.mapExpense(expense);
  }

  async update(id: string, dto: UpdateExpenseDto) {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Expense not found');

    const data: Prisma.ExpenseUpdateInput = {
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      amount: dto.amount ?? undefined,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
      title: dto.title ?? undefined,
      description: dto.description ?? undefined,
      vendor: dto.vendor ?? undefined,
      invoiceNumber: dto.invoiceNumber ?? undefined,
      receiptImages: dto.receiptImages ?? undefined,
      paymentMethod: dto.paymentMethod ?? undefined,
      referenceNumber: dto.referenceNumber ?? undefined,
      isRecurring: dto.isRecurring ?? undefined,
      recurringPattern: dto.recurringPattern ?? undefined,
    };

    const updated = await this.prisma.expense.update({
      where: { id },
      data,
      include: { category: true },
    });

    return this.mapExpense(updated);
  }

  async approve(id: string, approvedByUserId: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        approvedBy: approvedByUserId,
        approvedAt: new Date(),
      },
    });

    return this.mapExpense(updated);
  }

  async getSummary(from?: string, to?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const where: Prisma.ExpenseWhereInput = {
      expenseDate: { gte: fromDate, lte: toDate },
    };

    const [total, byCategory, byPaymentMethod] = await Promise.all([
      this.prisma.expense.aggregate({
        where,
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where,
        _count: true,
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.expense.groupBy({
        by: ['paymentMethod'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    const categories = await this.prisma.expenseCategory.findMany({
      where: { id: { in: byCategory.map((c) => c.categoryId) } },
      select: { id: true, name: true, nameEn: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return {
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalExpenses: total._count,
      totalAmount: this.decimalToNumber(total._sum.amount),
      byCategory: byCategory.map((c) => ({
        categoryId: c.categoryId,
        categoryName: categoryMap.get(c.categoryId)?.name,
        categoryNameEn: categoryMap.get(c.categoryId)?.nameEn,
        count: c._count,
        totalAmount: this.decimalToNumber(c._sum.amount),
      })),
      byPaymentMethod: byPaymentMethod.map((p) => ({
        paymentMethod: p.paymentMethod,
        count: p._count,
        totalAmount: this.decimalToNumber(p._sum.amount),
      })),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Expense not found');

    await this.prisma.expense.delete({ where: { id } });
    return { success: true, message: 'Expense deleted' };
  }

  // Helper methods

  private parseDateRange(from?: string, to?: string): { fromDate: Date; toDate: Date } {
    const fromDate = from ? new Date(from) : new Date(new Date().setMonth(new Date().getMonth() - 1));
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

  private mapExpense(e: any) {
    return {
      id: e.id,
      categoryId: e.categoryId,
      category: e.category ?? undefined,
      amount: this.decimalToNumber(e.amount),
      expenseDate: e.expenseDate,
      title: e.title,
      description: e.description,
      vendor: e.vendor,
      invoiceNumber: e.invoiceNumber,
      receiptImages: Array.isArray(e.receiptImages) ? e.receiptImages : [],
      paymentMethod: e.paymentMethod,
      referenceNumber: e.referenceNumber,
      isRecurring: e.isRecurring,
      recurringPattern: e.recurringPattern,
      approvedBy: e.approvedBy,
      approvedAt: e.approvedAt,
      notes: e.notes,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }
}