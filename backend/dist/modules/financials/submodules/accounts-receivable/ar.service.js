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
exports.ArService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
let ArService = class ArService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: dto.customerId },
            select: { id: true },
        });
        if (!customer)
            throw new common_1.BadRequestException('Customer not found');
        const amount = dto.amount;
        const paidAmount = dto.paidAmount ?? 0;
        const remainingAmount = amount - paidAmount;
        let status = 'PENDING';
        if (paidAmount >= amount) {
            status = 'PAID';
        }
        else if (paidAmount > 0) {
            status = 'PARTIAL';
        }
        const created = await this.prisma.accountsReceivable.create({
            data: {
                customer: { connect: { id: dto.customerId } },
                invoiceNumber: dto.invoiceNumber,
                invoiceDate: new Date(dto.invoiceDate),
                amount,
                paidAmount,
                remainingAmount,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                status,
                notes: dto.notes ?? null,
            },
        });
        return this.mapAr(created);
    }
    async findAll(params) {
        const { page, limit, customerId, status, from, to, overdue, sortBy = 'invoiceDate', sortOrder = 'desc' } = params;
        const where = {
            ...(customerId ? { customerId } : {}),
            ...(status ? { status } : {}),
            ...(from || to ? { invoiceDate: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
            ...(overdue ? { dueDate: { lt: new Date() }, status: { not: 'PAID' } } : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.accountsReceivable.count({ where }),
            this.prisma.accountsReceivable.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: { customer: { select: { id: true, code: true, firstName: true, lastName: true, businessName: true, phone: true, email: true } } },
            }),
        ]);
        return { items: rows.map((r) => this.mapAr(r)), total, page, limit };
    }
    async findOne(id) {
        const row = await this.prisma.accountsReceivable.findUnique({
            where: { id },
            include: {
                customer: true,
                installments: { orderBy: { dueDate: 'asc' } },
            },
        });
        if (!row)
            throw new common_1.NotFoundException('Accounts receivable record not found');
        return this.mapAr(row);
    }
    async update(id, dto) {
        const existing = await this.prisma.accountsReceivable.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Accounts receivable record not found');
        const updated = await this.prisma.accountsReceivable.update({
            where: { id },
            data: {
                invoiceNumber: dto.invoiceNumber ?? undefined,
                invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
                amount: dto.amount ?? undefined,
                paidAmount: dto.paidAmount ?? undefined,
                remainingAmount: dto.amount !== undefined || dto.paidAmount !== undefined
                    ? (dto.amount ?? this.dec(existing.amount)) - (dto.paidAmount ?? this.dec(existing.paidAmount))
                    : undefined,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                status: dto.status ?? undefined,
                notes: dto.notes ?? undefined,
            },
        });
        return this.mapAr(updated);
    }
    async recordPayment(id, dto) {
        const existing = await this.prisma.accountsReceivable.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Accounts receivable record not found');
        const currentPaid = this.dec(existing.paidAmount);
        const amount = this.dec(existing.amount);
        const newPaidAmount = currentPaid + dto.paymentAmount;
        if (newPaidAmount > amount) {
            throw new common_1.BadRequestException('Payment amount exceeds total amount');
        }
        const remainingAmount = amount - newPaidAmount;
        let status = 'PENDING';
        if (newPaidAmount >= amount)
            status = 'PAID';
        else if (newPaidAmount > 0)
            status = 'PARTIAL';
        const updated = await this.prisma.accountsReceivable.update({
            where: { id },
            data: { paidAmount: newPaidAmount, remainingAmount, status },
        });
        return { success: true, message: 'Payment recorded', paidAmount: newPaidAmount, remainingAmount };
    }
    async getSummary(customerId) {
        const where = customerId ? { customerId } : {};
        const [totalDue, totalPaid, totalPending, overdue] = await Promise.all([
            this.prisma.accountsReceivable.aggregate({ where, _sum: { remainingAmount: true } }),
            this.prisma.accountsReceivable.aggregate({ where: { ...where, status: 'PAID' }, _sum: { amount: true } }),
            this.prisma.accountsReceivable.aggregate({ where: { ...where, status: { in: ['PENDING', 'PARTIAL'] } }, _sum: { remainingAmount: true } }),
            this.prisma.accountsReceivable.aggregate({ where: { ...where, dueDate: { lt: new Date() }, status: { not: 'PAID' } }, _sum: { remainingAmount: true }, _count: true }),
        ]);
        return {
            totalDue: this.dec(totalDue._sum.remainingAmount),
            totalPaid: this.dec(totalPaid._sum.amount),
            totalPending: this.dec(totalPending._sum.remainingAmount),
            overdue: { amount: this.dec(overdue._sum.remainingAmount), count: overdue._count },
        };
    }
    async remove(id) {
        await this.prisma.accountsReceivable.delete({ where: { id } });
        return { success: true, message: 'Deleted' };
    }
    dec(value) {
        if (value == null)
            return 0;
        if (typeof value === 'number')
            return value;
        if (typeof value.toNumber === 'function') {
            try {
                return value.toNumber();
            }
            catch { }
        }
        const n = Number(value);
        return isNaN(n) ? 0 : n;
    }
    mapAr(r) {
        return {
            id: r.id,
            customerId: r.customerId,
            customer: r.customer ?? undefined,
            invoiceNumber: r.invoiceNumber,
            invoiceDate: r.invoiceDate,
            amount: this.dec(r.amount),
            paidAmount: this.dec(r.paidAmount),
            remainingAmount: this.dec(r.remainingAmount),
            dueDate: r.dueDate,
            status: r.status,
            notes: r.notes,
            installments: r.installments ?? undefined,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        };
    }
};
exports.ArService = ArService;
exports.ArService = ArService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ArService);
//# sourceMappingURL=ar.service.js.map