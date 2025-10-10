"use strict";
// ==========================================
// ZARMIND - Sales Service
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var Sale_1 = require("../models/Sale");
var Transaction_1 = require("../models/Transaction");
var Product_1 = require("../models/Product");
var Customer_1 = require("../models/Customer");
var AuditLog_1 = require("../models/AuditLog");
var types_1 = require("../types");
var logger_1 = require("../utils/logger");
var helpers_1 = require("../utils/helpers");
// ==========================================
// SALES SERVICE
// ==========================================
var SalesService = /** @class */ (function () {
    function SalesService() {
    }
    // ==========================================
    // SALE CRUD
    // ==========================================
    /**
     * Create a new sale
     */
    SalesService.prototype.createSale = function (saleData, created_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var sale, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        // Validate sale data
                        return [4 /*yield*/, this.validateSaleData(saleData)];
                    case 1:
                        // Validate sale data
                        _a.sent();
                        if (!saleData.customer_id) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.validateCustomerCredit(saleData.customer_id, saleData.items, saleData.gold_price, saleData.discount || 0, saleData.tax || 0, saleData.paid_amount || 0)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, Sale_1.default.create(__assign(__assign({}, saleData), { created_by: created_by }))];
                    case 4:
                        sale = _a.sent();
                        if (!(saleData.paid_amount && saleData.paid_amount > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, Transaction_1.default.createSaleTransaction(sale.id, sale.customer_id, saleData.paid_amount, saleData.payment_method || types_1.PaymentMethod.CASH, created_by, undefined)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: 
                    // Log creation
                    return [4 /*yield*/, AuditLog_1.default.logCreate(created_by, types_1.EntityType.SALE, sale.id, sale, ip_address, user_agent)];
                    case 7:
                        // Log creation
                        _a.sent();
                        logger_1.default.info("Sale created: ".concat(sale.sale_number, " - Amount: ").concat((0, helpers_1.formatPrice)(sale.final_amount), " by ").concat(created_by));
                        return [2 /*return*/, sale];
                    case 8:
                        error_1 = _a.sent();
                        logger_1.default.error('Error in createSale:', error_1);
                        throw error_1;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get sale by ID
     */
    SalesService.prototype.getSaleById = function (id, user_id, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var sale;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Sale_1.default.findByIdWithItems(id)];
                    case 1:
                        sale = _a.sent();
                        if (!sale) {
                            throw new types_1.NotFoundError('فروش یافت نشد');
                        }
                        if (!user_id) return [3 /*break*/, 3];
                        return [4 /*yield*/, AuditLog_1.default.logView(user_id, types_1.EntityType.SALE, id, ip_address, user_agent)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, sale];
                }
            });
        });
    };
    /**
     * Get sale by sale number
     */
    SalesService.prototype.getSaleBySaleNumber = function (sale_number) {
        return __awaiter(this, void 0, void 0, function () {
            var sale, items;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Sale_1.default.findBySaleNumber(sale_number)];
                    case 1:
                        sale = _a.sent();
                        if (!sale) {
                            throw new types_1.NotFoundError('فروش یافت نشد');
                        }
                        return [4 /*yield*/, Sale_1.default.getSaleItems(sale.id)];
                    case 2:
                        items = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, sale), { items: items })];
                }
            });
        });
    };
    /**
     * Get all sales with filters
     */
    SalesService.prototype.getSales = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Sale_1.default.findAll(filters)];
            });
        });
    };
    /**
     * Get sales with pagination
     */
    SalesService.prototype.getSalesWithPagination = function () {
        return __awaiter(this, arguments, void 0, function (page, limit, filters) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Sale_1.default.findWithPagination(page, limit, filters)];
            });
        });
    };
    /**
     * Get sales by customer
     */
    SalesService.prototype.getSalesByCustomer = function (customer_id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Sale_1.default.findByCustomer(customer_id)];
            });
        });
    };
    /**
     * Update sale
     */
    SalesService.prototype.updateSale = function (id, updateData, updated_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var oldSale, updatedSale, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Sale_1.default.findById(id)];
                    case 1:
                        oldSale = _a.sent();
                        if (!oldSale) {
                            throw new types_1.NotFoundError('فروش یافت نشد');
                        }
                        // Don't allow updating completed or cancelled sales
                        if (oldSale.status === types_1.SaleStatus.COMPLETED) {
                            throw new types_1.ValidationError('نمی‌توان فروش تکمیل شده را ویرایش کرد');
                        }
                        if (oldSale.status === types_1.SaleStatus.CANCELLED) {
                            throw new types_1.ValidationError('نمی‌توان فروش لغو شده را ویرایش کرد');
                        }
                        return [4 /*yield*/, Sale_1.default.update(id, updateData)];
                    case 2:
                        updatedSale = _a.sent();
                        // Log update
                        return [4 /*yield*/, AuditLog_1.default.logUpdate(updated_by, types_1.EntityType.SALE, id, oldSale, updatedSale, ip_address, user_agent)];
                    case 3:
                        // Log update
                        _a.sent();
                        logger_1.default.info("Sale updated: ".concat(updatedSale.sale_number, " by ").concat(updated_by));
                        return [2 /*return*/, updatedSale];
                    case 4:
                        error_2 = _a.sent();
                        logger_1.default.error('Error in updateSale:', error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update sale status
     */
    SalesService.prototype.updateSaleStatus = function (id, status, updated_by) {
        return __awaiter(this, void 0, void 0, function () {
            var sale, updatedSale;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Sale_1.default.findById(id)];
                    case 1:
                        sale = _a.sent();
                        if (!sale) {
                            throw new types_1.NotFoundError('فروش یافت نشد');
                        }
                        // Validate status transition
                        if (sale.status === types_1.SaleStatus.CANCELLED) {
                            throw new types_1.ValidationError('نمی‌توان وضعیت فروش لغو شده را تغییر داد');
                        }
                        if (status === types_1.SaleStatus.COMPLETED && sale.remaining_amount > 0) {
                            throw new types_1.ValidationError('برای تکمیل فروش باید مبلغ باقیمانده پرداخت شود');
                        }
                        return [4 /*yield*/, Sale_1.default.updateStatus(id, status)];
                    case 2:
                        updatedSale = _a.sent();
                        logger_1.default.info("Sale status updated: ".concat(updatedSale.sale_number, " -> ").concat(status));
                        return [2 /*return*/, updatedSale];
                }
            });
        });
    };
    /**
     * Cancel sale
     */
    SalesService.prototype.cancelSale = function (id, cancelled_by, reason, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var sale, cancelledSale, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Sale_1.default.findById(id)];
                    case 1:
                        sale = _a.sent();
                        if (!sale) {
                            throw new types_1.NotFoundError('فروش یافت نشد');
                        }
                        if (sale.status === types_1.SaleStatus.CANCELLED) {
                            throw new types_1.ValidationError('این فروش قبلاً لغو شده است');
                        }
                        return [4 /*yield*/, Sale_1.default.cancel(id, cancelled_by)];
                    case 2:
                        cancelledSale = _a.sent();
                        // Log cancellation
                        return [4 /*yield*/, AuditLog_1.default.logUpdate(cancelled_by, types_1.EntityType.SALE, id, { status: sale.status }, { status: types_1.SaleStatus.CANCELLED, reason: reason }, ip_address, user_agent)];
                    case 3:
                        // Log cancellation
                        _a.sent();
                        logger_1.default.warn("Sale cancelled: ".concat(cancelledSale.sale_number, " by ").concat(cancelled_by).concat(reason ? " - Reason: ".concat(reason) : ''));
                        return [2 /*return*/, cancelledSale];
                    case 4:
                        error_3 = _a.sent();
                        logger_1.default.error('Error in cancelSale:', error_3);
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete sale (only drafts)
     */
    SalesService.prototype.deleteSale = function (id, deleted_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var sale;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Sale_1.default.findById(id)];
                    case 1:
                        sale = _a.sent();
                        if (!sale) {
                            throw new types_1.NotFoundError('فروش یافت نشد');
                        }
                        if (sale.status !== types_1.SaleStatus.DRAFT) {
                            throw new types_1.ValidationError('فقط پیش‌فاکتورها قابل حذف هستند');
                        }
                        return [4 /*yield*/, Sale_1.default.hardDelete(id)];
                    case 2:
                        _a.sent();
                        // Log deletion
                        return [4 /*yield*/, AuditLog_1.default.logDelete(deleted_by, types_1.EntityType.SALE, id, sale, ip_address, user_agent)];
                    case 3:
                        // Log deletion
                        _a.sent();
                        logger_1.default.info("Sale deleted: ".concat(sale.sale_number, " by ").concat(deleted_by));
                        return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // PAYMENT MANAGEMENT
    // ==========================================
    /**
     * Add payment to sale
     */
    SalesService.prototype.addPayment = function (paymentData) {
        return __awaiter(this, void 0, void 0, function () {
            var sale_id, amount, payment_method, reference_number, notes, processed_by, sale, updatedSale, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        sale_id = paymentData.sale_id, amount = paymentData.amount, payment_method = paymentData.payment_method, reference_number = paymentData.reference_number, notes = paymentData.notes, processed_by = paymentData.processed_by;
                        // Validate payment
                        if (amount <= 0) {
                            throw new types_1.ValidationError('مبلغ پرداخت باید مثبت باشد');
                        }
                        return [4 /*yield*/, Sale_1.default.findById(sale_id)];
                    case 1:
                        sale = _a.sent();
                        if (!sale) {
                            throw new types_1.NotFoundError('فروش یافت نشد');
                        }
                        if (sale.status === types_1.SaleStatus.CANCELLED) {
                            throw new types_1.ValidationError('نمی‌توان به فروش لغو شده پرداخت افزود');
                        }
                        if (sale.status === types_1.SaleStatus.COMPLETED) {
                            throw new types_1.ValidationError('این فروش قبلاً تکمیل شده است');
                        }
                        if (amount > sale.remaining_amount) {
                            throw new types_1.ValidationError("\u0645\u0628\u0644\u063A \u067E\u0631\u062F\u0627\u062E\u062A (".concat((0, helpers_1.formatPrice)(amount), ") \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u0645\u0628\u0644\u063A \u0628\u0627\u0642\u06CC\u0645\u0627\u0646\u062F\u0647 (").concat((0, helpers_1.formatPrice)(sale.remaining_amount), ") \u0627\u0633\u062A"));
                        }
                        return [4 /*yield*/, Sale_1.default.addPayment({
                                sale_id: sale_id,
                                amount: amount,
                                payment_method: payment_method,
                                reference_number: reference_number,
                                payment_date: new Date(),
                                created_by: processed_by,
                            })];
                    case 2:
                        updatedSale = _a.sent();
                        logger_1.default.info("Payment added to sale ".concat(updatedSale.sale_number, ": ").concat((0, helpers_1.formatPrice)(amount)));
                        return [2 /*return*/, updatedSale];
                    case 3:
                        error_4 = _a.sent();
                        logger_1.default.error('Error in addPayment:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get pending payments
     */
    SalesService.prototype.getPendingPayments = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pendingSales;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Sale_1.default.findPending()];
                    case 1:
                        pendingSales = _a.sent();
                        return [2 /*return*/, pendingSales
                                .filter(function (sale) { return sale.remaining_amount > 0; })
                                .map(function (sale) {
                                var daysOverdue = Math.floor((Date.now() - sale.sale_date.getTime()) / (1000 * 60 * 60 * 24));
                                return {
                                    sale_id: sale.id,
                                    sale_number: sale.sale_number,
                                    customer_id: sale.customer_id,
                                    customer_name: null, // Would need to join with customer
                                    final_amount: sale.final_amount,
                                    paid_amount: sale.paid_amount,
                                    remaining_amount: sale.remaining_amount,
                                    sale_date: sale.sale_date,
                                    days_overdue: daysOverdue,
                                };
                            })];
                }
            });
        });
    };
    /**
     * Get overdue payments
     */
    SalesService.prototype.getOverduePayments = function () {
        return __awaiter(this, arguments, void 0, function (days) {
            var allPending;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPendingPayments()];
                    case 1:
                        allPending = _a.sent();
                        return [2 /*return*/, allPending.filter(function (payment) { return payment.days_overdue > days; })];
                }
            });
        });
    };
    // ==========================================
    // VALIDATION
    // ==========================================
    /**
     * Validate sale data
     */
    SalesService.prototype.validateSaleData = function (saleData) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, item, product, customerExists;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validate items
                        if (!saleData.items || saleData.items.length === 0) {
                            throw new types_1.ValidationError('حداقل یک محصول باید انتخاب شود');
                        }
                        _i = 0, _a = saleData.items;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        item = _a[_i];
                        return [4 /*yield*/, Product_1.default.findById(item.product_id)];
                    case 2:
                        product = _b.sent();
                        if (!product) {
                            throw new types_1.NotFoundError("\u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ".concat(item.product_id, " \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"));
                        }
                        if (!product.is_active) {
                            throw new types_1.ValidationError("\u0645\u062D\u0635\u0648\u0644 ".concat(product.name, " \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062A"));
                        }
                        if (product.stock_quantity < item.quantity) {
                            throw new types_1.ValidationError("\u0645\u0648\u062C\u0648\u062F\u06CC ".concat(product.name, " \u06A9\u0627\u0641\u06CC \u0646\u06CC\u0633\u062A (\u0645\u0648\u062C\u0648\u062F\u06CC: ").concat(product.stock_quantity, ", \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC: ").concat(item.quantity, ")"));
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Validate amounts
                        if (saleData.discount && saleData.discount < 0) {
                            throw new types_1.ValidationError('تخفیف نمی‌تواند منفی باشد');
                        }
                        if (saleData.tax && saleData.tax < 0) {
                            throw new types_1.ValidationError('مالیات نمی‌تواند منفی باشد');
                        }
                        if (saleData.paid_amount && saleData.paid_amount < 0) {
                            throw new types_1.ValidationError('مبلغ پرداختی نمی‌تواند منفی باشد');
                        }
                        if (!saleData.customer_id) return [3 /*break*/, 6];
                        return [4 /*yield*/, Customer_1.default.exists(saleData.customer_id)];
                    case 5:
                        customerExists = _b.sent();
                        if (!customerExists) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        _b.label = 6;
                    case 6:
                        // Validate gold price
                        if (saleData.gold_price <= 0) {
                            throw new types_1.ValidationError('قیمت طلا باید مثبت باشد');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate customer credit limit
     */
    SalesService.prototype.validateCustomerCredit = function (customer_id, items, gold_price, discount, tax, paid_amount) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, total, _i, items_1, item, product, finalAmount, remainingAmount, newBalance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findById(customer_id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        total = 0;
                        _i = 0, items_1 = items;
                        _a.label = 2;
                    case 2:
                        if (!(_i < items_1.length)) return [3 /*break*/, 5];
                        item = items_1[_i];
                        return [4 /*yield*/, Product_1.default.findById(item.product_id)];
                    case 3:
                        product = _a.sent();
                        if (product) {
                            total += product.selling_price * item.quantity;
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        finalAmount = total - discount + tax;
                        remainingAmount = finalAmount - paid_amount;
                        // Check credit limit
                        if (customer.credit_limit > 0 && remainingAmount > 0) {
                            newBalance = customer.balance + remainingAmount;
                            if (newBalance > customer.credit_limit) {
                                throw new types_1.ValidationError("\u0645\u0628\u0644\u063A \u0628\u0627\u0642\u06CC\u0645\u0627\u0646\u062F\u0647 (".concat((0, helpers_1.formatPrice)(remainingAmount), ") \u0627\u0632 \u0633\u0642\u0641 \u0627\u0639\u062A\u0628\u0627\u0631 \u0645\u0634\u062A\u0631\u06CC (").concat((0, helpers_1.formatPrice)(customer.credit_limit - customer.balance), ") \u0628\u06CC\u0634\u062A\u0631 \u0627\u0633\u062A"));
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // REPORTS & STATISTICS
    // ==========================================
    /**
     * Get sales report
     */
    SalesService.prototype.getSalesReport = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var filters, sales, stats, totalProfit, byPaymentMethod_1, bySaleType_1, topCustomers, dailySales, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        filters = {};
                        if (startDate)
                            filters.startDate = startDate;
                        if (endDate)
                            filters.endDate = endDate;
                        return [4 /*yield*/, Sale_1.default.findAll(filters)];
                    case 1:
                        sales = _a.sent();
                        return [4 /*yield*/, Sale_1.default.getStatistics(startDate, endDate)];
                    case 2:
                        stats = _a.sent();
                        totalProfit = 0;
                        byPaymentMethod_1 = {
                            cash: { count: 0, amount: 0 },
                            card: { count: 0, amount: 0 },
                            transfer: { count: 0, amount: 0 },
                            check: { count: 0, amount: 0 },
                            mixed: { count: 0, amount: 0 },
                        };
                        bySaleType_1 = {
                            cash: { count: 0, amount: 0 },
                            installment: { count: 0, amount: 0 },
                            exchange: { count: 0, amount: 0 },
                            repair: { count: 0, amount: 0 },
                        };
                        sales.forEach(function (sale) {
                            byPaymentMethod_1[sale.payment_method].count++;
                            byPaymentMethod_1[sale.payment_method].amount += sale.final_amount;
                            bySaleType_1[sale.sale_type].count++;
                            bySaleType_1[sale.sale_type].amount += sale.final_amount;
                        });
                        topCustomers = [];
                        dailySales = [];
                        return [2 /*return*/, {
                                totalSales: stats.totalAmount,
                                totalRevenue: stats.totalRevenue,
                                totalProfit: totalProfit,
                                salesCount: stats.total,
                                averageSaleAmount: stats.averageSaleAmount,
                                completedSales: stats.completed,
                                pendingSales: stats.pending,
                                cancelledSales: stats.cancelled,
                                byPaymentMethod: byPaymentMethod_1,
                                bySaleType: bySaleType_1,
                                topCustomers: topCustomers,
                                dailySales: dailySales,
                            }];
                    case 3:
                        error_5 = _a.sent();
                        logger_1.default.error('Error in getSalesReport:', error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get sales performance
     */
    SalesService.prototype.getSalesPerformance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var query, _a, todayResult, weekResult, monthResult, yearResult;
            var _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        query = require('../config/database').query;
                        return [4 /*yield*/, Promise.all([
                                query("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue \n         FROM sales \n         WHERE DATE(sale_date) = CURRENT_DATE \n         AND status IN ('completed', 'partial')"),
                                query("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue \n         FROM sales \n         WHERE sale_date >= NOW() - INTERVAL '7 days' \n         AND status IN ('completed', 'partial')"),
                                query("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue \n         FROM sales \n         WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)\n         AND status IN ('completed', 'partial')"),
                                query("SELECT COUNT(*) as count, COALESCE(SUM(final_amount), 0) as revenue \n         FROM sales \n         WHERE DATE_TRUNC('year', sale_date) = DATE_TRUNC('year', CURRENT_DATE)\n         AND status IN ('completed', 'partial')"),
                            ])];
                    case 1:
                        _a = _k.sent(), todayResult = _a[0], weekResult = _a[1], monthResult = _a[2], yearResult = _a[3];
                        return [2 /*return*/, {
                                today: {
                                    count: parseInt(((_b = todayResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10),
                                    revenue: parseFloat(((_c = todayResult.rows[0]) === null || _c === void 0 ? void 0 : _c.revenue) || '0'),
                                    profit: 0, // Placeholder
                                },
                                week: {
                                    count: parseInt(((_d = weekResult.rows[0]) === null || _d === void 0 ? void 0 : _d.count) || '0', 10),
                                    revenue: parseFloat(((_e = weekResult.rows[0]) === null || _e === void 0 ? void 0 : _e.revenue) || '0'),
                                    profit: 0,
                                },
                                month: {
                                    count: parseInt(((_f = monthResult.rows[0]) === null || _f === void 0 ? void 0 : _f.count) || '0', 10),
                                    revenue: parseFloat(((_g = monthResult.rows[0]) === null || _g === void 0 ? void 0 : _g.revenue) || '0'),
                                    profit: 0,
                                },
                                year: {
                                    count: parseInt(((_h = yearResult.rows[0]) === null || _h === void 0 ? void 0 : _h.count) || '0', 10),
                                    revenue: parseFloat(((_j = yearResult.rows[0]) === null || _j === void 0 ? void 0 : _j.revenue) || '0'),
                                    profit: 0,
                                },
                            }];
                }
            });
        });
    };
    /**
     * Get today's sales
     */
    SalesService.prototype.getTodaySales = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Sale_1.default.getTodaySales()];
            });
        });
    };
    /**
     * Get today's revenue
     */
    SalesService.prototype.getTodayRevenue = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Sale_1.default.getTodayRevenue()];
            });
        });
    };
    /**
     * Get recent sales
     */
    SalesService.prototype.getRecentSales = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Sale_1.default.findRecent(limit)];
            });
        });
    };
    /**
     * Get sales statistics
     */
    SalesService.prototype.getStatistics = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Sale_1.default.getStatistics(startDate, endDate)];
            });
        });
    };
    /**
     * Get sales by date range
     */
    SalesService.prototype.getSalesByDateRange = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Sale_1.default.findByDateRange(startDate, endDate)];
            });
        });
    };
    // ==========================================
    // INVOICE & RECEIPT
    // ==========================================
    /**
     * Generate invoice data
     */
    SalesService.prototype.generateInvoice = function (sale_id) {
        return __awaiter(this, void 0, void 0, function () {
            var sale, customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSaleById(sale_id)];
                    case 1:
                        sale = _a.sent();
                        customer = null;
                        if (!sale.customer_id) return [3 /*break*/, 3];
                        return [4 /*yield*/, Customer_1.default.findById(sale.customer_id)];
                    case 2:
                        customer = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, {
                            sale: sale,
                            customer: customer,
                            storeName: 'فروشگاه زرمند', // From settings
                            invoiceDate: (0, helpers_1.getCurrentJalaliDate)(),
                        }];
                }
            });
        });
    };
    /**
     * Generate receipt data for payment
     */
    SalesService.prototype.generateReceipt = function (transaction_id) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, sale, customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Transaction_1.default.findById(transaction_id)];
                    case 1:
                        transaction = _a.sent();
                        if (!transaction) {
                            throw new types_1.NotFoundError('تراکنش یافت نشد');
                        }
                        sale = null;
                        if (!transaction.sale_id) return [3 /*break*/, 3];
                        return [4 /*yield*/, Sale_1.default.findById(transaction.sale_id)];
                    case 2:
                        sale = _a.sent();
                        _a.label = 3;
                    case 3:
                        customer = null;
                        if (!transaction.customer_id) return [3 /*break*/, 5];
                        return [4 /*yield*/, Customer_1.default.findById(transaction.customer_id)];
                    case 4:
                        customer = _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, {
                            transaction: transaction,
                            sale: sale,
                            customer: customer,
                            storeName: 'فروشگاه زرمند',
                            receiptDate: (0, helpers_1.getCurrentJalaliDate)(),
                        }];
                }
            });
        });
    };
    // ==========================================
    // ANALYTICS
    // ==========================================
    /**
     * Get best selling products
     */
    SalesService.prototype.getBestSellingProducts = function () {
        return __awaiter(this, arguments, void 0, function (limit, startDate, endDate) {
            var query, whereClause, params, result;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = require('../config/database').query;
                        whereClause = '';
                        params = [];
                        if (startDate && endDate) {
                            whereClause = 'WHERE s.sale_date BETWEEN $1 AND $2';
                            params.push(startDate, endDate);
                        }
                        return [4 /*yield*/, query("SELECT \n        si.product_id,\n        si.product_name,\n        SUM(si.quantity) as total_quantity,\n        SUM(si.total_price) as total_revenue,\n        COUNT(DISTINCT si.sale_id) as sale_count\n       FROM sale_items si\n       JOIN sales s ON si.sale_id = s.id\n       ".concat(whereClause, "\n       GROUP BY si.product_id, si.product_name\n       ORDER BY total_quantity DESC\n       LIMIT $").concat(params.length + 1), __spreadArray(__spreadArray([], params, true), [limit], false))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    /**
     * Get sales trend (daily/weekly/monthly)
     */
    SalesService.prototype.getSalesTrend = function (period_1) {
        return __awaiter(this, arguments, void 0, function (period, days) {
            var query, dateFormat, result;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = require('../config/database').query;
                        dateFormat = 'YYYY-MM-DD';
                        if (period === 'weekly')
                            dateFormat = 'IYYY-IW';
                        if (period === 'monthly')
                            dateFormat = 'YYYY-MM';
                        return [4 /*yield*/, query("SELECT \n        TO_CHAR(sale_date, '".concat(dateFormat, "') as period,\n        COUNT(*) as count,\n        SUM(final_amount) as amount\n       FROM sales\n       WHERE sale_date >= NOW() - INTERVAL '").concat(days, " days'\n       AND status IN ('completed', 'partial')\n       GROUP BY period\n       ORDER BY period ASC"))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    /**
     * Get sales conversion rate (drafts to completed)
     */
    SalesService.prototype.getConversionRate = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var filters, sales, totalDrafts, completed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filters = {};
                        if (startDate)
                            filters.startDate = startDate;
                        if (endDate)
                            filters.endDate = endDate;
                        return [4 /*yield*/, Sale_1.default.findAll(filters)];
                    case 1:
                        sales = _a.sent();
                        totalDrafts = sales.filter(function (s) { return s.status === types_1.SaleStatus.DRAFT; }).length;
                        completed = sales.filter(function (s) { return s.status === types_1.SaleStatus.COMPLETED; }).length;
                        return [2 /*return*/, {
                                totalDrafts: totalDrafts,
                                completed: completed,
                                conversionRate: totalDrafts > 0 ? (completed / totalDrafts) * 100 : 0,
                            }];
                }
            });
        });
    };
    return SalesService;
}());
// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================
exports.default = new SalesService();
