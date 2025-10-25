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
exports.StonesController = void 0;
const common_1 = require("@nestjs/common");
const stones_service_1 = require("./stones.service");
const jwt_auth_guard_1 = require("../../../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/guards/roles.decorator");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
const create_stone_dto_1 = require("./dto/create-stone.dto");
const update_stone_dto_1 = require("./dto/update-stone.dto");
let StonesController = class StonesController {
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(page, limit, search, stoneType, status, branchId, minCaratWeight, maxCaratWeight, minPrice, maxPrice, quality, hasCertificate, sortBy, sortOrder) {
        const pageNum = this.toPosInt(page, 1);
        const limitNum = this.toPosInt(limit, 20);
        const minCarat = minCaratWeight ? parseFloat(minCaratWeight) : undefined;
        const maxCarat = maxCaratWeight ? parseFloat(maxCaratWeight) : undefined;
        const minPr = minPrice ? parseFloat(minPrice) : undefined;
        const maxPr = maxPrice ? parseFloat(maxPrice) : undefined;
        const hasCert = hasCertificate !== undefined
            ? ['true', '1', 'yes'].includes(hasCertificate.toLowerCase())
            : undefined;
        return this.service.findAll({
            page: pageNum,
            limit: limitNum,
            search,
            stoneType,
            status,
            branchId,
            minCaratWeight: minCarat,
            maxCaratWeight: maxCarat,
            minPrice: minPr,
            maxPrice: maxPr,
            quality,
            hasCertificate: hasCert,
            sortBy,
            sortOrder,
        });
    }
    getSummary(branchId) {
        return this.service.getSummary(branchId);
    }
    findByCertificate(certificateNumber) {
        return this.service.findByCertificate(certificateNumber);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    adjustQuantity(id, body) {
        return this.service.adjustQuantity(id, body.adjustment, body.branchId, body.notes);
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
exports.StonesController = StonesController;
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.WAREHOUSE_STAFF),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stone_dto_1.CreateStoneDto]),
    __metadata("design:returntype", void 0)
], StonesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF, shared_types_1.UserRole.VIEWER),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('stoneType')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('branchId')),
    __param(6, (0, common_1.Query)('minCaratWeight')),
    __param(7, (0, common_1.Query)('maxCaratWeight')),
    __param(8, (0, common_1.Query)('minPrice')),
    __param(9, (0, common_1.Query)('maxPrice')),
    __param(10, (0, common_1.Query)('quality')),
    __param(11, (0, common_1.Query)('hasCertificate')),
    __param(12, (0, common_1.Query)('sortBy')),
    __param(13, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], StonesController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF, shared_types_1.UserRole.VIEWER),
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StonesController.prototype, "getSummary", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF, shared_types_1.UserRole.VIEWER),
    (0, common_1.Get)('by-certificate/:certificateNumber'),
    __param(0, (0, common_1.Param)('certificateNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StonesController.prototype, "findByCertificate", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF, shared_types_1.UserRole.VIEWER),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StonesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.WAREHOUSE_STAFF),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stone_dto_1.UpdateStoneDto]),
    __metadata("design:returntype", void 0)
], StonesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.WAREHOUSE_STAFF),
    (0, common_1.Patch)(':id/adjust-quantity'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StonesController.prototype, "adjustQuantity", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StonesController.prototype, "remove", null);
exports.StonesController = StonesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('inventory/stones'),
    __metadata("design:paramtypes", [typeof (_a = typeof stones_service_1.StonesService !== "undefined" && stones_service_1.StonesService) === "function" ? _a : Object])
], StonesController);
//# sourceMappingURL=stones.controller.js.map