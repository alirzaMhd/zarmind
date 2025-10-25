import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierStatus, PurchaseStatus } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateSupplierDto) {
    const code = dto.code ?? this.generateSupplierCode();

    const data: any = {
      code,
      name: dto.name,
      contactPerson: dto.contactPerson ?? null,
      phone: dto.phone,
      email: dto.email ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      postalCode: dto.postalCode ?? null,
      paymentTerms: dto.paymentTerms ?? null,
      rating: dto.rating ?? null,
      categories: dto.categories ?? [],
      licenseNumber: dto.licenseNumber ?? null,
      taxId: dto.taxId ?? null,
      notes: dto.notes ?? null,
      website: dto.website ?? null,
      status: dto.status ?? SupplierStatus.ACTIVE,
    };

    const created = await this.prisma.supplier.create({ data });
    return this.mapSupplier(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: SupplierStatus;
    category?: string;
    city?: string;
    minRating?: number;
    maxRating?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      status,
      category,
      city,
      minRating,
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      ...(status ? { status } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      ...(category ? { categories: { has: category } } : {}),
      ...(minRating !== undefined || maxRating !== undefined
        ? {
          rating: {
            gte: minRating,
            lte: maxRating,
          },
        }
        : {}),
      ...(search
        ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { contactPerson: { contains: search, mode: 'insensitive' } },
            { licenseNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const items = rows.map((s: any) => this.mapSupplier(s));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          select: {
            id: true,
            purchaseNumber: true,
            purchaseDate: true,
            totalAmount: true,
            status: true,
          },
          orderBy: { purchaseDate: 'desc' },
          take: 10,
        },
        payables: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            remainingAmount: true,
            status: true,
            dueDate: true,
          },
          where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
        },
      },
    });

    if (!supplier) throw new NotFoundException('Supplier not found');
    return this.mapSupplier(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Supplier not found');

    const data: any = {
      code: dto.code ?? undefined,
      name: dto.name ?? undefined,
      contactPerson: dto.contactPerson ?? undefined,
      phone: dto.phone ?? undefined,
      email: dto.email ?? undefined,
      address: dto.address ?? undefined,
      city: dto.city ?? undefined,
      postalCode: dto.postalCode ?? undefined,
      paymentTerms: dto.paymentTerms ?? undefined,
      rating: dto.rating ?? undefined,
      categories: dto.categories ?? undefined,
      licenseNumber: dto.licenseNumber ?? undefined,
      taxId: dto.taxId ?? undefined,
      notes: dto.notes ?? undefined,
      website: dto.website ?? undefined,
      status: dto.status ?? undefined,
    };

    const updated = await this.prisma.supplier.update({
      where: { id },
      data,
    });

    return this.mapSupplier(updated);
  }

  async updateRating(id: string, rating: number, notes?: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: {
        rating,
        notes: notes ? `${supplier.notes ?? ''}\n${notes}`.trim() : supplier.notes,
      },
    });

    return {
      success: true,
      message: 'Supplier rating updated',
      supplierId: id,
      rating,
      notes,
    };
  }

  async getPurchases(id: string, from?: string, to?: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id }, select: { id: true } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const { fromDate, toDate } = this.parseDateRange(from, to);

    const purchases = await this.prisma.purchase.findMany({
      where: {
        supplierId: id,
        purchaseDate: { gte: fromDate, lte: toDate },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, category: true },
            },
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return {
      supplierId: id,
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum: any, p: any) => sum + this.decimalToNumber(p.totalAmount), 0),
      purchases: purchases.map((p: any) => ({
        id: p.id,
        purchaseNumber: p.purchaseNumber,
        purchaseDate: p.purchaseDate,
        status: p.status,
        subtotal: this.decimalToNumber(p.subtotal),
        taxAmount: this.decimalToNumber(p.taxAmount),
        totalAmount: this.decimalToNumber(p.totalAmount),
        paidAmount: this.decimalToNumber(p.paidAmount),
        items: p.items.map((i: any) => ({
          product: i.product
            ? {
              id: i.product.id,
              sku: i.product.sku,
              name: i.product.name,
              category: i.product.category,
            }
            : null,
          quantity: i.quantity,
          unitPrice: this.decimalToNumber(i.unitPrice),
          subtotal: this.decimalToNumber(i.subtotal),
        })),
      })),
    };
  }

  async getPayables(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id }, select: { id: true } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const payables = await this.prisma.accountsPayable.findMany({
      where: { supplierId: id },
      orderBy: { invoiceDate: 'desc' },
    });

    return {
      supplierId: id,
      totalPayables: payables.reduce((sum: any, p: any) => sum + this.decimalToNumber(p.remainingAmount), 0),
      payables: payables.map((p: any) => ({
        id: p.id,
        invoiceNumber: p.invoiceNumber,
        invoiceDate: p.invoiceDate,
        amount: this.decimalToNumber(p.amount),
        paidAmount: this.decimalToNumber(p.paidAmount),
        remainingAmount: this.decimalToNumber(p.remainingAmount),
        dueDate: p.dueDate,
        status: p.status,
        notes: p.notes,
      })),
    };
  }

  async getPerformance(id: string, from?: string, to?: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const { fromDate, toDate } = this.parseDateRange(from, to);

    const [purchases, totalSpent, onTimeDeliveries, totalDeliveries] = await Promise.all([
      this.prisma.purchase.count({
        where: {
          supplierId: id,
          purchaseDate: { gte: fromDate, lte: toDate },
        },
      }),

      this.prisma.purchase.aggregate({
        where: {
          supplierId: id,
          purchaseDate: { gte: fromDate, lte: toDate },
          status: PurchaseStatus.COMPLETED,
        },
        _sum: { totalAmount: true },
      }),

      this.prisma.purchase.count({
        where: {
          supplierId: id,
          purchaseDate: { gte: fromDate, lte: toDate },
          status: PurchaseStatus.COMPLETED,
          deliveryDate: { lte: this.prisma.purchase.fields.purchaseDate },
        },
      }),

      this.prisma.purchase.count({
        where: {
          supplierId: id,
          purchaseDate: { gte: fromDate, lte: toDate },
          status: PurchaseStatus.COMPLETED,
          deliveryDate: { not: null },
        },
      }),
    ]);

    const onTimeRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

    return {
      supplierId: id,
      supplierName: supplier.name,
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalPurchases: purchases,
      totalSpent: this.decimalToNumber(totalSpent._sum.totalAmount),
      onTimeDeliveryRate: onTimeRate,
      rating: supplier.rating,
      categories: supplier.categories,
      paymentTerms: supplier.paymentTerms,
    };
  }

  async getSummary() {
    // Define type for supplier details
    type SupplierDetail = {
      id: string;
      code: string;
      name: string;
      rating: number | null;
    };

    const [totalSuppliers, byStatus, byCategory, topSuppliers] = await Promise.all([
      this.prisma.supplier.count(),

      this.prisma.supplier.groupBy({
        by: ['status'],
        _count: true,
      }),

      this.prisma.supplier.findMany({
        where: { categories: { isEmpty: false } },
        select: { categories: true },
      }),

      this.prisma.purchase.groupBy({
        by: ['supplierId'],
        _count: true,
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
    ]);

    // Count suppliers by category
    const categoryCount: Record<string, number> = {};
    byCategory.forEach((s: any) => {
      if (Array.isArray(s.categories)) {
        s.categories.forEach((cat: any) => {
          categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
        });
      }
    });

    // Get supplier details for top suppliers
    const topSupplierIds = topSuppliers.map((t: any) => t.supplierId).filter(Boolean) as string[];
    const supplierDetails = await this.prisma.supplier.findMany({
      where: { id: { in: topSupplierIds } },
      select: { id: true, code: true, name: true, rating: true },
    });

    // Explicitly type the Map
    const supplierMap = new Map<string, SupplierDetail>(
      supplierDetails.map((s: any) => [s.id, s])
    );

    return {
      totalSuppliers,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
      byCategory: Object.entries(categoryCount).map(([category, count]) => ({ category, count })),
      topSuppliers: topSuppliers.map((t: any) => {
        const supplier = supplierMap.get(t.supplierId as string);
        return {
          supplierId: t.supplierId,
          code: supplier?.code,
          name: supplier?.name ?? 'Unknown',
          rating: supplier?.rating,
          purchaseCount: t._count,
          totalSpent: this.decimalToNumber(t._sum.totalAmount),
        };
      }),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Supplier not found');

    // Soft delete: mark as inactive
    await this.prisma.supplier.update({
      where: { id },
      data: { status: SupplierStatus.INACTIVE },
    });

    return { success: true, message: 'Supplier marked as inactive' };
  }

  // Helpers

  private generateSupplierCode(): string {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const t = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(
      now.getSeconds(),
    ).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `SUPP-${y}${m}${d}-${t}-${rand}`;
  }

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

  private mapSupplier(s: any) {
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      city: s.city,
      postalCode: s.postalCode,
      paymentTerms: s.paymentTerms,
      rating: s.rating,
      categories: Array.isArray(s.categories) ? s.categories : [],
      licenseNumber: s.licenseNumber,
      taxId: s.taxId,
      notes: s.notes,
      website: s.website,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      purchases: s.purchases ?? undefined,
      payables: s.payables ?? undefined,
    };
  }
}