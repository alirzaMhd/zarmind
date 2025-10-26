import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { AttendanceModule } from './submodules/attendance/attendance.module';
import { PayrollModule } from './submodules/payroll/payroll.module';
import { PerformanceModule } from './submodules/performance/performance.module';

@Module({
  imports: [DatabaseModule, AttendanceModule, PayrollModule, PerformanceModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService, AttendanceModule, PayrollModule, PerformanceModule],
})
export class EmployeesModule {}