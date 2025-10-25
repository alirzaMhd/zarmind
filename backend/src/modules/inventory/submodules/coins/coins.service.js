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
exports.CoinsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
let CoinsService = class CoinsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const sku = dto.sku ?? this.generateCoinSKU(dto.coinType, dto.coinYear);
        const qrCode = dto.qrCode ?? `QR-${sku}`;
        const data = {
            sku,
            qrCode,
            name: dto.name,
            description: dto.description ?? null,
            category: shared_types_1.ProductCategory.COIN,
            status: dto.status ?? shared_types_1.ProductStatus.IN_STOCK,
            weight: dto.weight ?? undefined,
            purchasePrice: dto.purchasePrice ?? undefined,
            sellingPrice: dto.sellingPrice ?? undefined,
            coinType: dto.coinType,
            coinYear: dto.coinYear ?? null,
            quantity: dto.quantity ?? 1,
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
                    minimumStock: dto.minimumStock ?? 10,
                    location: dto.location ?? null,
                },
            });
        }
        return this.mapCoin(created);
    }
    async findAll(params) {
        const { page, limit, search, coinType, status, branchId, coinYear, minQuantity, maxQuantity, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            category: shared_types_1.ProductCategory.COIN,
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
        const items = rows.map((r) => this.mapCoin(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const coin = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.COIN },
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
        if (!coin)
            throw new common_1.NotFoundException('Coin not found');
        return this.mapCoin(coin);
    }
    async update(id, dto) {
        const existing = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.COIN },
        });
        if (!existing)
            throw new common_1.NotFoundException('Coin not found');
        const data = {
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
    async adjustQuantity(id, adjustment, branchId, notes) {
        const coin = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.COIN },
            select: { id: true, quantity: true },
        });
        if (!coin)
            throw new common_1.NotFoundException('Coin not found');
        const currentQty = coin.quantity ?? 0;
        const newQty = currentQty + adjustment;
        if (newQty < 0) {
            throw new common_1.BadRequestException('Adjustment would result in negative quantity');
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
                    throw new common_1.BadRequestException('Adjustment would result in negative branch inventory');
                }
                await this.prisma.inventory.update({
                    where: { id: inventory.id },
                    data: { quantity: newInvQty },
                });
            }
            else if (adjustment > 0) {
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
    async getSummary(branchId) {
        const where = {
            category: shared_types_1.ProductCategory.COIN,
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
                        product: { category: shared_types_1.ProductCategory.COIN },
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
            byType: byType.map((t) => ({
                coinType: t.coinType,
                count: t._count,
                quantity: t._sum.quantity ?? 0,
                purchaseValue: this.decimalToNumber(t._sum.purchasePrice),
                sellingValue: this.decimalToNumber(t._sum.sellingPrice),
            })),
            lowStock: lowStock.map((inv) => ({
                productId: inv.product?.id,
                sku: inv.product?.sku,
                name: inv.product?.name,
                coinType: inv.product?.coinType,
                currentQuantity: inv.quantity,
                minimumStock: inv.minimumStock,
            })),
        };
    }
    async remove(id) {
        const existing = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.COIN },
        });
        if (!existing)
            throw new common_1.NotFoundException('Coin not found');
        // Soft delete: mark as inactive
        await this.prisma.product.update({
            where: { id },
            data: { status: shared_types_1.ProductStatus.RETURNED }, // or create a DELETED status
        });
        return { success: true, message: 'Coin marked as inactive' };
    }
    // Helpers
    generateCoinSKU(coinType, year) {
        const now = new Date();
        const y = year ?? now.getFullYear();
        const typeCode = coinType ? this.coinTypeCode(coinType) : 'COIN';
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        return `${typeCode}-${y}-${timestamp}-${rand}`;
    }
    coinTypeCode(type) {
        const map = {
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
    mapCoin(p) {
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
            quantity: p.quantity ?? 0,
            images: Array.isArray(p.images) ? p.images : [],
            inventory: p.inventory ?? undefined,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
};
exports.CoinsService = CoinsService;
exports.CoinsService = CoinsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoinsService);
//# sourceMappingURL=coins.service.js.map