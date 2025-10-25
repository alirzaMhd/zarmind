import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateApDto } from './dto/create-ap.dto';
import { UpdateApDto } from './dto/update-ap.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class ApService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApDto) {
    // Verify supplier exists
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
      select: { id: true },
    });
    if (!supplier) throw new BadRequestException('Supplier not found');

    const amount = dto.amount;
    const paidAmount = dto.paidAmount ?? 0;
    const remainingAmount = amount - paidAmount;

    // Determine status
    let status = 'PENDING';
    if (paidAmount >= amount) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    }

    const data: any = {
      supplier: { connect: { id: dto.supplierId } },
      invoiceNumber: dto.invoiceNumber,
      invoiceDate: new Date(dto.invoiceDate),
      amount,
      paidAmount,
      remainingAmount,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      status,
      notes: dto.notes ?? null,
    };

    const created = await this.prisma.accountsPayable.create({ data });
    return this.mapAp(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    supplierId?: string;
    status?: string;
    from?: string;
    to?: string;
    overdue?: boolean;
    sortBy?: 'invoiceDate' | 'dueDate' | 'amount' | 'remainingAmount';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const { page, limit, supplierId, status, from, to, overdue, sortBy = 'invoiceDate', sortOrder = 'desc' } = params;

    const where: any = {
      ...(supplierId ? { supplierId } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            invoiceDate: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {}),
      ...(overdue !== undefined && overdue
        ? {
            dueDate: { lt: new Date() },
            status: { not: 'PAID' },
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.accountsPayable.count({ where }),
      this.prisma.accountsPayable.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const items = rows.map((r: any) => this.mapAp(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const row = await this.prisma.accountsPayable.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
            address: true,
            paymentTerms: true,
          },
        },
      },
    });

    if (!row) throw new NotFoundException('Accounts payable record not found');
    return this.mapAp(row);
  }

  async update(id: string, dto: UpdateApDto) {
    const existing = await this.prisma.accountsPayable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Accounts payable record not found');

    const data: any = {
      invoiceNumber: dto.invoiceNumber ?? undefined,
      invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
      amount: dto.amount ?? undefined,
      paidAmount: dto.paidAmount ?? undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: dto.status ?? undefined,
      notes: dto.notes ?? undefined,
    };

    // Recalculate remaining amount if amount or paidAmount changed
    if (dto.amount !== undefined || dto.paidAmount !== undefined) {
      const newAmount = dto.amount ?? this.decimalToNumber(existing.amount);
      const newPaidAmount = dto.paidAmount ?? this.decimalToNumber(existing.paidAmount);
      data.remainingAmount = newAmount - newPaidAmount;

      // Auto-update status
      if (newPaidAmount >= newAmount) {
        data.status = 'PAID';
      } else if (newPaidAmount > 0) {
        data.status = 'PARTIAL';
      } else {
        data.status = 'PENDING';
      }
    }

    const updated = await this.prisma.accountsPayable.update({
      where: { id },
      data,
    });

    return this.mapAp(updated);
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const existing = await this.prisma.accountsPayable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Accounts payable record not found');

    const currentPaid = this.decimalToNumber(existing.paidAmount);
    const amount = this.decimalToNumber(existing.amount);
    const newPaidAmount = currentPaid + dto.paymentAmount;

    if (newPaidAmount > amount) {
      throw new BadRequestException('Payment amount exceeds total amount');
    }

    const remainingAmount = amount - newPaidAmount;
    let status = 'PENDING';
    if (newPaidAmount >= amount) {
      status = 'PAID';
    } else if (newPaidAmount > 0) {
      status = 'PARTIAL';
    }

    const updated = await this.prisma.accountsPayable.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount,
        status,
        notes: dto.notes ? `${existing.notes ?? ''}\n${dto.notes}`.trim() : existing.notes,
      },
    });

    return this.mapAp(updated);
  }

  async getSummary(supplierId?: string) {
    const where: any = supplierId ? { supplierId } : {};

    const [totalDue, totalPaid, totalPending, overdue] = await Promise.all([
      this.prisma.accountsPayable.aggregate({
        where,
        _sum: { remainingAmount: true },
      }),
      this.prisma.accountsPayable.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.accountsPayable.aggregate({
        where: { ...where, status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { remainingAmount: true },
      }),
      this.prisma.accountsPayable.aggregate({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { not: 'PAID' },
        },
        _sum: { remainingAmount: true },
        _count: true,
      }),
    ]);

    return {
      totalDue: this.decimalToNumber(totalDue._sum.remainingAmount),
      totalPaid: this.decimalToNumber(totalPaid._sum.amount),
      totalPending: this.decimalToNumber(totalPending._sum.remainingAmount),
      overdue: {
        amount: this.decimalToNumber(overdue._sum.remainingAmount),
        count: overdue._count,
      },
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.accountsPayable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Accounts payable record not found');

    await this.prisma.accountsPayable.delete({ where: { id } });
    return { success: true, message: 'Accounts payable record deleted' };
  }

  // Helpers

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

  private mapAp(r: any) {
    return {
      id: r.id,
      supplierId: r.supplierId,
      supplier: r.supplier ?? undefined,
      invoiceNumber: r.invoiceNumber,
      invoiceDate: r.invoiceDate,
      amount: this.decimalToNumber(r.amount),
      paidAmount: this.decimalToNumber(r.paidAmount),
      remainingAmount: this.decimalToNumber(r.remainingAmount),
      dueDate: r.dueDate,
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}