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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const sales_service_1 = require("./sales.service");
const jwt_auth_guard_1 = require("../../../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/guards/roles.decorator");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
const update_sale_dto_1 = require("./dto/update-sale.dto");
const update_sale_dto_2 = require("./dto/update-sale.dto");
const record_payment_dto_1 = require("./dto/record-payment.dto");
let SalesController = class SalesController {
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.create(dto, req.user.userId);
    }
    findAll(page, limit, search, status, customerId, branchId, userId, from, to, minAmount, maxAmount, paymentMethod, sortBy, sortOrder) {
        const pageNum = this.toPosInt(page, 1);
        const limitNum = this.toPosInt(limit, 20);
        const minAmt = minAmount ? parseFloat(minAmount) : undefined;
        const maxAmt = maxAmount ? parseFloat(maxAmount) : undefined;
        return this.service.findAll({
            page: pageNum,
            limit: limitNum,
            search,
            status,
            customerId,
            branchId,
            userId,
            from,
            to,
            minAmount: minAmt,
            maxAmount: maxAmt,
            paymentMethod,
            sortBy,
            sortOrder,
        });
    }
    getSummary(from, to, branchId, userId) {
        return this.service.getSummary(from, to, branchId, userId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    findByInvoiceNumber(invoiceNumber) {
        return this.service.findByInvoiceNumber(invoiceNumber);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    recordPayment(id, dto) {
        return this.service.recordPayment(id, dto);
    }
    complete(id, body) {
        return this.service.completeSale(id, body.notes);
    }
    cancel(id, body) {
        return this.service.cancelSale(id, body.reason, body.notes);
    }
    refund(id, body) {
        return this.service.refundSale(id, body.amount, body.reason, body.notes);
    }
    remove(id) {
        return this.service.remove(id);
    }
    toPosInt(value, fallback) {
        const n = value ? parseInt(value, 10) : NaN;
        if (isNaN(n) || n <= 0)
            return fallback;
        return n;
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_sale_dto_1.CreateSaleDto, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.ACCOUNTANT, shared_types_1.UserRole.VIEWER),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('customerId')),
    __param(5, (0, common_1.Query)('branchId')),
    __param(6, (0, common_1.Query)('userId')),
    __param(7, (0, common_1.Query)('from')),
    __param(8, (0, common_1.Query)('to')),
    __param(9, (0, common_1.Query)('minAmount')),
    __param(10, (0, common_1.Query)('maxAmount')),
    __param(11, (0, common_1.Query)('paymentMethod')),
    __param(12, (0, common_1.Query)('sortBy')),
    __param(13, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, typeof (_a = typeof shared_types_1.SaleStatus !== "undefined" && shared_types_1.SaleStatus) === "function" ? _a : Object, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.ACCOUNTANT),
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __param(3, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getSummary", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.ACCOUNTANT, shared_types_1.UserRole.VIEWER),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.ACCOUNTANT, shared_types_1.UserRole.VIEWER),
    (0, common_1.Get)('invoice/:invoiceNumber'),
    __param(0, (0, common_1.Param)('invoiceNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findByInvoiceNumber", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_sale_dto_2.UpdateSaleDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.ACCOUNTANT),
    (0, common_1.Post)(':id/payment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, record_payment_dto_1.RecordPaymentDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "recordPayment", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF),
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "complete", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "cancel", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Post)(':id/refund'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "refund", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "remove", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('transactions/sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map