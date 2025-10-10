"use strict";
// ==========================================
// ZARMIND - Report Controller
// ==========================================
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
exports.exportReport = exports.getGoldPriceTrend = exports.getProfitLossReport = exports.getFinancialReport = exports.getCustomerReport = exports.getInventoryReport = exports.getComparativeSalesReport = exports.getSalesReport = exports.getQuickStats = exports.getDashboardStats = void 0;
var error_middleware_1 = require("../middleware/error.middleware");
var reportService_1 = require("../services/reportService");
var types_1 = require("../types");
// ==========================================
// HELPERS
// ==========================================
var parseDate = function (val, fieldName) {
    if (val === undefined || val === null || String(val).trim() === '')
        return undefined;
    var d = new Date(String(val));
    if (isNaN(d.getTime())) {
        throw new types_1.ValidationError("\u062A\u0627\u0631\u06CC\u062E ".concat(fieldName, " \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A"));
    }
    return d;
};
var getDateRangeFromQuery = function (req) {
    var start = parseDate(req.query.startDate, 'شروع');
    var end = parseDate(req.query.endDate, 'پایان');
    if ((start && !end) || (!start && end)) {
        throw new types_1.ValidationError('برای بازه زمانی، هر دو تاریخ شروع و پایان الزامی است');
    }
    return start && end ? { startDate: start, endDate: end } : undefined;
};
// ==========================================
// DASHBOARD & QUICK STATS
// ==========================================
/**
 * GET /api/reports/dashboard
 */
exports.getDashboardStats = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, reportService_1.default.getDashboardStats()];
            case 1:
                data = _a.sent();
                res.sendSuccess(data, 'آمار داشبورد با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/reports/quick-stats
 */
exports.getQuickStats = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, reportService_1.default.getQuickStats()];
            case 1:
                data = _a.sent();
                res.sendSuccess(data, 'آمار سریع با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// SALES REPORTS
// ==========================================
/**
 * GET /api/reports/sales?startDate=...&endDate=...
 */
exports.getSalesReport = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var range, report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                range = getDateRangeFromQuery(req);
                return [4 /*yield*/, reportService_1.default.getSalesReport(range)];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش فروش با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/reports/comparative-sales?currentStart=...&currentEnd=...&previousStart=...&previousEnd=...
 */
exports.getComparativeSalesReport = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var currentStart, currentEnd, previousStart, previousEnd, current, previous, report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                currentStart = parseDate(req.query.currentStart, 'شروع (دوره فعلی)');
                currentEnd = parseDate(req.query.currentEnd, 'پایان (دوره فعلی)');
                previousStart = parseDate(req.query.previousStart, 'شروع (دوره قبل)');
                previousEnd = parseDate(req.query.previousEnd, 'پایان (دوره قبل)');
                if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
                    throw new types_1.ValidationError('همه تاریخ‌های دوره فعلی و دوره قبل الزامی هستند');
                }
                current = { startDate: currentStart, endDate: currentEnd };
                previous = { startDate: previousStart, endDate: previousEnd };
                return [4 /*yield*/, reportService_1.default.getComparativeSalesReport(current, previous)];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش مقایسه‌ای فروش با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// INVENTORY REPORTS
// ==========================================
/**
 * GET /api/reports/inventory
 */
exports.getInventoryReport = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, reportService_1.default.getInventoryReport()];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش موجودی با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// CUSTOMER REPORTS
// ==========================================
/**
 * GET /api/reports/customers
 */
exports.getCustomerReport = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, reportService_1.default.getCustomerReport()];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش مشتریان با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// FINANCIAL / P&L
// ==========================================
/**
 * GET /api/reports/financial?startDate=...&endDate=...
 */
exports.getFinancialReport = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var range, report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                range = getDateRangeFromQuery(req);
                return [4 /*yield*/, reportService_1.default.getFinancialReport(range)];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش مالی با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/reports/profit-loss?startDate=...&endDate=...
 */
exports.getProfitLossReport = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var range, report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                range = getDateRangeFromQuery(req);
                return [4 /*yield*/, reportService_1.default.getProfitLossReport(range)];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش سود و زیان با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// GOLD PRICE TRENDS
// ==========================================
/**
 * GET /api/reports/gold-price-trend?carat=18&days=30
 */
exports.getGoldPriceTrend = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var carat, days, trend;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                carat = req.query.carat ? parseInt(String(req.query.carat), 10) : undefined;
                days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
                if (!carat || ![18, 21, 22, 24].includes(carat)) {
                    throw new types_1.ValidationError('عیار نامعتبر است (18، 21، 22 یا 24)');
                }
                if (isNaN(days) || days <= 0) {
                    throw new types_1.ValidationError('تعداد روزها نامعتبر است');
                }
                return [4 /*yield*/, reportService_1.default.getGoldPriceTrend(carat, days)];
            case 1:
                trend = _a.sent();
                res.sendSuccess(trend, 'روند قیمت طلا با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// EXPORT
// ==========================================
/**
 * POST /api/reports/export
 * Body: any report object (reportData)
 */
exports.exportReport = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var reportData, json;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                reportData = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.report) !== null && _b !== void 0 ? _b : req.body;
                if (!reportData) {
                    throw new types_1.ValidationError('داده‌ای برای خروجی گرفتن ارسال نشده است');
                }
                return [4 /*yield*/, reportService_1.default.exportReportToJSON(reportData)];
            case 1:
                json = _c.sent();
                // Optional: set as downloadable file
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="report.json"');
                res.send(json);
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    // Dashboard
    getDashboardStats: exports.getDashboardStats,
    getQuickStats: exports.getQuickStats,
    // Sales
    getSalesReport: exports.getSalesReport,
    getComparativeSalesReport: exports.getComparativeSalesReport,
    // Inventory
    getInventoryReport: exports.getInventoryReport,
    // Customers
    getCustomerReport: exports.getCustomerReport,
    // Financial & P&L
    getFinancialReport: exports.getFinancialReport,
    getProfitLossReport: exports.getProfitLossReport,
    // Gold trend
    getGoldPriceTrend: exports.getGoldPriceTrend,
    // Export
    exportReport: exports.exportReport,
};
