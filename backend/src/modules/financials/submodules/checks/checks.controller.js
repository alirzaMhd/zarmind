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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChecksController = void 0;
const common_1 = require("@nestjs/common");
const checks_service_1 = require("./checks.service");
const jwt_auth_guard_1 = require("../../../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/guards/roles.decorator");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
const create_check_dto_1 = require("./dto/create-check.dto");
const update_check_dto_1 = require("./dto/update-check.dto");
const update_check_status_dto_1 = require("./dto/update-check-status.dto");
let ChecksController = class ChecksController {
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(page, limit, search, type, status, fromDueDate, toDueDate, bankName, minAmount, maxAmount, sortBy, sortOrder) {
        const pageNum = this.toPosInt(page, 1);
        const limitNum = this.toPosInt(limit, 20);
        const minAmt = minAmount ? parseFloat(minAmount) : undefined;
        const maxAmt = maxAmount ? parseFloat(maxAmount) : undefined;
        return this.service.findAll({
            page: pageNum,
            limit: limitNum,
            search,
            type,
            status,
            fromDueDate,
            toDueDate,
            bankName,
            minAmount: minAmt,
            maxAmount: maxAmt,
            sortBy,
            sortOrder,
        });
    }
    getSummary(type) {
        return this.service.getSummary(type);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    updateStatus(id, dto) {
        return this.service.updateStatus(id, dto);
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
exports.ChecksController = ChecksController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_check_dto_1.CreateCheckDto]),
    __metadata("design:returntype", void 0)
], ChecksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('fromDueDate')),
    __param(6, (0, common_1.Query)('toDueDate')),
    __param(7, (0, common_1.Query)('bankName')),
    __param(8, (0, common_1.Query)('minAmount')),
    __param(9, (0, common_1.Query)('maxAmount')),
    __param(10, (0, common_1.Query)('sortBy')),
    __param(11, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, typeof (_a = typeof shared_types_1.CheckType !== "undefined" && shared_types_1.CheckType) === "function" ? _a : Object, typeof (_b = typeof shared_types_1.CheckStatus !== "undefined" && shared_types_1.CheckStatus) === "function" ? _b : Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ChecksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof shared_types_1.CheckType !== "undefined" && shared_types_1.CheckType) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], ChecksController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChecksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_check_dto_1.UpdateCheckDto]),
    __metadata("design:returntype", void 0)
], ChecksController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_check_status_dto_1.UpdateCheckStatusDto]),
    __metadata("design:returntype", void 0)
], ChecksController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChecksController.prototype, "remove", null);
exports.ChecksController = ChecksController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.ACCOUNTANT),
    (0, common_1.Controller)('financials/checks'),
    __metadata("design:paramtypes", [checks_service_1.ChecksService])
], ChecksController);
//# sourceMappingURL=checks.controller.js.map