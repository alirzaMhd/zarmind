import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { AttendanceModule } from './submodules/attendance/attendance.module';
import { PayrollModule } from './submodules/payroll/payroll.module';
import { PerformanceModule } from './submodules/performance/performance.module';

@Module({
  imports: [DatabaseModule, AttendanceModule, PayrollModule, PerformanceModule],
  exports: [AttendanceModule, PayrollModule, PerformanceModule],
})
export class EmployeesModule {}