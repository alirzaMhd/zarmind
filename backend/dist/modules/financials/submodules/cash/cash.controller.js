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
exports.CashController = void 0;
const common_1 = require("@nestjs/common");
const cash_service_1 = require("./cash.service");
const jwt_auth_guard_1 = require("../../../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/guards/roles.decorator");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
const create_cash_transaction_dto_1 = require("./dto/create-cash-transaction.dto");
const update_cash_transaction_dto_1 = require("./dto/update-cash-transaction.dto");
let CashController = class CashController {
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.create(dto, req.user.userId);
    }
    findAll(page, limit, search, branchId, type, category, userId, from, to, minAmount, maxAmount, sortBy, sortOrder) {
        const pageNum = this.toPosInt(page, 1);
        const limitNum = this.toPosInt(limit, 50);
        const minAmt = minAmount ? parseFloat(minAmount) : undefined;
        const maxAmt = maxAmount ? parseFloat(maxAmount) : undefined;
        return this.service.findAll({
            page: pageNum,
            limit: limitNum,
            search,
            branchId,
            type,
            category,
            userId,
            from,
            to,
            minAmount: minAmt,
            maxAmount: maxAmt,
            sortBy,
            sortOrder,
        });
    }
    getSummary(from, to, branchId) {
        return this.service.getSummary(from, to, branchId);
    }
    getCurrentBalance(branchId) {
        return this.service.getCurrentBalance(branchId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
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
exports.CashController = CashController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cash_transaction_dto_1.CreateCashTransactionDto, Object]),
    __metadata("design:returntype", void 0)
], CashController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('branchId')),
    __param(4, (0, common_1.Query)('type')),
    __param(5, (0, common_1.Query)('category')),
    __param(6, (0, common_1.Query)('userId')),
    __param(7, (0, common_1.Query)('from')),
    __param(8, (0, common_1.Query)('to')),
    __param(9, (0, common_1.Query)('minAmount')),
    __param(10, (0, common_1.Query)('maxAmount')),
    __param(11, (0, common_1.Query)('sortBy')),
    __param(12, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CashController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CashController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashController.prototype, "getCurrentBalance", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_cash_transaction_dto_1.UpdateCashTransactionDto]),
    __metadata("design:returntype", void 0)
], CashController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashController.prototype, "remove", null);
exports.CashController = CashController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.ACCOUNTANT, shared_types_1.UserRole.SALES_STAFF),
    (0, common_1.Controller)('financials/cash'),
    __metadata("design:paramtypes", [cash_service_1.CashService])
], CashController);
//# sourceMappingURL=cash.controller.js.map