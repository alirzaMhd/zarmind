import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole, SaleStatus, ProductCategory } from '@zarmind/shared-types';
import { RedisService } from '../../core/cache/redis.service';
import { GoldCurrencyService } from './gold-currency.service';

type Granularity = 'day' | 'week' | 'month';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goldCurrencyService: GoldCurrencyService,
    @Optional() private readonly redis?: RedisService,
  ) { }
  // Dashboard summary (all-in-one endpoint)
  @Get('dashboard')
  async getDashboardSummary(
    @Query('branchId') branchId?: string,
  ) {
    const cacheKey = this.redisKey('dashboard', { branchId });

    const compute = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      const where = branchId ? { branchId } : {};

      const [
        todaySales,
        todayPurchases,
        todayCash,
        monthSales,
        activeCustomers,
        lowStockItems,
        recentSales,
        pendingOrders,
        inventoryValue,
        bankBalance,
        totalProducts,
        totalSuppliers,
        monthlyPurchases,
        monthlyExpenses,
        receivablesTotal,
        payablesTotal,
      ] = await Promise.all([
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
        }).then((items: any[]) => 
          items.filter((item: any) => item.quantity <= item.minimumStock).slice(0, 10)
        ).catch(() => []),

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
        recentTransactions: recentSales.map((s: any) => ({
          id: s.id || 'نامشخص',
          type: 'sale',
          invoiceNumber: s.invoiceNumber || null,
          amount: this.decimalToNumber(s.totalAmount) || 0,
          customer: s.customer
            ? s.customer.businessName || `${s.customer.firstName || ''} ${s.customer.lastName || ''}`.trim()
            : null,
          date: s.saleDate || new Date().toISOString(),
        })),
        lowStockItems: lowStockItems.map((inv: any) => ({
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
  @Get('gold-currency-prices')
  async getGoldCurrencyPrices() {
    const cacheKey = this.redisKey('gold-currency-prices', {});
    
    const compute = async () => {
      return await this.goldCurrencyService.getGoldAndCurrencyPrices();
    };

    return this.wrapCache(cacheKey, 300, compute); // Cache for 5 minutes
  }
  // Sales trend over time
  @Get('sales-trend')
  async getSalesTrend(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity: Granularity = 'day',
    @Query('branchId') branchId?: string,
  ) {
    const { fromDate, toDate } = this.parseDateRange(from, to);
    const g = this.normalizeGranularity(granularity);
    const cacheKey = this.redisKey('sales-trend', { fromDate, toDate, g, branchId });

    const compute = async () => {
      const sales = await this.prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: fromDate, lte: toDate },
          ...(branchId ? { branchId } : {}),
        },
        select: { saleDate: true, totalAmount: true },
      });

      const groups: Record<string, number> = {};
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
  @Get('top-products')
  async getTopProducts(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitStr?: string,
    @Query('branchId') branchId?: string,
  ) {
    const { fromDate, toDate } = this.parseDateRange(from, to);
    const limit = this.parseIntSafe(limitStr, 10);
    const cacheKey = this.redisKey('top-products', { fromDate, toDate, limit, branchId });

    const compute = async () => {
      const items = await this.prisma.saleItem.findMany({
        where: {
          sale: {
            status: SaleStatus.COMPLETED,
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

      const map: Record<
        string,
        { productId: string; name: string; sku: string | null; category: ProductCategory; qty: number; revenue: number }
      > = {};

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const pid = it.product?.id ?? 'unknown';
        if (!map[pid]) {
          map[pid] = {
            productId: pid,
            name: it.product?.name ?? 'Unknown',
            sku: it.product?.sku ?? null,
            category: (it.product?.category as ProductCategory) ?? ProductCategory.GENERAL_GOODS,
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
  @Get('inventory-valuation')
  async getInventoryValuation(@Query('branchId') branchId?: string) {
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

      const result: Record<
        string,
        { category: ProductCategory; quantity: number; purchaseValue: number; retailValue: number }
      > = {};

      for (let i = 0; i < inventory.length; i++) {
        const row = inventory[i];
        const cat = (row.product?.category as ProductCategory) ?? ProductCategory.GENERAL_GOODS;
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
  @Get('financial-kpi')
  async getFinancialKpi(@Query('from') from?: string, @Query('to') to?: string, @Query('branchId') branchId?: string) {
    const { fromDate, toDate } = this.parseDateRange(from, to);
    const cacheKey = this.redisKey('financial-kpi', { fromDate, toDate, branchId });

    const compute = async () => {
      const [sales, purchases, expenses, bankAccounts, cashIns, cashOuts, receivables, payables] =
        await Promise.all([
          this.prisma.sale.aggregate({
            where: {
              status: SaleStatus.COMPLETED,
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
      const currentRatio =
        currentLiabilities > 0 ? currentAssets / currentLiabilities : null;
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

  private parseDateRange(from?: string, to?: string): { fromDate: Date; toDate: Date } {
    let fromDate: Date;
    let toDate: Date;

    if (from) {
      const d = new Date(from);
      if (isNaN(d.getTime())) throw new BadRequestException('Invalid "from" date');
      fromDate = d;
    } else {
      // default: last 30 days
      const d = new Date();
      d.setDate(d.getDate() - 30);
      fromDate = d;
    }

    if (to) {
      const d = new Date(to);
      if (isNaN(d.getTime())) throw new BadRequestException('Invalid "to" date');
      toDate = d;
    } else {
      toDate = new Date();
    }

    // Normalize toDate to end of day
    toDate.setHours(23, 59, 59, 999);
    return { fromDate, toDate };
  }

  private normalizeGranularity(g: string | undefined): Granularity {
    if (g === 'day' || g === 'week' || g === 'month') return g;
    return 'day';
  }

  private bucketKey(date: Date, g: Granularity): string {
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

  private seriesFromGroups(
    groups: Record<string, number>,
    from: Date,
    to: Date,
    g: Granularity,
  ): Array<{ key: string; value: number }> {
    // Generate keys from from..to to fill gaps with zeros
    const out: Array<{ key: string; value: number }> = [];
    const cursor = new Date(from);

    const pushPoint = (key: string) => {
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

  private decimalToNumber(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    // Prisma Decimal
    if (typeof (value as any).toNumber === 'function') {
      try {
        return (value as any).toNumber();
      } catch {
        // fallback
      }
    }
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  }

  private parseIntSafe(value: string | undefined, fallback: number): number {
    const n = value ? parseInt(value, 10) : NaN;
    if (isNaN(n) || n <= 0) return fallback;
    return n;
  }

  private redisKey(name: string, args: any): string {
    try {
      return `analytics:${name}:${JSON.stringify(args)}`;
    } catch {
      return `analytics:${name}`;
    }
  }

  private async wrapCache<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    if (!this.redis) return producer();
    try {
      return await this.redis.wrap<T>(key, ttlSeconds, producer);
    } catch {
      // If Redis is unavailable, fall back to computation
      return producer();
    }
  }
}