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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const shared_types_1 = require("../../../../packages/shared-types/src");
let SuppliersService = class SuppliersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const code = dto.code ?? this.generateSupplierCode();
        const data = {
            code,
            name: dto.name,
            contactPerson: dto.contactPerson ?? null,
            phone: dto.phone,
            email: dto.email ?? null,
            address: dto.address ?? null,
            city: dto.city ?? null,
            postalCode: dto.postalCode ?? null,
            paymentTerms: dto.paymentTerms ?? null,
            rating: dto.rating ?? null,
            categories: dto.categories ?? [],
            licenseNumber: dto.licenseNumber ?? null,
            taxId: dto.taxId ?? null,
            notes: dto.notes ?? null,
            website: dto.website ?? null,
            status: dto.status ?? shared_types_1.SupplierStatus.ACTIVE,
        };
        const created = await this.prisma.supplier.create({ data });
        return this.mapSupplier(created);
    }
    async findAll(params) {
        const { page, limit, search, status, category, city, minRating, maxRating, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            ...(status ? { status } : {}),
            ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
            ...(category ? { categories: { has: category } } : {}),
            ...(minRating !== undefined || maxRating !== undefined
                ? {
                    rating: {
                        gte: minRating,
                        lte: maxRating,
                    },
                }
                : {}),
            ...(search
                ? {
                    OR: [
                        { code: { contains: search, mode: 'insensitive' } },
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { contactPerson: { contains: search, mode: 'insensitive' } },
                        { licenseNumber: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.supplier.count({ where }),
            this.prisma.supplier.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const items = rows.map((s) => this.mapSupplier(s));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: {
                purchases: {
                    select: {
                        id: true,
                        purchaseNumber: true,
                        purchaseDate: true,
                        totalAmount: true,
                        status: true,
                    },
                    orderBy: { purchaseDate: 'desc' },
                    take: 10,
                },
                payables: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        amount: true,
                        remainingAmount: true,
                        status: true,
                        dueDate: true,
                    },
                    where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
                },
            },
        });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        return this.mapSupplier(supplier);
    }
    async update(id, dto) {
        const existing = await this.prisma.supplier.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Supplier not found');
        const data = {
            code: dto.code ?? undefined,
            name: dto.name ?? undefined,
            contactPerson: dto.contactPerson ?? undefined,
            phone: dto.phone ?? undefined,
            email: dto.email ?? undefined,
            address: dto.address ?? undefined,
            city: dto.city ?? undefined,
            postalCode: dto.postalCode ?? undefined,
            paymentTerms: dto.paymentTerms ?? undefined,
            rating: dto.rating ?? undefined,
            categories: dto.categories ?? undefined,
            licenseNumber: dto.licenseNumber ?? undefined,
            taxId: dto.taxId ?? undefined,
            notes: dto.notes ?? undefined,
            website: dto.website ?? undefined,
            status: dto.status ?? undefined,
        };
        const updated = await this.prisma.supplier.update({
            where: { id },
            data,
        });
        return this.mapSupplier(updated);
    }
    async updateRating(id, rating, notes) {
        const supplier = await this.prisma.supplier.findUnique({ where: { id } });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        if (rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('Rating must be between 1 and 5');
        }
        const updated = await this.prisma.supplier.update({
            where: { id },
            data: {
                rating,
                notes: notes ? `${supplier.notes ?? ''}\n${notes}`.trim() : supplier.notes,
            },
        });
        return {
            success: true,
            message: 'Supplier rating updated',
            supplierId: id,
            rating,
            notes,
        };
    }
    async getPurchases(id, from, to) {
        const supplier = await this.prisma.supplier.findUnique({ where: { id }, select: { id: true } });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const purchases = await this.prisma.purchase.findMany({
            where: {
                supplierId: id,
                purchaseDate: { gte: fromDate, lte: toDate },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, sku: true, name: true, category: true },
                        },
                    },
                },
            },
            orderBy: { purchaseDate: 'desc' },
        });
        return {
            supplierId: id,
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totalPurchases: purchases.length,
            totalAmount: purchases.reduce((sum, p) => sum + this.decimalToNumber(p.totalAmount), 0),
            purchases: purchases.map((p) => ({
                id: p.id,
                purchaseNumber: p.purchaseNumber,
                purchaseDate: p.purchaseDate,
                status: p.status,
                subtotal: this.decimalToNumber(p.subtotal),
                taxAmount: this.decimalToNumber(p.taxAmount),
                totalAmount: this.decimalToNumber(p.totalAmount),
                paidAmount: this.decimalToNumber(p.paidAmount),
                items: p.items.map((i) => ({
                    product: i.product
                        ? {
                            id: i.product.id,
                            sku: i.product.sku,
                            name: i.product.name,
                            category: i.product.category,
                        }
                        : null,
                    quantity: i.quantity,
                    unitPrice: this.decimalToNumber(i.unitPrice),
                    subtotal: this.decimalToNumber(i.subtotal),
                })),
            })),
        };
    }
    async getPayables(id) {
        const supplier = await this.prisma.supplier.findUnique({ where: { id }, select: { id: true } });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        const payables = await this.prisma.accountsPayable.findMany({
            where: { supplierId: id },
            orderBy: { invoiceDate: 'desc' },
        });
        return {
            supplierId: id,
            totalPayables: payables.reduce((sum, p) => sum + this.decimalToNumber(p.remainingAmount), 0),
            payables: payables.map((p) => ({
                id: p.id,
                invoiceNumber: p.invoiceNumber,
                invoiceDate: p.invoiceDate,
                amount: this.decimalToNumber(p.amount),
                paidAmount: this.decimalToNumber(p.paidAmount),
                remainingAmount: this.decimalToNumber(p.remainingAmount),
                dueDate: p.dueDate,
                status: p.status,
                notes: p.notes,
            })),
        };
    }
    async getPerformance(id, from, to) {
        const supplier = await this.prisma.supplier.findUnique({ where: { id } });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const [purchases, totalSpent, onTimeDeliveries, totalDeliveries] = await Promise.all([
            this.prisma.purchase.count({
                where: {
                    supplierId: id,
                    purchaseDate: { gte: fromDate, lte: toDate },
                },
            }),
            this.prisma.purchase.aggregate({
                where: {
                    supplierId: id,
                    purchaseDate: { gte: fromDate, lte: toDate },
                    status: shared_types_1.PurchaseStatus.COMPLETED,
                },
                _sum: { totalAmount: true },
            }),
            this.prisma.purchase.count({
                where: {
                    supplierId: id,
                    purchaseDate: { gte: fromDate, lte: toDate },
                    status: shared_types_1.PurchaseStatus.COMPLETED,
                    deliveryDate: { lte: this.prisma.purchase.fields.purchaseDate },
                },
            }),
            this.prisma.purchase.count({
                where: {
                    supplierId: id,
                    purchaseDate: { gte: fromDate, lte: toDate },
                    status: shared_types_1.PurchaseStatus.COMPLETED,
                    deliveryDate: { not: null },
                },
            }),
        ]);
        const onTimeRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;
        return {
            supplierId: id,
            supplierName: supplier.name,
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            totalPurchases: purchases,
            totalSpent: this.decimalToNumber(totalSpent._sum.totalAmount),
            onTimeDeliveryRate: onTimeRate,
            rating: supplier.rating,
            categories: supplier.categories,
            paymentTerms: supplier.paymentTerms,
        };
    }
    async getSummary() {
        const [totalSuppliers, byStatus, byCategory, topSuppliers] = await Promise.all([
            this.prisma.supplier.count(),
            this.prisma.supplier.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.supplier.findMany({
                where: { categories: { isEmpty: false } },
                select: { categories: true },
            }),
            this.prisma.purchase.groupBy({
                by: ['supplierId'],
                _count: true,
                _sum: { totalAmount: true },
                orderBy: { _sum: { totalAmount: 'desc' } },
                take: 10,
            }),
        ]);
        // Count suppliers by category
        const categoryCount = {};
        byCategory.forEach((s) => {
            if (Array.isArray(s.categories)) {
                s.categories.forEach((cat) => {
                    categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
                });
            }
        });
        // Get supplier details for top suppliers
        const topSupplierIds = topSuppliers.map((t) => t.supplierId).filter(Boolean);
        const supplierDetails = await this.prisma.supplier.findMany({
            where: { id: { in: topSupplierIds } },
            select: { id: true, code: true, name: true, rating: true },
        });
        const supplierMap = new Map(supplierDetails.map((s) => [s.id, s]));
        return {
            totalSuppliers,
            byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
            byCategory: Object.entries(categoryCount).map(([category, count]) => ({ category, count })),
            topSuppliers: topSuppliers.map((t) => {
                const supplier = supplierMap.get(t.supplierId);
                return {
                    supplierId: t.supplierId,
                    code: supplier?.code,
                    name: supplier?.name ?? 'Unknown',
                    rating: supplier?.rating,
                    purchaseCount: t._count,
                    totalSpent: this.decimalToNumber(t._sum.totalAmount),
                };
            }),
        };
    }
    async remove(id) {
        const existing = await this.prisma.supplier.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Supplier not found');
        // Soft delete: mark as inactive
        await this.prisma.supplier.update({
            where: { id },
            data: { status: shared_types_1.SupplierStatus.INACTIVE },
        });
        return { success: true, message: 'Supplier marked as inactive' };
    }
    // Helpers
    generateSupplierCode() {
        const now = new Date();
        const y = String(now.getFullYear()).slice(-2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const t = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `SUPP-${y}${m}${d}-${t}-${rand}`;
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
    mapSupplier(s) {
        return {
            id: s.id,
            code: s.code,
            name: s.name,
            contactPerson: s.contactPerson,
            phone: s.phone,
            email: s.email,
            address: s.address,
            city: s.city,
            postalCode: s.postalCode,
            paymentTerms: s.paymentTerms,
            rating: s.rating,
            categories: Array.isArray(s.categories) ? s.categories : [],
            licenseNumber: s.licenseNumber,
            taxId: s.taxId,
            notes: s.notes,
            website: s.website,
            status: s.status,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            purchases: s.purchases ?? undefined,
            payables: s.payables ?? undefined,
        };
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map