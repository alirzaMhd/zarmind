import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateSaleDto } from './dto/update-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { SaleStatus, PaymentMethod, ProductStatus } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSaleDto, userId: string) {
    const invoiceNumber = dto.invoiceNumber ?? this.generateInvoiceNumber();

    // Verify customer exists if provided
    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });
      if (!customer) throw new BadRequestException('Customer not found');
    }

    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      select: { id: true },
    });
    if (!branch) throw new BadRequestException('Branch not found');

    // Verify all products exist and calculate totals
    let subtotal = 0;
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, sellingPrice: true, quantity: true, status: true },
      });

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (product.status !== ProductStatus.IN_STOCK) {
        throw new BadRequestException(`Product ${item.productId} is not in stock`);
      }

      // Calculate item subtotal
      const itemTotal =
        (item.goldPrice ?? 0) +
        (item.stonePrice ?? 0) +
        (item.craftsmanshipFee ?? 0) -
        (item.discount ?? 0);
      subtotal += itemTotal * item.quantity;
    }

    const taxAmount = dto.taxAmount ?? 0;
    const discountAmount = dto.discountAmount ?? 0;
    const totalAmount = subtotal + taxAmount - discountAmount;
    const paidAmount = dto.paidAmount ?? 0;

    // Determine status
    let status: SaleStatus = SaleStatus.DRAFT;
    if (dto.status) {
      status = dto.status;
    } else if (paidAmount >= totalAmount) {
      status = SaleStatus.COMPLETED;
    }

    const created = await this.prisma.sale.create({
      data: {
        invoiceNumber,
        saleDate: new Date(dto.saleDate ?? new Date()),
        status,
        customer: dto.customerId ? { connect: { id: dto.customerId } } : undefined,
        user: { connect: { id: userId } },
        branch: { connect: { id: dto.branchId } },
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paidAmount,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes ?? null,
        items: {
          create: dto.items.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            weight: item.weight ?? null,
            unitPrice: item.unitPrice,
            goldPrice: item.goldPrice ?? null,
            stonePrice: item.stonePrice ?? null,
            craftsmanshipFee: item.craftsmanshipFee ?? null,
            discount: item.discount ?? null,
            subtotal:
              ((item.goldPrice ?? 0) +
                (item.stonePrice ?? 0) +
                (item.craftsmanshipFee ?? 0) -
                (item.discount ?? 0)) *
              item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                category: true,
                goldPurity: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            businessName: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // If sale is completed, update inventory and create payment record
    if (status === SaleStatus.COMPLETED) {
      await this.updateInventoryForSale(created.id, dto.branchId);

      if (paidAmount > 0) {
        await this.prisma.salePayment.create({
          data: {
            saleId: created.id,
            amount: paidAmount,
            paymentMethod: dto.paymentMethod,
            paymentDate: new Date(),
          },
        });
      }
    }

    // Record QR code scans if products were scanned
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { qrCode: true },
      });

      if (product?.qrCode) {
        await this.prisma.qRCodeScan.create({
          data: {
            qrCode: product.qrCode,
            productId: item.productId,
            scannedBy: userId,
            scannedAt: new Date(),
            purpose: 'SALE',
            location: dto.branchId,
          },
        });
      }
    }

    return this.mapSale(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: SaleStatus;
    customerId?: string;
    branchId?: string;
    userId?: string;
    from?: string;
    to?: string;
    minAmount?: number;
    maxAmount?: number;
    paymentMethod?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'saleDate' | 'totalAmount';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      status,
      customerId,
      branchId,
      userId,
      from,
      to,
      minAmount,
      maxAmount,
      paymentMethod,
      sortBy = 'saleDate',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(branchId ? { branchId } : {}),
      ...(userId ? { userId } : {}),
      ...(paymentMethod ? { paymentMethod: paymentMethod as PaymentMethod } : {}),
      ...(from || to
        ? {
            saleDate: {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            },
          }
        : {}),
      ...(minAmount !== undefined || maxAmount !== undefined
        ? {
            totalAmount: {
              gte: minAmount,
              lte: maxAmount,
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
          customer: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              businessName: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
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

    const items = rows.map((r: any) => this.mapSale(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                qrCode: true,
                name: true,
                category: true,
                goldPurity: true,
                weight: true,
                images: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            businessName: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!sale) throw new NotFoundException('Sale not found');
    return this.mapSale(sale);
  }

  async findByInvoiceNumber(invoiceNumber: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { invoiceNumber },
      include: {
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
        customer: true,
        payments: true,
      },
    });

    if (!sale) throw new NotFoundException('Sale not found');
    return this.mapSale(sale);
  }

  async update(id: string, dto: UpdateSaleDto) {
    const existing = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) throw new NotFoundException('Sale not found');

    if (existing.status === SaleStatus.COMPLETED) {
      throw new BadRequestException('Cannot update completed sale');
    }

    if (existing.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Cannot update cancelled sale');
    }

    // Recalculate totals if needed
    let subtotal = this.decimalToNumber(existing.subtotal);
    if (dto.items && dto.items.length > 0) {
      subtotal = dto.items.reduce((sum, item) => {
        return (
          sum +
          ((item.goldPrice ?? 0) +
            (item.stonePrice ?? 0) +
            (item.craftsmanshipFee ?? 0) -
            (item.discount ?? 0)) *
            item.quantity
        );
      }, 0);
    }

    const taxAmount = dto.taxAmount ?? this.decimalToNumber(existing.taxAmount);
    const discountAmount = dto.discountAmount ?? this.decimalToNumber(existing.discountAmount);
    const totalAmount = subtotal + taxAmount - discountAmount;

    const data: any = {
      invoiceNumber: dto.invoiceNumber ?? undefined,
      saleDate: dto.saleDate ? new Date(dto.saleDate) : undefined,
      status: dto.status ?? undefined,
      customer: dto.customerId ? { connect: { id: dto.customerId } } : undefined,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paidAmount: dto.paidAmount ?? undefined,
      paymentMethod: dto.paymentMethod ?? undefined,
      notes: dto.notes ?? undefined,
    };

    const updated = await this.prisma.sale.update({
      where: { id },
      data,
      include: {
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
        customer: true,
      },
    });

    return this.mapSale(updated);
  }

  async recordPayment(id: string, dto: RecordPaymentDto) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');

    if (sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payment for cancelled sale');
    }

    const currentPaid = this.decimalToNumber(sale.paidAmount);
    const totalAmount = this.decimalToNumber(sale.totalAmount);
    const newPaidAmount = currentPaid + dto.amount;

    if (newPaidAmount > totalAmount) {
      throw new BadRequestException('Payment amount exceeds total amount');
    }

    // Create payment record
    await this.prisma.salePayment.create({
      data: {
        saleId: id,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        checkId: dto.checkId ?? null,
        bankAccountId: dto.bankAccountId ?? null,
        referenceNumber: dto.referenceNumber ?? null,
        notes: dto.notes ?? null,
      },
    });

    // Update sale
    let newStatus: SaleStatus = sale.status;
    if (newPaidAmount >= totalAmount) {
      newStatus = SaleStatus.COMPLETED;
      // Update inventory when fully paid
      await this.updateInventoryForSale(id, sale.branchId);
    }

    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return {
      success: true,
      message: 'Payment recorded successfully',
      saleId: id,
      paidAmount: newPaidAmount,
      remainingAmount: totalAmount - newPaidAmount,
      status: newStatus,
    };
  }

  async completeSale(id: string, notes?: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) throw new NotFoundException('Sale not found');

    if (sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete cancelled sale');
    }

    if (sale.status === SaleStatus.COMPLETED) {
      throw new BadRequestException('Sale is already completed');
    }

    // Update inventory
    await this.updateInventoryForSale(id, sale.branchId);

    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        status: SaleStatus.COMPLETED,
        notes: notes ? `${sale.notes ?? ''}\n${notes}`.trim() : sale.notes,
      },
    });

    return {
      success: true,
      message: 'Sale completed successfully',
      saleId: id,
      invoiceNumber: updated.invoiceNumber,
    };
  }

  async cancelSale(id: string, reason: string, notes?: string) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');

    if (sale.status === SaleStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed sale. Please create a return instead.');
    }

    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        status: SaleStatus.CANCELLED,
        notes: `${sale.notes ?? ''}\nCANCELLED: ${reason}\n${notes ?? ''}`.trim(),
      },
    });

    return {
      success: true,
      message: 'Sale cancelled',
      saleId: id,
      reason,
    };
  }

  async refundSale(id: string, amount: number, reason: string, notes?: string) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');

    if (sale.status !== SaleStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed sales');
    }

    const totalAmount = this.decimalToNumber(sale.totalAmount);

    if (amount > totalAmount) {
      throw new BadRequestException('Refund amount exceeds sale total');
    }

    let newStatus: SaleStatus;
    if (amount >= totalAmount) {
      newStatus = SaleStatus.REFUNDED;
    } else {
      newStatus = SaleStatus.PARTIALLY_REFUNDED;
    }

    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        status: newStatus,
        notes: `${sale.notes ?? ''}\nREFUNDED: ${amount} - ${reason}\n${notes ?? ''}`.trim(),
      },
    });

    return {
      success: true,
      message: 'Sale refunded',
      saleId: id,
      refundAmount: amount,
      reason,
      newStatus,
    };
  }

  async getSummary(from?: string, to?: string, branchId?: string, userId?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const where: any = {
      saleDate: { gte: fromDate, lte: toDate },
      ...(branchId ? { branchId } : {}),
      ...(userId ? { userId } : {}),
    };

    const [total, byStatus, byPaymentMethod, topCustomers, topProducts] = await Promise.all([
      this.prisma.sale.aggregate({
        where,
        _count: true,
        _sum: { totalAmount: true, paidAmount: true, subtotal: true, taxAmount: true, discountAmount: true },
      }),

      this.prisma.sale.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { totalAmount: true },
      }),

      this.prisma.sale.groupBy({
        by: ['paymentMethod'],
        where,
        _count: true,
        _sum: { totalAmount: true },
      }),

      this.prisma.sale.groupBy({
        by: ['customerId'],
        where: { ...where, customerId: { not: null } },
        _count: true,
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5,
      }),

      this.prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: where,
        },
        _count: true,
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalSales: total._count,
      totalRevenue: this.decimalToNumber(total._sum.totalAmount),
      totalPaid: this.decimalToNumber(total._sum.paidAmount),
      totalSubtotal: this.decimalToNumber(total._sum.subtotal),
      totalTax: this.decimalToNumber(total._sum.taxAmount),
      totalDiscount: this.decimalToNumber(total._sum.discountAmount),
      outstandingAmount:
        this.decimalToNumber(total._sum.totalAmount) - this.decimalToNumber(total._sum.paidAmount),
      byStatus: byStatus.map((s: any) => ({
        status: s.status,
        count: s._count,
        totalAmount: this.decimalToNumber(s._sum.totalAmount),
      })),
      byPaymentMethod: byPaymentMethod.map((p: any) => ({
        paymentMethod: p.paymentMethod,
        count: p._count,
        totalAmount: this.decimalToNumber(p._sum.totalAmount),
      })),
      topCustomers: topCustomers.map((c: any) => ({
        customerId: c.customerId,
        salesCount: c._count,
        totalAmount: this.decimalToNumber(c._sum.totalAmount),
      })),
      topProducts: topProducts.map((p: any) => ({
        productId: p.productId,
        salesCount: p._count,
        quantitySold: p._sum.quantity ?? 0,
        totalRevenue: this.decimalToNumber(p._sum.subtotal),
      })),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.sale.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sale not found');

    if (existing.status === SaleStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed sale. Cancel it first.');
    }

    await this.prisma.sale.delete({ where: { id } });
    return { success: true, message: 'Sale deleted' };
  }

  // Helper methods

  private async updateInventoryForSale(saleId: string, branchId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) return;

    for (const item of sale.items) {
      // Update product quantity
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { 
          quantity: { decrement: item.quantity },
          status: ProductStatus.SOLD,
        },
      });

      // Update inventory
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId_branchId: { productId: item.productId, branchId } },
      });

      if (inventory) {
        const newQty = (inventory.quantity ?? 0) - item.quantity;
        await this.prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: Math.max(0, newQty) },
        });
      }
    }
  }

  private generateInvoiceNumber(): string {
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const t = Date.now().toString(36).toUpperCase();
    return `INV-${y}${m}${d}-${t}`;
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

  private mapSale(s: any) {
    return {
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      saleDate: s.saleDate,
      status: s.status,
      customerId: s.customerId,
      customer: s.customer ?? undefined,
      userId: s.userId,
      user: s.user ?? undefined,
      branchId: s.branchId,
      branch: s.branch ?? undefined,
      subtotal: this.decimalToNumber(s.subtotal),
      taxAmount: this.decimalToNumber(s.taxAmount),
      discountAmount: this.decimalToNumber(s.discountAmount),
      totalAmount: this.decimalToNumber(s.totalAmount),
      paidAmount: this.decimalToNumber(s.paidAmount),
      paymentMethod: s.paymentMethod,
      notes: s.notes,
      items: Array.isArray(s.items)
        ? s.items.map((i: any) => ({
            id: i.id,
            productId: i.productId,
            product: i.product ?? undefined,
            quantity: i.quantity,
            weight: this.decimalToNumber(i.weight),
            unitPrice: this.decimalToNumber(i.unitPrice),
            goldPrice: this.decimalToNumber(i.goldPrice),
            stonePrice: this.decimalToNumber(i.stonePrice),
            craftsmanshipFee: this.decimalToNumber(i.craftsmanshipFee),
            discount: this.decimalToNumber(i.discount),
            subtotal: this.decimalToNumber(i.subtotal),
          }))
        : [],
      payments: Array.isArray(s.payments)
        ? s.payments.map((p: any) => ({
            id: p.id,
            amount: this.decimalToNumber(p.amount),
            paymentMethod: p.paymentMethod,
            paymentDate: p.paymentDate,
            checkId: p.checkId,
            bankAccountId: p.bankAccountId,
            referenceNumber: p.referenceNumber,
            notes: p.notes,
          }))
        : [],
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}