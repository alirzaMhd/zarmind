"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../core/database/database.module");
const employees_controller_1 = require("./employees.controller");
const employees_service_1 = require("./employees.service");
const attendance_module_1 = require("./submodules/attendance/attendance.module");
const payroll_module_1 = require("./submodules/payroll/payroll.module");
const performance_module_1 = require("./submodules/performance/performance.module");
let EmployeesModule = class EmployeesModule {
};
exports.EmployeesModule = EmployeesModule;
exports.EmployeesModule = EmployeesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, attendance_module_1.AttendanceModule, payroll_module_1.PayrollModule, performance_module_1.PerformanceModule],
        controllers: [employees_controller_1.EmployeesController],
        providers: [employees_service_1.EmployeesService],
        exports: [employees_service_1.EmployeesService, attendance_module_1.AttendanceModule, payroll_module_1.PayrollModule, performance_module_1.PerformanceModule],
    })
], EmployeesModule);
//# sourceMappingURL=employees.module.js.map