import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateRawGoldDto } from './dto/create-raw-gold.dto';
import { UpdateRawGoldDto } from './dto/update-raw-gold.dto';
import { ProductCategory, ProductStatus, GoldPurity } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class RawGoldService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateRawGoldDto) {
    const sku = dto.sku ?? this.generateRawGoldSKU(dto.goldPurity);
    const qrCode = dto.qrCode ?? `QR-${sku}`;

    const data: any = {
      sku,
      qrCode,
      name: dto.name,
      description: dto.description ?? null,
      category: ProductCategory.RAW_GOLD,
      status: dto.status ?? ProductStatus.IN_STOCK,
      weight: dto.weight,
      purchasePrice: dto.purchasePrice ?? undefined,
      sellingPrice: dto.sellingPrice ?? undefined,
      goldPurity: dto.goldPurity,
      quantity: dto.quantity ?? 1,
      images: dto.images ?? [],
      scaleImage: dto.scaleImage ?? null,
    };

    const created = await this.prisma.product.create({ data });

    // Create inventory record if branchId provided
    if (dto.branchId && dto.weight) {
      await this.prisma.inventory.create({
        data: {
          productId: created.id,
          branchId: dto.branchId,
          quantity: dto.quantity ?? 1,
          minimumStock: dto.minimumStock ?? 5,
          location: dto.location ?? null,
        },
      });
    }

    return this.mapRawGold(created);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    goldPurity?: GoldPurity;
    status?: ProductStatus;
    branchId?: string;
    minWeight?: number;
    maxWeight?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'weight';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      goldPurity,
      status,
      branchId,
      minWeight,
      maxWeight,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      category: ProductCategory.RAW_GOLD,
      ...(goldPurity ? { goldPurity } : {}),
      // Default to IN_STOCK if no status filter provided
      status: status || ProductStatus.IN_STOCK,
      ...(minWeight !== undefined || maxWeight !== undefined
        ? {
          weight: {
            gte: minWeight,
            lte: maxWeight,
          },
        }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
          sellingPrice: {
            gte: minPrice,
            lte: maxPrice,
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

    const items = rows.map((r: any) => {
      const mapped: any = this.mapRawGold(r);

      // Add total inventory quantity across all branches or specific branch
      if (Array.isArray(r.inventory) && r.inventory.length > 0) {
        const totalQty = r.inventory.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0);
        mapped.inventoryQuantity = totalQty;
      }

      return mapped;
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const rawGold = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.RAW_GOLD },
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

    if (!rawGold) throw new NotFoundException('Raw gold not found');
    return this.mapRawGold(rawGold);
  }

  async update(id: string, dto: UpdateRawGoldDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.RAW_GOLD },
    });
    if (!existing) throw new NotFoundException('Raw gold not found');

    const data: any = {
      sku: dto.sku ?? undefined,
      qrCode: dto.qrCode ?? undefined,
      name: dto.name ?? undefined,
      description: dto.description ?? undefined,
      status: dto.status ?? undefined,
      weight: dto.weight ?? undefined,
      purchasePrice: dto.purchasePrice ?? undefined,
      sellingPrice: dto.sellingPrice ?? undefined,
      goldPurity: dto.goldPurity ?? undefined,
      quantity: dto.quantity ?? undefined,
      images: dto.images ?? undefined,
      scaleImage: dto.scaleImage ?? undefined,
    };

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });
    // --- Fix: update inventory.quantity if quantity is provided ---
    if (dto.quantity !== undefined) {
      const inventories = await this.prisma.inventory.findMany({ where: { productId: id } });
      for (const inv of inventories) {
        await this.prisma.inventory.update({
          where: { id: inv.id },
          data: { quantity: dto.quantity },
        });
      }
    }
    return this.mapRawGold(updated);
  }

  async adjustWeight(id: string, adjustment: number, branchId?: string, notes?: string) {
    const rawGold = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.RAW_GOLD },
      select: { id: true, weight: true, name: true, goldPurity: true },
    });

    if (!rawGold) throw new NotFoundException('Raw gold not found');

    const currentWeight = this.decimalToNumber(rawGold.weight);
    const newWeight = currentWeight + adjustment;

    if (newWeight < 0) {
      throw new BadRequestException('Adjustment would result in negative weight');
    }

    // Update product weight
    await this.prisma.product.update({
      where: { id },
      data: { weight: newWeight },
    });

    // Optionally update inventory quantity based on weight change
    if (branchId) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId_branchId: { productId: id, branchId } },
      });

      if (inventory) {
        // For raw gold, we might track pieces, so adjust quantity if needed
        // This is optional - depends on business logic
        const qtyAdjustment = adjustment > 0 ? 1 : -1;
        const currentQty = inventory.quantity ?? 0;
        const newQty = Math.max(0, currentQty + qtyAdjustment);

        await this.prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: newQty },
        });
      }
    }

    return {
      success: true,
      message: `Weight adjusted by ${adjustment}g`,
      newWeight,
      notes,
    };
  }

  async transferToWorkshop(id: string, workshopId: string, weight: number, notes?: string) {
    const rawGold = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.RAW_GOLD },
      select: { id: true, weight: true, goldPurity: true, name: true },
    });

    if (!rawGold) throw new NotFoundException('Raw gold not found');

    const workshop = await this.prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { id: true, name: true },
    });

    if (!workshop) throw new BadRequestException('Workshop not found');

    const currentWeight = this.decimalToNumber(rawGold.weight);

    if (weight > currentWeight) {
      throw new BadRequestException('Transfer weight exceeds available weight');
    }

    if (weight <= 0) {
      throw new BadRequestException('Transfer weight must be positive');
    }

    // Reduce raw gold weight
    const newWeight = currentWeight - weight;
    await this.prisma.product.update({
      where: { id },
      data: { weight: newWeight },
    });

    // Optionally create a work order or transaction record
    // This is a simplified version - you might want to create a formal WorkOrder
    return {
      success: true,
      message: `Transferred ${weight}g to ${workshop.name}`,
      rawGoldId: id,
      workshopId,
      transferredWeight: weight,
      remainingWeight: newWeight,
      goldPurity: rawGold.goldPurity,
      notes,
    };
  }

  async getSummary(branchId?: string) {
    const where: any = {
      category: ProductCategory.RAW_GOLD,
      status: ProductStatus.IN_STOCK, // ⭐ Only count items in stock
      ...(branchId
        ? {
          inventory: {
            some: { branchId },
          },
        }
        : {}),
    };

    // Get all raw gold products with their inventory
    const products = await this.prisma.product.findMany({
      where,
      include: {
        inventory: branchId
          ? {
            where: { branchId },
          }
          : true,
      },
    });

    // Calculate totals based on inventory quantities
    let totalItems = 0;
    let totalWeight = 0;
    let totalPurchaseValue = 0;
    let totalSellingValue = 0;
    const purityMap = new Map<string, {
      count: number;
      totalWeight: number;
      purchaseValue: number;
      sellingValue: number;
    }>();

    for (const product of products) {
      // Get total quantity from all branches or specific branch
      const inventoryQty = Array.isArray(product.inventory)
        ? product.inventory.reduce((sum: any, inv: any) => sum + (inv.quantity || 0), 0)
        : 0;

      // Use inventory quantity if available, otherwise use product quantity
      const qty = inventoryQty > 0 ? inventoryQty : (product.quantity || 1);

      totalItems += qty;
      totalWeight += this.decimalToNumber(product.weight) * qty;
      totalPurchaseValue += this.decimalToNumber(product.purchasePrice) * qty;
      totalSellingValue += this.decimalToNumber(product.sellingPrice) * qty;

      // Group by purity
      const purity = product.goldPurity || 'UNKNOWN';
      if (!purityMap.has(purity)) {
        purityMap.set(purity, {
          count: 0,
          totalWeight: 0,
          purchaseValue: 0,
          sellingValue: 0,
        });
      }

      const purityData = purityMap.get(purity)!;
      purityData.count += qty;
      purityData.totalWeight += this.decimalToNumber(product.weight) * qty;
      purityData.purchaseValue += this.decimalToNumber(product.purchasePrice) * qty;
      purityData.sellingValue += this.decimalToNumber(product.sellingPrice) * qty;
    }

    // Convert purity map to array
    const byPurity = Array.from(purityMap.entries()).map(([goldPurity, data]) => ({
      goldPurity,
      ...data,
    }));

    // Get low stock items
    const lowStock = branchId
      ? await this.prisma.inventory.findMany({
        where: {
          branchId,
          product: { category: ProductCategory.RAW_GOLD },
          quantity: { lte: this.prisma.inventory.fields.minimumStock },
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              goldPurity: true,
              weight: true,
            },
          },
        },
      })
      : [];

    return {
      totalItems,
      totalWeight,
      totalPurchaseValue,
      totalSellingValue,
      byPurity,
      lowStock: lowStock.map((inv: any) => ({
        productId: inv.product?.id,
        sku: inv.product?.sku,
        name: inv.product?.name,
        goldPurity: inv.product?.goldPurity,
        weight: this.decimalToNumber(inv.product?.weight),
        currentQuantity: inv.quantity,
        minimumStock: inv.minimumStock,
      })),
    };
  }

  async getValuation(branchId?: string) {
    const where: any = {
      category: ProductCategory.RAW_GOLD,
      status: ProductStatus.IN_STOCK,
      ...(branchId
        ? {
          inventory: {
            some: { branchId },
          },
        }
        : {}),
    };

    // Get current gold prices
    const goldPrices = await this.prisma.goldPrice.findMany({
      where: {},
      orderBy: { effectiveDate: 'desc' },
      distinct: ['purity'],
      take: 4, // K18, K21, K22, K24
    });

    const priceMap = new Map(
      goldPrices.map((gp: any) => [gp.purity, this.decimalToNumber(gp.pricePerGram)]),
    );

    // Get all raw gold by purity
    const rawGoldByPurity = await this.prisma.product.groupBy({
      by: ['goldPurity'],
      where,
      _sum: { weight: true },
    });

    const valuation = rawGoldByPurity.map((rg: any) => {
      const weight = this.decimalToNumber(rg._sum.weight);
      const pricePerGram: any = priceMap.get(rg.goldPurity as GoldPurity) ?? 0;
      const value = weight * pricePerGram;

      return {
        goldPurity: rg.goldPurity,
        weight,
        pricePerGram,
        currentValue: value,
      };
    });

    const totalValue = valuation.reduce((sum: any, v: any) => sum + v.currentValue, 0);

    return {
      valuation,
      totalValue,
      pricesAsOf: goldPrices[0]?.effectiveDate ?? new Date(),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.RAW_GOLD },
    });
    if (!existing) throw new NotFoundException('Raw gold not found');

    // Soft delete: mark as inactive
    await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.RETURNED },
    });

    return { success: true, message: 'Raw gold marked as inactive' };
  }

  // Helpers

  private generateRawGoldSKU(goldPurity: GoldPurity): string {
    const purityCode = goldPurity.replace('K', '');
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `RG-${purityCode}K-${timestamp}-${rand}`;
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

  private mapRawGold(p: any) {
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
      goldPurity: p.goldPurity,
      quantity: totalInventoryQty > 0 ? totalInventoryQty : (p.quantity ?? 1), // Use inventory total or product quantity
      images: Array.isArray(p.images) ? p.images : [],
      scaleImage: p.scaleImage,
      inventory: p.inventory ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}