import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArService } from './ar.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole } from '@zarmind/shared-types';
import { CreateArDto } from './dto/create-ar.dto';
import { UpdateArDto } from './dto/update-ar.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
@Controller('financials/accounts-receivable')
export class ArController {
  constructor(private readonly service: ArService) {}

  @Post()
  create(@Body() dto: CreateArDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('overdue') overdue?: string,
    @Query('sortBy') sortBy?: 'invoiceDate' | 'dueDate' | 'amount' | 'remainingAmount',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const isOverdue = overdue ? ['true', '1', 'yes'].includes(overdue.toLowerCase()) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      customerId,
      status,
      from,
      to,
      overdue: isOverdue,
      sortBy,
      sortOrder,
    });
  }

  @Get('summary')
  getSummary(@Query('customerId') customerId?: string) {
    return this.service.getSummary(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/payment')
  recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.service.recordPayment(id, dto);
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