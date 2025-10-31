"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawGoldService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("@zarmind/shared-types");
let RawGoldService = class RawGoldService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const sku = dto.sku ?? this.generateRawGoldSKU(dto.goldPurity);
        const qrCode = dto.qrCode ?? `QR-${sku}`;
        const data = {
            sku,
            qrCode,
            name: dto.name,
            description: dto.description ?? null,
            category: shared_types_1.ProductCategory.RAW_GOLD,
            status: dto.status ?? shared_types_1.ProductStatus.IN_STOCK,
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
    async findAll(params) {
        const { page, limit, search, goldPurity, status, branchId, minWeight, maxWeight, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            category: shared_types_1.ProductCategory.RAW_GOLD,
            ...(goldPurity ? { goldPurity } : {}),
            // Only filter by status if explicitly provided
            ...(status ? { status } : {}),
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
        const items = rows.map((r) => {
            const mapped = this.mapRawGold(r);
            // Add total inventory quantity across all branches or specific branch
            if (Array.isArray(r.inventory) && r.inventory.length > 0) {
                const totalQty = r.inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
                mapped.inventoryQuantity = totalQty;
            }
            return mapped;
        });
        return { items, total, page, limit };
    }
    async findOne(id) {
        const rawGold = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.RAW_GOLD },
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
        if (!rawGold)
            throw new common_1.NotFoundException('Raw gold not found');
        return this.mapRawGold(rawGold);
    }
    async update(id, dto) {
        const existing = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.RAW_GOLD },
        });
        if (!existing)
            throw new common_1.NotFoundException('Raw gold not found');
        const data = {
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
    async adjustWeight(id, adjustment, branchId, notes) {
        const rawGold = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.RAW_GOLD },
            select: { id: true, weight: true, name: true, goldPurity: true },
        });
        if (!rawGold)
            throw new common_1.NotFoundException('Raw gold not found');
        const currentWeight = this.decimalToNumber(rawGold.weight);
        const newWeight = currentWeight + adjustment;
        if (newWeight < 0) {
            throw new common_1.BadRequestException('Adjustment would result in negative weight');
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
    async transferToWorkshop(id, workshopId, weight, notes) {
        const rawGold = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.RAW_GOLD },
            select: { id: true, weight: true, goldPurity: true, name: true },
        });
        if (!rawGold)
            throw new common_1.NotFoundException('Raw gold not found');
        const workshop = await this.prisma.workshop.findUnique({
            where: { id: workshopId },
            select: { id: true, name: true },
        });
        if (!workshop)
            throw new common_1.BadRequestException('Workshop not found');
        const currentWeight = this.decimalToNumber(rawGold.weight);
        if (weight > currentWeight) {
            throw new common_1.BadRequestException('Transfer weight exceeds available weight');
        }
        if (weight <= 0) {
            throw new common_1.BadRequestException('Transfer weight must be positive');
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
    async getSummary(branchId) {
        const where = {
            category: shared_types_1.ProductCategory.RAW_GOLD,
            status: shared_types_1.ProductStatus.IN_STOCK, // ⭐ Only count items in stock
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
        const purityMap = new Map();
        for (const product of products) {
            // Get total quantity from all branches or specific branch
            const inventoryQty = Array.isArray(product.inventory)
                ? product.inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
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
            const purityData = purityMap.get(purity);
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
                    product: { category: shared_types_1.ProductCategory.RAW_GOLD },
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
            lowStock: lowStock.map((inv) => ({
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
    async getValuation(branchId) {
        const where = {
            category: shared_types_1.ProductCategory.RAW_GOLD,
            status: shared_types_1.ProductStatus.IN_STOCK,
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
        const priceMap = new Map(goldPrices.map((gp) => [gp.purity, this.decimalToNumber(gp.pricePerGram)]));
        // Get all raw gold by purity
        const rawGoldByPurity = await this.prisma.product.groupBy({
            by: ['goldPurity'],
            where,
            _sum: { weight: true },
        });
        const valuation = rawGoldByPurity.map((rg) => {
            const weight = this.decimalToNumber(rg._sum.weight);
            const pricePerGram = priceMap.get(rg.goldPurity) ?? 0;
            const value = weight * pricePerGram;
            return {
                goldPurity: rg.goldPurity,
                weight,
                pricePerGram,
                currentValue: value,
            };
        });
        const totalValue = valuation.reduce((sum, v) => sum + v.currentValue, 0);
        return {
            valuation,
            totalValue,
            pricesAsOf: goldPrices[0]?.effectiveDate ?? new Date(),
        };
    }
    async remove(id) {
        const existing = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.RAW_GOLD },
            select: { id: true, status: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Raw gold not found');
        // If already returned, perform hard delete
        if (existing.status === shared_types_1.ProductStatus.RETURNED) {
            // Delete related inventory records first
            await this.prisma.inventory.deleteMany({
                where: { productId: id },
            });
            // Then delete the product
            await this.prisma.product.delete({
                where: { id },
            });
            return { success: true, message: 'Raw gold permanently deleted' };
        }
        // Soft delete: mark as returned (first step)
        await this.prisma.product.update({
            where: { id },
            data: { status: shared_types_1.ProductStatus.RETURNED },
        });
        return { success: true, message: 'Raw gold marked as returned' };
    }
    // Helpers
    generateRawGoldSKU(goldPurity) {
        const purityCode = goldPurity.replace('K', '');
        const timestamp = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `RG-${purityCode}K-${timestamp}-${rand}`;
    }
    decimalToNumber(value) {
        if (value == null)
            return 0;
        if (typeof value === 'number')
            return value;
        if (typeof value.toNumber === 'function') {
            try {
                return value.toNumber();
            }
            catch {
                // ignore
            }
        }
        const n = Number(value);
        return isNaN(n) ? 0 : n;
    }
    mapRawGold(p) {
        // Calculate total inventory quantity if inventory is included
        let totalInventoryQty = 0;
        if (Array.isArray(p.inventory) && p.inventory.length > 0) {
            totalInventoryQty = p.inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
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
};
exports.RawGoldService = RawGoldService;
exports.RawGoldService = RawGoldService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RawGoldService);
//# sourceMappingURL=raw-gold.service.js.map