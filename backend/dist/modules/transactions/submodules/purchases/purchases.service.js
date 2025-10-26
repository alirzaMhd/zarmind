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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("@zarmind/shared-types");
let PurchasesService = class PurchasesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const purchaseNumber = dto.purchaseNumber ?? this.generatePurchaseNumber();
        // Verify supplier exists if provided
        if (dto.supplierId) {
            const supplier = await this.prisma.supplier.findUnique({
                where: { id: dto.supplierId },
                select: { id: true },
            });
            if (!supplier)
                throw new common_1.BadRequestException('Supplier not found');
        }
        // Verify branch exists
        const branch = await this.prisma.branch.findUnique({
            where: { id: dto.branchId },
            select: { id: true },
        });
        if (!branch)
            throw new common_1.BadRequestException('Branch not found');
        // Verify user exists
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
            select: { id: true },
        });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        // Calculate or use provided totals
        let subtotal;
        let totalAmount;
        if (dto.items && dto.items.length > 0) {
            // Calculate from items if items exist
            subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        }
        else {
            // Use provided subtotal or 0
            subtotal = dto.subtotal ?? 0;
        }
        const taxAmount = dto.taxAmount ?? 0;
        // Use provided totalAmount or calculate it
        if (dto.totalAmount !== undefined) {
            totalAmount = dto.totalAmount;
        }
        else {
            totalAmount = subtotal + taxAmount;
        }
        const paidAmount = dto.paidAmount ?? 0;
        // Determine status
        let status = shared_types_1.PurchaseStatus.PENDING;
        if (dto.status) {
            status = dto.status;
        }
        else if (paidAmount >= totalAmount) {
            status = shared_types_1.PurchaseStatus.COMPLETED;
        }
        const created = await this.prisma.purchase.create({
            data: {
                purchaseNumber,
                purchaseDate: new Date(dto.purchaseDate),
                status,
                supplier: dto.supplierId ? { connect: { id: dto.supplierId } } : undefined,
                user: { connect: { id: dto.userId } },
                branch: { connect: { id: dto.branchId } },
                subtotal,
                taxAmount,
                totalAmount,
                paidAmount,
                paymentMethod: dto.paymentMethod,
                deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
                notes: dto.notes ?? null,
                items: {
                    create: dto.items.map((item) => ({
                        product: { connect: { id: item.productId } },
                        quantity: item.quantity,
                        weight: item.weight ?? null,
                        unitPrice: item.unitPrice,
                        subtotal: item.quantity * item.unitPrice,
                        receivedQuantity: 0,
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
                            },
                        },
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
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
        // If purchase is completed, update inventory
        if (status === shared_types_1.PurchaseStatus.COMPLETED) {
            await this.updateInventoryForPurchase(created.id, dto.branchId);
        }
        return this.mapPurchase(created);
    }
    async findAll(params) {
        const { page, limit, search, status, supplierId, branchId, userId, from, to, minAmount, maxAmount, sortBy = 'purchaseDate', sortOrder = 'desc', } = params;
        const where = {
            ...(status ? { status } : {}),
            ...(supplierId ? { supplierId } : {}),
            ...(branchId ? { branchId } : {}),
            ...(userId ? { userId } : {}),
            ...(from || to
                ? {
                    purchaseDate: {
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
                        { purchaseNumber: { contains: search, mode: 'insensitive' } },
                        { notes: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.purchase.count({ where }),
            this.prisma.purchase.findMany({
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
                    supplier: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
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
        const items = rows.map((r) => this.mapPurchase(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
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
                                weight: true,
                            },
                        },
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        contactPerson: true,
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
                    },
                },
            },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        return this.mapPurchase(purchase);
    }
    async update(id, dto) {
        const existing = await this.prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Purchase not found');
        // Calculate or use provided totals
        let subtotal;
        let totalAmount;
        if (dto.items && dto.items.length > 0) {
            // Recalculate from items if items are updated
            subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        }
        else if (dto.subtotal !== undefined) {
            // Use provided subtotal
            subtotal = dto.subtotal;
        }
        else {
            // Keep existing subtotal
            subtotal = this.decimalToNumber(existing.subtotal);
        }
        const taxAmount = dto.taxAmount !== undefined
            ? dto.taxAmount
            : this.decimalToNumber(existing.taxAmount);
        if (dto.totalAmount !== undefined) {
            // Use provided totalAmount
            totalAmount = dto.totalAmount;
        }
        else {
            // Calculate totalAmount
            totalAmount = subtotal + taxAmount;
        }
        const data = {
            purchaseNumber: dto.purchaseNumber ?? undefined,
            purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
            status: dto.status ?? undefined,
            supplier: dto.supplierId ? { connect: { id: dto.supplierId } } : undefined,
            subtotal,
            taxAmount,
            totalAmount,
            paidAmount: dto.paidAmount ?? undefined,
            paymentMethod: dto.paymentMethod ?? undefined,
            deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
            notes: dto.notes ?? undefined,
        };
        // Remove undefined values
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        const updated = await this.prisma.purchase.update({
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
                supplier: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });
        return this.mapPurchase(updated);
    }
    async receiveItems(id, items) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.status === shared_types_1.PurchaseStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot receive items for cancelled purchase');
        }
        // Update each item's received quantity
        for (const item of items) {
            const purchaseItem = purchase.items.find((i) => i.id === item.itemId);
            if (!purchaseItem) {
                throw new common_1.BadRequestException(`Purchase item ${item.itemId} not found`);
            }
            if (item.receivedQuantity > purchaseItem.quantity) {
                throw new common_1.BadRequestException('Received quantity cannot exceed ordered quantity');
            }
            await this.prisma.purchaseItem.update({
                where: { id: item.itemId },
                data: { receivedQuantity: item.receivedQuantity },
            });
            // Update inventory if items are received
            if (item.receivedQuantity > 0) {
                await this.updateInventoryForItem(purchaseItem.productId, purchase.branchId, item.receivedQuantity);
            }
        }
        // Check if all items are fully received
        const updatedPurchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });
        const allReceived = updatedPurchase.items.every((item) => (item.receivedQuantity ?? 0) >= item.quantity);
        const partiallyReceived = updatedPurchase.items.some((item) => (item.receivedQuantity ?? 0) > 0);
        // Fix: Explicitly type newStatus as PurchaseStatus
        let newStatus = purchase.status;
        if (allReceived) {
            newStatus = shared_types_1.PurchaseStatus.COMPLETED;
        }
        else if (partiallyReceived) {
            newStatus = shared_types_1.PurchaseStatus.PARTIALLY_RECEIVED;
        }
        await this.prisma.purchase.update({
            where: { id },
            data: { status: newStatus },
        });
        return {
            success: true,
            message: 'Items received successfully',
            purchaseId: id,
            status: newStatus,
        };
    }
    async completePurchase(id, notes) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.status === shared_types_1.PurchaseStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot complete cancelled purchase');
        }
        // Mark all items as received - update each item individually
        for (const item of purchase.items) {
            await this.prisma.purchaseItem.update({
                where: { id: item.id },
                data: { receivedQuantity: item.quantity },
            });
        }
        // Update inventory for all items
        await this.updateInventoryForPurchase(id, purchase.branchId);
        // Update purchase status
        const updated = await this.prisma.purchase.update({
            where: { id },
            data: {
                status: shared_types_1.PurchaseStatus.COMPLETED,
                notes: notes ? `${purchase.notes ?? ''}\n${notes}`.trim() : purchase.notes,
            },
        });
        return {
            success: true,
            message: 'Purchase completed successfully',
            purchaseId: id,
            purchaseNumber: updated.purchaseNumber,
        };
    }
    async cancelPurchase(id, reason, notes) {
        const purchase = await this.prisma.purchase.findUnique({ where: { id } });
        if (!purchase)
            throw new common_1.NotFoundException('Purchase not found');
        if (purchase.status === shared_types_1.PurchaseStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel completed purchase');
        }
        const updated = await this.prisma.purchase.update({
            where: { id },
            data: {
                status: shared_types_1.PurchaseStatus.CANCELLED,
                notes: `${purchase.notes ?? ''}\nCANCELLED: ${reason}\n${notes ?? ''}`.trim(),
            },
        });
        return {
            success: true,
            message: 'Purchase cancelled',
            purchaseId: id,
            reason,
        };
    }
    async getSummary(from, to, branchId) {
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const where = {
            purchaseDate: { gte: fromDate, lte: toDate },
            ...(branchId ? { branchId } : {}),
        };
        const [total, byStatus, topSuppliers] = await Promise.all([
            this.prisma.purchase.aggregate({
                where,
                _count: true,
                _sum: { totalAmount: true, paidAmount: true },
            }),
            this.prisma.purchase.groupBy({
                by: ['status'],
                where,
                _count: true,
                _sum: { totalAmount: true },
            }),
            this.prisma.purchase.groupBy({
                by: ['supplierId'],
                where: { ...where, supplierId: { not: null } },
                _count: true,
                _sum: { totalAmount: true },
                orderBy: { _sum: { totalAmount: 'desc' } },
                take: 5,
            }),
        ]);
        return {
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totalPurchases: total._count,
            totalAmount: this.decimalToNumber(total._sum.totalAmount),
            totalPaid: this.decimalToNumber(total._sum.paidAmount),
            outstandingAmount: this.decimalToNumber(total._sum.totalAmount) - this.decimalToNumber(total._sum.paidAmount),
            byStatus: byStatus.map((s) => ({
                status: s.status,
                count: s._count,
                totalAmount: this.decimalToNumber(s._sum.totalAmount),
            })),
            topSuppliers: topSuppliers.map((s) => ({
                supplierId: s.supplierId,
                purchaseCount: s._count,
                totalAmount: this.decimalToNumber(s._sum.totalAmount),
            })),
        };
    }
    async remove(id) {
        const existing = await this.prisma.purchase.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Purchase not found');
        if (existing.status === shared_types_1.PurchaseStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot delete completed purchase. Cancel it first.');
        }
        await this.prisma.purchase.delete({ where: { id } });
        return { success: true, message: 'Purchase deleted' };
    }
    // Helper methods
    async updateInventoryForPurchase(purchaseId, branchId) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { items: true },
        });
        if (!purchase)
            return;
        for (const item of purchase.items) {
            await this.updateInventoryForItem(item.productId, branchId, item.quantity);
        }
    }
    async updateInventoryForItem(productId, branchId, quantity) {
        const inventory = await this.prisma.inventory.findUnique({
            where: { productId_branchId: { productId, branchId } },
        });
        if (inventory) {
            await this.prisma.inventory.update({
                where: { id: inventory.id },
                data: { quantity: (inventory.quantity ?? 0) + quantity },
            });
        }
        else {
            await this.prisma.inventory.create({
                data: {
                    productId,
                    branchId,
                    quantity,
                    minimumStock: 1,
                },
            });
        }
        // Also update product quantity
        await this.prisma.product.update({
            where: { id: productId },
            data: { quantity: { increment: quantity } },
        });
    }
    generatePurchaseNumber() {
        const now = new Date();
        const y = String(now.getFullYear());
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const t = Date.now().toString(36).toUpperCase();
        return `PUR-${y}${m}${d}-${t}`;
    }
    parseDateRange(from, to) {
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
        const toDate = to ? new Date(to) : new Date();
        toDate.setHours(23, 59, 59, 999);
        return { fromDate, toDate };
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
    mapPurchase(p) {
        return {
            id: p.id,
            purchaseNumber: p.purchaseNumber,
            purchaseDate: p.purchaseDate,
            status: p.status,
            supplierId: p.supplierId,
            supplier: p.supplier ?? undefined,
            userId: p.userId,
            user: p.user ?? undefined,
            branchId: p.branchId,
            branch: p.branch ?? undefined,
            subtotal: this.decimalToNumber(p.subtotal),
            taxAmount: this.decimalToNumber(p.taxAmount),
            totalAmount: this.decimalToNumber(p.totalAmount),
            paidAmount: this.decimalToNumber(p.paidAmount),
            paymentMethod: p.paymentMethod,
            deliveryDate: p.deliveryDate,
            notes: p.notes,
            items: Array.isArray(p.items)
                ? p.items.map((i) => ({
                    id: i.id,
                    productId: i.productId,
                    product: i.product ?? undefined,
                    quantity: i.quantity,
                    weight: this.decimalToNumber(i.weight),
                    unitPrice: this.decimalToNumber(i.unitPrice),
                    subtotal: this.decimalToNumber(i.subtotal),
                    receivedQuantity: i.receivedQuantity ?? 0,
                }))
                : [],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map