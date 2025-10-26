import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';

// Controllers - Import all
import { AttendanceController } from './submodules/attendance/attendance.controller';
import { PayrollController } from './submodules/payroll/payroll.controller';
import { PerformanceController } from './submodules/performance/performance.controller';
import { EmployeesController } from './employees.controller';

// Services - Import all
import { AttendanceService } from './submodules/attendance/attendance.service';
import { PayrollService } from './submodules/payroll/payroll.service';
import { PerformanceService } from './submodules/performance/performance.service';
import { EmployeesService } from './employees.service';

@Module({
  imports: [DatabaseModule],
  // IMPORTANT: More specific routes MUST be registered FIRST
  controllers: [
    AttendanceController,    // /employees/attendance
    PayrollController,       // /employees/payroll
    PerformanceController,   // /employees/performance
    EmployeesController,     // /employees (with :id) - MUST BE LAST
  ],
  providers: [
    AttendanceService,
    PayrollService,
    PerformanceService,
    EmployeesService,
  ],
  exports: [
    EmployeesService,
    AttendanceService,
    PayrollService,
    PerformanceService,
  ],
})
export class EmployeesModule {}