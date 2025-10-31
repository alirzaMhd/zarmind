import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCategory, ProductStatus, GoldPurity, StoneType } from '@zarmind/shared-types';

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateProductDto) {
    const sku = dto.sku ?? this.generateProductSKU(dto.goldPurity);
    const qrCode = dto.qrCode ?? `QR-${sku}`;

    const data: any = {
      sku,
      qrCode,
      name: dto.name,
      description: dto.description ?? null,
      category: ProductCategory.MANUFACTURED_PRODUCT,
      status: dto.status ?? ProductStatus.IN_STOCK,
      weight: dto.weight ?? undefined,
      purchasePrice: dto.purchasePrice ?? undefined,
      sellingPrice: dto.sellingPrice ?? undefined,
      goldPurity: dto.goldPurity ?? null,
      craftsmanshipFee: dto.craftsmanshipFee ?? undefined,
      // If allocations provided, set total quantity as sum; otherwise use provided quantity or 1
      quantity:
        (Array.isArray(dto.allocations)
          ? dto.allocations.reduce((sum, a) => sum + (a?.quantity ?? 0), 0)
          : undefined) ?? dto.quantity ?? 1,
      images: dto.images ?? [],
      scaleImage: dto.scaleImage ?? null,
      workshop: dto.workshopId ? { connect: { id: dto.workshopId } } : undefined,
      productionStatus: dto.productionStatus ?? null,
    };

    const created = await this.prisma.product.create({
      data,
      include: {
        productStones: true,
        workshop: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Create embedded stones if provided
    if (dto.stones && dto.stones.length > 0) {
      await this.prisma.productStone.createMany({
        data: dto.stones.map((stone) => ({
          productId: created.id,
          stoneType: stone.stoneType,
          caratWeight: stone.caratWeight,
          quantity: stone.quantity ?? 1,
          price: stone.price,
          notes: stone.notes ?? null,
        })),
      });
    }

    // Create inventory records
    if (Array.isArray(dto.allocations) && dto.allocations.length > 0) {
      const allocations = dto.allocations
        .filter((a) => a && a.branchId && a.quantity && a.quantity > 0)
        .map((a) => ({
          productId: created.id,
          branchId: a.branchId,
          quantity: a.quantity,
          minimumStock: a.minimumStock ?? (dto.minimumStock ?? 1),
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
          minimumStock: dto.minimumStock ?? 1,
          location: dto.location ?? null,
        },
      });
    }

    return this.findOne(created.id);
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    goldPurity?: GoldPurity;
    status?: ProductStatus;
    branchId?: string;
    workshopId?: string;
    productionStatus?: string;
    minPrice?: number;
    maxPrice?: number;
    minWeight?: number;
    maxWeight?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'weight' | 'name';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<any>> {
    const {
      page,
      limit,
      search,
      goldPurity,
      status,
      branchId,
      workshopId,
      productionStatus,
      minPrice,
      maxPrice,
      minWeight,
      maxWeight,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {
      category: ProductCategory.MANUFACTURED_PRODUCT,
      ...(goldPurity ? { goldPurity } : {}),
      ...(status ? { status } : {}),
      ...(workshopId ? { workshopId } : {}),
      ...(productionStatus ? { productionStatus } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
          sellingPrice: {
            gte: minPrice,
            lte: maxPrice,
          },
        }
        : {}),
      ...(minWeight !== undefined || maxWeight !== undefined
        ? {
          weight: {
            gte: minWeight,
            lte: maxWeight,
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
          productStones: true,
          workshop: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
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

    const items = rows.map((r: any

    ) => this.mapProduct(r));
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.MANUFACTURED_PRODUCT },
      include: {
        productStones: true,
        workshop: {
          select: {
            id: true,
            name: true,
            code: true,
            contactPerson: true,
            phone: true,
          },
        },
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

    if (!product) throw new NotFoundException('Product not found');
    return this.mapProduct(product);
  }

  async findByQrCode(qrCode: string) {
    const product = await this.prisma.product.findUnique({
      where: { qrCode, category: ProductCategory.MANUFACTURED_PRODUCT },
      include: {
        productStones: true,
        workshop: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        inventory: {
          include: {
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
    });

    if (!product) throw new NotFoundException('Product not found');

    // Record QR scan
    await this.prisma.qRCodeScan.create({
      data: {
        qrCode,
        productId: product.id,
        scannedAt: new Date(),
        purpose: 'LOOKUP',
      },
    });

    return this.mapProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.MANUFACTURED_PRODUCT },
    });
    if (!existing) throw new NotFoundException('Product not found');

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
      craftsmanshipFee: dto.craftsmanshipFee ?? undefined,
      quantity: dto.quantity ?? undefined,
      images: dto.images ?? undefined,
      scaleImage: dto.scaleImage ?? undefined,
      workshop: dto.workshopId ? { connect: { id: dto.workshopId } } : undefined,
      productionStatus: dto.productionStatus ?? undefined,
    };

    // If allocations provided, sync inventory and total quantity accordingly
    if (Array.isArray((dto as any).allocations)) {
      const allocations = ((dto as any).allocations as Array<any>)
        .filter((a) => a && a.branchId && a.quantity && a.quantity > 0)
        .map((a) => ({
          branchId: a.branchId,
          quantity: a.quantity as number,
          minimumStock: a.minimumStock ?? (dto.minimumStock ?? 1),
          location: a.location ?? dto.location ?? null,
        }));

      const totalQty = allocations.reduce((s, a) => s + (a.quantity ?? 0), 0);

      await this.prisma.$transaction(async (tx: any) => {
        // Update product fields + quantity from allocations
        await tx.product.update({
          where: { id },
          data: { ...data, quantity: totalQty },
        });

        const existing = await tx.inventory.findMany({ where: { productId: id } });
        const byBranch: Record<string, typeof existing[number] | undefined> = {};
        for (const inv of existing) byBranch[inv.branchId] = inv as any;

        // Upsert allocations
        for (const a of allocations) {
          const found = byBranch[a.branchId];
          if (found) {
            await tx.inventory.update({
              where: { id: (found as any).id },
              data: { quantity: a.quantity, minimumStock: a.minimumStock ?? 1, location: a.location ?? null },
            });
          } else {
            await tx.inventory.create({
              data: {
                productId: id,
                branchId: a.branchId,
                quantity: a.quantity,
                minimumStock: a.minimumStock ?? 1,
                location: a.location ?? null,
              },
            });
          }
        }

        // Remove inventories not present in allocations
        const keepBranchIds = new Set(allocations.map((a) => a.branchId));
        if (existing.length > 0) {
          await tx.inventory.deleteMany({
            where: { productId: id, NOT: { branchId: { in: Array.from(keepBranchIds) } } },
          });
        }
      });
    } else {
      await this.prisma.product.update({
      where: { id },
      data,
      });
    }

    const refreshed = await this.findOne(id);
    return refreshed;
  }

  async updateProductionStatus(id: string, productionStatus: string, notes?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.MANUFACTURED_PRODUCT },
    });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id },
      data: { productionStatus },
    });

    return {
      success: true,
      message: `Production status updated to ${productionStatus}`,
      productId: id,
      productionStatus,
      notes,
    };
  }

  async addStone(
    id: string,
    stone: { stoneType: string; caratWeight: number; quantity: number; price: number; notes?: string },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.MANUFACTURED_PRODUCT },
    });
    if (!product) throw new NotFoundException('Product not found');

    const created = await this.prisma.productStone.create({
      data: {
        productId: id,
        stoneType: stone.stoneType as StoneType,
        caratWeight: stone.caratWeight,
        quantity: stone.quantity,
        price: stone.price,
        notes: stone.notes ?? null,
      },
    });

    return {
      success: true,
      message: 'Stone added to product',
      stone: {
        id: created.id,
        stoneType: created.stoneType,
        caratWeight: this.decimalToNumber(created.caratWeight),
        quantity: created.quantity,
        price: this.decimalToNumber(created.price),
        notes: created.notes,
      },
    };
  }

  async removeStone(productId: string, stoneId: string) {
    const stone = await this.prisma.productStone.findUnique({
      where: { id: stoneId },
    });

    if (!stone || stone.productId !== productId) {
      throw new NotFoundException('Stone not found on this product');
    }

    await this.prisma.productStone.delete({
      where: { id: stoneId },
    });

    return {
      success: true,
      message: 'Stone removed from product',
    };
  }

  async getSummary(branchId?: string) {
    const where: any = {
      category: ProductCategory.MANUFACTURED_PRODUCT,
      status: { not: ProductStatus.RETURNED }, // ⭐ ADD THIS LINE - Exclude soft-deleted
      ...(branchId
        ? {
          inventory: {
            some: { branchId },
          },
        }
        : {}),
    };

    const [totalCount, weightSum, totalValue, byPurity, byStatus, lowStock] = await Promise.all([
      // Total products count
      this.prisma.product.count({ where }),

      // Total weight
      this.prisma.product.aggregate({
        where,
        _sum: { weight: true },
      }),

      // Total value
      this.prisma.product.aggregate({
        where,
        _sum: { purchasePrice: true, sellingPrice: true, craftsmanshipFee: true },
      }),

      // Group by gold purity
      this.prisma.product.groupBy({
        by: ['goldPurity'],
        where,
        _count: { id: true },
        _sum: { weight: true, purchasePrice: true, sellingPrice: true },
      }),

      // Group by status
      this.prisma.product.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),

      // Low stock items
      branchId
        ? this.prisma.inventory.findMany({
          where: {
            branchId,
            product: {
              category: ProductCategory.MANUFACTURED_PRODUCT,
              status: { not: ProductStatus.RETURNED }, // ⭐ ADD THIS TOO
            },
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
                sellingPrice: true,
              },
            },
          },
        })
        : [],
    ]);

    return {
      totalProducts: totalCount,
      totalWeight: this.decimalToNumber(weightSum._sum.weight),
      totalPurchaseValue: this.decimalToNumber(totalValue._sum.purchasePrice),
      totalSellingValue: this.decimalToNumber(totalValue._sum.sellingPrice),
      totalCraftsmanshipFees: this.decimalToNumber(totalValue._sum.craftsmanshipFee),
      byPurity: byPurity.map((p: any) => ({
        goldPurity: p.goldPurity,
        count: p._count.id,
        totalWeight: this.decimalToNumber(p._sum.weight),
        purchaseValue: this.decimalToNumber(p._sum.purchasePrice),
        sellingValue: this.decimalToNumber(p._sum.sellingPrice),
      })),
      byStatus: byStatus.map((s: any) => ({
        status: s.status,
        count: s._count.id,
      })),
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

  async remove(id: string, force = false) {
    const existing = await this.prisma.product.findUnique({
      where: { id, category: ProductCategory.MANUFACTURED_PRODUCT },
    });
    if (!existing) throw new NotFoundException('Product not found');

    // If force delete requested and item already soft-deleted, remove permanently
    if (force && existing.status === ProductStatus.RETURNED) {
      await this.prisma.product.delete({ where: { id } });
      return { success: true, message: 'Product permanently deleted' };
    }

    // Soft delete: mark as returned
    await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.RETURNED },
    });

    return { success: true, message: 'Product marked as returned' };
  }

  // Helpers

  private generateProductSKU(goldPurity?: GoldPurity): string {
    const purityCode = goldPurity
      ? goldPurity.replace('K', '')
      : 'XX';
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `PROD-${purityCode}K-${timestamp}-${rand}`;
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

  private mapProduct(p: any) {
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
      craftsmanshipFee: this.decimalToNumber(p.craftsmanshipFee),
      quantity: p.quantity ?? 1,
      images: Array.isArray(p.images) ? p.images : [],
      scaleImage: p.scaleImage,
      workshopId: p.workshopId,
      workshop: p.workshop ?? undefined,
      productionStatus: p.productionStatus,
      stones: Array.isArray(p.productStones)
        ? p.productStones.map((s: any) => ({
          id: s.id,
          stoneType: s.stoneType,
          caratWeight: this.decimalToNumber(s.caratWeight),
          quantity: s.quantity,
          price: this.decimalToNumber(s.price),
          notes: s.notes,
        }))
        : [],
      inventory: p.inventory ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}