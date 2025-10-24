import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateArDto } from './dto/create-ar.dto';
import { UpdateArDto } from './dto/update-ar.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class ArService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateArDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true },
    });
    if (!customer) throw new BadRequestException('Customer not found');

    const amount = dto.amount;
    const paidAmount = dto.paidAmount ?? 0;
    const remainingAmount = amount - paidAmount;

    let status = 'PENDING';
    if (paidAmount >= amount) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    }

    const created = await this.prisma.accountsReceivable.create({
      data: {
        customer: { connect: { id: dto.customerId } },
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: new Date(dto.invoiceDate),
        amount,
        paidAmount,
        remainingAmount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status,
        notes: dto.notes ?? null,
      },
    });

    return this.mapAr(created);
  }

  async findAll(params: any) {
    const { page, limit, customerId, status, from, to, overdue, sortBy = 'invoiceDate', sortOrder = 'desc' } = params;

    const where: any = {
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
      ...(from || to ? { invoiceDate: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
      ...(overdue ? { dueDate: { lt: new Date() }, status: { not: 'PAID' } } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.accountsReceivable.count({ where }),
      this.prisma.accountsReceivable.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { customer: { select: { id: true, code: true, firstName: true, lastName: true, businessName: true, phone: true, email: true } } },
      }),
    ]);

    return { items: rows.map((r: any) => this.mapAr(r)), total, page, limit };
  }

  async findOne(id: string) {
    const row = await this.prisma.accountsReceivable.findUnique({
      where: { id },
      include: {
        customer: true,
        installments: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Accounts receivable record not found');
    return this.mapAr(row);
  }

  async update(id: string, dto: UpdateArDto) {
    const existing = await this.prisma.accountsReceivable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Accounts receivable record not found');

    const updated = await this.prisma.accountsReceivable.update({
      where: { id },
      data: {
        invoiceNumber: dto.invoiceNumber ?? undefined,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
        amount: dto.amount ?? undefined,
        paidAmount: dto.paidAmount ?? undefined,
        remainingAmount: dto.amount !== undefined || dto.paidAmount !== undefined
          ? (dto.amount ?? this.dec(existing.amount)) - (dto.paidAmount ?? this.dec(existing.paidAmount))
          : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status ?? undefined,
        notes: dto.notes ?? undefined,
      },
    });

    return this.mapAr(updated);
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const existing = await this.prisma.accountsReceivable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Accounts receivable record not found');

    const currentPaid = this.dec(existing.paidAmount);
    const amount = this.dec(existing.amount);
    const newPaidAmount = currentPaid + dto.paymentAmount;

    if (newPaidAmount > amount) {
      throw new BadRequestException('Payment amount exceeds total amount');
    }

    const remainingAmount = amount - newPaidAmount;
    let status = 'PENDING';
    if (newPaidAmount >= amount) status = 'PAID';
    else if (newPaidAmount > 0) status = 'PARTIAL';

    const updated = await this.prisma.accountsReceivable.update({
      where: { id },
      data: { paidAmount: newPaidAmount, remainingAmount, status },
    });

    return { success: true, message: 'Payment recorded', paidAmount: newPaidAmount, remainingAmount };
  }

  async getSummary(customerId?: string) {
    const where: any = customerId ? { customerId } : {};

    const [totalDue, totalPaid, totalPending, overdue] = await Promise.all([
      this.prisma.accountsReceivable.aggregate({ where, _sum: { remainingAmount: true } }),
      this.prisma.accountsReceivable.aggregate({ where: { ...where, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.accountsReceivable.aggregate({ where: { ...where, status: { in: ['PENDING', 'PARTIAL'] } }, _sum: { remainingAmount: true } }),
      this.prisma.accountsReceivable.aggregate({ where: { ...where, dueDate: { lt: new Date() }, status: { not: 'PAID' } }, _sum: { remainingAmount: true }, _count: true }),
    ]);

    return {
      totalDue: this.dec(totalDue._sum.remainingAmount),
      totalPaid: this.dec(totalPaid._sum.amount),
      totalPending: this.dec(totalPending._sum.remainingAmount),
      overdue: { amount: this.dec(overdue._sum.remainingAmount), count: overdue._count },
    };
  }

  async remove(id: string) {
    await this.prisma.accountsReceivable.delete({ where: { id } });
    return { success: true, message: 'Deleted' };
  }

  private dec(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof (value as any).toNumber === 'function') {
      try { return (value as any).toNumber(); } catch {}
    }
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  private mapAr(r: any) {
    return {
      id: r.id,
      customerId: r.customerId,
      customer: r.customer ?? undefined,
      invoiceNumber: r.invoiceNumber,
      invoiceDate: r.invoiceDate,
      amount: this.dec(r.amount),
      paidAmount: this.dec(r.paidAmount),
      remainingAmount: this.dec(r.remainingAmount),
      dueDate: r.dueDate,
      status: r.status,
      notes: r.notes,
      installments: r.installments ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}