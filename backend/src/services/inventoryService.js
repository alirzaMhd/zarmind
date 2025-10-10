"use strict";
// ==========================================
// ZARMIND - Inventory Service
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
var AuditLog_1 = require("../models/AuditLog");
var types_1 = require("../types");
var logger_1 = require("../utils/logger");
var helpers_1 = require("../utils/helpers");
var database_1 = require("../config/database");
// ==========================================
// INVENTORY SERVICE
// ==========================================
var InventoryService = /** @class */ (function () {
    function InventoryService() {
    }
    // ==========================================
    // PRODUCT CRUD
    // ==========================================
    /**
     * Create a new product
     */
    InventoryService.prototype.createProduct = function (productData, created_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var goldPrice, product, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        // Validate carat
                        if (![18, 21, 22, 24].includes(productData.carat)) {
                            throw new types_1.ValidationError('عیار باید 18، 21، 22 یا 24 باشد');
                        }
                        // Validate weight
                        if (productData.weight <= 0) {
                            throw new types_1.ValidationError('وزن باید مثبت باشد');
                        }
                        if (!(!productData.override_price && !productData.selling_price)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getCurrentGoldPrice(productData.carat)];
                    case 1:
                        goldPrice = _a.sent();
                        if (goldPrice) {
                            productData.selling_price = (0, helpers_1.calculateGoldPrice)(productData.weight, productData.carat, goldPrice, productData.wage || 0, productData.stone_price || 0);
                        }
                        else {
                            throw new types_1.ValidationError('قیمت طلا برای این عیار یافت نشد. لطفاً قیمت فروش را مشخص کنید');
                        }
                        _a.label = 2;
                    case 2: return [4 /*yield*/, Product_1.default.create(__assign(__assign({}, productData), { created_by: created_by }))];
                    case 3:
                        product = _a.sent();
                        // Log creation
                        return [4 /*yield*/, AuditLog_1.default.logCreate(created_by, types_1.EntityType.PRODUCT, product.id, product, ip_address, user_agent)];
                    case 4:
                        // Log creation
                        _a.sent();
                        logger_1.default.info("Product created: ".concat(product.name, " (").concat(product.code, ") by ").concat(created_by));
                        return [2 /*return*/, product];
                    case 5:
                        error_1 = _a.sent();
                        logger_1.default.error('Error in createProduct:', error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get product by ID
     */
    InventoryService.prototype.getProductById = function (id, user_id, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.findById(id)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            throw new types_1.NotFoundError('محصول یافت نشد');
                        }
                        if (!user_id) return [3 /*break*/, 3];
                        return [4 /*yield*/, AuditLog_1.default.logView(user_id, types_1.EntityType.PRODUCT, id, ip_address, user_agent)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, product];
                }
            });
        });
    };
    /**
     * Get product by ID with current gold price calculation
     */
    InventoryService.prototype.getProductByIdWithPrice = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.findByIdWithPrice(id)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            throw new types_1.NotFoundError('محصول یافت نشد');
                        }
                        return [2 /*return*/, product];
                }
            });
        });
    };
    /**
     * Get all products with filters
     */
    InventoryService.prototype.getProducts = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.findAll(filters)];
            });
        });
    };
    /**
     * Get products with pagination
     */
    InventoryService.prototype.getProductsWithPagination = function () {
        return __awaiter(this, arguments, void 0, function (page, limit, filters) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.findWithPagination(page, limit, filters)];
            });
        });
    };
    /**
     * Update product
     */
    InventoryService.prototype.updateProduct = function (id, updateData, updated_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var oldProduct, updatedProduct, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Product_1.default.findById(id)];
                    case 1:
                        oldProduct = _a.sent();
                        if (!oldProduct) {
                            throw new types_1.NotFoundError('محصول یافت نشد');
                        }
                        // Validate carat if being updated
                        if (updateData.carat && ![18, 21, 22, 24].includes(updateData.carat)) {
                            throw new types_1.ValidationError('عیار باید 18، 21، 22 یا 24 باشد');
                        }
                        // Validate weight if being updated
                        if (updateData.weight !== undefined && updateData.weight <= 0) {
                            throw new types_1.ValidationError('وزن باید مثبت باشد');
                        }
                        return [4 /*yield*/, Product_1.default.update(id, updateData)];
                    case 2:
                        updatedProduct = _a.sent();
                        // Log update
                        return [4 /*yield*/, AuditLog_1.default.logUpdate(updated_by, types_1.EntityType.PRODUCT, id, oldProduct, updatedProduct, ip_address, user_agent)];
                    case 3:
                        // Log update
                        _a.sent();
                        logger_1.default.info("Product updated: ".concat(updatedProduct.name, " (").concat(updatedProduct.code, ") by ").concat(updated_by));
                        return [2 /*return*/, updatedProduct];
                    case 4:
                        error_2 = _a.sent();
                        logger_1.default.error('Error in updateProduct:', error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete product (soft delete)
     */
    InventoryService.prototype.deleteProduct = function (id, deleted_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.findById(id)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            throw new types_1.NotFoundError('محصول یافت نشد');
                        }
                        // Soft delete
                        return [4 /*yield*/, Product_1.default.softDelete(id)];
                    case 2:
                        // Soft delete
                        _a.sent();
                        // Log deletion
                        return [4 /*yield*/, AuditLog_1.default.logDelete(deleted_by, types_1.EntityType.PRODUCT, id, product, ip_address, user_agent)];
                    case 3:
                        // Log deletion
                        _a.sent();
                        logger_1.default.info("Product deleted: ".concat(product.name, " (").concat(product.code, ") by ").concat(deleted_by));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Restore deleted product
     */
    InventoryService.prototype.restoreProduct = function (id, restored_by) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.setActiveStatus(id, true)];
                    case 1:
                        product = _a.sent();
                        logger_1.default.info("Product restored: ".concat(product.name, " (").concat(product.code, ") by ").concat(restored_by));
                        return [2 /*return*/, product];
                }
            });
        });
    };
    // ==========================================
    // STOCK MANAGEMENT
    // ==========================================
    /**
     * Update product stock
     */
    InventoryService.prototype.updateStock = function (stockData) {
        return __awaiter(this, void 0, void 0, function () {
            var product_id, quantity, type, reason, updated_by, oldProduct, updatedProduct, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        product_id = stockData.product_id, quantity = stockData.quantity, type = stockData.type, reason = stockData.reason, updated_by = stockData.updated_by;
                        return [4 /*yield*/, Product_1.default.findById(product_id)];
                    case 1:
                        oldProduct = _a.sent();
                        if (!oldProduct) {
                            throw new types_1.NotFoundError('محصول یافت نشد');
                        }
                        return [4 /*yield*/, Product_1.default.adjustStock({
                                product_id: product_id,
                                quantity: quantity,
                                type: type,
                                reason: reason,
                                adjusted_by: updated_by,
                            })];
                    case 2:
                        updatedProduct = _a.sent();
                        // Log stock change
                        return [4 /*yield*/, AuditLog_1.default.logUpdate(updated_by, types_1.EntityType.PRODUCT, product_id, { stock_quantity: oldProduct.stock_quantity }, { stock_quantity: updatedProduct.stock_quantity }, undefined, undefined)];
                    case 3:
                        // Log stock change
                        _a.sent();
                        logger_1.default.info("Stock updated for ".concat(updatedProduct.name, ": ").concat(oldProduct.stock_quantity, " -> ").concat(updatedProduct.stock_quantity));
                        return [2 /*return*/, updatedProduct];
                    case 4:
                        error_3 = _a.sent();
                        logger_1.default.error('Error in updateStock:', error_3);
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Increase stock
     */
    InventoryService.prototype.increaseStock = function (product_id, quantity, updated_by, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateStock({
                        product_id: product_id,
                        quantity: quantity,
                        type: 'increase',
                        reason: reason || 'افزایش موجودی',
                        updated_by: updated_by,
                    })];
            });
        });
    };
    /**
     * Decrease stock
     */
    InventoryService.prototype.decreaseStock = function (product_id, quantity, updated_by, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateStock({
                        product_id: product_id,
                        quantity: quantity,
                        type: 'decrease',
                        reason: reason || 'کاهش موجودی',
                        updated_by: updated_by,
                    })];
            });
        });
    };
    /**
     * Set exact stock quantity
     */
    InventoryService.prototype.setStock = function (product_id, quantity, updated_by, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateStock({
                        product_id: product_id,
                        quantity: quantity,
                        type: 'set',
                        reason: reason || 'تنظیم موجودی',
                        updated_by: updated_by,
                    })];
            });
        });
    };
    /**
     * Get low stock products
     */
    InventoryService.prototype.getLowStockProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.findLowStock()];
            });
        });
    };
    /**
     * Get out of stock products
     */
    InventoryService.prototype.getOutOfStockProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.findOutOfStock()];
            });
        });
    };
    /**
     * Check if product is low on stock
     */
    InventoryService.prototype.isLowStock = function (product_id) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.findById(product_id)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            throw new types_1.NotFoundError('محصول یافت نشد');
                        }
                        return [2 /*return*/, product.stock_quantity <= product.min_stock_level];
                }
            });
        });
    };
    // ==========================================
    // GOLD PRICE MANAGEMENT
    // ==========================================
    /**
     * Get current gold price for carat
     */
    InventoryService.prototype.getCurrentGoldPrice = function (carat) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT price_per_gram \n       FROM gold_prices \n       WHERE carat = $1 \n       ORDER BY date DESC \n       LIMIT 1", [carat])];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.price_per_gram) || null];
                }
            });
        });
    };
    /**
     * Set gold price
     */
    InventoryService.prototype.setGoldPrice = function (priceData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("INSERT INTO gold_prices (carat, price_per_gram, date, created_by)\n       VALUES ($1, $2, $3, $4)\n       ON CONFLICT (carat, date) \n       DO UPDATE SET price_per_gram = $2, created_by = $4", [
                            priceData.carat,
                            priceData.price_per_gram,
                            priceData.date || new Date(),
                            priceData.created_by,
                        ])];
                    case 1:
                        _a.sent();
                        logger_1.default.info("Gold price updated: ".concat(priceData.carat, " carat = ").concat((0, helpers_1.formatPrice)(priceData.price_per_gram), "/gram"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get gold price history
     */
    InventoryService.prototype.getGoldPriceHistory = function (carat_1) {
        return __awaiter(this, arguments, void 0, function (carat, days) {
            var result;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT * FROM gold_prices \n       WHERE carat = $1 \n       AND date >= CURRENT_DATE - INTERVAL '".concat(days, " days'\n       ORDER BY date DESC"), [carat])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    /**
     * Recalculate product prices based on current gold price
     */
    InventoryService.prototype.recalculateProductPrices = function (category, updated_by) {
        return __awaiter(this, void 0, void 0, function () {
            var filters, products, updatedCount, _i, products_1, product, goldPrice, newPrice, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        filters = { isActive: true };
                        if (category) {
                            filters.category = category;
                        }
                        return [4 /*yield*/, Product_1.default.findAll(filters)];
                    case 1:
                        products = _a.sent();
                        updatedCount = 0;
                        _i = 0, products_1 = products;
                        _a.label = 2;
                    case 2:
                        if (!(_i < products_1.length)) return [3 /*break*/, 6];
                        product = products_1[_i];
                        return [4 /*yield*/, this.getCurrentGoldPrice(product.carat)];
                    case 3:
                        goldPrice = _a.sent();
                        if (!goldPrice) return [3 /*break*/, 5];
                        newPrice = (0, helpers_1.calculateGoldPrice)(product.weight, product.carat, goldPrice, product.wage, product.stone_price);
                        if (!(newPrice !== product.selling_price)) return [3 /*break*/, 5];
                        return [4 /*yield*/, Product_1.default.update(product.id, {
                                selling_price: newPrice,
                            })];
                    case 4:
                        _a.sent();
                        updatedCount++;
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6:
                        logger_1.default.info("Recalculated prices for ".concat(updatedCount, " products"));
                        return [2 /*return*/, updatedCount];
                    case 7:
                        error_4 = _a.sent();
                        logger_1.default.error('Error in recalculateProductPrices:', error_4);
                        throw error_4;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // BULK OPERATIONS
    // ==========================================
    /**
     * Bulk update prices
     */
    InventoryService.prototype.bulkUpdatePrices = function (updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var filters, products, updatedCount, _i, products_2, product, newPrice, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        filters = { isActive: true };
                        if (updateData.category) {
                            filters.category = updateData.category;
                        }
                        if (updateData.type) {
                            filters.type = updateData.type;
                        }
                        return [4 /*yield*/, Product_1.default.findAll(filters)];
                    case 1:
                        products = _a.sent();
                        updatedCount = 0;
                        _i = 0, products_2 = products;
                        _a.label = 2;
                    case 2:
                        if (!(_i < products_2.length)) return [3 /*break*/, 5];
                        product = products_2[_i];
                        newPrice = product.selling_price * (1 + updateData.percentage / 100);
                        return [4 /*yield*/, Product_1.default.update(product.id, {
                                selling_price: Math.round(newPrice),
                            })];
                    case 3:
                        _a.sent();
                        updatedCount++;
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        logger_1.default.info("Bulk updated ".concat(updatedCount, " product prices by ").concat(updateData.percentage, "%"));
                        return [2 /*return*/, updatedCount];
                    case 6:
                        error_5 = _a.sent();
                        logger_1.default.error('Error in bulkUpdatePrices:', error_5);
                        throw error_5;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Bulk activate/deactivate products
     */
    InventoryService.prototype.bulkSetActiveStatus = function (product_ids, is_active, updated_by) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedCount, _i, product_ids_1, id, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updatedCount = 0;
                        _i = 0, product_ids_1 = product_ids;
                        _a.label = 1;
                    case 1:
                        if (!(_i < product_ids_1.length)) return [3 /*break*/, 6];
                        id = product_ids_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, Product_1.default.setActiveStatus(id, is_active)];
                    case 3:
                        _a.sent();
                        updatedCount++;
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _a.sent();
                        logger_1.default.error("Error updating product ".concat(id, ":"), error_6);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        logger_1.default.info("Bulk ".concat(is_active ? 'activated' : 'deactivated', " ").concat(updatedCount, " products"));
                        return [2 /*return*/, updatedCount];
                }
            });
        });
    };
    // ==========================================
    // SEARCH & FILTER
    // ==========================================
    /**
     * Search products
     */
    InventoryService.prototype.searchProducts = function (searchTerm_1) {
        return __awaiter(this, arguments, void 0, function (searchTerm, limit) {
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.search(searchTerm, limit)];
            });
        });
    };
    /**
     * Get products by category
     */
    InventoryService.prototype.getProductsByCategory = function (category) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.findByCategory(category)];
            });
        });
    };
    /**
     * Get products by type
     */
    InventoryService.prototype.getProductsByType = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.findByType(type)];
            });
        });
    };
    /**
     * Advanced product search
     */
    InventoryService.prototype.advancedSearch = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.findAll(filters)];
            });
        });
    };
    // ==========================================
    // REPORTS & STATISTICS
    // ==========================================
    /**
     * Get inventory report
     */
    InventoryService.prototype.getInventoryReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats, products, byCategory_1, byType_1, topProducts, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Product_1.default.getStatistics()];
                    case 1:
                        stats = _a.sent();
                        return [4 /*yield*/, Product_1.default.findAll({ isActive: true })];
                    case 2:
                        products = _a.sent();
                        byCategory_1 = {
                            gold: { count: 0, value: 0, weight: 0 },
                            silver: { count: 0, value: 0, weight: 0 },
                            platinum: { count: 0, value: 0, weight: 0 },
                            diamond: { count: 0, value: 0, weight: 0 },
                            gemstone: { count: 0, value: 0, weight: 0 },
                        };
                        byType_1 = {
                            ring: { count: 0, value: 0 },
                            necklace: { count: 0, value: 0 },
                            bracelet: { count: 0, value: 0 },
                            earring: { count: 0, value: 0 },
                            anklet: { count: 0, value: 0 },
                            bangle: { count: 0, value: 0 },
                            chain: { count: 0, value: 0 },
                            pendant: { count: 0, value: 0 },
                            coin: { count: 0, value: 0 },
                            bar: { count: 0, value: 0 },
                            set: { count: 0, value: 0 },
                            other: { count: 0, value: 0 },
                        };
                        products.forEach(function (product) {
                            var itemValue = product.selling_price * product.stock_quantity;
                            var itemWeight = product.weight * product.stock_quantity;
                            byCategory_1[product.category].count += product.stock_quantity;
                            byCategory_1[product.category].value += itemValue;
                            byCategory_1[product.category].weight += itemWeight;
                            byType_1[product.type].count += product.stock_quantity;
                            byType_1[product.type].value += itemValue;
                        });
                        topProducts = products
                            .map(function (p) { return ({
                            id: p.id,
                            name: p.name,
                            value: p.selling_price * p.stock_quantity,
                            stock: p.stock_quantity,
                        }); })
                            .sort(function (a, b) { return b.value - a.value; })
                            .slice(0, 10);
                        return [2 /*return*/, {
                                totalProducts: stats.total,
                                totalValue: stats.totalValue,
                                totalWeight: stats.totalWeight,
                                activeProducts: stats.active,
                                lowStockProducts: stats.lowStock,
                                outOfStockProducts: stats.outOfStock,
                                byCategory: byCategory_1,
                                byType: byType_1,
                                topProducts: topProducts,
                            }];
                    case 3:
                        error_7 = _a.sent();
                        logger_1.default.error('Error in getInventoryReport:', error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get inventory statistics
     */
    InventoryService.prototype.getStatistics = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.getStatistics()];
            });
        });
    };
    /**
     * Get inventory value
     */
    InventoryService.prototype.getTotalInventoryValue = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.getTotalValue()];
            });
        });
    };
    /**
     * Get total inventory weight
     */
    InventoryService.prototype.getTotalInventoryWeight = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Product_1.default.getTotalWeight()];
            });
        });
    };
    /**
     * Get stock alerts
     */
    InventoryService.prototype.getStockAlerts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, lowStock, outOfStock;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            Product_1.default.findLowStock(),
                            Product_1.default.findOutOfStock(),
                        ])];
                    case 1:
                        _a = _b.sent(), lowStock = _a[0], outOfStock = _a[1];
                        return [2 /*return*/, {
                                lowStock: lowStock,
                                outOfStock: outOfStock,
                                totalAlerts: lowStock.length + outOfStock.length,
                            }];
                }
            });
        });
    };
    /**
     * Get product performance
     */
    InventoryService.prototype.getProductPerformance = function (product_id) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.findById(product_id)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            throw new types_1.NotFoundError('محصول یافت نشد');
                        }
                        return [2 /*return*/, {
                                product: product,
                                // These would come from sales analytics
                                totalSold: 0,
                                revenue: 0,
                                profit: 0,
                            }];
                }
            });
        });
    };
    // ==========================================
    // IMAGE MANAGEMENT
    // ==========================================
    /**
     * Update product image
     */
    InventoryService.prototype.updateProductImage = function (product_id, image_url, updated_by) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.updateImage(product_id, image_url)];
                    case 1:
                        product = _a.sent();
                        logger_1.default.info("Product image updated: ".concat(product.name, " (").concat(product.code, ")"));
                        return [2 /*return*/, product];
                }
            });
        });
    };
    /**
     * Remove product image
     */
    InventoryService.prototype.removeProductImage = function (product_id, updated_by) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateProductImage(product_id, '', updated_by)];
            });
        });
    };
    // ==========================================
    // VALIDATION
    // ==========================================
    /**
     * Validate product data
     */
    InventoryService.prototype.validateProductData = function (data) {
        if (data.weight !== undefined && data.weight <= 0) {
            throw new types_1.ValidationError('وزن باید مثبت باشد');
        }
        if (data.carat && ![18, 21, 22, 24].includes(data.carat)) {
            throw new types_1.ValidationError('عیار باید 18، 21، 22 یا 24 باشد');
        }
        if (data.stock_quantity !== undefined && data.stock_quantity < 0) {
            throw new types_1.ValidationError('موجودی نمی‌تواند منفی باشد');
        }
        if (data.selling_price !== undefined && data.selling_price <= 0) {
            throw new types_1.ValidationError('قیمت فروش باید مثبت باشد');
        }
        if (data.wage !== undefined && data.wage < 0) {
            throw new types_1.ValidationError('اجرت نمی‌تواند منفی باشد');
        }
        if (data.stone_price !== undefined && data.stone_price < 0) {
            throw new types_1.ValidationError('قیمت نگین نمی‌تواند منفی باشد');
        }
    };
    /**
     * Check if product code is unique
     */
    InventoryService.prototype.isCodeUnique = function (code, excludeId) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.findByCode(code)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, true];
                        }
                        if (excludeId && product.id === excludeId) {
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                }
            });
        });
    };
    return InventoryService;
}());
// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================
exports.default = new InventoryService();
