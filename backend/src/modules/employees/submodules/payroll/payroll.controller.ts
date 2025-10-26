import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole } from '@zarmind/shared-types';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { PayPayrollDto } from './dto/pay-payroll.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
@Controller('employees/payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) { }

  @Post('generate')
  generate(@Body() dto: GeneratePayrollDto) {
    return this.service.generate(dto);
  }

  @Get()
  list(
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('paid') paid?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'payDate' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const p = this.toPosInt(page, 1);
    const l = this.toPosInt(limit, 20);
    const paidBool =
      typeof paid === 'string'
        ? ['true', '1', 'yes', 'on'].includes(paid.toLowerCase())
        : undefined;

    return this.service.findAll({
      employeeId,
      from,
      to,
      paid: paidBool,
      page: p,
      limit: l,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/pay')
  markPaid(@Param('id') id: string, @Body() dto: PayPayrollDto) {
    return this.service.markPaid(id, dto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
  private toPosInt(value: string | undefined, fallback: number): number {
    const n = value ? parseInt(value, 10) : NaN;
    if (isNaN(n) || n <= 0) return fallback;
    return n;
  }
}