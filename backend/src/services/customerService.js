"use strict";
// ==========================================
// ZARMIND - Customer Service
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
var Customer_1 = require("../models/Customer");
var AuditLog_1 = require("../models/AuditLog");
var types_1 = require("../types");
var logger_1 = require("../utils/logger");
var helpers_1 = require("../utils/helpers");
var database_1 = require("../config/database");
// ==========================================
// CUSTOMER SERVICE
// ==========================================
var CustomerService = /** @class */ (function () {
    function CustomerService() {
    }
    // ==========================================
    // CUSTOMER CRUD
    // ==========================================
    /**
     * Create a new customer
     */
    CustomerService.prototype.createCustomer = function (customerData, created_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Validate phone number
                        if (!(0, helpers_1.validateMobileNumber)(customerData.phone)) {
                            throw new types_1.ValidationError('شماره تلفن نامعتبر است');
                        }
                        // Validate email if provided
                        if (customerData.email && !(0, helpers_1.validateEmail)(customerData.email)) {
                            throw new types_1.ValidationError('ایمیل نامعتبر است');
                        }
                        // Validate national ID if provided
                        if (customerData.national_id && !(0, helpers_1.validateNationalId)(customerData.national_id)) {
                            throw new types_1.ValidationError('کد ملی نامعتبر است');
                        }
                        return [4 /*yield*/, Customer_1.default.create(customerData)];
                    case 1:
                        customer = _a.sent();
                        // Log creation
                        return [4 /*yield*/, AuditLog_1.default.logCreate(created_by, types_1.EntityType.CUSTOMER, customer.id, customer, ip_address, user_agent)];
                    case 2:
                        // Log creation
                        _a.sent();
                        logger_1.default.info("Customer created: ".concat(customer.full_name, " (").concat(customer.customer_code, ") by ").concat(created_by));
                        return [2 /*return*/, customer];
                    case 3:
                        error_1 = _a.sent();
                        logger_1.default.error('Error in createCustomer:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get customer by ID
     */
    CustomerService.prototype.getCustomerById = function (id, user_id, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findById(id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        if (!user_id) return [3 /*break*/, 3];
                        return [4 /*yield*/, AuditLog_1.default.logView(user_id, types_1.EntityType.CUSTOMER, id, ip_address, user_agent)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, customer];
                }
            });
        });
    };
    /**
     * Get customer by code
     */
    CustomerService.prototype.getCustomerByCode = function (customer_code) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findByCode(customer_code)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        return [2 /*return*/, customer];
                }
            });
        });
    };
    /**
     * Get customer by phone
     */
    CustomerService.prototype.getCustomerByPhone = function (phone) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findByPhone(phone)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری با این شماره تلفن یافت نشد');
                        }
                        return [2 /*return*/, customer];
                }
            });
        });
    };
    /**
     * Get all customers with filters
     */
    CustomerService.prototype.getCustomers = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Customer_1.default.findAll(filters)];
            });
        });
    };
    /**
     * Get customers with pagination
     */
    CustomerService.prototype.getCustomersWithPagination = function () {
        return __awaiter(this, arguments, void 0, function (page, limit, filters) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Customer_1.default.findWithPagination(page, limit, filters)];
            });
        });
    };
    /**
     * Update customer
     */
    CustomerService.prototype.updateCustomer = function (id, updateData, updated_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var oldCustomer, updatedCustomer, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Customer_1.default.findById(id)];
                    case 1:
                        oldCustomer = _a.sent();
                        if (!oldCustomer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        // Validate phone if being updated
                        if (updateData.phone && !(0, helpers_1.validateMobileNumber)(updateData.phone)) {
                            throw new types_1.ValidationError('شماره تلفن نامعتبر است');
                        }
                        // Validate email if being updated
                        if (updateData.email && !(0, helpers_1.validateEmail)(updateData.email)) {
                            throw new types_1.ValidationError('ایمیل نامعتبر است');
                        }
                        // Validate national ID if being updated
                        if (updateData.national_id && !(0, helpers_1.validateNationalId)(updateData.national_id)) {
                            throw new types_1.ValidationError('کد ملی نامعتبر است');
                        }
                        return [4 /*yield*/, Customer_1.default.update(id, updateData)];
                    case 2:
                        updatedCustomer = _a.sent();
                        // Log update
                        return [4 /*yield*/, AuditLog_1.default.logUpdate(updated_by, types_1.EntityType.CUSTOMER, id, oldCustomer, updatedCustomer, ip_address, user_agent)];
                    case 3:
                        // Log update
                        _a.sent();
                        logger_1.default.info("Customer updated: ".concat(updatedCustomer.full_name, " (").concat(updatedCustomer.customer_code, ") by ").concat(updated_by));
                        return [2 /*return*/, updatedCustomer];
                    case 4:
                        error_2 = _a.sent();
                        logger_1.default.error('Error in updateCustomer:', error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete customer (soft delete)
     */
    CustomerService.prototype.deleteCustomer = function (id, deleted_by, ip_address, user_agent) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findById(id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        // Check if customer has outstanding debt
                        if (customer.balance > 0) {
                            throw new types_1.ValidationError('نمی‌توان مشتری با بدهی را حذف کرد');
                        }
                        // Soft delete
                        return [4 /*yield*/, Customer_1.default.softDelete(id)];
                    case 2:
                        // Soft delete
                        _a.sent();
                        // Log deletion
                        return [4 /*yield*/, AuditLog_1.default.logDelete(deleted_by, types_1.EntityType.CUSTOMER, id, customer, ip_address, user_agent)];
                    case 3:
                        // Log deletion
                        _a.sent();
                        logger_1.default.info("Customer deleted: ".concat(customer.full_name, " (").concat(customer.customer_code, ") by ").concat(deleted_by));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Restore deleted customer
     */
    CustomerService.prototype.restoreCustomer = function (id, restored_by) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.setActiveStatus(id, true)];
                    case 1:
                        customer = _a.sent();
                        logger_1.default.info("Customer restored: ".concat(customer.full_name, " (").concat(customer.customer_code, ") by ").concat(restored_by));
                        return [2 /*return*/, customer];
                }
            });
        });
    };
    // ==========================================
    // BALANCE MANAGEMENT
    // ==========================================
    /**
     * Adjust customer balance
     */
    CustomerService.prototype.adjustBalance = function (adjustment) {
        return __awaiter(this, void 0, void 0, function () {
            var customer_id, amount, type, reason, adjusted_by, customer, oldBalance, updatedCustomer, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        customer_id = adjustment.customer_id, amount = adjustment.amount, type = adjustment.type, reason = adjustment.reason, adjusted_by = adjustment.adjusted_by;
                        return [4 /*yield*/, Customer_1.default.findById(customer_id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        oldBalance = customer.balance;
                        return [4 /*yield*/, Customer_1.default.adjustBalance({
                                customer_id: customer_id,
                                amount: amount,
                                type: type,
                                reason: reason,
                                updated_by: adjusted_by,
                            })];
                    case 2:
                        updatedCustomer = _a.sent();
                        // Log balance change
                        return [4 /*yield*/, AuditLog_1.default.logUpdate(adjusted_by, types_1.EntityType.CUSTOMER, customer_id, { balance: oldBalance }, { balance: updatedCustomer.balance }, undefined, undefined)];
                    case 3:
                        // Log balance change
                        _a.sent();
                        logger_1.default.info("Customer balance adjusted: ".concat(customer.full_name, " - ").concat(type, " ").concat((0, helpers_1.formatPrice)(amount), " - Reason: ").concat(reason));
                        return [2 /*return*/, updatedCustomer];
                    case 4:
                        error_3 = _a.sent();
                        logger_1.default.error('Error in adjustBalance:', error_3);
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add debt to customer
     */
    CustomerService.prototype.addDebt = function (customer_id, amount, adjusted_by, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adjustBalance({
                        customer_id: customer_id,
                        amount: amount,
                        type: 'increase',
                        reason: reason || 'افزایش بدهی',
                        adjusted_by: adjusted_by,
                    })];
            });
        });
    };
    /**
     * Reduce debt (customer payment)
     */
    CustomerService.prototype.reduceDebt = function (customer_id, amount, adjusted_by, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adjustBalance({
                        customer_id: customer_id,
                        amount: amount,
                        type: 'decrease',
                        reason: reason || 'پرداخت بدهی',
                        adjusted_by: adjusted_by,
                    })];
            });
        });
    };
    /**
     * Settle customer account (set balance to zero)
     */
    CustomerService.prototype.settleAccount = function (customer_id, adjusted_by) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adjustBalance({
                        customer_id: customer_id,
                        amount: 0,
                        type: 'set',
                        reason: 'تسویه حساب',
                        adjusted_by: adjusted_by,
                    })];
            });
        });
    };
    /**
     * Update credit limit
     */
    CustomerService.prototype.updateCreditLimit = function (customer_id, credit_limit, updated_by) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (credit_limit < 0) {
                            throw new types_1.ValidationError('سقف اعتبار نمی‌تواند منفی باشد');
                        }
                        return [4 /*yield*/, Customer_1.default.findById(customer_id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        // Check if current balance exceeds new credit limit
                        if (customer.balance > credit_limit) {
                            throw new types_1.ValidationError('سقف اعتبار جدید کمتر از بدهی فعلی مشتری است');
                        }
                        return [2 /*return*/, Customer_1.default.update(customer_id, { credit_limit: credit_limit })];
                }
            });
        });
    };
    /**
     * Get customers with debt
     */
    CustomerService.prototype.getCustomersWithDebt = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Customer_1.default.findWithDebt()];
            });
        });
    };
    /**
     * Get customers with credit
     */
    CustomerService.prototype.getCustomersWithCredit = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Customer_1.default.findWithCredit()];
            });
        });
    };
    /**
     * Check if customer can purchase (credit limit check)
     */
    CustomerService.prototype.canPurchase = function (customer_id, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, newBalance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findById(customer_id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        if (customer.credit_limit === 0) {
                            return [2 /*return*/, true]; // No credit limit set
                        }
                        newBalance = customer.balance + amount;
                        return [2 /*return*/, newBalance <= customer.credit_limit];
                }
            });
        });
    };
    /**
     * Get available credit
     */
    CustomerService.prototype.getAvailableCredit = function (customer_id) {
        return __awaiter(this, void 0, void 0, function () {
            var customer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findById(customer_id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        if (customer.credit_limit === 0) {
                            return [2 /*return*/, Infinity]; // No limit
                        }
                        return [2 /*return*/, Math.max(0, customer.credit_limit - customer.balance)];
                }
            });
        });
    };
    // ==========================================
    // SEARCH & FILTER
    // ==========================================
    /**
     * Search customers
     */
    CustomerService.prototype.searchCustomers = function (searchTerm_1) {
        return __awaiter(this, arguments, void 0, function (searchTerm, limit) {
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Customer_1.default.search(searchTerm, limit)];
            });
        });
    };
    /**
     * Get customers by city
     */
    CustomerService.prototype.getCustomersByCity = function (city) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Customer_1.default.findByCity(city)];
            });
        });
    };
    /**
     * Advanced customer search
     */
    CustomerService.prototype.advancedSearch = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Customer_1.default.findAll(filters)];
            });
        });
    };
    // ==========================================
    // CUSTOMER ACCOUNT & HISTORY
    // ==========================================
    /**
     * Get customer account summary
     */
    CustomerService.prototype.getCustomerAccountSummary = function (customer_id) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, purchaseHistory, balanceStatus, creditUtilization;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findByIdWithStats(customer_id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        return [4 /*yield*/, Customer_1.default.getPurchaseHistory(customer_id)];
                    case 2:
                        purchaseHistory = _a.sent();
                        if (customer.balance > 0) {
                            balanceStatus = 'debtor';
                        }
                        else if (customer.balance < 0) {
                            balanceStatus = 'creditor';
                        }
                        else {
                            balanceStatus = 'settled';
                        }
                        creditUtilization = 0;
                        if (customer.credit_limit > 0) {
                            creditUtilization = (customer.balance / customer.credit_limit) * 100;
                        }
                        return [2 /*return*/, {
                                customer: customer,
                                balance: customer.balance,
                                balanceStatus: balanceStatus,
                                totalPurchases: customer.total_purchases,
                                totalOrders: purchaseHistory.totalOrders,
                                completedOrders: purchaseHistory.completedOrders,
                                pendingOrders: purchaseHistory.pendingOrders,
                                cancelledOrders: purchaseHistory.cancelledOrders,
                                lastPurchaseDate: customer.last_purchase_date,
                                creditUtilization: creditUtilization,
                            }];
                }
            });
        });
    };
    /**
     * Get customer purchase history
     */
    CustomerService.prototype.getCustomerPurchaseHistory = function (customer_id) {
        return __awaiter(this, void 0, void 0, function () {
            var exists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.exists(customer_id)];
                    case 1:
                        exists = _a.sent();
                        if (!exists) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        return [2 /*return*/, Customer_1.default.getPurchaseHistory(customer_id)];
                }
            });
        });
    };
    /**
     * Get customer transaction history
     */
    CustomerService.prototype.getCustomerTransactions = function (customer_id) {
        return __awaiter(this, void 0, void 0, function () {
            var exists, TransactionModel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.exists(customer_id)];
                    case 1:
                        exists = _a.sent();
                        if (!exists) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        TransactionModel = require('./Transaction').default;
                        return [2 /*return*/, TransactionModel.findByCustomer(customer_id)];
                }
            });
        });
    };
    // ==========================================
    // REPORTS & STATISTICS
    // ==========================================
    /**
     * Get customer statistics
     */
    CustomerService.prototype.getCustomerStatistics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Customer_1.default.getStatistics()];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, {
                                totalCustomers: stats.total,
                                activeCustomers: stats.active,
                                inactiveCustomers: stats.inactive,
                                customersWithDebt: stats.withDebt,
                                customersWithCredit: stats.withCredit,
                                totalDebt: stats.totalDebt,
                                totalCredit: stats.totalCredit,
                                totalPurchases: stats.totalPurchases,
                                averagePurchasePerCustomer: stats.active > 0 ? stats.totalPurchases / stats.active : 0,
                                topCities: stats.topCities,
                            }];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.default.error('Error in getCustomerStatistics:', error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get top customers by purchases
     */
    CustomerService.prototype.getTopCustomers = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var customers;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.getTopCustomers(limit)];
                    case 1:
                        customers = _a.sent();
                        return [2 /*return*/, customers.map(function (customer) { return ({
                                id: customer.id,
                                customer_code: customer.customer_code,
                                full_name: customer.full_name,
                                phone: customer.phone,
                                total_purchases: customer.total_purchases,
                                total_orders: 0, // Would need to join with sales
                                last_purchase_date: customer.last_purchase_date,
                            }); })];
                }
            });
        });
    };
    /**
     * Get debtor report
     */
    CustomerService.prototype.getDebtorReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var debtors;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findWithDebt()];
                    case 1:
                        debtors = _a.sent();
                        return [2 /*return*/, debtors.map(function (customer) { return ({
                                customer_id: customer.id,
                                customer_code: customer.customer_code,
                                full_name: customer.full_name,
                                phone: customer.phone,
                                debt_amount: customer.balance,
                                credit_limit: customer.credit_limit,
                                last_purchase_date: customer.last_purchase_date,
                            }); })];
                }
            });
        });
    };
    /**
     * Get customers nearing credit limit
     */
    CustomerService.prototype.getCustomersNearingCreditLimit = function () {
        return __awaiter(this, arguments, void 0, function (threshold) {
            var customers;
            if (threshold === void 0) { threshold = 80; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findAll({ isActive: true })];
                    case 1:
                        customers = _a.sent();
                        return [2 /*return*/, customers.filter(function (customer) {
                                if (customer.credit_limit === 0)
                                    return false;
                                var utilization = (customer.balance / customer.credit_limit) * 100;
                                return utilization >= threshold;
                            })];
                }
            });
        });
    };
    /**
     * Get customer lifetime value
     */
    CustomerService.prototype.getCustomerLifetimeValue = function (customer_id) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, purchaseHistory, daysActive;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Customer_1.default.findById(customer_id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            throw new types_1.NotFoundError('مشتری یافت نشد');
                        }
                        return [4 /*yield*/, Customer_1.default.getPurchaseHistory(customer_id)];
                    case 2:
                        purchaseHistory = _a.sent();
                        daysActive = Math.floor((Date.now() - customer.created_at.getTime()) / (1000 * 60 * 60 * 24));
                        return [2 /*return*/, {
                                customer_id: customer.id,
                                total_purchases: customer.total_purchases,
                                total_orders: purchaseHistory.totalOrders,
                                average_order_value: purchaseHistory.totalOrders > 0
                                    ? customer.total_purchases / purchaseHistory.totalOrders
                                    : 0,
                                customer_since: customer.created_at,
                                days_active: daysActive,
                            }];
                }
            });
        });
    };
    /**
     * Get new customers (this month)
     */
    CustomerService.prototype.getNewCustomers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT * FROM customers \n       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)\n       ORDER BY created_at DESC")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    /**
     * Get inactive customers (no purchase in X days)
     */
    CustomerService.prototype.getInactiveCustomers = function () {
        return __awaiter(this, arguments, void 0, function (days) {
            var result;
            if (days === void 0) { days = 90; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_1.query)("SELECT * FROM customers \n       WHERE is_active = true \n       AND (last_purchase_date IS NULL OR last_purchase_date < NOW() - INTERVAL '".concat(days, " days')\n       ORDER BY last_purchase_date ASC NULLS FIRST"))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows];
                }
            });
        });
    };
    // ==========================================
    // BULK OPERATIONS
    // ==========================================
    /**
     * Bulk activate/deactivate customers
     */
    CustomerService.prototype.bulkSetActiveStatus = function (customer_ids, is_active, updated_by) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedCount, _i, customer_ids_1, id, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updatedCount = 0;
                        _i = 0, customer_ids_1 = customer_ids;
                        _a.label = 1;
                    case 1:
                        if (!(_i < customer_ids_1.length)) return [3 /*break*/, 6];
                        id = customer_ids_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, Customer_1.default.setActiveStatus(id, is_active)];
                    case 3:
                        _a.sent();
                        updatedCount++;
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        logger_1.default.error("Error updating customer ".concat(id, ":"), error_5);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        logger_1.default.info("Bulk ".concat(is_active ? 'activated' : 'deactivated', " ").concat(updatedCount, " customers"));
                        return [2 /*return*/, updatedCount];
                }
            });
        });
    };
    /**
     * Bulk update credit limit
     */
    CustomerService.prototype.bulkUpdateCreditLimit = function (customer_ids, credit_limit, updated_by) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedCount, _i, customer_ids_2, id, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updatedCount = 0;
                        _i = 0, customer_ids_2 = customer_ids;
                        _a.label = 1;
                    case 1:
                        if (!(_i < customer_ids_2.length)) return [3 /*break*/, 6];
                        id = customer_ids_2[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.updateCreditLimit(id, credit_limit, updated_by)];
                    case 3:
                        _a.sent();
                        updatedCount++;
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _a.sent();
                        logger_1.default.error("Error updating credit limit for customer ".concat(id, ":"), error_6);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        logger_1.default.info("Bulk updated credit limit for ".concat(updatedCount, " customers"));
                        return [2 /*return*/, updatedCount];
                }
            });
        });
    };
    // ==========================================
    // VALIDATION
    // ==========================================
    /**
     * Validate customer data
     */
    CustomerService.prototype.validateCustomerData = function (data) {
        if (data.phone && !(0, helpers_1.validateMobileNumber)(data.phone)) {
            throw new types_1.ValidationError('شماره تلفن نامعتبر است');
        }
        if (data.email && !(0, helpers_1.validateEmail)(data.email)) {
            throw new types_1.ValidationError('ایمیل نامعتبر است');
        }
        if (data.national_id && !(0, helpers_1.validateNationalId)(data.national_id)) {
            throw new types_1.ValidationError('کد ملی نامعتبر است');
        }
        if (data.credit_limit !== undefined && data.credit_limit < 0) {
            throw new types_1.ValidationError('سقف اعتبار نمی‌تواند منفی باشد');
        }
        if (data.postal_code && data.postal_code.length !== 10) {
            throw new types_1.ValidationError('کد پستی باید 10 رقم باشد');
        }
    };
    /**
     * Check if phone number is unique
     */
    CustomerService.prototype.isPhoneUnique = function (phone, excludeId) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Customer_1.default.findByPhone(phone)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            return [2 /*return*/, true];
                        }
                        if (excludeId && customer.id === excludeId) {
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                    case 2:
                        error_7 = _a.sent();
                        return [2 /*return*/, true]; // Phone not found = unique
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if email is unique
     */
    CustomerService.prototype.isEmailUnique = function (email, excludeId) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Customer_1.default.findByEmail(email)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            return [2 /*return*/, true];
                        }
                        if (excludeId && customer.id === excludeId) {
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                    case 2:
                        error_8 = _a.sent();
                        return [2 /*return*/, true]; // Email not found = unique
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if national ID is unique
     */
    CustomerService.prototype.isNationalIdUnique = function (national_id, excludeId) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Customer_1.default.findByNationalId(national_id)];
                    case 1:
                        customer = _a.sent();
                        if (!customer) {
                            return [2 /*return*/, true];
                        }
                        if (excludeId && customer.id === excludeId) {
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                    case 2:
                        error_9 = _a.sent();
                        return [2 /*return*/, true]; // National ID not found = unique
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ==========================================
    // CUSTOMER INSIGHTS
    // ==========================================
    /**
     * Get customer segmentation
     */
    CustomerService.prototype.getCustomerSegmentation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, vipResult, regularResult, inactiveResult, newResult;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE total_purchases > 50000000 AND is_active = true"),
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE total_purchases BETWEEN 10000000 AND 50000000 AND is_active = true"),
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE is_active = true \n         AND (last_purchase_date IS NULL OR last_purchase_date < NOW() - INTERVAL '90 days')"),
                            (0, database_1.query)("SELECT COUNT(*) as count FROM customers \n         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)"),
                        ])];
                    case 1:
                        _a = _f.sent(), vipResult = _a[0], regularResult = _a[1], inactiveResult = _a[2], newResult = _a[3];
                        return [2 /*return*/, {
                                vip: parseInt(((_b = vipResult.rows[0]) === null || _b === void 0 ? void 0 : _b.count) || '0', 10),
                                regular: parseInt(((_c = regularResult.rows[0]) === null || _c === void 0 ? void 0 : _c.count) || '0', 10),
                                inactive: parseInt(((_d = inactiveResult.rows[0]) === null || _d === void 0 ? void 0 : _d.count) || '0', 10),
                                new: parseInt(((_e = newResult.rows[0]) === null || _e === void 0 ? void 0 : _e.count) || '0', 10),
                            }];
                }
            });
        });
    };
    /**
     * Get customer retention rate
     */
    CustomerService.prototype.getCustomerRetentionRate = function () {
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
                        return [2 /*return*/, {
                                totalCustomers: total,
                                activeCustomers: active,
                                retentionRate: total > 0 ? (active / total) * 100 : 0,
                            }];
                }
            });
        });
    };
    return CustomerService;
}());
// ==========================================
// EXPORT SINGLETON INSTANCE
// ==========================================
exports.default = new CustomerService();
