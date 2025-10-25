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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/guards/roles.decorator");
const shared_types_1 = require("../../../../packages/shared-types/src");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
let UsersController = class UsersController {
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(page, limit, search, role, status, branchId, sortBy, sortOrder) {
        const pageNum = this.toPosInt(page, 1);
        const limitNum = this.toPosInt(limit, 20);
        return this.service.findAll({
            page: pageNum,
            limit: limitNum,
            search,
            role,
            status,
            branchId,
            sortBy,
            sortOrder,
        });
    }
    getSummary() {
        return this.service.getSummary();
    }
    getProfile(req) {
        return this.service.findOne(req.user.userId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    updateProfile(req, dto) {
        return this.service.update(req.user.userId, dto);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    changePassword(req, dto) {
        return this.service.changePassword(req.user.userId, dto);
    }
    resetPassword(id, body) {
        return this.service.resetPassword(id, body.newPassword);
    }
    updateStatus(id, body) {
        return this.service.updateStatus(id, body.status);
    }
    updateRole(id, body) {
        return this.service.updateRole(id, body.role);
    }
    remove(id) {
        return this.service.remove(id);
    }
    getActivity(id, from, to, limit) {
        const limitNum = this.toPosInt(limit, 50);
        return this.service.getActivity(id, from, to, limitNum);
    }
    toPosInt(value, fallback) {
        const n = value ? parseInt(value, 10) : NaN;
        if (isNaN(n) || n <= 0)
            return fallback;
        return n;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('role')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('branchId')),
    __param(6, (0, common_1.Query)('sortBy')),
    __param(7, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, typeof (_a = typeof shared_types_1.UserRole !== "undefined" && shared_types_1.UserRole) === "function" ? _a : Object, typeof (_b = typeof shared_types_1.UserStatus !== "undefined" && shared_types_1.UserStatus) === "function" ? _b : Object, String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Post)(':id/reset-password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "resetPassword", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Patch)(':id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Get)(':id/activity'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getActivity", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map