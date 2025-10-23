import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import {
  Prisma,
  ReturnStatus,
  ReturnType,
  ReturnReason,
  PaymentMethod,
  SaleStatus,
  PurchaseStatus,
} from '@prisma/client';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReturnDto, createdByUserId: string) {
    const returnNumber = dto.returnNumber ?? this.generateReturnNumber(dto.type);

    // Verify original transaction exists
    if (dto.type === ReturnType.CUSTOMER_RETURN) {
      if (!dto.originalSaleId) {
        throw new BadRequestException('originalSaleId is required for customer returns');
      }

      const sale = await this.prisma.sale.findUnique({
        where: { id: dto.originalSaleId },
        include: { customer: true },
      });

      if (!sale) throw new NotFoundException('Original sale not found');
      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('Cannot return items from cancelled sale');
      }

      // Auto-set customerId from sale if not provided
      if (!dto.customerId && sale.customerId) {
        dto.customerId = sale.customerId;
      }
    } else if (dto.type === ReturnType.SUPPLIER_RETURN) {
      if (!dto.originalPurchaseId) {
        throw new BadRequestException('originalPurchaseId is required for supplier returns');
      }

      const purchase = await this.prisma.purchase.findUnique({
        where: { id: dto.originalPurchaseId },
        include: { supplier: true },
      });

      if (!purchase) throw new NotFoundException('Original purchase not found');
      if (purchase.status === PurchaseStatus.CANCELLED) {
        throw new BadRequestException('Cannot return items from cancelled purchase');
      }

      // Auto-set supplierId from purchase if not provided
      if (!dto.supplierId && purchase.supplierId) {
        dto.supplierId = purchase.supplierId;
      }
    }

    const data: Prisma.ReturnCreateInput = {
      returnNumber,
      returnDate: new Date(dto.returnDate),
      type: dto.type,
      status: dto.status ?? ReturnStatus.PENDING,
      reason: dto.reason ?? null,
      originalSale: dto.originalSaleId ? { connect: { id: dto.originalSaleId } } : undefined,
      originalPurchase: dto.originalPurchaseId
        ? { connect: { id: dto.originalPurchaseId } }
        : undefined,
      customerId: dto.customerId ?? null,
      supplierId: dto.supplierId ?? null,
      reasonDetails: dto.reasonDetails ?? null,
      refundAmount: dto.refundAmount,
      refundMethod: dto.refundMethod ?? null,
      notes: dto.notes ?? null,
    };

    const created = await this.prisma.return.create({
      data,
      include: {
        originalSale: {
          select: {
            id: true,
            invoiceNumber: true,
            saleDate: true,
            totalAmount: true,
          },
        },
        originalPurchase: {
          select: {
            id: true,
            purchaseNumber: true,
            purchaseDate: true,
            totalAmount: true,
          },
        },
      },
    });

    return this.mapReturn(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    type?: ReturnType;
    status?: ReturnStatus;
    customerId?: string;
    supplierId?: string;
    from?: string;
    to?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'returnDate' | 'refundAmount';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      type,
      status,
      customerId,
      supplierId,
      from,
      to,
      sortBy = 'returnDate',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ReturnWhereInput = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(from || to
        ? {
            returnDate: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { returnNumber: { contains: search, mode: 'insensitive' } },
              { reasonDetails: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.return.count({ where }),
      this.prisma.return.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          originalSale: {
            select: {
              id: true,
              invoiceNumber: true,
              saleDate: true,
              totalAmount: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  businessName: true,
                },
              },
            },
          },
          originalPurchase: {
            select: {
              id: true,
              purchaseNumber: true,
              purchaseDate: true,
              totalAmount: true,
              supplier: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const items = rows.map((r) => this.mapReturn(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: {
        originalSale: {
          select: {
            id: true,
            invoiceNumber: true,
            saleDate: true,
            subtotal: true,
            taxAmount: true,
            totalAmount: true,
            customer: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                businessName: true,
                phone: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
        originalPurchase: {
          select: {
            id: true,
            purchaseNumber: true,
            purchaseDate: true,
            subtotal: true,
            taxAmount: true,
            totalAmount: true,
            supplier: {
              select: {
                id: true,
                code: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!returnRecord) throw new NotFoundException('Return record not found');
    return this.mapReturn(returnRecord);
  }

  async update(id: string, dto: UpdateReturnDto) {
    const existing = await this.prisma.return.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Return record not found');

    if (existing.status === ReturnStatus.COMPLETED) {
      throw new BadRequestException('Cannot update completed return');
    }

    const data: Prisma.ReturnUpdateInput = {
      returnNumber: dto.returnNumber ?? undefined,
      returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
      type: dto.type ?? undefined,
      status: dto.status ?? undefined,
      reason: dto.reason ?? undefined,
      reasonDetails: dto.reasonDetails ?? undefined,
      refundAmount: dto.refundAmount ?? undefined,
      refundMethod: dto.refundMethod ?? undefined,
      notes: dto.notes ?? undefined,
    };

    const updated = await this.prisma.return.update({
      where: { id },
      data,
    });

    return this.mapReturn(updated);
  }

  async approve(id: string, approvedByUserId: string, notes?: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: {
        originalSale: true,
        originalPurchase: true,
      },
    });

    if (!returnRecord) throw new NotFoundException('Return record not found');

    if (returnRecord.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending returns can be approved');
    }

    const updated = await this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.APPROVED,
        approvedBy: approvedByUserId,
        approvedAt: new Date(),
        notes: notes ? `${returnRecord.notes ?? ''}\nAPPROVED: ${notes}`.trim() : returnRecord.notes,
      },
    });

    // Update original transaction if applicable
    if (returnRecord.type === ReturnType.CUSTOMER_RETURN && returnRecord.originalSaleId) {
      const sale = returnRecord.originalSale;
      if (sale) {
        await this.prisma.sale.update({
          where: { id: returnRecord.originalSaleId },
          data: {
            status:
              this.decimalToNumber(sale.totalAmount) === this.decimalToNumber(returnRecord.refundAmount)
                ? SaleStatus.REFUNDED
                : SaleStatus.PARTIALLY_REFUNDED,
          },
        });
      }
    }

    return {
      success: true,
      message: 'Return approved',
      returnId: id,
      returnNumber: updated.returnNumber,
    };
  }

  async reject(id: string, rejectedByUserId: string, reason: string, notes?: string) {
    const returnRecord = await this.prisma.return.findUnique({ where: { id } });
    if (!returnRecord) throw new NotFoundException('Return record not found');

    if (returnRecord.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending returns can be rejected');
    }

    const updated = await this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.REJECTED,
        rejectedReason: reason,
        approvedBy: rejectedByUserId, // Track who made the decision
        approvedAt: new Date(),
        notes: notes ? `${returnRecord.notes ?? ''}\nREJECTED: ${notes}`.trim() : returnRecord.notes,
      },
    });

    return {
      success: true,
      message: 'Return rejected',
      returnId: id,
      reason,
    };
  }

  async complete(id: string, notes?: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: {
        originalSale: { include: { items: true } },
        originalPurchase: { include: { items: true } },
      },
    });

    if (!returnRecord) throw new NotFoundException('Return record not found');

    if (returnRecord.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Return must be approved before completion');
    }

    // Process inventory adjustments
    if (returnRecord.type === ReturnType.CUSTOMER_RETURN && returnRecord.originalSale) {
      // Return items to inventory
      for (const item of returnRecord.originalSale.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }
    } else if (returnRecord.type === ReturnType.SUPPLIER_RETURN && returnRecord.originalPurchase) {
      // Remove items from inventory
      for (const item of returnRecord.originalPurchase.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }

    const updated = await this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.COMPLETED,
        notes: notes ? `${returnRecord.notes ?? ''}\nCOMPLETED: ${notes}`.trim() : returnRecord.notes,
      },
    });

    return {
      success: true,
      message: 'Return completed',
      returnId: id,
      returnNumber: updated.returnNumber,
      refundAmount: this.decimalToNumber(updated.refundAmount),
    };
  }

  async getSummary(from?: string, to?: string, type?: ReturnType) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const where: Prisma.ReturnWhereInput = {
      returnDate: { gte: fromDate, lte: toDate },
      ...(type ? { type } : {}),
    };

    const [total, byStatus, byReason, byType] = await Promise.all([
      this.prisma.return.aggregate({
        where,
        _count: true,
        _sum: { refundAmount: true },
      }),

      this.prisma.return.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { refundAmount: true },
      }),

      this.prisma.return.groupBy({
        by: ['reason'],
        where: { ...where, reason: { not: null } },
        _count: true,
      }),

      this.prisma.return.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { refundAmount: true },
      }),
    ]);

    return {
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalReturns: total._count,
      totalRefundAmount: this.decimalToNumber(total._sum.refundAmount),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        refundAmount: this.decimalToNumber(s._sum.refundAmount),
      })),
      byReason: byReason.map((r) => ({
        reason: r.reason,
        count: r._count,
      })),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count,
        refundAmount: this.decimalToNumber(t._sum.refundAmount),
      })),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.return.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Return record not found');

    if (existing.status === ReturnStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed return');
    }

    await this.prisma.return.delete({ where: { id } });
    return { success: true, message: 'Return record deleted' };
  }

  // Helper methods

  private generateReturnNumber(type: ReturnType): string {
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const t = Date.now().toString(36).toUpperCase();
    const prefix = type === ReturnType.CUSTOMER_RETURN ? 'RET-C' : 'RET-S';
    return `${prefix}-${y}${m}${d}-${t}`;
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

  private mapReturn(r: any) {
    return {
      id: r.id,
      returnNumber: r.returnNumber,
      returnDate: r.returnDate,
      type: r.type,
      status: r.status,
      reason: r.reason,
      originalSaleId: r.originalSaleId,
      originalSale: r.originalSale ?? undefined,
      originalPurchaseId: r.originalPurchaseId,
      originalPurchase: r.originalPurchase ?? undefined,
      customerId: r.customerId,
      supplierId: r.supplierId,
      reasonDetails: r.reasonDetails,
      refundAmount: this.decimalToNumber(r.refundAmount),
      refundMethod: r.refundMethod,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt,
      rejectedReason: r.rejectedReason,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}