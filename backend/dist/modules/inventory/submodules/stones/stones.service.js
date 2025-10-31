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
exports.StonesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("@zarmind/shared-types");
let StonesService = class StonesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const sku = dto.sku ?? this.generateStoneSKU(dto.stoneType);
        const qrCode = dto.qrCode ?? `QR-${sku}`;
        // Check if certificate number already exists (if provided)
        if (dto.certificateNumber) {
            const existing = await this.prisma.product.findFirst({
                where: {
                    category: shared_types_1.ProductCategory.STONE,
                    certificateNumber: dto.certificateNumber,
                },
            });
            if (existing) {
                throw new common_1.BadRequestException('A stone with this certificate number already exists');
            }
        }
        const data = {
            sku,
            qrCode,
            name: dto.name,
            description: dto.description ?? null,
            category: shared_types_1.ProductCategory.STONE,
            status: dto.status ?? shared_types_1.ProductStatus.IN_STOCK,
            purchasePrice: dto.purchasePrice ?? undefined,
            sellingPrice: dto.sellingPrice ?? undefined,
            stoneType: dto.stoneType,
            caratWeight: dto.caratWeight,
            stoneQuality: dto.stoneQuality ?? null,
            certificateNumber: dto.certificateNumber ?? null,
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
                    minimumStock: dto.minimumStock ?? 5,
                    location: dto.location ?? null,
                },
            });
        }
        return this.mapStone(created);
    }
    async findAll(params) {
        const { page, limit, search, stoneType, status, branchId, minCaratWeight, maxCaratWeight, minPrice, maxPrice, quality, hasCertificate, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            category: shared_types_1.ProductCategory.STONE,
            ...(stoneType ? { stoneType } : {}),
            ...(status ? { status } : {}),
            ...(quality ? { stoneQuality: { contains: quality, mode: 'insensitive' } } : {}),
            ...(hasCertificate !== undefined
                ? hasCertificate
                    ? { certificateNumber: { not: null } }
                    : { certificateNumber: null }
                : {}),
            ...(minCaratWeight !== undefined || maxCaratWeight !== undefined
                ? {
                    caratWeight: {
                        gte: minCaratWeight,
                        lte: maxCaratWeight,
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
                        { certificateNumber: { contains: search, mode: 'insensitive' } },
                        { stoneQuality: { contains: search, mode: 'insensitive' } },
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
        const items = rows.map((r) => this.mapStone(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const stone = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.STONE },
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
        if (!stone)
            throw new common_1.NotFoundException('Stone not found');
        return this.mapStone(stone);
    }
    async findByCertificate(certificateNumber) {
        const stone = await this.prisma.product.findFirst({
            where: {
                category: shared_types_1.ProductCategory.STONE,
                certificateNumber: certificateNumber,
            },
            include: {
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
        if (!stone)
            throw new common_1.NotFoundException('Stone not found with this certificate number');
        return this.mapStone(stone);
    }
    async update(id, dto) {
        const existing = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.STONE },
        });
        if (!existing)
            throw new common_1.NotFoundException('Stone not found');
        // Check if certificate number is being changed and already exists
        if (dto.certificateNumber && dto.certificateNumber !== existing.certificateNumber) {
            const duplicate = await this.prisma.product.findFirst({
                where: {
                    category: shared_types_1.ProductCategory.STONE,
                    certificateNumber: dto.certificateNumber,
                    id: { not: id },
                },
            });
            if (duplicate) {
                throw new common_1.BadRequestException('A stone with this certificate number already exists');
            }
        }
        const data = {
            sku: dto.sku ?? undefined,
            qrCode: dto.qrCode ?? undefined,
            name: dto.name ?? undefined,
            description: dto.description ?? undefined,
            status: dto.status ?? undefined,
            purchasePrice: dto.purchasePrice ?? undefined,
            sellingPrice: dto.sellingPrice ?? undefined,
            stoneType: dto.stoneType ?? undefined,
            caratWeight: dto.caratWeight ?? undefined,
            stoneQuality: dto.stoneQuality ?? undefined,
            certificateNumber: dto.certificateNumber ?? undefined,
            quantity: dto.quantity ?? undefined,
            images: dto.images ?? undefined,
        };
        const updated = await this.prisma.product.update({
            where: { id },
            data,
        });
        return this.mapStone(updated);
    }
    async adjustQuantity(id, adjustment, branchId, notes) {
        const stone = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.STONE },
            select: { id: true, quantity: true, name: true, stoneType: true },
        });
        if (!stone)
            throw new common_1.NotFoundException('Stone not found');
        const currentQty = stone.quantity ?? 0;
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
                        minimumStock: 5,
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
            category: shared_types_1.ProductCategory.STONE,
            status: { not: shared_types_1.ProductStatus.RETURNED }, // ⭐ ADD THIS LINE - Exclude soft-deleted
            ...(branchId
                ? {
                    inventory: {
                        some: { branchId },
                    },
                }
                : {}),
        };
        const [totalStones, totalValue, byType, byQuality, certified, lowStock] = await Promise.all([
            // Total stones count
            this.prisma.product.aggregate({
                where,
                _sum: { quantity: true, caratWeight: true },
                _count: true,
            }),
            // Total value (purchase + selling)
            this.prisma.product.aggregate({
                where,
                _sum: { purchasePrice: true, sellingPrice: true },
            }),
            // Group by stone type
            this.prisma.product.groupBy({
                by: ['stoneType'],
                where,
                _sum: { quantity: true, caratWeight: true, purchasePrice: true, sellingPrice: true },
                _count: true,
            }),
            // Group by quality
            this.prisma.product.groupBy({
                by: ['stoneQuality'],
                where: { ...where, stoneQuality: { not: null } },
                _count: true,
                _sum: { quantity: true, caratWeight: true },
            }),
            // Certified stones count
            this.prisma.product.count({
                where: { ...where, certificateNumber: { not: null } },
            }),
            // Low stock items
            branchId
                ? this.prisma.inventory.findMany({
                    where: {
                        branchId,
                        product: {
                            category: shared_types_1.ProductCategory.STONE,
                            status: { not: shared_types_1.ProductStatus.RETURNED }, // ⭐ ADD THIS TOO
                        },
                        quantity: { lte: this.prisma.inventory.fields.minimumStock },
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                sku: true,
                                name: true,
                                stoneType: true,
                                caratWeight: true,
                                certificateNumber: true,
                                quantity: true,
                            },
                        },
                    },
                })
                : [],
        ]);
        return {
            totalStones: totalStones._count,
            totalQuantity: totalStones._sum.quantity ?? 0,
            totalCaratWeight: this.decimalToNumber(totalStones._sum.caratWeight),
            totalPurchaseValue: this.decimalToNumber(totalValue._sum.purchasePrice),
            totalSellingValue: this.decimalToNumber(totalValue._sum.sellingPrice),
            certifiedStones: certified,
            byType: byType.map((t) => ({
                stoneType: t.stoneType,
                count: t._count,
                quantity: t._sum.quantity ?? 0,
                totalCaratWeight: this.decimalToNumber(t._sum.caratWeight),
                purchaseValue: this.decimalToNumber(t._sum.purchasePrice),
                sellingValue: this.decimalToNumber(t._sum.sellingPrice),
            })),
            byQuality: byQuality.map((q) => ({
                quality: q.stoneQuality,
                count: q._count,
                quantity: q._sum.quantity ?? 0,
                totalCaratWeight: this.decimalToNumber(q._sum.caratWeight),
            })),
            lowStock: lowStock.map((inv) => ({
                productId: inv.product?.id,
                sku: inv.product?.sku,
                name: inv.product?.name,
                stoneType: inv.product?.stoneType,
                caratWeight: this.decimalToNumber(inv.product?.caratWeight),
                certificateNumber: inv.product?.certificateNumber,
                currentQuantity: inv.quantity,
                minimumStock: inv.minimumStock,
            })),
        };
    }
    async remove(id) {
        const existing = await this.prisma.product.findUnique({
            where: { id, category: shared_types_1.ProductCategory.STONE },
            select: { id: true, status: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Stone not found');
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
            return { success: true, message: 'Stone permanently deleted' };
        }
        // Soft delete: mark as returned (first step)
        await this.prisma.product.update({
            where: { id },
            data: { status: shared_types_1.ProductStatus.RETURNED },
        });
        return { success: true, message: 'Stone marked as returned' };
    }
    // Helpers
    generateStoneSKU(stoneType) {
        const typeCode = this.stoneTypeCode(stoneType);
        const timestamp = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `STONE-${typeCode}-${timestamp}-${rand}`;
    }
    stoneTypeCode(type) {
        const map = {
            DIAMOND: 'DIA',
            RUBY: 'RUB',
            EMERALD: 'EME',
            SAPPHIRE: 'SAP',
            PEARL: 'PRL',
            TURQUOISE: 'TUR',
            OTHER: 'OTH',
        };
        return map[type] ?? 'STONE';
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
    mapStone(p) {
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
            stoneType: p.stoneType,
            caratWeight: this.decimalToNumber(p.caratWeight),
            stoneQuality: p.stoneQuality,
            certificateNumber: p.certificateNumber,
            quantity: p.quantity ?? 0,
            images: Array.isArray(p.images) ? p.images : [],
            inventory: p.inventory ?? undefined,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
};
exports.StonesService = StonesService;
exports.StonesService = StonesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StonesService);
//# sourceMappingURL=stones.service.js.map