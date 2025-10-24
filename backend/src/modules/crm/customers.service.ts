import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma, CustomerStatus, CustomerType } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    const code = dto.code ?? this.generateCustomerCode();

    const data: Prisma.CustomerCreateInput = {
      code,
      type: dto.type ?? CustomerType.INDIVIDUAL,
      status: dto.status ?? CustomerStatus.ACTIVE,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      businessName: dto.businessName ?? null,
      phone: dto.phone,
      email: dto.email ?? null,
      nationalId: dto.nationalId ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      postalCode: dto.postalCode ?? null,
      creditLimit: dto.creditLimit ?? undefined,
      // currentBalance uses default 0
      notes: dto.notes ?? null,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      anniversary: dto.anniversary ? new Date(dto.anniversary) : null,
      loyaltyPoints: dto.loyaltyPoints ?? undefined,
      tags: dto.tags ?? [],
    };

    const created = await this.prisma.customer.create({ data });
    return this.mapCustomer(created);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: CustomerType;
    status?: CustomerStatus;
    tags?: string[];
    city?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'businessName' | 'code';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      status,
      tags,
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.CustomerWhereInput = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      ...(tags && tags.length
        ? { tags: { hasEvery: tags } }
        : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { businessName: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const items = rows.map((c) => this.mapCustomer(c));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.mapCustomer(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer not found');

    const data: Prisma.CustomerUpdateInput = {
      code: dto.code ?? undefined,
      type: dto.type ?? undefined,
      status: dto.status ?? undefined,
      firstName: dto.firstName ?? undefined,
      lastName: dto.lastName ?? undefined,
      businessName: dto.businessName ?? undefined,
      phone: dto.phone ?? undefined,
      email: dto.email ?? undefined,
      nationalId: dto.nationalId ?? undefined,
      address: dto.address ?? undefined,
      city: dto.city ?? undefined,
      postalCode: dto.postalCode ?? undefined,
      creditLimit: dto.creditLimit ?? undefined,
      notes: dto.notes ?? undefined,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      anniversary: dto.anniversary ? new Date(dto.anniversary) : undefined,
      loyaltyPoints: dto.loyaltyPoints ?? undefined,
      tags: dto.tags ?? undefined,
    };

    const updated = await this.prisma.customer.update({
      where: { id },
      data,
    });
    return this.mapCustomer(updated);
  }

  // Soft-delete: mark as INACTIVE
  async remove(id: string) {
    const existing = await this.prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Customer not found');

    const updated = await this.prisma.customer.update({
      where: { id },
      data: { status: CustomerStatus.INACTIVE },
    });
    return this.mapCustomer(updated);
  }

  async getReceivables(id: string) {
    // Confirm customer exists
    const customer = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!customer) throw new NotFoundException('Customer not found');

    const receivables = await this.prisma.accountsReceivable.findMany({
      where: { customerId: id },
      orderBy: { invoiceDate: 'desc' },
    });

    return receivables.map((r) => ({
      id: r.id,
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
    }));
  }

  async getSales(id: string) {
    // Confirm customer exists
    const customer = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!customer) throw new NotFoundException('Customer not found');

    const sales = await this.prisma.sale.findMany({
      where: { customerId: id },
      orderBy: { saleDate: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        saleDate: true,
        status: true,
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
        totalAmount: true,
        paidAmount: true,
        paymentMethod: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sales.map((s) => ({
      ...s,
      subtotal: this.decimalToNumber(s.subtotal),
      taxAmount: this.decimalToNumber(s.taxAmount),
      discountAmount: this.decimalToNumber(s.discountAmount),
      totalAmount: this.decimalToNumber(s.totalAmount),
      paidAmount: this.decimalToNumber(s.paidAmount),
    }));
  }

  // Helpers

  private generateCustomerCode(): string {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const t = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(
      now.getSeconds(),
    ).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CUST-${y}${m}${d}-${t}-${rand}`;
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

  private mapCustomer(c: any) {
    return {
      id: c.id,
      code: c.code,
      type: c.type,
      status: c.status,
      firstName: c.firstName,
      lastName: c.lastName,
      businessName: c.businessName,
      phone: c.phone,
      email: c.email,
      nationalId: c.nationalId,
      address: c.address,
      city: c.city,
      postalCode: c.postalCode,
      creditLimit: this.decimalToNumber(c.creditLimit),
      currentBalance: this.decimalToNumber(c.currentBalance),
      notes: c.notes,
      birthDate: c.birthDate,
      anniversary: c.anniversary,
      loyaltyPoints: c.loyaltyPoints ?? 0,
      tags: Array.isArray(c.tags) ? c.tags : [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}