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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const jwt_auth_guard_1 = require("../../../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../../core/guards/roles.guard");
const roles_decorator_1 = require("../../../../core/guards/roles.decorator");
const shared_types_1 = require("../../../../../../packages/shared-types/src");
const clock_in_dto_1 = require("./dto/clock-in.dto");
const clock_out_dto_1 = require("./dto/clock-out.dto");
const update_attendance_dto_1 = require("./dto/update-attendance.dto");
let AttendanceController = class AttendanceController {
    constructor(service) {
        this.service = service;
    }
    clockIn(dto, req) {
        const ip = req.ip ||
            (Array.isArray(req.ips) && req.ips[0]) ||
            undefined;
        const ua = req.headers['user-agent'] || undefined;
        return this.service.clockIn(dto, ip, ua);
    }
    clockOut(dto, req) {
        const ip = req.ip ||
            (Array.isArray(req.ips) && req.ips[0]) ||
            undefined;
        const ua = req.headers['user-agent'] || undefined;
        return this.service.clockOut(dto, ip, ua);
    }
    list(employeeId, from, to, status, page, limit) {
        const p = this.toPosInt(page, 1);
        const l = this.toPosInt(limit, 20);
        return this.service.findAll({ employeeId, from, to, status, page: p, limit: l });
    }
    get(id) {
        return this.service.findOne(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    toPosInt(value, fallback) {
        const n = value ? parseInt(value, 10) : NaN;
        if (isNaN(n) || n <= 0)
            return fallback;
        return n;
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('clock-in'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [clock_in_dto_1.ClockInDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "clockIn", null);
__decorate([
    (0, common_1.Post)('clock-out'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [clock_out_dto_1.ClockOutDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "clockOut", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('employeeId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, typeof (_a = typeof shared_types_1.AttendanceStatus !== "undefined" && shared_types_1.AttendanceStatus) === "function" ? _a : Object, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_attendance_dto_1.UpdateAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "update", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF),
    (0, common_1.Controller)('employees/attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map