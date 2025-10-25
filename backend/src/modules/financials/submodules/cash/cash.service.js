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
exports.CashService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
let CashService = class CashService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, createdByUserId) {
        // Verify branch exists
        const branch = await this.prisma.branch.findUnique({
            where: { id: dto.branchId },
            select: { id: true },
        });
        if (!branch)
            throw new common_1.BadRequestException('Branch not found');
        const data = {
            type: dto.type,
            amount: dto.amount,
            transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
            branch: { connect: { id: dto.branchId } },
            user: { connect: { id: createdByUserId } },
            category: dto.category ?? null,
            referenceType: dto.referenceType ?? null,
            referenceId: dto.referenceId ?? null,
            description: dto.description ?? null,
            receiptNumber: dto.receiptNumber ?? null,
        };
        const created = await this.prisma.cashTransaction.create({
            data,
            include: {
                branch: { select: { id: true, code: true, name: true } },
                user: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        return this.mapCashTransaction(created);
    }
    async findAll(params) {
        const { page, limit, search, branchId, type, category, userId, from, to, minAmount, maxAmount, sortBy = 'transactionDate', sortOrder = 'desc', } = params;
        const where = {
            ...(branchId ? { branchId } : {}),
            ...(type ? { type } : {}),
            ...(category ? { category } : {}),
            ...(userId ? { userId } : {}),
            ...(from || to
                ? {
                    transactionDate: {
                        gte: from ? new Date(from) : undefined,
                        lte: to ? new Date(to) : undefined,
                    },
                }
                : {}),
            ...(minAmount !== undefined || maxAmount !== undefined
                ? {
                    amount: {
                        gte: minAmount,
                        lte: maxAmount,
                    },
                }
                : {}),
            ...(search
                ? {
                    OR: [
                        { description: { contains: search, mode: 'insensitive' } },
                        { receiptNumber: { contains: search, mode: 'insensitive' } },
                        { category: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.cashTransaction.count({ where }),
            this.prisma.cashTransaction.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    branch: { select: { id: true, code: true, name: true } },
                    user: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
        ]);
        const items = rows.map((r) => this.mapCashTransaction(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const transaction = await this.prisma.cashTransaction.findUnique({
            where: { id },
            include: {
                branch: { select: { id: true, code: true, name: true } },
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
        if (!transaction)
            throw new common_1.NotFoundException('Cash transaction not found');
        return this.mapCashTransaction(transaction);
    }
    async update(id, dto) {
        const existing = await this.prisma.cashTransaction.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Cash transaction not found');
        const data = {
            type: dto.type ?? undefined,
            amount: dto.amount ?? undefined,
            transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
            category: dto.category ?? undefined,
            referenceType: dto.referenceType ?? undefined,
            referenceId: dto.referenceId ?? undefined,
            description: dto.description ?? undefined,
            receiptNumber: dto.receiptNumber ?? undefined,
        };
        const updated = await this.prisma.cashTransaction.update({
            where: { id },
            data,
        });
        return this.mapCashTransaction(updated);
    }
    async getSummary(from, to, branchId) {
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const where = {
            transactionDate: { gte: fromDate, lte: toDate },
            ...(branchId ? { branchId } : {}),
        };
        const [cashIn, cashOut, byCategoryIn, byCategoryOut, byUser] = await Promise.all([
            this.prisma.cashTransaction.aggregate({
                where: { ...where, type: 'CASH_IN' },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.cashTransaction.aggregate({
                where: { ...where, type: 'CASH_OUT' },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.cashTransaction.groupBy({
                by: ['category'],
                where: { ...where, type: 'CASH_IN', category: { not: null } },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.cashTransaction.groupBy({
                by: ['category'],
                where: { ...where, type: 'CASH_OUT', category: { not: null } },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.cashTransaction.groupBy({
                by: ['userId'],
                where,
                _count: true,
            }),
        ]);
        const totalCashIn = this.decimalToNumber(cashIn._sum.amount);
        const totalCashOut = this.decimalToNumber(cashOut._sum.amount);
        const netCashFlow = totalCashIn - totalCashOut;
        return {
            period: { from: fromDate.toISOString(), to: toDate.toISOString() },
            branchId: branchId ?? 'ALL',
            totalCashIn,
            totalCashOut,
            netCashFlow,
            totalTransactions: (cashIn._count ?? 0) + (cashOut._count ?? 0),
            byCategoryIn: byCategoryIn.map((c) => ({
                category: c.category,
                amount: this.decimalToNumber(c._sum.amount),
                count: c._count,
            })),
            byCategoryOut: byCategoryOut.map((c) => ({
                category: c.category,
                amount: this.decimalToNumber(c._sum.amount),
                count: c._count,
            })),
            byUser: byUser.map((u) => ({
                userId: u.userId,
                count: u._count,
            })),
        };
    }
    async getCurrentBalance(branchId) {
        const where = branchId ? { branchId } : {};
        const aggregates = await this.prisma.cashTransaction.aggregate({
            where: {
                ...where,
                type: { in: [shared_types_1.CashTransactionType.CASH_IN, shared_types_1.CashTransactionType.CASH_OUT] },
            },
            _sum: {
                amount: true,
            },
        });
        // This is not an accurate balance, need to sum cash_in and subtract cash_out
        const cashInResult = await this.prisma.cashTransaction.aggregate({
            where: { ...where, type: shared_types_1.CashTransactionType.CASH_IN },
            _sum: { amount: true },
        });
        const cashOutResult = await this.prisma.cashTransaction.aggregate({
            where: { ...where, type: shared_types_1.CashTransactionType.CASH_OUT },
            _sum: { amount: true },
        });
        const cashIn = this.decimalToNumber(cashInResult._sum.amount);
        const cashOut = this.decimalToNumber(cashOutResult._sum.amount);
        return {
            branchId: branchId ?? 'ALL',
            currentBalance: cashIn - cashOut,
        };
    }
    async remove(id) {
        const existing = await this.prisma.cashTransaction.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Cash transaction not found');
        await this.prisma.cashTransaction.delete({ where: { id } });
        return { success: true, message: 'Cash transaction deleted' };
    }
    // Helper methods
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
    mapCashTransaction(t) {
        return {
            id: t.id,
            type: t.type,
            amount: this.decimalToNumber(t.amount),
            transactionDate: t.transactionDate,
            branchId: t.branchId,
            branch: t.branch ?? undefined,
            userId: t.userId,
            user: t.user ?? undefined,
            category: t.category,
            referenceType: t.referenceType,
            referenceId: t.referenceId,
            description: t.description,
            receiptNumber: t.receiptNumber,
            createdAt: t.createdAt,
        };
    }
};
exports.CashService = CashService;
exports.CashService = CashService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashService);
//# sourceMappingURL=cash.service.js.map