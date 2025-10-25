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
exports.ChecksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("@zarmind/shared-types");
let ChecksService = class ChecksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        // Validate related customer/supplier if provided
        if (dto.customerId) {
            const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
            if (!customer)
                throw new common_1.BadRequestException('Customer not found');
        }
        if (dto.supplierId) {
            const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
            if (!supplier)
                throw new common_1.BadRequestException('Supplier not found');
        }
        const data = {
            checkNumber: dto.checkNumber,
            type: dto.type,
            status: dto.status ?? shared_types_1.CheckStatus.PENDING,
            amount: dto.amount,
            issueDate: new Date(dto.issueDate),
            dueDate: new Date(dto.dueDate),
            bankName: dto.bankName,
            branchName: dto.branchName ?? null,
            accountNumber: dto.accountNumber ?? null,
            issuerName: dto.issuerName ?? null,
            customerId: dto.customerId ?? null,
            supplierId: dto.supplierId ?? null,
            payeeName: dto.payeeName ?? null,
            checkImages: dto.checkImages ?? [],
            notes: dto.notes ?? null,
        };
        const created = await this.prisma.check.create({ data });
        return this.mapCheck(created);
    }
    async findAll(params) {
        const { page, limit, search, type, status, fromDueDate, toDueDate, bankName, minAmount, maxAmount, sortBy = 'dueDate', sortOrder = 'asc', } = params;
        const where = {
            ...(type ? { type } : {}),
            ...(status ? { status } : {}),
            ...(bankName ? { bankName: { contains: bankName, mode: 'insensitive' } } : {}),
            ...(fromDueDate || toDueDate
                ? {
                    dueDate: {
                        gte: fromDueDate ? new Date(fromDueDate) : undefined,
                        lte: toDueDate ? new Date(toDueDate) : undefined,
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
                        { checkNumber: { contains: search, mode: 'insensitive' } },
                        { issuerName: { contains: search, mode: 'insensitive' } },
                        { payeeName: { contains: search, mode: 'insensitive' } },
                        { notes: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.check.count({ where }),
            this.prisma.check.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const items = rows.map((r) => this.mapCheck(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const check = await this.prisma.check.findUnique({
            where: { id },
        });
        if (!check)
            throw new common_1.NotFoundException('Check not found');
        return this.mapCheck(check);
    }
    async update(id, dto) {
        const existing = await this.prisma.check.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Check not found');
        if (existing.status === shared_types_1.CheckStatus.CLEARED || existing.status === shared_types_1.CheckStatus.CASHED) {
            throw new common_1.BadRequestException('Cannot update a cleared or cashed check');
        }
        const data = {
            checkNumber: dto.checkNumber ?? undefined,
            type: dto.type ?? undefined,
            amount: dto.amount ?? undefined,
            issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            bankName: dto.bankName ?? undefined,
            branchName: dto.branchName ?? undefined,
            accountNumber: dto.accountNumber ?? undefined,
            issuerName: dto.issuerName ?? undefined,
            customerId: dto.customerId ?? undefined,
            supplierId: dto.supplierId ?? undefined,
            payeeName: dto.payeeName ?? undefined,
            checkImages: dto.checkImages ?? undefined,
            notes: dto.notes ?? undefined,
        };
        const updated = await this.prisma.check.update({
            where: { id },
            data,
        });
        return this.mapCheck(updated);
    }
    async updateStatus(id, dto) {
        const existing = await this.prisma.check.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Check not found');
        const updateDate = dto.date ? new Date(dto.date) : new Date();
        const data = { status: dto.status };
        switch (dto.status) {
            case shared_types_1.CheckStatus.DEPOSITED:
                data.depositedDate = updateDate;
                break;
            case shared_types_1.CheckStatus.CLEARED:
                data.clearedDate = updateDate;
                data.depositedDate = data.depositedDate ?? updateDate;
                break;
            case shared_types_1.CheckStatus.BOUNCED:
                if (!dto.reason) {
                    throw new common_1.BadRequestException('Reason is required for bounced checks');
                }
                data.bouncedDate = updateDate;
                data.bouncedReason = dto.reason;
                break;
            case shared_types_1.CheckStatus.CANCELLED:
            case shared_types_1.CheckStatus.TRANSFERRED:
                // No specific date field for these, but can be logged in notes if needed
                break;
        }
        const updated = await this.prisma.check.update({
            where: { id },
            data,
        });
        return this.mapCheck(updated);
    }
    async getSummary(type) {
        const where = { ...(type ? { type } : {}) };
        const [byStatus, upcomingDue, overdue] = await Promise.all([
            this.prisma.check.groupBy({
                by: ['status'],
                where,
                _count: true,
                _sum: { amount: true },
            }),
            this.prisma.check.aggregate({
                where: {
                    ...where,
                    status: { in: [shared_types_1.CheckStatus.PENDING, shared_types_1.CheckStatus.DEPOSITED] },
                    dueDate: {
                        gte: new Date(),
                        lte: new Date(new Date().setDate(new Date().getDate() + 7)),
                    },
                },
                _count: true,
                _sum: { amount: true },
            }),
            this.prisma.check.aggregate({
                where: {
                    ...where,
                    status: { in: [shared_types_1.CheckStatus.PENDING, shared_types_1.CheckStatus.DEPOSITED] },
                    dueDate: { lt: new Date() },
                },
                _count: true,
                _sum: { amount: true },
            }),
        ]);
        return {
            type: type ?? 'ALL',
            byStatus: byStatus.map((s) => ({
                status: s.status,
                count: s._count,
                totalAmount: this.decimalToNumber(s._sum.amount),
            })),
            upcomingDue: {
                count: upcomingDue._count,
                totalAmount: this.decimalToNumber(upcomingDue._sum.amount),
            },
            overdue: {
                count: overdue._count,
                totalAmount: this.decimalToNumber(overdue._sum.amount),
            },
        };
    }
    async remove(id) {
        const existing = await this.prisma.check.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Check not found');
        if (existing.status === shared_types_1.CheckStatus.CLEARED ||
            existing.status === shared_types_1.CheckStatus.CASHED ||
            existing.status === shared_types_1.CheckStatus.DEPOSITED) {
            throw new common_1.BadRequestException('Cannot delete a check that has been processed. Cancel it instead.');
        }
        await this.prisma.check.delete({ where: { id } });
        return { success: true, message: 'Check deleted' };
    }
    // Helper methods
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
    mapCheck(c) {
        return {
            id: c.id,
            checkNumber: c.checkNumber,
            type: c.type,
            status: c.status,
            amount: this.decimalToNumber(c.amount),
            issueDate: c.issueDate,
            dueDate: c.dueDate,
            bankName: c.bankName,
            branchName: c.branchName,
            accountNumber: c.accountNumber,
            issuerName: c.issuerName,
            customerId: c.customerId,
            supplierId: c.supplierId,
            payeeName: c.payeeName,
            checkImages: Array.isArray(c.checkImages) ? c.checkImages : [],
            notes: c.notes,
            depositedDate: c.depositedDate,
            clearedDate: c.clearedDate,
            bouncedDate: c.bouncedDate,
            bouncedReason: c.bouncedReason,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        };
    }
};
exports.ChecksService = ChecksService;
exports.ChecksService = ChecksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChecksService);
//# sourceMappingURL=checks.service.js.map