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
exports.ReturnsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
let ReturnsService = class ReturnsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, createdByUserId) {
        const returnNumber = dto.returnNumber ?? this.generateReturnNumber(dto.type);
        // Verify original transaction exists
        if (dto.type === shared_types_1.ReturnType.CUSTOMER_RETURN) {
            if (!dto.originalSaleId) {
                throw new common_1.BadRequestException('originalSaleId is required for customer returns');
            }
            const sale = await this.prisma.sale.findUnique({
                where: { id: dto.originalSaleId },
                include: { customer: true },
            });
            if (!sale)
                throw new common_1.NotFoundException('Original sale not found');
            if (sale.status === shared_types_1.SaleStatus.CANCELLED) {
                throw new common_1.BadRequestException('Cannot return items from cancelled sale');
            }
            // Auto-set customerId from sale if not provided
            if (!dto.customerId && sale.customerId) {
                dto.customerId = sale.customerId;
            }
        }
        else if (dto.type === shared_types_1.ReturnType.SUPPLIER_RETURN) {
            if (!dto.originalPurchaseId) {
                throw new common_1.BadRequestException('originalPurchaseId is required for supplier returns');
            }
            const purchase = await this.prisma.purchase.findUnique({
                where: { id: dto.originalPurchaseId },
                include: { supplier: true },
            });
            if (!purchase)
                throw new common_1.NotFoundException('Original purchase not found');
            if (purchase.status === shared_types_1.PurchaseStatus.CANCELLED) {
                throw new common_1.BadRequestException('Cannot return items from cancelled purchase');
            }
            // Auto-set supplierId from purchase if not provided
            if (!dto.supplierId && purchase.supplierId) {
                dto.supplierId = purchase.supplierId;
            }
        }
        const data = {
            returnNumber,
            returnDate: new Date(dto.returnDate),
            type: dto.type,
            status: dto.status ?? shared_types_1.ReturnStatus.PENDING,
            reason: dto.reason ?? null,
            originalSale: dto.originalSaleId ? { connect: { id: dto.originalSaleId } } : undefined,
            originalPurchase: dto.originalPurchaseId
                ? { connect: { id: dto.originalPurchaseId } }
                : undefined,
            customerId: dto.customerId ?? null,
            supplierId: dto.supplierId ?? null,
            reasonDetails: dto.reasonDetails ?? null,
            refundAmount: dto.refundAmount,
            refundMethod: dto.refundMethod ?? null,
            notes: dto.notes ?? null,
        };
        const created = await this.prisma.return.create({
            data,
            include: {
                originalSale: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        saleDate: true,
                        totalAmount: true,
                    },
                },
                originalPurchase: {
                    select: {
                        id: true,
                        purchaseNumber: true,
                        purchaseDate: true,
                        totalAmount: true,
                    },
                },
            },
        });
        return this.mapReturn(created);
    }
    async findAll(params) {
        const { page, limit, search, type, status, customerId, supplierId, from, to, sortBy = 'returnDate', sortOrder = 'desc', } = params;
        const where = {
            ...(type ? { type } : {}),
            ...(status ? { status } : {}),
            ...(customerId ? { customerId } : {}),
            ...(supplierId ? { supplierId } : {}),
            ...(from || to
                ? {
                    returnDate: {
                        gte: from ? new Date(from) : undefined,
                        lte: to ? new Date(to) : undefined,
                    },
                }
                : {}),
            ...(search
                ? {
                    OR: [
                        { returnNumber: { contains: search, mode: 'insensitive' } },
                        { reasonDetails: { contains: search, mode: 'insensitive' } },
                        { notes: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.return.count({ where }),
            this.prisma.return.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    originalSale: {
                        select: {
                            id: true,
                            invoiceNumber: true,
                            saleDate: true,
                            totalAmount: true,
                            customer: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    businessName: true,
                                },
                            },
                        },
                    },
                    originalPurchase: {
                        select: {
                            id: true,
                            purchaseNumber: true,
                            purchaseDate: true,
                            totalAmount: true,
                            supplier: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        const items = rows.map((r) => this.mapReturn(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const returnRecord = await this.prisma.return.findUnique({
            where: { id },
            include: {
                originalSale: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        saleDate: true,
                        subtotal: true,
                        taxAmount: true,
                        totalAmount: true,
                        customer: {
                            select: {
                                id: true,
                                code: true,
                                firstName: true,
                                lastName: true,
                                businessName: true,
                                phone: true,
                                email: true,
                            },
                        },
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
                    },
                },
                originalPurchase: {
                    select: {
                        id: true,
                        purchaseNumber: true,
                        purchaseDate: true,
                        subtotal: true,
                        taxAmount: true,
                        totalAmount: true,
                        supplier: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                                phone: true,
                                email: true,
                            },
                        },
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
                    },
                },
            },
        });
        if (!returnRecord)
            throw new common_1.NotFoundException('Return record not found');
        return this.mapReturn(returnRecord);
    }
    async update(id, dto) {
        const existing = await this.prisma.return.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Return record not found');
        if (existing.status === shared_types_1.ReturnStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot update completed return');
        }
        const data = {
            returnNumber: dto.returnNumber ?? undefined,
            returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
            type: dto.type ?? undefined,
            status: dto.status ?? undefined,
            reason: dto.reason ?? undefined,
            reasonDetails: dto.reasonDetails ?? undefined,
            refundAmount: dto.refundAmount ?? undefined,
            refundMethod: dto.refundMethod ?? undefined,
            notes: dto.notes ?? undefined,
        };
        const updated = await this.prisma.return.update({
            where: { id },
            data,
        });
        return this.mapReturn(updated);
    }
    async approve(id, approvedByUserId, notes) {
        const returnRecord = await this.prisma.return.findUnique({
            where: { id },
            include: {
                originalSale: true,
                originalPurchase: true,
            },
        });
        if (!returnRecord)
            throw new common_1.NotFoundException('Return record not found');
        if (returnRecord.status !== shared_types_1.ReturnStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending returns can be approved');
        }
        const updated = await this.prisma.return.update({
            where: { id },
            data: {
                status: shared_types_1.ReturnStatus.APPROVED,
                approvedBy: approvedByUserId,
                approvedAt: new Date(),
                notes: notes ? `${returnRecord.notes ?? ''}\nAPPROVED: ${notes}`.trim() : returnRecord.notes,
            },
        });
        // Update original transaction if applicable
        if (returnRecord.type === shared_types_1.ReturnType.CUSTOMER_RETURN && returnRecord.originalSaleId) {
            const sale = returnRecord.originalSale;
            if (sale) {
                await this.prisma.sale.update({
                    where: { id: returnRecord.originalSaleId },
                    data: {
                        status: this.decimalToNumber(sale.totalAmount) === this.decimalToNumber(returnRecord.refundAmount)
                            ? shared_types_1.SaleStatus.REFUNDED
                            : shared_types_1.SaleStatus.PARTIALLY_REFUNDED,
                    },
                });
            }
        }
        return {
            success: true,
            message: 'Return approved',
            returnId: id,
            returnNumber: updated.returnNumber,
        };
    }
    async reject(id, rejectedByUserId, reason, notes) {
        const returnRecord = await this.prisma.return.findUnique({ where: { id } });
        if (!returnRecord)
            throw new common_1.NotFoundException('Return record not found');
        if (returnRecord.status !== shared_types_1.ReturnStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending returns can be rejected');
        }
        const updated = await this.prisma.return.update({
            where: { id },
            data: {
                status: shared_types_1.ReturnStatus.REJECTED,
                rejectedReason: reason,
                approvedBy: rejectedByUserId, // Track who made the decision
                approvedAt: new Date(),
                notes: notes ? `${returnRecord.notes ?? ''}\nREJECTED: ${notes}`.trim() : returnRecord.notes,
            },
        });
        return {
            success: true,
            message: 'Return rejected',
            returnId: id,
            reason,
        };
    }
    async complete(id, notes) {
        const returnRecord = await this.prisma.return.findUnique({
            where: { id },
            include: {
                originalSale: { include: { items: true } },
                originalPurchase: { include: { items: true } },
            },
        });
        if (!returnRecord)
            throw new common_1.NotFoundException('Return record not found');
        if (returnRecord.status !== shared_types_1.ReturnStatus.APPROVED) {
            throw new common_1.BadRequestException('Return must be approved before completion');
        }
        // Process inventory adjustments
        if (returnRecord.type === shared_types_1.ReturnType.CUSTOMER_RETURN && returnRecord.originalSale) {
            // Return items to inventory
            for (const item of returnRecord.originalSale.items) {
                await this.prisma.product.update({
                    where: { id: item.productId },
                    data: { quantity: { increment: item.quantity } },
                });
            }
        }
        else if (returnRecord.type === shared_types_1.ReturnType.SUPPLIER_RETURN && returnRecord.originalPurchase) {
            // Remove items from inventory
            for (const item of returnRecord.originalPurchase.items) {
                await this.prisma.product.update({
                    where: { id: item.productId },
                    data: { quantity: { decrement: item.quantity } },
                });
            }
        }
        const updated = await this.prisma.return.update({
            where: { id },
            data: {
                status: shared_types_1.ReturnStatus.COMPLETED,
                notes: notes ? `${returnRecord.notes ?? ''}\nCOMPLETED: ${notes}`.trim() : returnRecord.notes,
            },
        });
        return {
            success: true,
            message: 'Return completed',
            returnId: id,
            returnNumber: updated.returnNumber,
            refundAmount: this.decimalToNumber(updated.refundAmount),
        };
    }
    async getSummary(from, to, type) {
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const where = {
            returnDate: { gte: fromDate, lte: toDate },
            ...(type ? { type } : {}),
        };
        const [total, byStatus, byReason, byType] = await Promise.all([
            this.prisma.return.aggregate({
                where,
                _count: true,
                _sum: { refundAmount: true },
            }),
            this.prisma.return.groupBy({
                by: ['status'],
                where,
                _count: true,
                _sum: { refundAmount: true },
            }),
            this.prisma.return.groupBy({
                by: ['reason'],
                where: { ...where, reason: { not: null } },
                _count: true,
            }),
            this.prisma.return.groupBy({
                by: ['type'],
                where,
                _count: true,
                _sum: { refundAmount: true },
            }),
        ]);
        return {
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totalReturns: total._count,
            totalRefundAmount: this.decimalToNumber(total._sum.refundAmount),
            byStatus: byStatus.map((s) => ({
                status: s.status,
                count: s._count,
                refundAmount: this.decimalToNumber(s._sum.refundAmount),
            })),
            byReason: byReason.map((r) => ({
                reason: r.reason,
                count: r._count,
            })),
            byType: byType.map((t) => ({
                type: t.type,
                count: t._count,
                refundAmount: this.decimalToNumber(t._sum.refundAmount),
            })),
        };
    }
    async remove(id) {
        const existing = await this.prisma.return.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Return record not found');
        if (existing.status === shared_types_1.ReturnStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot delete completed return');
        }
        await this.prisma.return.delete({ where: { id } });
        return { success: true, message: 'Return record deleted' };
    }
    // Helper methods
    generateReturnNumber(type) {
        const now = new Date();
        const y = String(now.getFullYear());
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const t = Date.now().toString(36).toUpperCase();
        const prefix = type === shared_types_1.ReturnType.CUSTOMER_RETURN ? 'RET-C' : 'RET-S';
        return `${prefix}-${y}${m}${d}-${t}`;
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
    mapReturn(r) {
        return {
            id: r.id,
            returnNumber: r.returnNumber,
            returnDate: r.returnDate,
            type: r.type,
            status: r.status,
            reason: r.reason,
            originalSaleId: r.originalSaleId,
            originalSale: r.originalSale ?? undefined,
            originalPurchaseId: r.originalPurchaseId,
            originalPurchase: r.originalPurchase ?? undefined,
            customerId: r.customerId,
            supplierId: r.supplierId,
            reasonDetails: r.reasonDetails,
            refundAmount: this.decimalToNumber(r.refundAmount),
            refundMethod: r.refundMethod,
            approvedBy: r.approvedBy,
            approvedAt: r.approvedAt,
            rejectedReason: r.rejectedReason,
            notes: r.notes,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        };
    }
};
exports.ReturnsService = ReturnsService;
exports.ReturnsService = ReturnsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReturnsService);
//# sourceMappingURL=returns.service.js.map