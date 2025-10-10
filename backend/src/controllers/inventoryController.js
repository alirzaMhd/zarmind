"use strict";
// ==========================================
// ZARMIND - Inventory Controller
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
exports.getProductPerformance = exports.getStockAlerts = exports.getStatistics = exports.getInventoryReport = exports.getGoldPriceHistory = exports.setGoldPrice = exports.getCurrentGoldPrice = exports.bulkSetActive = exports.bulkUpdatePrices = exports.recalculatePrices = exports.advancedSearch = exports.search = exports.getOutOfStock = exports.getLowStock = exports.removeImage = exports.updateImage = exports.setStock = exports.decreaseStock = exports.increaseStock = exports.updateStock = exports.restoreProduct = exports.deleteProduct = exports.updateProduct = exports.getProducts = exports.getProductWithPrice = exports.getProduct = exports.createProduct = void 0;
var error_middleware_1 = require("../middleware/error.middleware");
var inventoryService_1 = require("../services/inventoryService");
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
// Build product filters from query
var buildProductFilters = function (req) {
    var _a = req.query, category = _a.category, type = _a.type, carat = _a.carat, minWeight = _a.minWeight, maxWeight = _a.maxWeight, minPrice = _a.minPrice, maxPrice = _a.maxPrice, search = _a.search, isActive = _a.isActive, lowStock = _a.lowStock;
    return {
        category: category,
        type: type,
        carat: carat ? parseInt(String(carat), 10) : undefined,
        minWeight: minWeight ? parseFloat(String(minWeight)) : undefined,
        maxWeight: maxWeight ? parseFloat(String(maxWeight)) : undefined,
        minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
        maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
        search: search ? String(search) : undefined,
        isActive: isActive !== undefined ? parseBoolean(isActive) : undefined,
        lowStock: lowStock !== undefined ? parseBoolean(lowStock) : undefined,
    };
};
// ==========================================
// CONTROLLERS
// ==========================================
/**
 * Create product
 * POST /api/inventory
 */
exports.createProduct = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, product;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, inventoryService_1.default.createProduct(__assign({}, req.body), userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                product = _a.sent();
                res.status(201).json({
                    success: true,
                    message: 'محصول با موفقیت ثبت شد',
                    data: product,
                });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get product by ID
 * GET /api/inventory/:id
 */
exports.getProduct = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, product;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = (0, auth_middleware_1.getCurrentUserId)(req);
                return [4 /*yield*/, inventoryService_1.default.getProductById(req.params.id, userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                product = _a.sent();
                res.sendSuccess(product, 'محصول با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get product by ID with current gold price info
 * GET /api/inventory/:id/price
 */
exports.getProductWithPrice = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var product;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inventoryService_1.default.getProductByIdWithPrice(req.params.id)];
            case 1:
                product = _a.sent();
                res.sendSuccess(product, 'محصول و قیمت به‌روز با موفقیت دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get products (with optional pagination and filters)
 * GET /api/inventory
 * Query: page, limit, filters...
 */
exports.getProducts = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, filters, result, products;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
                limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
                filters = buildProductFilters(req);
                if (!(page && limit)) return [3 /*break*/, 2];
                return [4 /*yield*/, inventoryService_1.default.getProductsWithPagination(page, limit, filters)];
            case 1:
                result = _a.sent();
                res.sendSuccess(result, 'لیست محصولات (صفحه‌بندی شده) دریافت شد', {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit),
                });
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, inventoryService_1.default.getProducts(filters)];
            case 3:
                products = _a.sent();
                res.sendSuccess(products, 'لیست محصولات دریافت شد', { total: products.length });
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * Update product
 * PUT /api/inventory/:id
 */
exports.updateProduct = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, inventoryService_1.default.updateProduct(req.params.id, __assign({}, req.body), userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'محصول با موفقیت بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Delete (soft) product
 * DELETE /api/inventory/:id
 */
exports.deleteProduct = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, inventoryService_1.default.deleteProduct(req.params.id, userId, req.ip, req.get('user-agent') || undefined)];
            case 1:
                _a.sent();
                res.sendSuccess(null, 'محصول با موفقیت حذف شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Restore product (activate)
 * PATCH /api/inventory/:id/restore
 */
exports.restoreProduct = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, restored;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, inventoryService_1.default.restoreProduct(req.params.id, userId)];
            case 1:
                restored = _a.sent();
                res.sendSuccess(restored, 'محصول با موفقیت بازیابی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Update stock (increase/decrease/set)
 * PATCH /api/inventory/:id/stock
 * Body: { type: 'increase'|'decrease'|'set', quantity: number, reason?: string }
 */
exports.updateStock = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, type, quantity, reason, updated;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = requireUser(req);
                _a = req.body, type = _a.type, quantity = _a.quantity, reason = _a.reason;
                if (!type || !['increase', 'decrease', 'set'].includes(type)) {
                    throw new types_1.ValidationError('نوع تغییر موجودی نامعتبر است');
                }
                if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
                    throw new types_1.ValidationError('مقدار موجودی نامعتبر است');
                }
                if (['increase', 'decrease'].includes(type) && Number(quantity) <= 0) {
                    throw new types_1.ValidationError('مقدار باید بزرگ‌تر از صفر باشد');
                }
                if (type === 'set' && Number(quantity) < 0) {
                    throw new types_1.ValidationError('مقدار موجودی نمی‌تواند منفی باشد');
                }
                return [4 /*yield*/, inventoryService_1.default.updateStock({
                        product_id: req.params.id,
                        quantity: Number(quantity),
                        type: type,
                        reason: reason,
                        updated_by: userId,
                    })];
            case 1:
                updated = _b.sent();
                res.sendSuccess(updated, 'موجودی محصول با موفقیت بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Increase stock
 * PATCH /api/inventory/:id/stock/increase
 * Body: { quantity: number, reason?: string }
 */
exports.increaseStock = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, qty, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                qty = Number(req.body.quantity);
                if (!qty || qty <= 0)
                    throw new types_1.ValidationError('مقدار افزایش باید مثبت باشد');
                return [4 /*yield*/, inventoryService_1.default.increaseStock(req.params.id, qty, userId, req.body.reason)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'موجودی محصول افزایش یافت');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Decrease stock
 * PATCH /api/inventory/:id/stock/decrease
 * Body: { quantity: number, reason?: string }
 */
exports.decreaseStock = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, qty, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                qty = Number(req.body.quantity);
                if (!qty || qty <= 0)
                    throw new types_1.ValidationError('مقدار کاهش باید مثبت باشد');
                return [4 /*yield*/, inventoryService_1.default.decreaseStock(req.params.id, qty, userId, req.body.reason)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'موجودی محصول کاهش یافت');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Set exact stock
 * PATCH /api/inventory/:id/stock/set
 * Body: { quantity: number, reason?: string }
 */
exports.setStock = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, qty, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                qty = Number(req.body.quantity);
                if (qty === undefined || qty === null || isNaN(qty) || qty < 0) {
                    throw new types_1.ValidationError('مقدار موجودی نامعتبر است');
                }
                return [4 /*yield*/, inventoryService_1.default.setStock(req.params.id, qty, userId, req.body.reason)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'موجودی محصول تنظیم شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Update product image
 * PUT /api/inventory/:id/image
 * Accepts multipart (req.file) or JSON body { image_url }
 */
exports.updateImage = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, imageUrl, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                imageUrl = (req.file && req.file.path) || req.body.image_url;
                if (!imageUrl) {
                    throw new types_1.ValidationError('فایل یا آدرس تصویر الزامی است');
                }
                return [4 /*yield*/, inventoryService_1.default.updateProductImage(req.params.id, imageUrl, userId)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'تصویر محصول با موفقیت بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Remove product image
 * DELETE /api/inventory/:id/image
 */
exports.removeImage = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, updated;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                return [4 /*yield*/, inventoryService_1.default.removeProductImage(req.params.id, userId)];
            case 1:
                updated = _a.sent();
                res.sendSuccess(updated, 'تصویر محصول حذف شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Low stock products
 * GET /api/inventory/low-stock
 */
exports.getLowStock = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inventoryService_1.default.getLowStockProducts()];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'لیست محصولات با موجودی کم دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Out of stock products
 * GET /api/inventory/out-of-stock
 */
exports.getOutOfStock = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inventoryService_1.default.getOutOfStockProducts()];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'لیست محصولات ناموجود دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Search products
 * GET /api/inventory/search?query=...
 */
exports.search = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var q, limit, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                q = String(req.query.query || req.query.q || '');
                limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
                return [4 /*yield*/, inventoryService_1.default.searchProducts(q, limit)];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'نتایج جستجو دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Advanced search
 * GET /api/inventory/advanced?...
 */
exports.advancedSearch = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var filters, items;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filters = buildProductFilters(req);
                return [4 /*yield*/, inventoryService_1.default.advancedSearch(filters)];
            case 1:
                items = _a.sent();
                res.sendSuccess(items, 'نتایج جستجوی پیشرفته دریافت شد', { total: items.length });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Recalculate prices based on current gold price
 * POST /api/inventory/recalculate-prices
 * Body: { category?: ProductCategory }
 */
exports.recalculatePrices = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var category, updatedCount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                category = req.body.category;
                return [4 /*yield*/, inventoryService_1.default.recalculateProductPrices(category)];
            case 1:
                updatedCount = _a.sent();
                res.sendSuccess({ updatedCount: updatedCount }, 'قیمت محصولات بر اساس قیمت طلا بروزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Bulk update prices (percentage)
 * POST /api/inventory/bulk/price-update
 * Body: { percentage: number, category?: ProductCategory, type?: ProductType }
 */
exports.bulkUpdatePrices = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var percentage, updatedCount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                percentage = Number(req.body.percentage);
                if (!percentage) {
                    throw new types_1.ValidationError('درصد تغییر قیمت الزامی است');
                }
                return [4 /*yield*/, inventoryService_1.default.bulkUpdatePrices({
                        percentage: percentage,
                        category: req.body.category,
                        type: req.body.type,
                        updated_by: requireUser(req),
                    })];
            case 1:
                updatedCount = _a.sent();
                res.sendSuccess({ updatedCount: updatedCount }, 'قیمت‌ها به صورت گروهی بروزرسانی شدند');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Bulk set active status
 * POST /api/inventory/bulk/active
 * Body: { product_ids: string[], is_active: boolean }
 */
exports.bulkSetActive = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, ids, isActive, updatedCount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                ids = req.body.product_ids || [];
                isActive = parseBoolean(req.body.is_active);
                if (!Array.isArray(ids) || ids.length === 0) {
                    throw new types_1.ValidationError('لیست شناسه محصولات الزامی است');
                }
                if (isActive === undefined) {
                    throw new types_1.ValidationError('وضعیت فعال/غیرفعال نامعتبر است');
                }
                return [4 /*yield*/, inventoryService_1.default.bulkSetActiveStatus(ids, isActive, userId)];
            case 1:
                updatedCount = _a.sent();
                res.sendSuccess({ updatedCount: updatedCount }, 'وضعیت محصولات به‌روزرسانی شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Get current gold price
 * GET /api/inventory/gold-price/current?carat=18
 */
exports.getCurrentGoldPrice = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var carat, price;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                carat = req.query.carat ? parseInt(String(req.query.carat), 10) : undefined;
                if (!carat)
                    throw new types_1.ValidationError('عیار الزامی است');
                return [4 /*yield*/, inventoryService_1.default.getCurrentGoldPrice(carat)];
            case 1:
                price = _a.sent();
                res.sendSuccess({ carat: carat, price: price }, 'قیمت به‌روز طلا دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Set gold price
 * POST /api/inventory/gold-price
 * Body: { carat: number, price_per_gram: number, date?: string }
 */
exports.setGoldPrice = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, carat, ppg, date;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = requireUser(req);
                carat = parseInt(String(req.body.carat), 10);
                ppg = parseFloat(String(req.body.price_per_gram));
                date = req.body.date ? new Date(req.body.date) : undefined;
                if (![18, 21, 22, 24].includes(carat)) {
                    throw new types_1.ValidationError('عیار باید 18، 21، 22 یا 24 باشد');
                }
                if (!ppg || ppg <= 0) {
                    throw new types_1.ValidationError('قیمت هر گرم نامعتبر است');
                }
                return [4 /*yield*/, inventoryService_1.default.setGoldPrice({
                        carat: carat,
                        price_per_gram: ppg,
                        date: date,
                        created_by: userId,
                    })];
            case 1:
                _a.sent();
                res.sendSuccess(null, 'قیمت طلا ثبت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Gold price history
 * GET /api/inventory/gold-price/history?carat=18&days=30
 */
exports.getGoldPriceHistory = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var carat, days, history;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                carat = req.query.carat ? parseInt(String(req.query.carat), 10) : undefined;
                days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
                if (!carat)
                    throw new types_1.ValidationError('عیار الزامی است');
                return [4 /*yield*/, inventoryService_1.default.getGoldPriceHistory(carat, days)];
            case 1:
                history = _a.sent();
                res.sendSuccess(history, 'تاریخچه قیمت طلا دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Inventory report
 * GET /api/inventory/report
 */
exports.getInventoryReport = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inventoryService_1.default.getInventoryReport()];
            case 1:
                report = _a.sent();
                res.sendSuccess(report, 'گزارش موجودی دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Inventory statistics
 * GET /api/inventory/statistics
 */
exports.getStatistics = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stats;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inventoryService_1.default.getStatistics()];
            case 1:
                stats = _a.sent();
                res.sendSuccess(stats, 'آمار موجودی دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * Stock alerts
 * GET /api/inventory/alerts
 */
exports.getStockAlerts = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var alerts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inventoryService_1.default.getStockAlerts()];
            case 1:
                alerts = _a.sent();
                res.sendSuccess(alerts, 'هشدارهای موجودی دریافت شد', { total: alerts.totalAlerts });
                return [2 /*return*/];
        }
    });
}); });
/**
 * Product performance
 * GET /api/inventory/:id/performance
 */
exports.getProductPerformance = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var perf;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inventoryService_1.default.getProductPerformance(req.params.id)];
            case 1:
                perf = _a.sent();
                res.sendSuccess(perf, 'عملکرد محصول دریافت شد');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    // CRUD
    createProduct: exports.createProduct,
    getProduct: exports.getProduct,
    getProductWithPrice: exports.getProductWithPrice,
    getProducts: exports.getProducts,
    updateProduct: exports.updateProduct,
    deleteProduct: exports.deleteProduct,
    restoreProduct: exports.restoreProduct,
    // Stock
    updateStock: exports.updateStock,
    increaseStock: exports.increaseStock,
    decreaseStock: exports.decreaseStock,
    setStock: exports.setStock,
    // Images
    updateImage: exports.updateImage,
    removeImage: exports.removeImage,
    // Lists
    getLowStock: exports.getLowStock,
    getOutOfStock: exports.getOutOfStock,
    search: exports.search,
    advancedSearch: exports.advancedSearch,
    // Prices
    recalculatePrices: exports.recalculatePrices,
    bulkUpdatePrices: exports.bulkUpdatePrices,
    bulkSetActive: exports.bulkSetActive,
    // Gold Price
    getCurrentGoldPrice: exports.getCurrentGoldPrice,
    setGoldPrice: exports.setGoldPrice,
    getGoldPriceHistory: exports.getGoldPriceHistory,
    // Reports
    getInventoryReport: exports.getInventoryReport,
    getStatistics: exports.getStatistics,
    getStockAlerts: exports.getStockAlerts,
    getProductPerformance: exports.getProductPerformance,
};
