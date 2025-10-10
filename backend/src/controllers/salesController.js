"use strict";
// ==========================================
// ZARMIND - Sales Controller
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
exports.generateReceipt = exports.generateInvoice = exports.getConversionRate = exports.getSalesTrend = exports.getBestSellingProducts = exports.getSalesByDateRange = exports.getStatistics = exports.getRecentSales = exports.getTodayRevenue = exports.getTodaySales = exports.getPerformance = exports.getSalesReport = exports.getOverduePayments = exports.getPendingPayments = exports.getSalesByCustomer = exports.addPayment = exports.deleteSale = exports.cancelSale = exports.updateSaleStatus = exports.updateSale = exports.getSales = exports.getSaleByNumber = exports.getSale = exports.createSale = void 0;
var error_middleware_1 = require("../middleware/error.middleware");
var salesService_1 = require("../services/salesService");
var auth_middleware_1 = require("../middleware/auth.middleware");
var types_1 = require("../types");
// ==========================================
// HELPERS
// ==========================================
var requireUser = function (req) {
    var userId = (0, auth_middleware_1.getCurrentUserId)(req);
    if (!userId)
        throw new types_1.UnauthorizedError('کاربر احراز هویت نشده است');
    return userId;
};
var parseBoolean = function (val) {
    if (val === undefined)
        return undefined;
    if (typeof val === 'boolean')
        return val;
    var v = String(val).toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(v))
        return true;
    if (['false', '0', 'no', 'n'].includes(v))
        return false;
    return undefined;
};
var parseDate = function (val, fieldName) {
    if (!val)
        return undefined;
    var d = new Date(String(val));
    if (isNaN(d.getTime())) {
        throw new types_1.ValidationError("\u062A\u0627\u0631\u06CC\u062E ".concat(fieldName, " \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A"));
    }
    return d;
};
var isEnumValue = function (val, enumObj) {
    return Object.values(enumObj).includes(val);
};
// Build sale filters from query
var buildSaleFilters = function (req) {
    var _a = req.query, customer_id = _a.customer_id, status = _a.status, sale_type = _a.sale_type, payment_method = _a.payment_method, startDate = _a.startDate, endDate = _a.endDate, search = _a.search;
    var statusEnum;
    var saleTypeEnum;
    var paymentMethodEnum;
    if (status) {
        var s = String(status);
        if (!isEnumValue(s, types_1.SaleStatus)) {
            throw new types_1.ValidationError('وضعیت فروش نامعتبر است');
        }
        statusEnum = s;
    }
    if (sale_type) {
        var st = String(sale_type);
        if (!isEnumValue(st, types_1.SaleType)) {
            throw new types_1.ValidationError('نوع فروش نامعتبر است');
        }
        saleTypeEnum = st;
    }
    if (payment_method) {
        var pm = String(payment_method);
        if (!isEnumValue(pm, types_1.PaymentMethod)) {
            throw new types_1.ValidationError('روش پرداخت نامعتبر است');
        }
        paymentMethodEnum = pm;
    }
    return {
        customer_id: customer_id ? String(customer_id) : undefined,
        status: statusEnum,
        sale_type: saleTypeEnum,
        payment_method: paymentMethodEnum,
        startDate: parseDate(startDate, 'شروع'),
        endDate: parseDate(endDate, 'پایان'),
        search: search ? String(search) : undefined,
    };
};
// ==========================================
// CONTROLLERS
// ==========================================
/**
 * Create sale
 * POST /api/sales
 */
exports.createSale = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, sale;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, salesService_1.default.createSale(__assign({}, req.body), userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                sale = _a.sent();
                res.status(201).json({
                    success: true,
                    message: 'فروش با موفقیت ثبت شد',
                    data: sale,
                });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get sale by ID
 * GET /api/sales/:id
 */
exports.getSale = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, sale;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                return [4 /*yield*/, salesService_1.default.getSaleById(req.params.id, userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                sale = _a.sent();
                res.sendSuccess(sale, 'اطلاعات فروش با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get sale by sale number
 * GET /api/sales/number/:sale_number
 */
exports.getSaleByNumber = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sale;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, salesService_1.default.getSaleBySaleNumber(req.params.sale_number)];
            case 1:
                sale = _a.sent();
                res.sendSuccess(sale, 'اطلاعات فروش با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get sales (with optional pagination + filters)
 * GET /api/sales
 * Query: page, limit, customer_id, status, sale_type, payment_method, startDate, endDate, search
 */
exports.getSales = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, filters, result, sales;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
                limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
                filters = buildSaleFilters(req);
                if (!(page && limit)) return [3 /*break*/, 2];
                return [4 /*yield*/, salesService_1.default.getSalesWithPagination(page, limit, filters)];
            case 1:
                result = _a.sent();
                res.sendSuccess(result, 'لیست فروش‌ها (صفحه‌بندی) دریافت شد', {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                });
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, salesService_1.default.getSales(filters)];
            case 3:
                sales = _a.sent();
                res.sendSuccess(sales, 'لیست فروش‌ها دریافت شد', { total: sales.length });
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * Update sale
 * PUT /api/sales/:id
 */
exports.updateSale = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, salesService_1.default.updateSale(req.params.id, __assign({}, req.body), userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'فروش با موفقیت بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Update sale status
 * PATCH /api/sales/:id/status
 * Body: { status: 'draft'|'completed'|'partial'|'cancelled'|'returned' }
 */
exports.updateSaleStatus = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, status, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                status = String(req.body.status);
                if (!isEnumValue(status, types_1.SaleStatus)) {
                    throw new types_1.ValidationError('وضعیت فروش نامعتبر است');
                }
                return [4 /*yield*/, salesService_1.default.updateSaleStatus(req.params.id, status, userId)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'وضعیت فروش بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Cancel sale
 * POST /api/sales/:id/cancel
 * Body: { reason?: string }
 */
exports.cancelSale = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, reason, cancelled;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                reason = req.body.reason ? String(req.body.reason) : undefined;
                return [4 /*yield*/, salesService_1.default.cancelSale(req.params.id, userId, reason, req.ip, req.get('user-agent') || undefined)];
            case 1:
                cancelled = _a.sent();
                res.sendSuccess(cancelled, 'فروش با موفقیت لغو شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Delete sale (draft only)
 * DELETE /api/sales/:id
 */
exports.deleteSale = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, salesService_1.default.deleteSale(req.params.id, userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                _a.sent();
                res.sendSuccess(null, 'فروش با موفقیت حذف شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Add payment to sale
 * POST /api/sales/:id/payments
 * Body: { amount: number, payment_method: PaymentMethod, reference_number?: string, notes?: string }
 */
exports.addPayment = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, amount, payment_method, reference_number, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                amount = Number(req.body.amount);
                payment_method = String(req.body.payment_method);
                reference_number = req.body.reference_number ? String(req.body.reference_number) : undefined;
                if (isNaN(amount) || amount <= 0) {
                    throw new types_1.ValidationError('مبلغ پرداخت باید عددی و مثبت باشد');
                }
                if (!isEnumValue(payment_method, types_1.PaymentMethod)) {
                    throw new types_1.ValidationError('روش پرداخت نامعتبر است');
                }
                return [4 /*yield*/, salesService_1.default.addPayment({
                        sale_id: req.params.id,
                        amount: amount,
                        payment_method: payment_method,
                        reference_number: reference_number,
                        notes: req.body.notes ? String(req.body.notes) : undefined,
                        processed_by: userId,
                    })];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'پرداخت با موفقیت ثبت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get sales by customer
 * GET /api/sales/customer/:customer_id
 */
exports.getSalesByCustomer = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, salesService_1.default.getSalesByCustomer(req.params.customer_id)];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'لیست فروش‌های مشتری دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Pending payments
 * GET /api/sales/pending-payments
 */
exports.getPendingPayments = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, salesService_1.default.getPendingPayments()];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'لیست پرداخت‌های معوق دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Overdue payments
 * GET /api/sales/overdue-payments?days=30
 */
exports.getOverduePayments = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var days, list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
                return [4 /*yield*/, salesService_1.default.getOverduePayments(days)];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'لیست پرداخت‌های سررسید گذشته دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// REPORTS & ANALYTICS
// ==========================================
/**
 * Sales report
 * GET /api/sales/report?startDate=...&endDate=...
 */
exports.getSalesReport = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var start, end, report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                start = parseDate(req.query.startDate, 'شروع');
                end = parseDate(req.query.endDate, 'پایان');
                return [4 /*yield*/, salesService_1.default.getSalesReport(start, end)];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش فروش دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Sales performance (today/week/month/year)
 * GET /api/sales/performance
 */
exports.getPerformance = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, salesService_1.default.getSalesPerformance()];
            case 1:
                data = _a.sent();
                res.sendSuccess(data, 'عملکرد فروش دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Today sales
 * GET /api/sales/today
 */
exports.getTodaySales = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, salesService_1.default.getTodaySales()];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'فروش‌های امروز دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Today revenue
 * GET /api/sales/today/revenue
 */
exports.getTodayRevenue = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var total;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, salesService_1.default.getTodayRevenue()];
            case 1:
                total = _a.sent();
                res.sendSuccess({ total: total }, 'درآمد امروز دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Recent sales
 * GET /api/sales/recent?limit=10
 */
exports.getRecentSales = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
                return [4 /*yield*/, salesService_1.default.getRecentSales(limit)];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'آخرین فروش‌ها دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Sales statistics (aggregate)
 * GET /api/sales/statistics?startDate=...&endDate=...
 */
exports.getStatistics = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var start, end, stats;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                start = parseDate(req.query.startDate, 'شروع');
                end = parseDate(req.query.endDate, 'پایان');
                return [4 /*yield*/, salesService_1.default.getStatistics(start, end)];
            case 1:
                stats = _a.sent();
                res.sendSuccess(stats, 'آمار فروش دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Sales by date range
 * GET /api/sales/range?startDate=...&endDate=...
 */
exports.getSalesByDateRange = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var start, end, list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                start = parseDate(req.query.startDate, 'شروع');
                end = parseDate(req.query.endDate, 'پایان');
                if (!start || !end) {
                    throw new types_1.ValidationError('محدوده تاریخ الزامی است');
                }
                return [4 /*yield*/, salesService_1.default.getSalesByDateRange(start, end)];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'فروش‌های بازه زمانی دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Best selling products
 * GET /api/sales/best-products?limit=10&startDate=...&endDate=...
 */
exports.getBestSellingProducts = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, start, end, list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
                start = parseDate(req.query.startDate, 'شروع');
                end = parseDate(req.query.endDate, 'پایان');
                return [4 /*yield*/, salesService_1.default.getBestSellingProducts(limit, start, end)];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'پرفروش‌ترین محصولات دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Sales trend
 * GET /api/sales/trend?period=daily|weekly|monthly&days=30
 */
exports.getSalesTrend = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var period, days, list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                period = (req.query.period ? String(req.query.period) : 'daily');
                if (!['daily', 'weekly', 'monthly'].includes(period)) {
                    throw new types_1.ValidationError('دوره نامعتبر است (daily | weekly | monthly)');
                }
                days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
                return [4 /*yield*/, salesService_1.default.getSalesTrend(period, days)];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'روند فروش دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Conversion rate (drafts to completed)
 * GET /api/sales/conversion?startDate=...&endDate=...
 */
exports.getConversionRate = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var start, end, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                start = parseDate(req.query.startDate, 'شروع');
                end = parseDate(req.query.endDate, 'پایان');
                return [4 /*yield*/, salesService_1.default.getConversionRate(start, end)];
            case 1:
                result = _a.sent();
                res.sendSuccess(result, 'نرخ تبدیل فروش دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// INVOICE & RECEIPT
// ==========================================
/**
 * Generate invoice
 * GET /api/sales/:id/invoice
 */
exports.generateInvoice = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, salesService_1.default.generateInvoice(req.params.id)];
            case 1:
                data = _a.sent();
                res.sendSuccess(data, 'اطلاعات فاکتور دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Generate receipt by transaction id
 * GET /api/sales/receipt/:transaction_id
 */
exports.generateReceipt = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, salesService_1.default.generateReceipt(req.params.transaction_id)];
            case 1:
                data = _a.sent();
                res.sendSuccess(data, 'اطلاعات رسید دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    // CRUD
    createSale: exports.createSale,
    getSale: exports.getSale,
    getSaleByNumber: exports.getSaleByNumber,
    getSales: exports.getSales,
    updateSale: exports.updateSale,
    updateSaleStatus: exports.updateSaleStatus,
    cancelSale: exports.cancelSale,
    deleteSale: exports.deleteSale,
    // Payments
    addPayment: exports.addPayment,
    getPendingPayments: exports.getPendingPayments,
    getOverduePayments: exports.getOverduePayments,
    getSalesByCustomer: exports.getSalesByCustomer,
    // Reports & Analytics
    getSalesReport: exports.getSalesReport,
    getPerformance: exports.getPerformance,
    getTodaySales: exports.getTodaySales,
    getTodayRevenue: exports.getTodayRevenue,
    getRecentSales: exports.getRecentSales,
    getStatistics: exports.getStatistics,
    getSalesByDateRange: exports.getSalesByDateRange,
    getBestSellingProducts: exports.getBestSellingProducts,
    getSalesTrend: exports.getSalesTrend,
    getConversionRate: exports.getConversionRate,
    // Invoice & Receipt
    generateInvoice: exports.generateInvoice,
    generateReceipt: exports.generateReceipt,
};
