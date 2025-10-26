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
// Controllers - Import all
const attendance_controller_1 = require("./submodules/attendance/attendance.controller");
const payroll_controller_1 = require("./submodules/payroll/payroll.controller");
const performance_controller_1 = require("./submodules/performance/performance.controller");
const employees_controller_1 = require("./employees.controller");
// Services - Import all
const attendance_service_1 = require("./submodules/attendance/attendance.service");
const payroll_service_1 = require("./submodules/payroll/payroll.service");
const performance_service_1 = require("./submodules/performance/performance.service");
const employees_service_1 = require("./employees.service");
let EmployeesModule = class EmployeesModule {
};
exports.EmployeesModule = EmployeesModule;
exports.EmployeesModule = EmployeesModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        // IMPORTANT: More specific routes MUST be registered FIRST
        controllers: [
            attendance_controller_1.AttendanceController, // /employees/attendance
            payroll_controller_1.PayrollController, // /employees/payroll
            performance_controller_1.PerformanceController, // /employees/performance
            employees_controller_1.EmployeesController, // /employees (with :id) - MUST BE LAST
        ],
        providers: [
            attendance_service_1.AttendanceService,
            payroll_service_1.PayrollService,
            performance_service_1.PerformanceService,
            employees_service_1.EmployeesService,
        ],
        exports: [
            employees_service_1.EmployeesService,
            attendance_service_1.AttendanceService,
            payroll_service_1.PayrollService,
            performance_service_1.PerformanceService,
        ],
    })
], EmployeesModule);
//# sourceMappingURL=employees.module.js.map