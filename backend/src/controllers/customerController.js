"use strict";
// ==========================================
// ZARMIND - Customer Controller
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
exports.getAvailableCredit = exports.canPurchase = exports.bulkUpdateCreditLimit = exports.bulkSetActive = exports.getInactiveCustomers = exports.getNewCustomers = exports.getLifetimeValue = exports.getCustomersNearingCreditLimit = exports.getDebtorReport = exports.getTopCustomers = exports.getStatistics = exports.getTransactions = exports.getPurchaseHistory = exports.getAccountSummary = exports.advancedSearch = exports.search = exports.getCreditors = exports.getDebtors = exports.updateCreditLimit = exports.settleAccount = exports.reduceDebt = exports.addDebt = exports.adjustBalance = exports.restoreCustomer = exports.deleteCustomer = exports.updateCustomer = exports.getCustomers = exports.getCustomer = exports.createCustomer = void 0;
var error_middleware_1 = require("../middleware/error.middleware");
var customerService_1 = require("../services/customerService");
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
// Build customer filters from query
var buildCustomerFilters = function (req) {
    var _a = req.query, search = _a.search, city = _a.city, hasDebt = _a.hasDebt, hasCredit = _a.hasCredit, isActive = _a.isActive;
    return {
        search: search ? String(search) : undefined,
        city: city ? String(city) : undefined,
        hasDebt: hasDebt !== undefined ? parseBoolean(hasDebt) : undefined,
        hasCredit: hasCredit !== undefined ? parseBoolean(hasCredit) : undefined,
        isActive: isActive !== undefined ? parseBoolean(isActive) : undefined,
    };
};
// ==========================================
// CONTROLLERS
// ==========================================
/**
 * Create customer
 * POST /api/customers
 */
exports.createCustomer = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, customer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, customerService_1.default.createCustomer(__assign({}, req.body), userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                customer = _a.sent();
                res.status(201).json({
                    success: true,
                    message: 'مشتری با موفقیت ثبت شد',
                    data: customer,
                });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get customer by ID
 * GET /api/customers/:id
 */
exports.getCustomer = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, customer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                return [4 /*yield*/, customerService_1.default.getCustomerById(req.params.id, userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                customer = _a.sent();
                res.sendSuccess(customer, 'اطلاعات مشتری با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get customers (with optional pagination)
 * GET /api/customers
 * Query: page, limit, filters...
 */
exports.getCustomers = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, filters, result, customers;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
                limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
                filters = buildCustomerFilters(req);
                if (!(page && limit)) return [3 /*break*/, 2];
                return [4 /*yield*/, customerService_1.default.getCustomersWithPagination(page, limit, filters)];
            case 1:
                result = _a.sent();
                res.sendSuccess(result, 'لیست مشتریان (صفحه‌بندی) دریافت شد', {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                });
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, customerService_1.default.getCustomers(filters)];
            case 3:
                customers = _a.sent();
                res.sendSuccess(customers, 'لیست مشتریان دریافت شد', { total: customers.length });
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * Update customer
 * PUT /api/customers/:id
 */
exports.updateCustomer = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, customerService_1.default.updateCustomer(req.params.id, __assign({}, req.body), userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'مشتری با موفقیت بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Delete (soft) customer
 * DELETE /api/customers/:id
 */
exports.deleteCustomer = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, customerService_1.default.deleteCustomer(req.params.id, userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                _a.sent();
                res.sendSuccess(null, 'مشتری با موفقیت حذف شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Restore customer (activate)
 * PATCH /api/customers/:id/restore
 */
exports.restoreCustomer = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, restored;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, customerService_1.default.restoreCustomer(req.params.id, userId)];
            case 1:
                restored = _a.sent();
                res.sendSuccess(restored, 'مشتری با موفقیت بازیابی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Adjust balance
 * PATCH /api/customers/:id/balance
 * Body: { type: 'increase'|'decrease'|'set', amount: number, reason: string }
 */
exports.adjustBalance = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, type, amount, reason, updated;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = requireUser(req);
                _a = req.body, type = _a.type, amount = _a.amount, reason = _a.reason;
                if (!['increase', 'decrease', 'set'].includes(type)) {
                    throw new types_1.ValidationError('نوع تغییر موجودی نامعتبر است');
                }
                if (amount === undefined || amount === null || isNaN(Number(amount))) {
                    throw new types_1.ValidationError('مبلغ نامعتبر است');
                }
                if (!reason || String(reason).trim().length === 0) {
                    throw new types_1.ValidationError('دلیل تغییر مانده الزامی است');
                }
                return [4 /*yield*/, customerService_1.default.adjustBalance({
                        customer_id: req.params.id,
                        amount: Number(amount),
                        type: type,
                        reason: reason,
                        adjusted_by: userId,
                    })];
            case 1:
                updated = _b.sent();
                res.sendSuccess(updated, 'مانده حساب مشتری با موفقیت بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Add debt
 * PATCH /api/customers/:id/debt/add
 * Body: { amount: number, reason?: string }
 */
exports.addDebt = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, amount, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                amount = Number(req.body.amount);
                if (!amount || amount <= 0)
                    throw new types_1.ValidationError('مبلغ باید مثبت باشد');
                return [4 /*yield*/, customerService_1.default.addDebt(req.params.id, amount, userId, req.body.reason)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'بدهی مشتری افزایش یافت');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Reduce debt
 * PATCH /api/customers/:id/debt/reduce
 * Body: { amount: number, reason?: string }
 */
exports.reduceDebt = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, amount, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                amount = Number(req.body.amount);
                if (!amount || amount <= 0)
                    throw new types_1.ValidationError('مبلغ باید مثبت باشد');
                return [4 /*yield*/, customerService_1.default.reduceDebt(req.params.id, amount, userId, req.body.reason)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'بدهی مشتری کاهش یافت');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Settle account
 * PATCH /api/customers/:id/settle
 */
exports.settleAccount = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, customerService_1.default.settleAccount(req.params.id, userId)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'حساب مشتری تسویه شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Update credit limit
 * PATCH /api/customers/:id/credit-limit
 * Body: { credit_limit: number }
 */
exports.updateCreditLimit = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, credit_limit, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                credit_limit = Number(req.body.credit_limit);
                if (isNaN(credit_limit))
                    throw new types_1.ValidationError('سقف اعتبار نامعتبر است');
                return [4 /*yield*/, customerService_1.default.updateCreditLimit(req.params.id, credit_limit, userId)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'سقف اعتبار مشتری بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get debtors
 * GET /api/customers/debtors
 */
exports.getDebtors = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getCustomersWithDebt()];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'لیست مشتریان بدهکار دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get creditors
 * GET /api/customers/creditors
 */
exports.getCreditors = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getCustomersWithCredit()];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'لیست مشتریان طلبکار دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Search customers
 * GET /api/customers/search?q=...&limit=10
 */
exports.search = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var q, limit, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                q = String(req.query.query || req.query.q || '');
                limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
                return [4 /*yield*/, customerService_1.default.searchCustomers(q, limit)];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'نتایج جستجو دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Advanced search
 * GET /api/customers/advanced?...
 */
exports.advancedSearch = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var filters, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filters = buildCustomerFilters(req);
                return [4 /*yield*/, customerService_1.default.advancedSearch(filters)];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'نتایج جستجوی پیشرفته دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Customer account summary
 * GET /api/customers/:id/account
 */
exports.getAccountSummary = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var summary;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getCustomerAccountSummary(req.params.id)];
            case 1:
                summary = _a.sent();
                res.sendSuccess(summary, 'خلاصه حساب مشتری دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Purchase history
 * GET /api/customers/:id/purchase-history
 */
exports.getPurchaseHistory = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var history;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getCustomerPurchaseHistory(req.params.id)];
            case 1:
                history = _a.sent();
                res.sendSuccess(history, 'تاریخچه خرید مشتری دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Transactions history
 * GET /api/customers/:id/transactions
 */
exports.getTransactions = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var txns;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getCustomerTransactions(req.params.id)];
            case 1:
                txns = _a.sent();
                res.sendSuccess(txns, 'تاریخچه تراکنش‌های مشتری دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Customer statistics
 * GET /api/customers/statistics
 */
exports.getStatistics = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stats;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getCustomerStatistics()];
            case 1:
                stats = _a.sent();
                res.sendSuccess(stats, 'آمار مشتریان دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Top customers
 * GET /api/customers/top?limit=10
 */
exports.getTopCustomers = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
                return [4 /*yield*/, customerService_1.default.getTopCustomers(limit)];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'مشتریان برتر دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Debtor report
 * GET /api/customers/debtor-report
 */
exports.getDebtorReport = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getDebtorReport()];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش بدهکاران دریافت شد', { total: report.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Customers near credit limit
 * GET /api/customers/near-credit-limit?threshold=80
 */
exports.getCustomersNearingCreditLimit = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var threshold, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                threshold = req.query.threshold ? parseInt(String(req.query.threshold), 10) : 80;
                return [4 /*yield*/, customerService_1.default.getCustomersNearingCreditLimit(threshold)];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'مشتریان نزدیک به سقف اعتبار دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Lifetime value
 * GET /api/customers/:id/lifetime-value
 */
exports.getLifetimeValue = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var value;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getCustomerLifetimeValue(req.params.id)];
            case 1:
                value = _a.sent();
                res.sendSuccess(value, 'ارزش طول عمر مشتری دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * New customers (this month)
 * GET /api/customers/new
 */
exports.getNewCustomers = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getNewCustomers()];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'مشتریان جدید دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Inactive customers
 * GET /api/customers/inactive?days=90
 */
exports.getInactiveCustomers = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var days, list;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                days = req.query.days ? parseInt(String(req.query.days), 10) : 90;
                return [4 /*yield*/, customerService_1.default.getInactiveCustomers(days)];
            case 1:
                list = _a.sent();
                res.sendSuccess(list, 'مشتریان غیرفعال دریافت شد', { total: list.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Bulk set active status
 * POST /api/customers/bulk/active
 * Body: { customer_ids: string[], is_active: boolean }
 */
exports.bulkSetActive = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, ids, isActive, updatedCount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                ids = req.body.customer_ids || [];
                isActive = parseBoolean(req.body.is_active);
                if (!Array.isArray(ids) || ids.length === 0) {
                    throw new types_1.ValidationError('لیست شناسه مشتریان الزامی است');
                }
                if (isActive === undefined) {
                    throw new types_1.ValidationError('وضعیت فعال/غیرفعال نامعتبر است');
                }
                return [4 /*yield*/, customerService_1.default.bulkSetActiveStatus(ids, isActive, userId)];
            case 1:
                updatedCount = _a.sent();
                res.sendSuccess({ updatedCount: updatedCount }, 'وضعیت مشتریان به‌روزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Bulk update credit limit
 * POST /api/customers/bulk/credit-limit
 * Body: { customer_ids: string[], credit_limit: number }
 */
exports.bulkUpdateCreditLimit = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, ids, credit_limit, updatedCount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                ids = req.body.customer_ids || [];
                credit_limit = Number(req.body.credit_limit);
                if (!Array.isArray(ids) || ids.length === 0) {
                    throw new types_1.ValidationError('لیست شناسه مشتریان الزامی است');
                }
                if (isNaN(credit_limit) || credit_limit < 0) {
                    throw new types_1.ValidationError('سقف اعتبار نامعتبر است');
                }
                return [4 /*yield*/, customerService_1.default.bulkUpdateCreditLimit(ids, credit_limit, userId)];
            case 1:
                updatedCount = _a.sent();
                res.sendSuccess({ updatedCount: updatedCount }, 'سقف اعتبار مشتریان به‌روزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Can purchase (check credit limit)
 * GET /api/customers/:id/can-purchase?amount=...
 */
exports.canPurchase = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var amount, allowed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                amount = Number(req.query.amount);
                if (isNaN(amount) || amount <= 0) {
                    throw new types_1.ValidationError('مبلغ نامعتبر است');
                }
                return [4 /*yield*/, customerService_1.default.canPurchase(req.params.id, amount)];
            case 1:
                allowed = _a.sent();
                res.sendSuccess({ allowed: allowed }, allowed ? 'مشتری مجاز به خرید است' : 'سقف اعتبار کافی نیست');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Available credit
 * GET /api/customers/:id/available-credit
 */
exports.getAvailableCredit = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var available;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, customerService_1.default.getAvailableCredit(req.params.id)];
            case 1:
                available = _a.sent();
                res.sendSuccess({ available: available }, 'اعتبار در دسترس مشتری دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    // CRUD
    createCustomer: exports.createCustomer,
    getCustomer: exports.getCustomer,
    getCustomers: exports.getCustomers,
    updateCustomer: exports.updateCustomer,
    deleteCustomer: exports.deleteCustomer,
    restoreCustomer: exports.restoreCustomer,
    // Balance & Credit
    adjustBalance: exports.adjustBalance,
    addDebt: exports.addDebt,
    reduceDebt: exports.reduceDebt,
    settleAccount: exports.settleAccount,
    updateCreditLimit: exports.updateCreditLimit,
    canPurchase: exports.canPurchase,
    getAvailableCredit: exports.getAvailableCredit,
    // Lists & Search
    getDebtors: exports.getDebtors,
    getCreditors: exports.getCreditors,
    search: exports.search,
    advancedSearch: exports.advancedSearch,
    // Account & History
    getAccountSummary: exports.getAccountSummary,
    getPurchaseHistory: exports.getPurchaseHistory,
    getTransactions: exports.getTransactions,
    getLifetimeValue: exports.getLifetimeValue,
    // Stats & Reports
    getStatistics: exports.getStatistics,
    getTopCustomers: exports.getTopCustomers,
    getDebtorReport: exports.getDebtorReport,
    getCustomersNearingCreditLimit: exports.getCustomersNearingCreditLimit,
    getNewCustomers: exports.getNewCustomers,
    getInactiveCustomers: exports.getInactiveCustomers,
    // Bulk
    bulkSetActive: exports.bulkSetActive,
    bulkUpdateCreditLimit: exports.bulkUpdateCreditLimit,
};
