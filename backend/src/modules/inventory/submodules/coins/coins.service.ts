import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { ProductCategory, ProductStatus, CoinType } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class CoinsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateCoinDto) {
    const sku = dto.sku ?? this.generateCoinSKU(dto.coinType, dto.coinYear);
    const qrCode = dto.qrCode ?? `QR-${sku}`;

    const data: any = {
      sku,
      qrCode,
      name: dto.name,
      description: dto.description ?? null,
      category: ProductCategory.COIN,
      status: dto.status ?? ProductStatus.IN_STOCK,
      weight: dto.weight ?? undefined,
      purchasePrice: dto.purchasePrice ?? undefined,
      sellingPrice: dto.sellingPrice ?? undefined,
      coinType: dto.coinType,
      coinYear: dto.coinYear ?? null,
      quantity: dto.quantity ?? 1,
      images: dto.images ?? [],
    };

    const created = await this.prisma.product.create({ data });

    // Create inventory records
    if (Array.isArray(dto.allocations) && dto.allocations.length > 0) {
      const allocations = dto.allocations
        .filter((a) => a && a.branchId && a.quantity && a.quantity > 0)
        .map((a) => ({
          productId: created.id,
          branchId: a.branchId,
          quantity: a.quantity,
          minimumStock: a.minimumStock ?? (dto.minimumStock ?? 10),
          location: a.location ?? dto.location ?? null,
        }));
      if (allocations.length > 0) {
        await this.prisma.inventory.createMany({ data: allocations });
      }
    } else if (dto.branchId && dto.quantity && dto.quantity > 0) {
      // Backward-compatible single-branch path
      await this.prisma.inventory.create({
        data: {
          productId: created.id,
          branchId: dto.branchId,
          quantity: dto.quantity,
          minimumStock: dto.minimumStock ?? 10,
          location: dto.location ?? null,
        },
      });
    }

    return this.mapCoin(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    coinType?: CoinType;
    status?: ProductStatus;
    branchId?: string;
    coinYear?: number;
    minQuantity?: number;
    maxQuantity?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      coinType,
      status,
      branchId,
      coinYear,
      minQuantity,
      maxQuantity,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      category: ProductCategory.COIN,
      ...(coinType ? { coinType } : {}),
      ...(status ? { status } : {}),
      ...(coinYear ? { coinYear } : {}),
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

    const items = rows.map((r: any) => this.mapCoin(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const coin = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.COIN },
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

    if (!coin) throw new NotFoundException('Coin not found');
    return this.mapCoin(coin);
  }

  async update(id: string, dto: UpdateCoinDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.COIN },
    });
    if (!existing) throw new NotFoundException('Coin not found');

    const data: any = {
      sku: dto.sku ?? undefined,
      qrCode: dto.qrCode ?? undefined,
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      status: dto.status ?? undefined,
      weight: dto.weight ?? undefined,
      purchasePrice: dto.purchasePrice ?? undefined,
      sellingPrice: dto.sellingPrice ?? undefined,
      coinType: dto.coinType ?? undefined,
      coinYear: dto.coinYear ?? undefined,
      quantity: dto.quantity ?? undefined,
      images: dto.images ?? undefined,
    };

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    return this.mapCoin(updated);
  }

  async adjustQuantity(id: string, adjustment: number, branchId?: string, notes?: string) {
    const coin = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.COIN },
      select: { id: true, quantity: true },
    });

    if (!coin) throw new NotFoundException('Coin not found');

    const currentQty = coin.quantity ?? 0;
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
            minimumStock: 10,
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
    const where: any = {
      category: ProductCategory.COIN,
      status: { not: ProductStatus.RETURNED }, // exclude soft-deleted
      ...(branchId
        ? {
          inventory: {
            some: { branchId },
          },
        }
        : {}),
    };
    const [totalCoins, totalValue, byType, lowStock] = await Promise.all([
      // Total coins count
      this.prisma.product.aggregate({
        where,
        _sum: { quantity: true },
      }),

      // Total value (purchase + selling)
      this.prisma.product.aggregate({
        where,
        _sum: { purchasePrice: true, sellingPrice: true },
      }),

      // Group by coin type
      this.prisma.product.groupBy({
        by: ['coinType'],
        where,
        _sum: { quantity: true, purchasePrice: true, sellingPrice: true },
        _count: true,
      }),

      // Low stock items
      branchId
        ? this.prisma.inventory.findMany({
          where: {
            branchId,

            product: {
              category: ProductCategory.COIN,
              status: { not: ProductStatus.RETURNED }, // exclude soft-deleted
            },
            quantity: { lte: this.prisma.inventory.fields.minimumStock },
          },
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                coinType: true,
                quantity: true,
              },
            },
          },
        })
        : [],
    ]);

    return {
      totalQuantity: totalCoins._sum.quantity ?? 0,
      totalPurchaseValue: this.decimalToNumber(totalValue._sum.purchasePrice),
      totalSellingValue: this.decimalToNumber(totalValue._sum.sellingPrice),
      byType: byType.map((t: any) => ({
        coinType: t.coinType,
        count: t._count,
        quantity: t._sum.quantity ?? 0,
        purchaseValue: this.decimalToNumber(t._sum.purchasePrice),
        sellingValue: this.decimalToNumber(t._sum.sellingPrice),
      })),
      lowStock: lowStock.map((inv: any) => ({
        productId: inv.product?.id,
        sku: inv.product?.sku,
        name: inv.product?.name,
        coinType: inv.product?.coinType,
        currentQuantity: inv.quantity,
        minimumStock: inv.minimumStock,
      })),
    };
  }

  async remove(id: string, force = false) {
    const existing = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.COIN },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Coin not found');

    // If force delete requested and item already soft-deleted, remove permanently
    if (force && existing.status === ProductStatus.RETURNED) {
      // Check for related records that would prevent deletion
      const [saleItems, purchaseItems, inventoryRecords] = await Promise.all([
        this.prisma.saleItem.count({ where: { productId: id } }),
        this.prisma.purchaseItem.count({ where: { productId: id } }),
        this.prisma.inventory.count({ where: { productId: id } }),
      ]);

      if (saleItems > 0 || purchaseItems > 0) {
        throw new BadRequestException(
          `Cannot delete coin: it has ${saleItems} sale record(s) and ${purchaseItems} purchase record(s). Products with transaction history cannot be permanently deleted.`
        );
      }

      // Delete related inventory records first
      await this.prisma.inventory.deleteMany({
        where: { productId: id },
      });

      // Then delete the product
      await this.prisma.product.delete({ where: { id } });
      return { success: true, message: 'Coin permanently deleted' };
    }

    // Soft delete: mark as returned
    await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.RETURNED },
    });

    return { success: true, message: 'Coin marked as returned' };
  }

  // Helpers

  private generateCoinSKU(coinType?: CoinType, year?: number): string {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const typeCode = coinType ? this.coinTypeCode(coinType) : 'COIN';
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${typeCode}-${y}-${timestamp}-${rand}`;
  }

  private coinTypeCode(type: CoinType): string {
    const map: Record<CoinType, string> = {
      BAHAR_AZADI: 'BA',
      GERAMI: 'GER',
      HALF_BAHAR: 'HBA',
      QUARTER_BAHAR: 'QBA',
      NIM_AZADI: 'NIM',
      ROB_AZADI: 'ROB',
      OTHER: 'OTH',
    };
    return map[type] ?? 'COIN';
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

  private mapCoin(p: any) {
    // Calculate total inventory quantity if inventory is included
    let totalInventoryQty = 0;
    if (Array.isArray(p.inventory) && p.inventory.length > 0) {
      totalInventoryQty = p.inventory.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0);
    }

    return {
      id: p.id,
      sku: p.sku,
      qrCode: p.qrCode,
      name: p.name,
      description: p.description,
      category: p.category,
      status: p.status,
      weight: this.decimalToNumber(p.weight),
      purchasePrice: this.decimalToNumber(p.purchasePrice),
      sellingPrice: this.decimalToNumber(p.sellingPrice),
      coinType: p.coinType,
      coinYear: p.coinYear,
      quantity: totalInventoryQty > 0 ? totalInventoryQty : (p.quantity ?? 0), // Use inventory total or product quantity
      images: Array.isArray(p.images) ? p.images : [],
      inventory: p.inventory ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}