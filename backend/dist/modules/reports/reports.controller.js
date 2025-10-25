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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/guards/roles.decorator");
const shared_types_1 = require("@zarmind/shared-types");
let ReportsController = class ReportsController {
    constructor(service) {
        this.service = service;
    }
    // Profit & Loss Statement
    async getProfitLoss(from, to, branchId, format) {
        this.validateDateRange(from, to);
        return this.service.getProfitLossReport(from, to, branchId, format);
    }
    // Balance Sheet
    async getBalanceSheet(asOf, branchId, format) {
        return this.service.getBalanceSheetReport(asOf, branchId, format);
    }
    // Inventory Valuation Report
    async getInventoryValuation(asOf, branchId, category, format) {
        return this.service.getInventoryValuationReport(asOf, branchId, category, format);
    }
    // Sales Report
    async getSalesReport(from, to, branchId, userId, customerId, groupBy, format) {
        this.validateDateRange(from, to);
        return this.service.getSalesReport(from, to, branchId, userId, customerId, groupBy, format);
    }
    // Purchase Report
    async getPurchasesReport(from, to, branchId, supplierId, format) {
        this.validateDateRange(from, to);
        return this.service.getPurchasesReport(from, to, branchId, supplierId, format);
    }
    // Cash Flow Statement
    async getCashFlow(from, to, branchId, format) {
        this.validateDateRange(from, to);
        return this.service.getCashFlowReport(from, to, branchId, format);
    }
    // Accounts Receivable Aging Report
    async getARAgingReport(asOf, customerId, format) {
        return this.service.getARAgingReport(asOf, customerId, format);
    }
    // Accounts Payable Aging Report
    async getAPAgingReport(asOf, supplierId, format) {
        return this.service.getAPAgingReport(asOf, supplierId, format);
    }
    // Tax Report
    async getTaxReport(from, to, taxType, format) {
        this.validateDateRange(from, to);
        return this.service.getTaxReport(from, to, taxType, format);
    }
    // Employee Performance Report
    async getEmployeePerformance(from, to, employeeId, branchId, format) {
        this.validateDateRange(from, to);
        return this.service.getEmployeePerformanceReport(from, to, employeeId, branchId, format);
    }
    // Customer Transaction History
    async getCustomerTransactions(customerId, from, to, format) {
        if (!customerId) {
            throw new common_1.BadRequestException('customerId is required');
        }
        return this.service.getCustomerTransactionsReport(customerId, from, to, format);
    }
    // Product Movement Report
    async getProductMovement(productId, category, from, to, branchId, format) {
        return this.service.getProductMovementReport(productId, category, from, to, branchId, format);
    }
    // Gold Price Impact Report
    async getGoldPriceImpact(from, to, format) {
        this.validateDateRange(from, to);
        return this.service.getGoldPriceImpactReport(from, to, format);
    }
    // Workshop Performance Report
    async getWorkshopPerformance(workshopId, from, to, format) {
        return this.service.getWorkshopPerformanceReport(workshopId, from, to, format);
    }
    // Custom Report Builder
    async getCustomReport(reportId, params, format) {
        if (!reportId) {
            throw new common_1.BadRequestException('reportId is required');
        }
        const parsedParams = params ? JSON.parse(params) : {};
        return this.service.getCustomReport(reportId, parsedParams, format);
    }
    // Export Report
    async exportReport(format, params, res) {
        if (!format) {
            throw new common_1.BadRequestException('format is required (pdf, excel, or csv)');
        }
        const parsedParams = params ? JSON.parse(params) : {};
        return this.service.exportReport(format, parsedParams, res);
    }
    // Helper method
    validateDateRange(from, to) {
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                throw new common_1.BadRequestException('Invalid date format');
            }
            if (fromDate > toDate) {
                throw new common_1.BadRequestException('from date must be before to date');
            }
        }
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('profit-loss'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getProfitLoss", null);
__decorate([
    (0, common_1.Get)('balance-sheet'),
    __param(0, (0, common_1.Query)('asOf')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getBalanceSheet", null);
__decorate([
    (0, common_1.Get)('inventory-valuation'),
    __param(0, (0, common_1.Query)('asOf')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getInventoryValuation", null);
__decorate([
    (0, common_1.Get)('sales'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __param(3, (0, common_1.Query)('userId')),
    __param(4, (0, common_1.Query)('customerId')),
    __param(5, (0, common_1.Query)('groupBy')),
    __param(6, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSalesReport", null);
__decorate([
    (0, common_1.Get)('purchases'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __param(3, (0, common_1.Query)('supplierId')),
    __param(4, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPurchasesReport", null);
__decorate([
    (0, common_1.Get)('cash-flow'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCashFlow", null);
__decorate([
    (0, common_1.Get)('ar-aging'),
    __param(0, (0, common_1.Query)('asOf')),
    __param(1, (0, common_1.Query)('customerId')),
    __param(2, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getARAgingReport", null);
__decorate([
    (0, common_1.Get)('ap-aging'),
    __param(0, (0, common_1.Query)('asOf')),
    __param(1, (0, common_1.Query)('supplierId')),
    __param(2, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getAPAgingReport", null);
__decorate([
    (0, common_1.Get)('tax'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('taxType')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTaxReport", null);
__decorate([
    (0, common_1.Get)('employee-performance'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('employeeId')),
    __param(3, (0, common_1.Query)('branchId')),
    __param(4, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getEmployeePerformance", null);
__decorate([
    (0, common_1.Get)('customer-transactions'),
    __param(0, (0, common_1.Query)('customerId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCustomerTransactions", null);
__decorate([
    (0, common_1.Get)('product-movement'),
    __param(0, (0, common_1.Query)('productId')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('branchId')),
    __param(5, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getProductMovement", null);
__decorate([
    (0, common_1.Get)('gold-price-impact'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getGoldPriceImpact", null);
__decorate([
    (0, common_1.Get)('workshop-performance'),
    __param(0, (0, common_1.Query)('workshopId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getWorkshopPerformance", null);
__decorate([
    (0, common_1.Get)('custom'),
    __param(0, (0, common_1.Query)('reportId')),
    __param(1, (0, common_1.Query)('params')),
    __param(2, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCustomReport", null);
__decorate([
    (0, common_1.Get)('export/:reportType'),
    __param(0, (0, common_1.Query)('format')),
    __param(1, (0, common_1.Query)('params')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.ACCOUNTANT),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map