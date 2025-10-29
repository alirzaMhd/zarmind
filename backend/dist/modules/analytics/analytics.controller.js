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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const jwt_auth_guard_1 = require("../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/guards/roles.decorator");
const shared_types_1 = require("@zarmind/shared-types");
const redis_service_1 = require("../../core/cache/redis.service");
const gold_currency_service_1 = require("./gold-currency.service");
let AnalyticsController = class AnalyticsController {
    constructor(prisma, goldCurrencyService, redis) {
        this.prisma = prisma;
        this.goldCurrencyService = goldCurrencyService;
        this.redis = redis;
    }
    // Dashboard summary (all-in-one endpoint)
    async getDashboardSummary(branchId) {
        const cacheKey = this.redisKey('dashboard', { branchId });
        const compute = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            const where = branchId ? { branchId } : {};
            const [todaySales, todayPurchases, todayCash, monthSales, activeCustomers, lowStockItems, recentSales, pendingOrders, inventoryValue, bankBalance, totalProducts, totalSuppliers, monthlyPurchases, monthlyExpenses, receivablesTotal, payablesTotal,] = await Promise.all([
                // Today's sales
                this.prisma.sale.aggregate({
                    where: {
                        ...where,
                        status: 'COMPLETED',
                        saleDate: { gte: today, lt: tomorrow },
                    },
                    _sum: { totalAmount: true },
                    _count: true,
                }),
                // Today's purchases
                this.prisma.purchase.aggregate({
                    where: {
                        ...where,
                        status: 'COMPLETED',
                        purchaseDate: { gte: today, lt: tomorrow },
                    },
                    _sum: { totalAmount: true },
                    _count: true,
                }),
                // Today's cash balance
                this.prisma.cashTransaction.aggregate({
                    where: {
                        ...where,
                        transactionDate: { gte: today, lt: tomorrow },
                    },
                    _sum: { amount: true },
                }),
                // Monthly sales
                this.prisma.sale.aggregate({
                    where: {
                        ...where,
                        status: 'COMPLETED',
                        saleDate: { gte: monthStart, lte: monthEnd },
                    },
                    _sum: { totalAmount: true },
                }),
                // Active customers count
                this.prisma.customer.count({
                    where: { status: 'ACTIVE' },
                }),
                // Low stock items
                this.prisma.inventory.findMany({
                    where: {
                        ...where,
                    },
                    take: 50, // Get more items to filter
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                category: true,
                            },
                        },
                    },
                }).then((items) => items.filter((item) => item.quantity <= item.minimumStock).slice(0, 10)).catch(() => []),
                // Recent sales (last 10)
                this.prisma.sale.findMany({
                    where: {
                        ...where,
                        status: 'COMPLETED',
                    },
                    take: 10,
                    orderBy: { saleDate: 'desc' },
                    include: {
                        customer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                businessName: true,
                            },
                        },
                    },
                }),
                // Pending work orders
                this.prisma.workOrder.count({
                    where: {
                        status: { in: ['PENDING', 'IN_PROGRESS'] },
                    },
                }),
                // Inventory valuation
                this.prisma.product.aggregate({
                    where: {
                        status: 'IN_STOCK',
                        ...(branchId ? { inventory: { some: { branchId } } } : {}),
                    },
                    _sum: { purchasePrice: true, sellingPrice: true },
                }),
                // Bank balance
                this.prisma.bankAccount.aggregate({
                    where: { ...where, isActive: true },
                    _sum: { balance: true },
                }),
                // Total products count
                this.prisma.product.count({
                    where: { status: 'IN_STOCK' },
                }),
                // Total suppliers count
                this.prisma.supplier.count({
                    where: { status: 'ACTIVE' },
                }),
                // Monthly purchases
                this.prisma.purchase.aggregate({
                    where: {
                        ...where,
                        status: 'COMPLETED',
                        purchaseDate: { gte: monthStart, lte: monthEnd },
                    },
                    _sum: { totalAmount: true },
                }),
                // Monthly expenses
                this.prisma.expense.aggregate({
                    where: {
                        expenseDate: { gte: monthStart, lte: monthEnd },
                    },
                    _sum: { amount: true },
                }),
                // Total receivables
                this.prisma.accountsReceivable.aggregate({
                    where: {
                        status: 'PENDING',
                    },
                    _sum: { amount: true },
                }).catch(() => ({ _sum: { amount: null } })),
                // Total payables
                this.prisma.accountsPayable.aggregate({
                    where: {
                        status: 'PENDING',
                    },
                    _sum: { amount: true },
                }).catch(() => ({ _sum: { amount: null } })),
            ]);
            return {
                today: {
                    sales: {
                        count: todaySales._count,
                        total: this.decimalToNumber(todaySales._sum.totalAmount),
                    },
                    purchases: {
                        count: todayPurchases._count,
                        total: this.decimalToNumber(todayPurchases._sum.totalAmount),
                    },
                    cashFlow: this.decimalToNumber(todayCash._sum.amount),
                },
                month: {
                    revenue: this.decimalToNumber(monthSales._sum.totalAmount),
                },
                totals: {
                    activeCustomers,
                    pendingOrders,
                    lowStockCount: lowStockItems.length,
                    inventoryValue: this.decimalToNumber(inventoryValue._sum.purchasePrice),
                    cashOnHand: this.decimalToNumber(bankBalance._sum.balance),
                    totalProducts,
                    totalSuppliers,
                    monthlyPurchases: this.decimalToNumber(monthlyPurchases._sum.totalAmount),
                    monthlyExpenses: this.decimalToNumber(monthlyExpenses._sum.amount),
                    receivablesTotal: this.decimalToNumber(receivablesTotal._sum.amount),
                    payablesTotal: this.decimalToNumber(payablesTotal._sum.amount),
                },
                recentTransactions: recentSales.map((s) => ({
                    id: s.id || 'نامشخص',
                    type: 'sale',
                    invoiceNumber: s.invoiceNumber || null,
                    amount: this.decimalToNumber(s.totalAmount) || 0,
                    customer: s.customer
                        ? s.customer.businessName || `${s.customer.firstName || ''} ${s.customer.lastName || ''}`.trim()
                        : null,
                    date: s.saleDate || new Date().toISOString(),
                })),
                lowStockItems: lowStockItems.map((inv) => ({
                    id: inv.product?.id || inv.id,
                    name: inv.product?.name || 'محصول نامشخص',
                    sku: inv.product?.sku || 'نامشخص',
                    category: inv.product?.category || 'نامشخص',
                    currentStock: inv.quantity || 0,
                    minimumStock: inv.minimumStock || 0,
                })),
            };
        };
        return this.wrapCache(cacheKey, 60, compute); // Cache for 1 minute
    }
    // Gold and Currency Prices endpoint
    async getGoldCurrencyPrices() {
        const cacheKey = this.redisKey('gold-currency-prices', {});
        const compute = async () => {
            return await this.goldCurrencyService.getGoldAndCurrencyPrices();
        };
        return this.wrapCache(cacheKey, 300, compute); // Cache for 5 minutes
    }
    // Sales trend over time
    async getSalesTrend(from, to, granularity = 'day', branchId) {
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const g = this.normalizeGranularity(granularity);
        const cacheKey = this.redisKey('sales-trend', { fromDate, toDate, g, branchId });
        const compute = async () => {
            const sales = await this.prisma.sale.findMany({
                where: {
                    status: shared_types_1.SaleStatus.COMPLETED,
                    saleDate: { gte: fromDate, lte: toDate },
                    ...(branchId ? { branchId } : {}),
                },
                select: { saleDate: true, totalAmount: true },
            });
            const groups = {};
            for (let i = 0; i < sales.length; i++) {
                const s = sales[i];
                const bucket = this.bucketKey(s.saleDate, g);
                const amount = this.decimalToNumber(s.totalAmount);
                groups[bucket] = (groups[bucket] ?? 0) + amount;
            }
            const series = this.seriesFromGroups(groups, fromDate, toDate, g);
            const total = series.reduce((acc, it) => acc + it.value, 0);
            return {
                range: { from: fromDate.toISOString(), to: toDate.toISOString() },
                granularity: g,
                total,
                points: series,
            };
        };
        return this.wrapCache(cacheKey, 300, compute);
    }
    // Top selling products in a period
    async getTopProducts(from, to, limitStr, branchId) {
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const limit = this.parseIntSafe(limitStr, 10);
        const cacheKey = this.redisKey('top-products', { fromDate, toDate, limit, branchId });
        const compute = async () => {
            const items = await this.prisma.saleItem.findMany({
                where: {
                    sale: {
                        status: shared_types_1.SaleStatus.COMPLETED,
                        saleDate: { gte: fromDate, lte: toDate },
                        ...(branchId ? { branchId } : {}),
                    },
                },
                select: {
                    quantity: true,
                    subtotal: true,
                    product: {
                        select: { id: true, name: true, sku: true, category: true },
                    },
                },
            });
            const map = {};
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                const pid = it.product?.id ?? 'unknown';
                if (!map[pid]) {
                    map[pid] = {
                        productId: pid,
                        name: it.product?.name ?? 'Unknown',
                        sku: it.product?.sku ?? null,
                        category: it.product?.category ?? shared_types_1.ProductCategory.GENERAL_GOODS,
                        qty: 0,
                        revenue: 0,
                    };
                }
                map[pid].qty += it.quantity ?? 0;
                map[pid].revenue += this.decimalToNumber(it.subtotal);
            }
            const arr = Object.keys(map).map((k) => map[k]);
            arr.sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);
            return {
                range: { from: fromDate.toISOString(), to: toDate.toISOString() },
                totalProducts: arr.length,
                top: arr.slice(0, limit),
            };
        };
        return this.wrapCache(cacheKey, 300, compute);
    }
    // Inventory valuation (by category)
    async getInventoryValuation(branchId) {
        const cacheKey = this.redisKey('inventory-valuation', { branchId });
        const compute = async () => {
            const inventory = await this.prisma.inventory.findMany({
                where: { ...(branchId ? { branchId } : {}) },
                select: {
                    quantity: true,
                    product: {
                        select: {
                            id: true,
                            category: true,
                            purchasePrice: true,
                            sellingPrice: true,
                        },
                    },
                },
            });
            const result = {};
            for (let i = 0; i < inventory.length; i++) {
                const row = inventory[i];
                const cat = row.product?.category ?? shared_types_1.ProductCategory.GENERAL_GOODS;
                if (!result[cat]) {
                    result[cat] = { category: cat, quantity: 0, purchaseValue: 0, retailValue: 0 };
                }
                const qty = row.quantity ?? 0;
                result[cat].quantity += qty;
                result[cat].purchaseValue += qty * this.decimalToNumber(row.product?.purchasePrice);
                result[cat].retailValue += qty * this.decimalToNumber(row.product?.sellingPrice);
            }
            const totalPurchase = Object.keys(result).reduce((acc, k) => acc + result[k].purchaseValue, 0);
            const totalRetail = Object.keys(result).reduce((acc, k) => acc + result[k].retailValue, 0);
            return {
                byCategory: Object.keys(result).map((k) => result[k]),
                totals: {
                    purchaseValue: totalPurchase,
                    retailValue: totalRetail,
                    markupPct: totalPurchase > 0 ? ((totalRetail - totalPurchase) / totalPurchase) * 100 : null,
                },
            };
        };
        return this.wrapCache(cacheKey, 600, compute);
    }
    // Financial KPIs (approximate, based on available data)
    async getFinancialKpi(from, to, branchId) {
        const { fromDate, toDate } = this.parseDateRange(from, to);
        const cacheKey = this.redisKey('financial-kpi', { fromDate, toDate, branchId });
        const compute = async () => {
            const [sales, purchases, expenses, bankAccounts, cashIns, cashOuts, receivables, payables] = await Promise.all([
                this.prisma.sale.aggregate({
                    where: {
                        status: shared_types_1.SaleStatus.COMPLETED,
                        saleDate: { gte: fromDate, lte: toDate },
                        ...(branchId ? { branchId } : {}),
                    },
                    _sum: { totalAmount: true, discountAmount: true, taxAmount: true, subtotal: true },
                }),
                this.prisma.purchase.aggregate({
                    where: {
                        purchaseDate: { gte: fromDate, lte: toDate },
                        ...(branchId ? { branchId } : {}),
                    },
                    _sum: { totalAmount: true, taxAmount: true, subtotal: true },
                }),
                this.prisma.expense.aggregate({
                    where: { expenseDate: { gte: fromDate, lte: toDate } },
                    _sum: { amount: true },
                }),
                this.prisma.bankAccount.findMany({
                    where: { ...(branchId ? { branchId } : {}) },
                    select: { balance: true },
                }),
                this.prisma.cashTransaction.aggregate({
                    where: {
                        type: 'CASH_IN',
                        transactionDate: { gte: fromDate, lte: toDate },
                        ...(branchId ? { branchId } : {}),
                    },
                    _sum: { amount: true },
                }),
                this.prisma.cashTransaction.aggregate({
                    where: {
                        type: 'CASH_OUT',
                        transactionDate: { gte: fromDate, lte: toDate },
                        ...(branchId ? { branchId } : {}),
                    },
                    _sum: { amount: true },
                }),
                this.prisma.accountsReceivable.aggregate({
                    where: { invoiceDate: { gte: fromDate, lte: toDate } },
                    _sum: { remainingAmount: true },
                }),
                this.prisma.accountsPayable.aggregate({
                    where: { invoiceDate: { gte: fromDate, lte: toDate } },
                    _sum: { remainingAmount: true },
                }),
            ]);
            const salesTotal = this.decimalToNumber(sales._sum.totalAmount);
            const purchasesTotal = this.decimalToNumber(purchases._sum.totalAmount);
            const expensesTotal = this.decimalToNumber(expenses._sum.amount);
            const cashIn = this.decimalToNumber(cashIns._sum.amount);
            const cashOut = this.decimalToNumber(cashOuts._sum.amount);
            let bankBalance = 0;
            for (let i = 0; i < bankAccounts.length; i++) {
                bankBalance += this.decimalToNumber(bankAccounts[i].balance);
            }
            const receivableRemain = this.decimalToNumber(receivables._sum.remainingAmount);
            const payableRemain = this.decimalToNumber(payables._sum.remainingAmount);
            const grossProfit = Math.max(0, salesTotal - purchasesTotal); // approximation
            const netProfit = grossProfit - expensesTotal;
            const operatingCashFlow = cashIn - cashOut;
            const currentAssets = bankBalance + receivableRemain; // approximation
            const currentLiabilities = payableRemain; // approximation
            const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : null;
            const quickRatio = currentRatio; // no inventory considered in quick ratio here
            const workingCapital = currentAssets - currentLiabilities;
            return {
                range: { from: fromDate.toISOString(), to: toDate.toISOString() },
                revenue: salesTotal,
                purchases: purchasesTotal,
                expenses: expensesTotal,
                grossProfit,
                netProfit,
                grossProfitMargin: salesTotal > 0 ? (grossProfit / salesTotal) * 100 : null,
                netProfitMargin: salesTotal > 0 ? (netProfit / salesTotal) * 100 : null,
                operatingCashFlow,
                currentRatio,
                quickRatio,
                workingCapital,
            };
        };
        return this.wrapCache(cacheKey, 300, compute);
    }
    // Helpers
    parseDateRange(from, to) {
        let fromDate;
        let toDate;
        if (from) {
            const d = new Date(from);
            if (isNaN(d.getTime()))
                throw new common_1.BadRequestException('Invalid "from" date');
            fromDate = d;
        }
        else {
            // default: last 30 days
            const d = new Date();
            d.setDate(d.getDate() - 30);
            fromDate = d;
        }
        if (to) {
            const d = new Date(to);
            if (isNaN(d.getTime()))
                throw new common_1.BadRequestException('Invalid "to" date');
            toDate = d;
        }
        else {
            toDate = new Date();
        }
        // Normalize toDate to end of day
        toDate.setHours(23, 59, 59, 999);
        return { fromDate, toDate };
    }
    normalizeGranularity(g) {
        if (g === 'day' || g === 'week' || g === 'month')
            return g;
        return 'day';
    }
    bucketKey(date, g) {
        const d = new Date(date);
        if (g === 'day') {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
        if (g === 'week') {
            const wd = d.getDay(); // 0 (Sun) .. 6 (Sat)
            const diff = (wd === 0 ? -6 : 1) - wd; // move to Monday
            const monday = new Date(d);
            monday.setDate(d.getDate() + diff);
            const y = monday.getFullYear();
            const m = String(monday.getMonth() + 1).padStart(2, '0');
            const day = String(monday.getDate()).padStart(2, '0');
            return `W-${y}-${m}-${day}`; // ISO-week start date key
        }
        // month
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }
    seriesFromGroups(groups, from, to, g) {
        // Generate keys from from..to to fill gaps with zeros
        const out = [];
        const cursor = new Date(from);
        const pushPoint = (key) => {
            out.push({ key, value: groups[key] ?? 0 });
        };
        if (g === 'day') {
            while (cursor <= to) {
                pushPoint(this.bucketKey(cursor, 'day'));
                cursor.setDate(cursor.getDate() + 1);
            }
            return out;
        }
        if (g === 'week') {
            // Advance cursor to Monday of its week
            const wd = cursor.getDay();
            const startDiff = (wd === 0 ? -6 : 1) - wd;
            cursor.setDate(cursor.getDate() + startDiff);
            while (cursor <= to) {
                pushPoint(this.bucketKey(cursor, 'week'));
                cursor.setDate(cursor.getDate() + 7);
            }
            return out;
        }
        // month
        cursor.setDate(1);
        while (cursor <= to) {
            pushPoint(this.bucketKey(cursor, 'month'));
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return out;
    }
    decimalToNumber(value) {
        if (value == null)
            return 0;
        if (typeof value === 'number')
            return value;
        // Prisma Decimal
        if (typeof value.toNumber === 'function') {
            try {
                return value.toNumber();
            }
            catch {
                // fallback
            }
        }
        const n = Number(value);
        return isNaN(n) ? 0 : n;
    }
    parseIntSafe(value, fallback) {
        const n = value ? parseInt(value, 10) : NaN;
        if (isNaN(n) || n <= 0)
            return fallback;
        return n;
    }
    redisKey(name, args) {
        try {
            return `analytics:${name}:${JSON.stringify(args)}`;
        }
        catch {
            return `analytics:${name}`;
        }
    }
    async wrapCache(key, ttlSeconds, producer) {
        if (!this.redis)
            return producer();
        try {
            return await this.redis.wrap(key, ttlSeconds, producer);
        }
        catch {
            // If Redis is unavailable, fall back to computation
            return producer();
        }
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('gold-currency-prices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getGoldCurrencyPrices", null);
__decorate([
    (0, common_1.Get)('sales-trend'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('granularity')),
    __param(3, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSalesTrend", null);
__decorate([
    (0, common_1.Get)('top-products'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTopProducts", null);
__decorate([
    (0, common_1.Get)('inventory-valuation'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getInventoryValuation", null);
__decorate([
    (0, common_1.Get)('financial-kpi'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getFinancialKpi", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.ACCOUNTANT),
    (0, common_1.Controller)('analytics'),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gold_currency_service_1.GoldCurrencyService,
        redis_service_1.RedisService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map