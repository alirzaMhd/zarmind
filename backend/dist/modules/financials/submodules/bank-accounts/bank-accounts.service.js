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
exports.BankAccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../core/database/prisma.service");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
let BankAccountsService = class BankAccountsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        // Check if account number already exists
        const existing = await this.prisma.bankAccount.findUnique({
            where: { accountNumber: dto.accountNumber },
        });
        if (existing) {
            throw new common_1.BadRequestException('Account number already exists');
        }
        // Verify branch exists if provided
        if (dto.branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: dto.branchId },
                select: { id: true },
            });
            if (!branch)
                throw new common_1.BadRequestException('Branch not found');
        }
        const data = {
            accountName: dto.accountName,
            accountNumber: dto.accountNumber,
            bankName: dto.bankName,
            branchName: dto.branchName ?? null,
            iban: dto.iban ?? null,
            swiftCode: dto.swiftCode ?? null,
            branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
            balance: dto.initialBalance ?? 0,
            currency: dto.currency ?? 'IRR',
            accountType: dto.accountType ?? null,
            isActive: dto.isActive ?? true,
            notes: dto.notes ?? null,
        };
        const created = await this.prisma.bankAccount.create({ data });
        // If there's an initial balance, create opening balance transaction
        if (dto.initialBalance && dto.initialBalance > 0) {
            await this.prisma.bankTransaction.create({
                data: {
                    bankAccountId: created.id,
                    type: shared_types_1.BankTransactionType.DEPOSIT,
                    amount: dto.initialBalance,
                    transactionDate: new Date(),
                    description: 'Opening balance',
                    balanceAfter: dto.initialBalance,
                    reconciled: true,
                },
            });
        }
        return this.mapBankAccount(created);
    }
    async findAll(params) {
        const { page, limit, search, branchId, isActive, accountType, currency, sortBy = 'createdAt', sortOrder = 'desc', } = params;
        const where = {
            ...(branchId ? { branchId } : {}),
            ...(isActive !== undefined ? { isActive } : {}),
            ...(accountType ? { accountType } : {}),
            ...(currency ? { currency } : {}),
            ...(search
                ? {
                    OR: [
                        { accountName: { contains: search, mode: 'insensitive' } },
                        { accountNumber: { contains: search, mode: 'insensitive' } },
                        { bankName: { contains: search, mode: 'insensitive' } },
                        { iban: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.bankAccount.count({ where }),
            this.prisma.bankAccount.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
                include: {
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
        const items = rows.map((r) => this.mapBankAccount(r));
        return { items, total, page, limit };
    }
    async findOne(id) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
            include: {
                branch: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        address: true,
                    },
                },
                transactions: {
                    orderBy: { transactionDate: 'desc' },
                    take: 10,
                },
            },
        });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found');
        return this.mapBankAccount(account);
    }
    async update(id, dto) {
        const existing = await this.prisma.bankAccount.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Bank account not found');
        // Check if account number is being changed and already exists
        if (dto.accountNumber && dto.accountNumber !== existing.accountNumber) {
            const duplicate = await this.prisma.bankAccount.findUnique({
                where: { accountNumber: dto.accountNumber },
            });
            if (duplicate) {
                throw new common_1.BadRequestException('Account number already exists');
            }
        }
        // Verify branch if being updated
        if (dto.branchId && dto.branchId !== existing.branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: dto.branchId },
                select: { id: true },
            });
            if (!branch)
                throw new common_1.BadRequestException('Branch not found');
        }
        const data = {
            accountName: dto.accountName ?? undefined,
            accountNumber: dto.accountNumber ?? undefined,
            bankName: dto.bankName ?? undefined,
            branchName: dto.branchName ?? undefined,
            iban: dto.iban ?? undefined,
            swiftCode: dto.swiftCode ?? undefined,
            branch: dto.branchId ? { connect: { id: dto.branchId } } : undefined,
            currency: dto.currency ?? undefined,
            accountType: dto.accountType ?? undefined,
            isActive: dto.isActive ?? undefined,
            notes: dto.notes ?? undefined,
        };
        const updated = await this.prisma.bankAccount.update({
            where: { id },
            data,
        });
        return this.mapBankAccount(updated);
    }
    async recordTransaction(id, dto) {
        const account = await this.prisma.bankAccount.findUnique({ where: { id } });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found');
        if (!account.isActive) {
            throw new common_1.BadRequestException('Cannot record transaction on inactive account');
        }
        const currentBalance = this.decimalToNumber(account.balance);
        let newBalance = currentBalance;
        // Calculate new balance based on transaction type
        switch (dto.type) {
            case shared_types_1.BankTransactionType.DEPOSIT:
            case shared_types_1.BankTransactionType.TRANSFER_IN:
            case shared_types_1.BankTransactionType.INTEREST:
                newBalance += dto.amount;
                break;
            case shared_types_1.BankTransactionType.WITHDRAWAL:
            case shared_types_1.BankTransactionType.TRANSFER_OUT:
            case shared_types_1.BankTransactionType.FEE:
            case shared_types_1.BankTransactionType.CHECK_WITHDRAWAL:
                newBalance -= dto.amount;
                break;
            case shared_types_1.BankTransactionType.CHECK_DEPOSIT:
                newBalance += dto.amount;
                break;
        }
        if (newBalance < 0 && !dto.allowNegative) {
            throw new common_1.BadRequestException('Transaction would result in negative balance');
        }
        // Create transaction
        const transaction = await this.prisma.bankTransaction.create({
            data: {
                bankAccountId: id,
                type: dto.type,
                amount: dto.amount,
                transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
                referenceNumber: dto.referenceNumber ?? null,
                description: dto.description ?? null,
                category: dto.category ?? null,
                balanceAfter: newBalance,
                reconciled: false,
            },
        });
        // Update account balance
        await this.prisma.bankAccount.update({
            where: { id },
            data: { balance: newBalance },
        });
        return {
            success: true,
            message: 'Transaction recorded successfully',
            transaction: {
                id: transaction.id,
                type: transaction.type,
                amount: this.decimalToNumber(transaction.amount),
                transactionDate: transaction.transactionDate,
                balanceAfter: this.decimalToNumber(transaction.balanceAfter),
            },
            newBalance,
        };
    }
    async getTransactions(id, params) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found');
        const { from, to, type, reconciled, page, limit } = params;
        const where = {
            bankAccountId: id,
            ...(type ? { type: type } : {}),
            ...(reconciled !== undefined ? { reconciled } : {}),
            ...(from || to
                ? {
                    transactionDate: {
                        gte: from ? new Date(from) : undefined,
                        lte: to ? new Date(to) : undefined,
                    },
                }
                : {}),
        };
        const [total, transactions] = await this.prisma.$transaction([
            this.prisma.bankTransaction.count({ where }),
            this.prisma.bankTransaction.findMany({
                where,
                orderBy: { transactionDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return {
            items: transactions.map((t) => ({
                id: t.id,
                type: t.type,
                amount: this.decimalToNumber(t.amount),
                transactionDate: t.transactionDate,
                referenceNumber: t.referenceNumber,
                description: t.description,
                category: t.category,
                balanceAfter: this.decimalToNumber(t.balanceAfter),
                reconciled: t.reconciled,
                reconciledDate: t.reconciledDate,
                createdAt: t.createdAt,
            })),
            total,
            page,
            limit,
        };
    }
    async reconcileTransactions(id, transactionIds, reconciledDate) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found');
        const date = reconciledDate ? new Date(reconciledDate) : new Date();
        await this.prisma.bankTransaction.updateMany({
            where: {
                id: { in: transactionIds },
                bankAccountId: id,
            },
            data: {
                reconciled: true,
                reconciledDate: date,
            },
        });
        return {
            success: true,
            message: `${transactionIds.length} transactions reconciled`,
            count: transactionIds.length,
        };
    }
    async toggleActive(id, isActive) {
        const account = await this.prisma.bankAccount.findUnique({ where: { id } });
        if (!account)
            throw new common_1.NotFoundException('Bank account not found');
        const updated = await this.prisma.bankAccount.update({
            where: { id },
            data: { isActive },
        });
        return {
            success: true,
            message: `Bank account ${isActive ? 'activated' : 'deactivated'}`,
            isActive: updated.isActive,
        };
    }
    async getSummary(branchId, currency) {
        const where = {
            ...(branchId ? { branchId } : {}),
            ...(currency ? { currency } : {}),
            isActive: true,
        };
        const [totalBalance, byCurrency, byBranch, recentTransactions] = await Promise.all([
            this.prisma.bankAccount.aggregate({
                where,
                _sum: { balance: true },
                _count: true,
            }),
            this.prisma.bankAccount.groupBy({
                by: ['currency'],
                where,
                _sum: { balance: true },
                _count: true,
            }),
            branchId
                ? null
                : this.prisma.bankAccount.groupBy({
                    by: ['branchId'],
                    where,
                    _sum: { balance: true },
                    _count: true,
                }),
            this.prisma.bankTransaction.findMany({
                where: {
                    bankAccount: where,
                    reconciled: false,
                },
                orderBy: { transactionDate: 'desc' },
                take: 10,
                include: {
                    bankAccount: {
                        select: {
                            id: true,
                            accountName: true,
                            accountNumber: true,
                        },
                    },
                },
            }),
        ]);
        return {
            totalAccounts: totalBalance._count,
            totalBalance: this.decimalToNumber(totalBalance._sum.balance),
            byCurrency: byCurrency.map((c) => ({
                currency: c.currency,
                count: c._count,
                balance: this.decimalToNumber(c._sum.balance),
            })),
            byBranch: byBranch
                ? byBranch.map((b) => ({
                    branchId: b.branchId,
                    count: b._count,
                    balance: this.decimalToNumber(b._sum.balance),
                }))
                : undefined,
            unreconciledTransactions: recentTransactions.map((t) => ({
                id: t.id,
                type: t.type,
                amount: this.decimalToNumber(t.amount),
                transactionDate: t.transactionDate,
                account: t.bankAccount,
            })),
        };
    }
    async remove(id) {
        const existing = await this.prisma.bankAccount.findUnique({
            where: { id },
            include: { transactions: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Bank account not found');
        if (existing.transactions.length > 0) {
            throw new common_1.BadRequestException('Cannot delete bank account with transaction history. Deactivate it instead.');
        }
        await this.prisma.bankAccount.delete({ where: { id } });
        return { success: true, message: 'Bank account deleted' };
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
    mapBankAccount(a) {
        return {
            id: a.id,
            accountName: a.accountName,
            accountNumber: a.accountNumber,
            bankName: a.bankName,
            branchName: a.branchName,
            iban: a.iban,
            swiftCode: a.swiftCode,
            branchId: a.branchId,
            branch: a.branch ?? undefined,
            balance: this.decimalToNumber(a.balance),
            currency: a.currency,
            accountType: a.accountType,
            isActive: a.isActive,
            notes: a.notes,
            transactions: a.transactions
                ? a.transactions.map((t) => ({
                    id: t.id,
                    type: t.type,
                    amount: this.decimalToNumber(t.amount),
                    transactionDate: t.transactionDate,
                    description: t.description,
                    balanceAfter: this.decimalToNumber(t.balanceAfter),
                    reconciled: t.reconciled,
                }))
                : undefined,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        };
    }
};
exports.BankAccountsService = BankAccountsService;
exports.BankAccountsService = BankAccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BankAccountsService);
//# sourceMappingURL=bank-accounts.service.js.map