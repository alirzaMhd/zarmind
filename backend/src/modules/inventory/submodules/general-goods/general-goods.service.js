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
exports.GeneralGoodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
let GeneralGoodsService = class GeneralGoodsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const sku = dto.sku ?? this.generateGeneralGoodsSKU(dto.brand, dto.model);
        const qrCode = dto.qrCode ?? `QR-${sku}`;
        const data = {
            sku,
            qrCode,
            name: dto.name,
            description: dto.description ?? null,
            category: shared_types_1.ProductCategory.GENERAL_GOODS,
            status: dto.status ?? shared_types_1.ProductStatus.IN_STOCK,
            weight: dto.weight ?? undefined,
            purchasePrice: dto.purchasePrice ?? undefined,
            sellingPrice: dto.sellingPrice ?? undefined,
            brand: dto.brand ?? null,
            model: dto.model ?? null,
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
                    minimumStock: dto.minimumStock ?? 1,
                    location: dto.location ?? null,
                },
            });
        }
        return this.mapGeneralGoods(created);
    }
    async findAll(params) {
        const { page, limit, search, brand, status, branchId, minQuantity, maxQuantity, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            category: shared_types_1.ProductCategory.GENERAL_GOODS,
            ...(brand ? { brand: { contains: brand, mode: 'insensitive' } } : {}),
            ...(status ? { status } : {}),
            ...(minQuantity !== undefined || maxQuantity !== undefined
                ? {
                    quantity: {
                        gte: minQuantity,
                        lte: maxQuantity,
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
                        { brand: { contains: search, mode: 'insensitive' } },
                        { model: { contains: search, mode: 'insensitive' } },
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
        const items = rows.map((r) => this.mapGeneralGoods(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const goods = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.GENERAL_GOODS },
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
        if (!goods)
            throw new common_1.NotFoundException('General goods item not found');
        return this.mapGeneralGoods(goods);
    }
    async update(id, dto) {
        const existing = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.GENERAL_GOODS },
        });
        if (!existing)
            throw new common_1.NotFoundException('General goods item not found');
        const data = {
            sku: dto.sku ?? undefined,
            qrCode: dto.qrCode ?? undefined,
            name: dto.name ?? undefined,
            description: dto.description ?? undefined,
            status: dto.status ?? undefined,
            weight: dto.weight ?? undefined,
            purchasePrice: dto.purchasePrice ?? undefined,
            sellingPrice: dto.sellingPrice ?? undefined,
            brand: dto.brand ?? undefined,
            model: dto.model ?? undefined,
            quantity: dto.quantity ?? undefined,
            images: dto.images ?? undefined,
        };
        const updated = await this.prisma.product.update({
            where: { id },
            data,
        });
        return this.mapGeneralGoods(updated);
    }
    async adjustQuantity(id, adjustment, branchId, notes) {
        const goods = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.GENERAL_GOODS },
            select: { id: true, quantity: true, name: true },
        });
        if (!goods)
            throw new common_1.NotFoundException('General goods item not found');
        const currentQty = goods.quantity ?? 0;
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
                        minimumStock: 1,
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
            category: shared_types_1.ProductCategory.GENERAL_GOODS,
            ...(branchId
                ? {
                    inventory: {
                        some: { branchId },
                    },
                }
                : {}),
        };
        const [totalItems, totalValue, byBrand, lowStock] = await Promise.all([
            // Total items count
            this.prisma.product.aggregate({
                where,
                _sum: { quantity: true },
                _count: true,
            }),
            // Total value (purchase + selling)
            this.prisma.product.aggregate({
                where,
                _sum: { purchasePrice: true, sellingPrice: true },
            }),
            // Group by brand
            this.prisma.product.groupBy({
                by: ['brand'],
                where,
                _sum: { quantity: true, purchasePrice: true, sellingPrice: true },
                _count: true,
            }),
            // Low stock items
            branchId
                ? this.prisma.inventory.findMany({
                    where: {
                        branchId,
                        product: { category: shared_types_1.ProductCategory.GENERAL_GOODS },
                        quantity: { lte: this.prisma.inventory.fields.minimumStock },
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                brand: true,
                                model: true,
                                quantity: true,
                            },
                        },
                    },
                })
                : [],
        ]);
        return {
            totalProducts: totalItems._count,
            totalQuantity: totalItems._sum.quantity ?? 0,
            totalPurchaseValue: this.decimalToNumber(totalValue._sum.purchasePrice),
            totalSellingValue: this.decimalToNumber(totalValue._sum.sellingPrice),
            byBrand: byBrand.map((b) => ({
                brand: b.brand ?? 'Unknown',
                count: b._count,
                quantity: b._sum.quantity ?? 0,
                purchaseValue: this.decimalToNumber(b._sum.purchasePrice),
                sellingValue: this.decimalToNumber(b._sum.sellingPrice),
            })),
            lowStock: lowStock.map((inv) => ({
                productId: inv.product?.id,
                sku: inv.product?.sku,
                name: inv.product?.name,
                brand: inv.product?.brand,
                model: inv.product?.model,
                currentQuantity: inv.quantity,
                minimumStock: inv.minimumStock,
            })),
        };
    }
    async getBrands() {
        const brands = await this.prisma.product.findMany({
            where: {
                category: shared_types_1.ProductCategory.GENERAL_GOODS,
                brand: { not: null },
            },
            select: { brand: true },
            distinct: ['brand'],
            orderBy: { brand: 'asc' },
        });
        return brands.map((b) => b.brand).filter(Boolean);
    }
    async remove(id) {
        const existing = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.GENERAL_GOODS },
        });
        if (!existing)
            throw new common_1.NotFoundException('General goods item not found');
        // Soft delete: mark as inactive
        await this.prisma.product.update({
            where: { id },
            data: { status: shared_types_1.ProductStatus.RETURNED },
        });
        return { success: true, message: 'General goods item marked as inactive' };
    }
    // Helpers
    generateGeneralGoodsSKU(brand, model) {
        const brandCode = brand
            ? brand
                .slice(0, 3)
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
            : 'GEN';
        const modelCode = model
            ? model
                .slice(0, 3)
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
            : '';
        const timestamp = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `GG-${brandCode}${modelCode ? '-' + modelCode : ''}-${timestamp}-${rand}`;
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
    mapGeneralGoods(p) {
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
            brand: p.brand,
            model: p.model,
            quantity: p.quantity ?? 0,
            images: Array.isArray(p.images) ? p.images : [],
            inventory: p.inventory ?? undefined,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
};
exports.GeneralGoodsService = GeneralGoodsService;
exports.GeneralGoodsService = GeneralGoodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GeneralGoodsService);
//# sourceMappingURL=general-goods.service.js.map