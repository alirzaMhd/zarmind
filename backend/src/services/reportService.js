"use strict";
// ==========================================
// ZARMIND - Report Service
// ==========================================
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Product_1 = require("../models/Product");
var Customer_1 = require("../models/Customer");
var Sale_1 = require("../models/Sale");
var Transaction_1 = require("../models/Transaction");
var logger_1 = require("../utils/logger");
var helpers_1 = require("../utils/helpers");
var database_1 = require("../config/database");
// ==========================================
// REPORT SERVICE
// ==========================================
var ReportService = /** @class */ (function () {
    function ReportService() {
    }
    // ==========================================
    // DASHBOARD
    // ==========================================
    /**
     * Get comprehensive dashboard statistics
     */
    ReportService.prototype.getDashboardStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, salesStats, inventoryStats, customerStats, transactionStats, recentSales, recentCustomers, stockAlerts, pendingPayments, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                this.getSalesStats(),
                                this.getInventoryStats(),
                                this.getCustomerStats(),
                                this.getTransactionStats(),
                                Sale_1.default.findRecent(5),
                                this.getRecentCustomers(5),
                                Product_1.default.findLowStock(),
                                this.getPendingPaymentsSummary(),
                            ])];
                    case 1:
                        _a = _b.sent(), salesStats = _a[0], inventoryStats = _a[1], customerStats = _a[2], transactionStats = _a[3], recentSales = _a[4], recentCustomers = _a[5], stockAlerts = _a[6], pendingPayments = _a[7];
                        return [2 /*return*/, {
                                sales: salesStats,
                                inventory: inventoryStats,
                                customers: customerStats,
                                transactions: transactionStats,
                                recentSales: recentSales,
                                recentCustomers: recentCustomers,
                                stockAlerts: stockAlerts.slice(0, 5),
                                pendingPayments: pendingPayments.slice(0, 5),
                            }];
                    case 2:
                        error_1 = _b.sent();
                        logger_1.default.error('Error in getDashboardStats:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get sales statistics for dashboard
     */
    ReportService.prototype.getSalesStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, todayResult, weekResult, monthResult, yearResult;
            var _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            (0, database_1.query)("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue \n         FROM sales \n         WHERE DATE(sale_date) = CURRENT_DATE \n         AND status IN ('completed', 'partial')"),
                            (0, database_1.query)("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue \n         FROM sales \n         WHERE sale_date >= NOW() - INTERVAL '7 days' \n         AND status IN ('completed', 'partial')"),
                            (0, database_1.query)("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue \n         FROM sales \n         WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)\n         AND status IN ('completed', 'partial')"),
                            (0, database_1.query)("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue \n         FROM sales \n         WHERE DATE_TRUNC('year', sale_date) = DATE_TRUNC('year', CURRENT_DATE)\n         AND status IN ('completed', 'partial')"),
                        ])];
                    case 1:
                        _a = _k.sent(), todayResult = _a[0], weekResult = _a[1], monthResult = _a[2], yearResult = _a[3];
                        return [2 /*return*/, {
                                today: parseInt(((_b = todayResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10),
                                todayRevenue: parseFloat(((_c = todayResult.rows[0]) === null || _c === void 0 ? void 0 : _c.revenue) || '0'),
                                week: parseInt(((_d = weekResult.rows[0]) === null || _d === void 0 ? void 0 : _d.count) || '0', 10),
                                weekRevenue: parseFloat(((_e = weekResult.rows[0]) === null || _e === void 0 ? void 0 : _e.revenue) || '0'),
                                month: parseInt(((_f = monthResult.rows[0]) === null || _f === void 0 ? void 0 : _f.count) || '0', 10),
                                monthRevenue: parseFloat(((_g = monthResult.rows[0]) === null || _g === void 0 ? void 0 : _g.revenue) || '0'),
                                year: parseInt(((_h = yearResult.rows[0]) === null || _h === void 0 ? void 0 : _h.count) || '0', 10),
                                yearRevenue: parseFloat(((_j = yearResult.rows[0]) === null || _j === void 0 ? void 0 : _j.revenue) || '0'),
                            }];
                }
            });
        });
    };
    /**
     * Get inventory statistics for dashboard
     */
    ReportService.prototype.getInventoryStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.getStatistics()];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, {
                                totalProducts: stats.total,
                                totalValue: stats.totalValue,
                                totalWeight: stats.totalWeight,
                                lowStock: stats.lowStock,
                                outOfStock: stats.outOfStock,
                            }];
                }
            });
        });
    };
    /**
     * Get customer statistics for dashboard
     */
    ReportService.prototype.getCustomerStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, stats, newCustomersResult;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            Customer_1.default.getStatistics(),
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)"),
                        ])];
                    case 1:
                        _a = _c.sent(), stats = _a[0], newCustomersResult = _a[1];
                        return [2 /*return*/, {
                                total: stats.total,
                                active: stats.active,
                                new: parseInt(((_b = newCustomersResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10),
                                withDebt: stats.withDebt,
                                totalDebt: stats.totalDebt,
                            }];
                }
            });
        });
    };
    /**
     * Get transaction statistics for dashboard
     */
    ReportService.prototype.getTransactionStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, todayResult, pendingResult;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            (0, database_1.query)("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount \n         FROM transactions \n         WHERE DATE(transaction_date) = CURRENT_DATE"),
                            (0, database_1.query)("SELECT COUNT(*) as count, COALESCE(SUM(remaining_amount), 0) as amount \n         FROM sales \n         WHERE status IN ('draft', 'partial') \n         AND remaining_amount > 0"),
                        ])];
                    case 1:
                        _a = _f.sent(), todayResult = _a[0], pendingResult = _a[1];
                        return [2 /*return*/, {
                                today: parseInt(((_b = todayResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10),
                                todayAmount: parseFloat(((_c = todayResult.rows[0]) === null || _c === void 0 ? void 0 : _c.amount) || '0'),
                                pending: parseInt(((_d = pendingResult.rows[0]) === null || _d === void 0 ? void 0 : _d.count) || '0', 10),
                                pendingAmount: parseFloat(((_e = pendingResult.rows[0]) === null || _e === void 0 ? void 0 : _e.amount) || '0'),
                            }];
                }
            });
        });
    };
    /**
     * Get recent customers
     */
    ReportService.prototype.getRecentCustomers = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var result;
            if (limit === void 0) { limit = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT * FROM customers \n       ORDER BY created_at DESC \n       LIMIT $1", [limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    /**
     * Get pending payments summary
     */
    ReportService.prototype.getPendingPaymentsSummary = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT \n        s.id,\n        s.sale_number,\n        s.customer_id,\n        c.full_name as customer_name,\n        s.final_amount,\n        s.paid_amount,\n        s.remaining_amount,\n        s.sale_date,\n        CURRENT_DATE - DATE(s.sale_date) as days_overdue\n       FROM sales s\n       LEFT JOIN customers c ON s.customer_id = c.id\n       WHERE s.status IN ('draft', 'partial') \n       AND s.remaining_amount > 0\n       ORDER BY s.sale_date ASC\n       LIMIT 10")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    // ==========================================
    // SALES REPORTS
    // ==========================================
    /**
     * Generate comprehensive sales report
     */
    ReportService.prototype.getSalesReport = function (dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var startDate, endDate, _a, sales, stats, byCategory, byPayment, topProducts, topCustomers, dailyBreakdown, totalRevenue, totalCost, grossProfit, profitMargin, period, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        startDate = dateRange === null || dateRange === void 0 ? void 0 : dateRange.startDate;
                        endDate = dateRange === null || dateRange === void 0 ? void 0 : dateRange.endDate;
                        return [4 /*yield*/, Promise.all([
                                this.getSalesInPeriod(startDate, endDate),
                                Sale_1.default.getStatistics(startDate, endDate),
                                this.getSalesByCategory(startDate, endDate),
                                this.getSalesByPaymentMethod(startDate, endDate),
                                this.getTopSellingProducts(10, startDate, endDate),
                                this.getTopCustomers(10, startDate, endDate),
                                this.getDailySalesBreakdown(startDate, endDate),
                            ])];
                    case 1:
                        _a = _b.sent(), sales = _a[0], stats = _a[1], byCategory = _a[2], byPayment = _a[3], topProducts = _a[4], topCustomers = _a[5], dailyBreakdown = _a[6];
                        totalRevenue = stats.totalAmount;
                        totalCost = 0;
                        grossProfit = totalRevenue - totalCost;
                        profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
                        period = this.formatPeriod(startDate, endDate);
                        return [2 /*return*/, {
                                period: period,
                                totalSales: stats.totalAmount,
                                totalRevenue: stats.totalRevenue,
                                totalCost: totalCost,
                                grossProfit: grossProfit,
                                profitMargin: profitMargin,
                                salesCount: stats.total,
                                averageSaleValue: stats.averageSaleAmount,
                                completedSales: stats.completed,
                                pendingSales: stats.pending,
                                cancelledSales: stats.cancelled,
                                byCategory: byCategory,
                                byPaymentMethod: byPayment,
                                topProducts: topProducts,
                                topCustomers: topCustomers,
                                dailyBreakdown: dailyBreakdown,
                            }];
                    case 2:
                        error_2 = _b.sent();
                        logger_1.default.error('Error in getSalesReport:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get sales in period
     */
    ReportService.prototype.getSalesInPeriod = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = "WHERE status IN ('completed', 'partial')";
                        params = [];
                        if (startDate && endDate) {
                            whereClause += ' AND sale_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT * FROM sales ".concat(whereClause), params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    /**
     * Get sales by category
     */
    ReportService.prototype.getSalesByCategory = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result, total;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = "WHERE s.status IN ('completed', 'partial')";
                        params = [];
                        if (startDate && endDate) {
                            whereClause += ' AND s.sale_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT \n        p.category,\n        COUNT(DISTINCT s.id) as count,\n        SUM(si.total_price) as revenue\n       FROM sale_items si\n       JOIN sales s ON si.sale_id = s.id\n       JOIN products p ON si.product_id = p.id\n       ".concat(whereClause, "\n       GROUP BY p.category\n       ORDER BY revenue DESC"), params)];
                    case 1:
                        result = _a.sent();
                        total = result.rows.reduce(function (sum, row) { return sum + parseFloat(row.revenue); }, 0);
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                category: row.category,
                                count: parseInt(row.count, 10),
                                revenue: parseFloat(row.revenue),
                                percentage: total > 0 ? (parseFloat(row.revenue) / total) * 100 : 0,
                            }); })];
                }
            });
        });
    };
    /**
     * Get sales by payment method
     */
    ReportService.prototype.getSalesByPaymentMethod = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result, total;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = "WHERE status IN ('completed', 'partial')";
                        params = [];
                        if (startDate && endDate) {
                            whereClause += ' AND sale_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT \n        payment_method as method,\n        COUNT(*) as count,\n        SUM(final_amount) as amount\n       FROM sales\n       ".concat(whereClause, "\n       GROUP BY payment_method\n       ORDER BY amount DESC"), params)];
                    case 1:
                        result = _a.sent();
                        total = result.rows.reduce(function (sum, row) { return sum + parseFloat(row.amount); }, 0);
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                method: row.method,
                                count: parseInt(row.count, 10),
                                amount: parseFloat(row.amount),
                                percentage: total > 0 ? (parseFloat(row.amount) / total) * 100 : 0,
                            }); })];
                }
            });
        });
    };
    /**
     * Get top selling products
     */
    ReportService.prototype.getTopSellingProducts = function () {
        return __awaiter(this, arguments, void 0, function (limit, startDate, endDate) {
            var whereClause, params, result;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = "WHERE s.status IN ('completed', 'partial')";
                        params = [];
                        if (startDate && endDate) {
                            whereClause += ' AND s.sale_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        params.push(limit);
                        return [4 /*yield*/, (0, database_1.query)("SELECT \n        si.product_id,\n        si.product_name,\n        SUM(si.quantity) as quantity_sold,\n        SUM(si.total_price) as revenue\n       FROM sale_items si\n       JOIN sales s ON si.sale_id = s.id\n       ".concat(whereClause, "\n       GROUP BY si.product_id, si.product_name\n       ORDER BY quantity_sold DESC\n       LIMIT $").concat(params.length), params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                product_id: row.product_id,
                                product_name: row.product_name,
                                quantity_sold: parseInt(row.quantity_sold, 10),
                                revenue: parseFloat(row.revenue),
                            }); })];
                }
            });
        });
    };
    /**
     * Get top customers
     */
    ReportService.prototype.getTopCustomers = function () {
        return __awaiter(this, arguments, void 0, function (limit, startDate, endDate) {
            var whereClause, params, result;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = "WHERE s.status IN ('completed', 'partial') AND s.customer_id IS NOT NULL";
                        params = [];
                        if (startDate && endDate) {
                            whereClause += ' AND s.sale_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        params.push(limit);
                        return [4 /*yield*/, (0, database_1.query)("SELECT \n        c.id as customer_id,\n        c.full_name as customer_name,\n        COUNT(s.id) as sale_count,\n        SUM(s.final_amount) as total_amount\n       FROM sales s\n       JOIN customers c ON s.customer_id = c.id\n       ".concat(whereClause, "\n       GROUP BY c.id, c.full_name\n       ORDER BY total_amount DESC\n       LIMIT $").concat(params.length), params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                customer_id: row.customer_id,
                                customer_name: row.customer_name,
                                sale_count: parseInt(row.sale_count, 10),
                                total_amount: parseFloat(row.total_amount),
                            }); })];
                }
            });
        });
    };
    /**
     * Get daily sales breakdown
     */
    ReportService.prototype.getDailySalesBreakdown = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = "WHERE status IN ('completed', 'partial')";
                        params = [];
                        if (startDate && endDate) {
                            whereClause += ' AND sale_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        else {
                            // Default to last 30 days
                            whereClause += " AND sale_date >= NOW() - INTERVAL '30 days'";
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT \n        DATE(sale_date) as date,\n        COUNT(*) as sales_count,\n        SUM(final_amount) as revenue\n       FROM sales\n       ".concat(whereClause, "\n       GROUP BY DATE(sale_date)\n       ORDER BY date ASC"), params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                date: (0, helpers_1.toJalaliDate)(row.date),
                                sales_count: parseInt(row.sales_count, 10),
                                revenue: parseFloat(row.revenue),
                            }); })];
                }
            });
        });
    };
    // ==========================================
    // INVENTORY REPORTS
    // ==========================================
    /**
     * Generate comprehensive inventory report
     */
    ReportService.prototype.getInventoryReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats_1, products_1, byCategory, byType, byCarat, topValueProducts, lowStockProducts, outOfStockProducts, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, Product_1.default.getStatistics()];
                    case 1:
                        stats_1 = _a.sent();
                        return [4 /*yield*/, Product_1.default.findAll({ isActive: true })];
                    case 2:
                        products_1 = _a.sent();
                        byCategory = Object.entries(stats_1.byCategory).map(function (_a) {
                            var category = _a[0], count = _a[1];
                            var categoryProducts = products_1.filter(function (p) { return p.category === category; });
                            var value = categoryProducts.reduce(function (sum, p) { return sum + p.selling_price * p.stock_quantity; }, 0);
                            var weight = categoryProducts.reduce(function (sum, p) { return sum + p.weight * p.stock_quantity; }, 0);
                            return {
                                category: category,
                                count: count,
                                value: value,
                                weight: weight,
                                percentage: stats_1.total > 0 ? (count / stats_1.total) * 100 : 0,
                            };
                        });
                        byType = Object.entries(stats_1.byType).map(function (_a) {
                            var type = _a[0], count = _a[1];
                            var typeProducts = products_1.filter(function (p) { return p.type === type; });
                            var value = typeProducts.reduce(function (sum, p) { return sum + p.selling_price * p.stock_quantity; }, 0);
                            return {
                                type: type,
                                count: count,
                                value: value,
                                percentage: stats_1.total > 0 ? (count / stats_1.total) * 100 : 0,
                            };
                        });
                        return [4 /*yield*/, this.getInventoryByCarat()];
                    case 3:
                        byCarat = _a.sent();
                        topValueProducts = products_1
                            .map(function (p) { return (__assign(__assign({}, p), { total_value: p.selling_price * p.stock_quantity })); })
                            .sort(function (a, b) { return b.total_value - a.total_value; })
                            .slice(0, 10);
                        return [4 /*yield*/, Product_1.default.findLowStock()];
                    case 4:
                        lowStockProducts = _a.sent();
                        return [4 /*yield*/, Product_1.default.findOutOfStock()];
                    case 5:
                        outOfStockProducts = _a.sent();
                        return [2 /*return*/, {
                                totalProducts: stats_1.total,
                                totalValue: stats_1.totalValue,
                                totalWeight: stats_1.totalWeight,
                                activeProducts: stats_1.active,
                                inactiveProducts: stats_1.inactive,
                                lowStockItems: stats_1.lowStock,
                                outOfStockItems: stats_1.outOfStock,
                                byCategory: byCategory,
                                byType: byType,
                                byCarat: byCarat,
                                topValueProducts: topValueProducts,
                                lowStockProducts: lowStockProducts,
                                outOfStockProducts: outOfStockProducts,
                            }];
                    case 6:
                        error_3 = _a.sent();
                        logger_1.default.error('Error in getInventoryReport:', error_3);
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get inventory by carat
     */
    ReportService.prototype.getInventoryByCarat = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT \n        carat,\n        COUNT(*) as count,\n        SUM(weight * stock_quantity) as weight,\n        SUM(selling_price * stock_quantity) as value\n       FROM products\n       WHERE is_active = true\n       GROUP BY carat\n       ORDER BY carat DESC")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                carat: row.carat,
                                count: parseInt(row.count, 10),
                                weight: parseFloat(row.weight || '0'),
                                value: parseFloat(row.value || '0'),
                            }); })];
                }
            });
        });
    };
    // ==========================================
    // CUSTOMER REPORTS
    // ==========================================
    /**
     * Generate comprehensive customer report
     */
    ReportService.prototype.getCustomerReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats, _a, topCustomers, customersByCity, segmentation, retentionResult, newCustomersResult, inactiveCustomersResult, error_4;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Customer_1.default.getStatistics()];
                    case 1:
                        stats = _d.sent();
                        return [4 /*yield*/, Promise.all([
                                Customer_1.default.getTopCustomers(10),
                                this.getCustomersByCity(),
                                this.getCustomerSegmentation(),
                                this.getCustomerRetentionRate(),
                                (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n           WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)"),
                                (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n           WHERE is_active = true \n           AND (last_purchase_date IS NULL OR last_purchase_date < NOW() - INTERVAL '90 days')"),
                            ])];
                    case 2:
                        _a = _d.sent(), topCustomers = _a[0], customersByCity = _a[1], segmentation = _a[2], retentionResult = _a[3], newCustomersResult = _a[4], inactiveCustomersResult = _a[5];
                        return [2 /*return*/, {
                                totalCustomers: stats.total,
                                activeCustomers: stats.active,
                                newCustomers: parseInt(((_b = newCustomersResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10),
                                inactiveCustomers: parseInt(((_c = inactiveCustomersResult.rows[0]) === null || _c === void 0 ? void 0 : _c.count) || '0', 10),
                                customersWithDebt: stats.withDebt,
                                customersWithCredit: stats.withCredit,
                                totalDebt: stats.totalDebt,
                                totalCredit: stats.totalCredit,
                                totalPurchases: stats.totalPurchases,
                                averagePurchasePerCustomer: stats.active > 0 ? stats.totalPurchases / stats.active : 0,
                                topCustomers: topCustomers,
                                customersByCity: customersByCity,
                                customerSegmentation: segmentation,
                                retentionRate: retentionResult,
                            }];
                    case 3:
                        error_4 = _d.sent();
                        logger_1.default.error('Error in getCustomerReport:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get customers by city
     */
    ReportService.prototype.getCustomersByCity = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, total;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT \n        city,\n        COUNT(*) as count\n       FROM customers\n       WHERE city IS NOT NULL AND is_active = true\n       GROUP BY city\n       ORDER BY count DESC\n       LIMIT 10")];
                    case 1:
                        result = _a.sent();
                        total = result.rows.reduce(function (sum, row) { return sum + parseInt(row.count, 10); }, 0);
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                city: row.city,
                                count: parseInt(row.count, 10),
                                percentage: total > 0 ? (parseInt(row.count, 10) / total) * 100 : 0,
                            }); })];
                }
            });
        });
    };
    /**
     * Get customer segmentation
     */
    ReportService.prototype.getCustomerSegmentation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, vipResult, regularResult, occasionalResult, inactiveResult;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE total_purchases > 50000000 AND is_active = true"),
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE total_purchases BETWEEN 10000000 AND 50000000 AND is_active = true"),
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE total_purchases BETWEEN 1 AND 10000000 AND is_active = true"),
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE is_active = true \n         AND (last_purchase_date IS NULL OR last_purchase_date < NOW() - INTERVAL '90 days')"),
                        ])];
                    case 1:
                        _a = _f.sent(), vipResult = _a[0], regularResult = _a[1], occasionalResult = _a[2], inactiveResult = _a[3];
                        return [2 /*return*/, {
                                vip: parseInt(((_b = vipResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10),
                                regular: parseInt(((_c = regularResult.rows[0]) === null || _c === void 0 ? void 0 : _c.count) || '0', 10),
                                occasional: parseInt(((_d = occasionalResult.rows[0]) === null || _d === void 0 ? void 0 : _d.count) || '0', 10),
                                inactive: parseInt(((_e = inactiveResult.rows[0]) === null || _e === void 0 ? void 0 : _e.count) || '0', 10),
                            }];
                }
            });
        });
    };
    /**
     * Get customer retention rate
     */
    ReportService.prototype.getCustomerRetentionRate = function () {
        return __awaiter(this, arguments, void 0, function (months) {
            var result, total, active;
            var _a, _b;
            if (months === void 0) { months = 3; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT \n        COUNT(*) as total,\n        SUM(CASE WHEN last_purchase_date >= NOW() - INTERVAL '".concat(months, " months' THEN 1 ELSE 0 END) as active\n       FROM customers \n       WHERE is_active = true \n       AND created_at < NOW() - INTERVAL '").concat(months, " months'"))];
                    case 1:
                        result = _c.sent();
                        total = parseInt(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.total) || '0', 10);
                        active = parseInt(((_b = result.rows[0]) === null || _b === void 0 ? void 0 : _b.active) || '0', 10);
                        return [2 /*return*/, total > 0 ? (active / total) * 100 : 0];
                }
            });
        });
    };
    // ==========================================
    // FINANCIAL REPORTS
    // ==========================================
    /**
     * Generate financial report
     */
    ReportService.prototype.getFinancialReport = function (dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var startDate, endDate, _a, revenue, expenses, cashFlow, byPaymentMethod, accountsReceivable, period, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        startDate = dateRange === null || dateRange === void 0 ? void 0 : dateRange.startDate;
                        endDate = dateRange === null || dateRange === void 0 ? void 0 : dateRange.endDate;
                        return [4 /*yield*/, Promise.all([
                                this.getRevenue(startDate, endDate),
                                this.getExpenses(startDate, endDate),
                                this.getCashFlow(startDate, endDate),
                                this.getTransactionsByPaymentMethod(startDate, endDate),
                                this.getAccountsReceivable(),
                            ])];
                    case 1:
                        _a = _b.sent(), revenue = _a[0], expenses = _a[1], cashFlow = _a[2], byPaymentMethod = _a[3], accountsReceivable = _a[4];
                        period = this.formatPeriod(startDate, endDate);
                        return [2 /*return*/, {
                                period: period,
                                revenue: revenue,
                                expenses: expenses,
                                netIncome: revenue.total - expenses.total,
                                cashFlow: cashFlow,
                                byPaymentMethod: byPaymentMethod,
                                accountsReceivable: accountsReceivable,
                                accountsPayable: 0, // Placeholder
                            }];
                    case 2:
                        error_5 = _b.sent();
                        logger_1.default.error('Error in getFinancialReport:', error_5);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get revenue breakdown
     */
    ReportService.prototype.getRevenue = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result, sales, payments;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        whereClause = '';
                        params = [];
                        if (startDate && endDate) {
                            whereClause = 'WHERE transaction_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT \n        SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END) as sales,\n        SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as payments\n       FROM transactions\n       ".concat(whereClause), params)];
                    case 1:
                        result = _c.sent();
                        sales = parseFloat(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.sales) || '0');
                        payments = parseFloat(((_b = result.rows[0]) === null || _b === void 0 ? void 0 : _b.payments) || '0');
                        return [2 /*return*/, {
                                sales: sales,
                                payments: payments,
                                total: sales + payments,
                            }];
                }
            });
        });
    };
    /**
     * Get expenses breakdown
     */
    ReportService.prototype.getExpenses = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result, purchases, returns, otherExpenses;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        whereClause = '';
                        params = [];
                        if (startDate && endDate) {
                            whereClause = 'WHERE transaction_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT \n        SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END) as purchases,\n        SUM(CASE WHEN type = 'return' THEN amount ELSE 0 END) as returns,\n        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as other_expenses\n       FROM transactions\n       ".concat(whereClause), params)];
                    case 1:
                        result = _d.sent();
                        purchases = parseFloat(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.purchases) || '0');
                        returns = parseFloat(((_b = result.rows[0]) === null || _b === void 0 ? void 0 : _b.returns) || '0');
                        otherExpenses = parseFloat(((_c = result.rows[0]) === null || _c === void 0 ? void 0 : _c.other_expenses) || '0');
                        return [2 /*return*/, {
                                purchases: purchases,
                                returns: returns,
                                otherExpenses: otherExpenses,
                                total: purchases + returns + otherExpenses,
                            }];
                }
            });
        });
    };
    /**
     * Get cash flow
     */
    ReportService.prototype.getCashFlow = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var cashFlow;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Transaction_1.default.getCashFlow(startDate, endDate)];
                    case 1:
                        cashFlow = _a.sent();
                        return [2 /*return*/, {
                                inflow: cashFlow.income,
                                outflow: cashFlow.expense,
                                net: cashFlow.netCashFlow,
                            }];
                }
            });
        });
    };
    /**
     * Get transactions by payment method
     */
    ReportService.prototype.getTransactionsByPaymentMethod = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result, total;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = '';
                        params = [];
                        if (startDate && endDate) {
                            whereClause = 'WHERE transaction_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT \n        payment_method as method,\n        SUM(amount) as amount\n       FROM transactions\n       ".concat(whereClause, "\n       GROUP BY payment_method\n       ORDER BY amount DESC"), params)];
                    case 1:
                        result = _a.sent();
                        total = result.rows.reduce(function (sum, row) { return sum + parseFloat(row.amount); }, 0);
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                method: row.method,
                                amount: parseFloat(row.amount),
                                percentage: total > 0 ? (parseFloat(row.amount) / total) * 100 : 0,
                            }); })];
                }
            });
        });
    };
    /**
     * Get accounts receivable
     */
    ReportService.prototype.getAccountsReceivable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT COALESCE(SUM(remaining_amount), 0) as total\n       FROM sales\n       WHERE status IN ('draft', 'partial') \n       AND remaining_amount > 0")];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, parseFloat(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.total) || '0')];
                }
            });
        });
    };
    // ==========================================
    // PROFIT & LOSS
    // ==========================================
    /**
     * Generate profit & loss report
     */
    ReportService.prototype.getProfitLossReport = function (dateRange) {
        return __awaiter(this, void 0, void 0, function () {
            var startDate, endDate, revenue, costOfGoodsSold, grossProfit, grossProfitMargin, operatingExpenses, operatingIncome, netIncome, netProfitMargin;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startDate = dateRange === null || dateRange === void 0 ? void 0 : dateRange.startDate;
                        endDate = dateRange === null || dateRange === void 0 ? void 0 : dateRange.endDate;
                        return [4 /*yield*/, this.getTotalRevenue(startDate, endDate)];
                    case 1:
                        revenue = _a.sent();
                        costOfGoodsSold = 0;
                        grossProfit = revenue - costOfGoodsSold;
                        grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
                        return [4 /*yield*/, this.getOperatingExpenses(startDate, endDate)];
                    case 2:
                        operatingExpenses = _a.sent();
                        operatingIncome = grossProfit - operatingExpenses;
                        netIncome = operatingIncome;
                        netProfitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
                        return [2 /*return*/, {
                                period: this.formatPeriod(startDate, endDate),
                                revenue: revenue,
                                costOfGoodsSold: costOfGoodsSold,
                                grossProfit: grossProfit,
                                grossProfitMargin: grossProfitMargin,
                                operatingExpenses: operatingExpenses,
                                operatingIncome: operatingIncome,
                                netIncome: netIncome,
                                netProfitMargin: netProfitMargin,
                            }];
                }
            });
        });
    };
    /**
     * Get total revenue
     */
    ReportService.prototype.getTotalRevenue = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        whereClause = "WHERE status IN ('completed', 'partial')";
                        params = [];
                        if (startDate && endDate) {
                            whereClause += ' AND sale_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT COALESCE(SUM(final_amount), 0) as total FROM sales ".concat(whereClause), params)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, parseFloat(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.total) || '0')];
                }
            });
        });
    };
    /**
     * Get operating expenses
     */
    ReportService.prototype.getOperatingExpenses = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, params, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        whereClause = "WHERE type = 'expense'";
                        params = [];
                        if (startDate && endDate) {
                            whereClause += ' AND transaction_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, (0, database_1.query)("SELECT COALESCE(SUM(amount), 0) as total FROM transactions ".concat(whereClause), params)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, parseFloat(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.total) || '0')];
                }
            });
        });
    };
    // ==========================================
    // GOLD PRICE TRENDS
    // ==========================================
    /**
     * Get gold price trend
     */
    ReportService.prototype.getGoldPriceTrend = function (carat_1) {
        return __awaiter(this, arguments, void 0, function (carat, days) {
            var result, history, currentPrice, previousPrice, change, changePercentage;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT date, price_per_gram\n       FROM gold_prices\n       WHERE carat = $1\n       AND date >= CURRENT_DATE - INTERVAL '".concat(days, " days'\n       ORDER BY date ASC"), [carat])];
                    case 1:
                        result = _a.sent();
                        history = result.rows.map(function (row) { return ({
                            date: (0, helpers_1.toJalaliDate)(row.date),
                            price: parseFloat(row.price_per_gram),
                        }); });
                        currentPrice = history.length > 0 ? history[history.length - 1].price : 0;
                        previousPrice = history.length > 1 ? history[history.length - 2].price : currentPrice;
                        change = currentPrice - previousPrice;
                        changePercentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
                        return [2 /*return*/, {
                                carat: carat,
                                currentPrice: currentPrice,
                                previousPrice: previousPrice,
                                change: change,
                                changePercentage: changePercentage,
                                history: history,
                            }];
                }
            });
        });
    };
    // ==========================================
    // COMPARATIVE REPORTS
    // ==========================================
    /**
     * Get comparative sales report
     */
    ReportService.prototype.getComparativeSalesReport = function (currentPeriod, previousPeriod) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, current, previous, salesGrowth, revenueGrowth, profitGrowth, averageValueGrowth;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.getSalesReport(currentPeriod),
                            this.getSalesReport(previousPeriod),
                        ])];
                    case 1:
                        _a = _b.sent(), current = _a[0], previous = _a[1];
                        salesGrowth = (0, helpers_1.percentageChange)(previous.salesCount, current.salesCount);
                        revenueGrowth = (0, helpers_1.percentageChange)(previous.totalRevenue, current.totalRevenue);
                        profitGrowth = (0, helpers_1.percentageChange)(previous.grossProfit, current.grossProfit);
                        averageValueGrowth = (0, helpers_1.percentageChange)(previous.averageSaleValue, current.averageSaleValue);
                        return [2 /*return*/, {
                                currentPeriod: current,
                                previousPeriod: previous,
                                comparison: {
                                    salesGrowth: salesGrowth,
                                    revenueGrowth: revenueGrowth,
                                    profitGrowth: profitGrowth,
                                    averageValueGrowth: averageValueGrowth,
                                },
                            }];
                }
            });
        });
    };
    // ==========================================
    // UTILITY METHODS
    // ==========================================
    /**
     * Format period string
     */
    ReportService.prototype.formatPeriod = function (startDate, endDate) {
        if (!startDate || !endDate) {
            return 'همه زمان‌ها';
        }
        return "".concat((0, helpers_1.toJalaliDate)(startDate), " \u062A\u0627 ").concat((0, helpers_1.toJalaliDate)(endDate));
    };
    /**
     * Export report to JSON
     */
    ReportService.prototype.exportReportToJSON = function (reportData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, JSON.stringify(reportData, null, 2)];
            });
        });
    };
    /**
     * Get quick stats (for widgets)
     */
    ReportService.prototype.getQuickStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, todaySales, todayRevenue, pendingPayments, lowStock;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            Sale_1.default.getTodaySales(),
                            Sale_1.default.getTodayRevenue(),
                            this.getAccountsReceivable(),
                            Product_1.default.findLowStock(),
                        ])];
                    case 1:
                        _a = _b.sent(), todaySales = _a[0], todayRevenue = _a[1], pendingPayments = _a[2], lowStock = _a[3];
                        return [2 /*return*/, {
                                todaySalesCount: todaySales.length,
                                todayRevenue: todayRevenue,
                                pendingPaymentsAmount: pendingPayments,
                                lowStockCount: lowStock.length,
                            }];
                }
            });
        });
    };
    return ReportService;
}());
// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================
exports.default = new ReportService();
