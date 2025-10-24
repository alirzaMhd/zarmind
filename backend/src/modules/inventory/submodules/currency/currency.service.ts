import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { RecordCurrencyTradeDto } from './dto/record-currency-trade.dto';
import { Prisma, ProductCategory, ProductStatus } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCurrencyDto) {
    const sku = dto.sku ?? this.generateCurrencySKU(dto.currencyCode);
    const qrCode = dto.qrCode ?? `QR-${sku}`;

    const data: Prisma.ProductCreateInput = {
      sku,
      qrCode,
      name: dto.name ?? `${dto.currencyCode} Currency`,
      description: dto.description ?? `Foreign currency - ${dto.currencyCode}`,
      category: ProductCategory.CURRENCY,
      status: dto.status ?? ProductStatus.IN_STOCK,
      purchasePrice: dto.purchasePrice ?? undefined,
      sellingPrice: dto.sellingPrice ?? undefined,
      currencyCode: dto.currencyCode,
      quantity: dto.quantity ?? 0,
      images: dto.images ?? [],
    };

    const created = await this.prisma.product.create({ data });

    // Create inventory record if branchId provided
    if (dto.branchId && dto.quantity && dto.quantity > 0) {
      await this.prisma.inventory.create({
        data: {
          productId: created.id,
          branchId: dto.branchId,
          quantity: dto.quantity,
          minimumStock: dto.minimumStock ?? 1000,
          location: dto.location ?? null,
        },
      });
    }

    return this.mapCurrency(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    currencyCode?: string;
    status?: ProductStatus;
    branchId?: string;
    minQuantity?: number;
    maxQuantity?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      currencyCode,
      status,
      branchId,
      minQuantity,
      maxQuantity,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ProductWhereInput = {
      category: ProductCategory.CURRENCY,
      ...(currencyCode ? { currencyCode: { equals: currencyCode, mode: 'insensitive' } } : {}),
      ...(status ? { status } : {}),
      ...(minQuantity !== undefined || maxQuantity !== undefined
        ? {
            quantity: {
              gte: minQuantity,
              lte: maxQuantity,
            },
          }
        : {}),
      ...(branchId
        ? {
            inventory: {
              some: { branchId },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { sku: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { qrCode: { contains: search, mode: 'insensitive' } },
              { currencyCode: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          inventory: branchId
            ? {
                where: { branchId },
                select: {
                  quantity: true,
                  minimumStock: true,
                  location: true,
                  branchId: true,
                },
              }
            : {
                select: {
                  quantity: true,
                  minimumStock: true,
                  location: true,
                  branchId: true,
                  branch: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              },
        },
      }),
    ]);

    const items = rows.map((r) => this.mapCurrency(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const currency = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.CURRENCY },
      include: {
        inventory: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!currency) throw new NotFoundException('Currency not found');
    return this.mapCurrency(currency);
  }

  async update(id: string, dto: UpdateCurrencyDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.CURRENCY },
    });
    if (!existing) throw new NotFoundException('Currency not found');

    const data: Prisma.ProductUpdateInput = {
      sku: dto.sku ?? undefined,
      qrCode: dto.qrCode ?? undefined,
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      status: dto.status ?? undefined,
      purchasePrice: dto.purchasePrice ?? undefined,
      sellingPrice: dto.sellingPrice ?? undefined,
      currencyCode: dto.currencyCode ?? undefined,
      quantity: dto.quantity ?? undefined,
      images: dto.images ?? undefined,
    };

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    return this.mapCurrency(updated);
  }

  async recordTrade(id: string, dto: RecordCurrencyTradeDto) {
    const currency = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.CURRENCY },
      select: { id: true, currencyCode: true, quantity: true },
    });

    if (!currency) throw new NotFoundException('Currency not found');

    const currentQty = currency.quantity ?? 0;
    const tradeQty = dto.type === 'BUY' ? dto.quantity : -dto.quantity;
    const newQty = currentQty + tradeQty;

    if (newQty < 0) {
      throw new BadRequestException('Insufficient currency quantity for SELL transaction');
    }

    // Update product quantity
    await this.prisma.product.update({
      where: { id },
      data: { 
        quantity: newQty,
        purchasePrice: dto.type === 'BUY' && dto.rate ? dto.rate : undefined,
        sellingPrice: dto.type === 'SELL' && dto.rate ? dto.rate : undefined,
      },
    });

    // Update inventory if branchId provided
    if (dto.branchId) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId_branchId: { productId: id, branchId: dto.branchId } },
      });

      if (inventory) {
        const invQty = inventory.quantity ?? 0;
        const newInvQty = invQty + tradeQty;
        if (newInvQty < 0) {
          throw new BadRequestException('Insufficient branch inventory for SELL transaction');
        }

        await this.prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: newInvQty },
        });
      } else if (dto.type === 'BUY') {
        // Create inventory record for BUY transactions if it doesn't exist
        await this.prisma.inventory.create({
          data: {
            productId: id,
            branchId: dto.branchId,
            quantity: dto.quantity,
            minimumStock: 1000,
          },
        });
      }
    }

    // Optionally, create an exchange rate record
    if (dto.rate && currency.currencyCode) {
      await this.prisma.exchangeRate.create({
        data: {
          fromCurrency: currency.currencyCode,
          toCurrency: dto.toCurrency ?? 'IRR',
          rate: dto.rate,
          source: 'MANUAL',
          effectiveDate: new Date(),
        },
      });
    }

    return {
      success: true,
      message: `${dto.type} transaction recorded`,
      currencyCode: currency.currencyCode,
      quantity: dto.quantity,
      rate: dto.rate,
      newQuantity: newQty,
      notes: dto.notes,
    };
  }

  async adjustQuantity(id: string, adjustment: number, branchId?: string, notes?: string) {
    const currency = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.CURRENCY },
      select: { id: true, quantity: true, currencyCode: true },
    });

    if (!currency) throw new NotFoundException('Currency not found');

    const currentQty = currency.quantity ?? 0;
    const newQty = currentQty + adjustment;

    if (newQty < 0) {
      throw new BadRequestException('Adjustment would result in negative quantity');
    }

    // Update product quantity
    await this.prisma.product.update({
      where: { id },
      data: { quantity: newQty },
    });

    // Update inventory if branchId provided
    if (branchId) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId_branchId: { productId: id, branchId } },
      });

      if (inventory) {
        const invQty = inventory.quantity ?? 0;
        const newInvQty = invQty + adjustment;
        if (newInvQty < 0) {
          throw new BadRequestException('Adjustment would result in negative branch inventory');
        }

        await this.prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: newInvQty },
        });
      } else if (adjustment > 0) {
        // Create inventory record if it doesn't exist and adjustment is positive
        await this.prisma.inventory.create({
          data: {
            productId: id,
            branchId,
            quantity: adjustment,
            minimumStock: 1000,
          },
        });
      }
    }

    return {
      success: true,
      message: `Quantity adjusted by ${adjustment}`,
      newQuantity: newQty,
      notes,
    };
  }

  async getSummary(branchId?: string) {
    const where: Prisma.ProductWhereInput = {
      category: ProductCategory.CURRENCY,
      ...(branchId
        ? {
            inventory: {
              some: { branchId },
            },
          }
        : {}),
    };

    const [totalValue, byCurrency, lowStock] = await Promise.all([
      // Total value (purchase + selling)
      this.prisma.product.aggregate({
        where,
        _sum: { quantity: true },
      }),

      // Group by currency code
      this.prisma.product.groupBy({
        by: ['currencyCode'],
        where,
        _sum: { quantity: true, purchasePrice: true, sellingPrice: true },
        _count: true,
      }),

      // Low stock items
      branchId
        ? this.prisma.inventory.findMany({
            where: {
              branchId,
              product: { category: ProductCategory.CURRENCY },
              quantity: { lte: this.prisma.inventory.fields.minimumStock },
            },
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  currencyCode: true,
                  quantity: true,
                },
              },
            },
          })
        : [],
    ]);

    return {
      totalQuantity: totalValue._sum.quantity ?? 0,
      byCurrency: byCurrency.map((c) => ({
        currencyCode: c.currencyCode,
        count: c._count,
        quantity: c._sum.quantity ?? 0,
        averagePurchaseRate: this.decimalToNumber(c._sum.purchasePrice),
        averageSellingRate: this.decimalToNumber(c._sum.sellingPrice),
      })),
      lowStock: lowStock.map((inv) => ({
        productId: inv.product?.id,
        sku: inv.product?.sku,
        name: inv.product?.name,
        currencyCode: inv.product?.currencyCode,
        currentQuantity: inv.quantity,
        minimumStock: inv.minimumStock,
      })),
    };
  }

  async getLatestExchangeRates() {
    // Get the latest exchange rate for each currency pair
    const rates = await this.prisma.$queryRaw<
      Array<{ fromCurrency: string; toCurrency: string; rate: any; effectiveDate: Date }>
    >`
      SELECT DISTINCT ON ("fromCurrency", "toCurrency") 
        "fromCurrency", "toCurrency", "rate", "effectiveDate", "source"
      FROM "exchange_rates"
      ORDER BY "fromCurrency", "toCurrency", "effectiveDate" DESC
    `;

    return rates.map((r) => ({
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: this.decimalToNumber(r.rate),
      effectiveDate: r.effectiveDate,
    }));
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.CURRENCY },
    });
    if (!existing) throw new NotFoundException('Currency not found');

    // Soft delete: mark as inactive
    await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.RETURNED },
    });

    return { success: true, message: 'Currency marked as inactive' };
  }

  // Helpers

  private generateCurrencySKU(currencyCode?: string): string {
    const code = currencyCode ?? 'CUR';
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CURR-${code}-${timestamp}-${rand}`;
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

  private mapCurrency(p: any) {
    return {
      id: p.id,
      sku: p.sku,
      qrCode: p.qrCode,
      name: p.name,
      description: p.description,
      category: p.category,
      status: p.status,
      purchasePrice: this.decimalToNumber(p.purchasePrice),
      sellingPrice: this.decimalToNumber(p.sellingPrice),
      currencyCode: p.currencyCode,
      quantity: p.quantity ?? 0,
      images: Array.isArray(p.images) ? p.images : [],
      inventory: p.inventory ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}