import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';
  import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole } from '@zarmind/shared-types';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('employees/performance')
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  @Post()
  create(@Body() dto: CreatePerformanceDto) {
    return this.service.create(dto);
  }

  @Get()
  list(
    @Query('employeeId') employeeId?: string,
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = this.toPosInt(page, 1);
    const l = this.toPosInt(limit, 20);
    return this.service.findAll({ employeeId, period, page: p, limit: l });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePerformanceDto) {
    return this.service.update(id, dto);
  }

  private toPosInt(value: string | undefined, fallback: number): number {
    const n = value ? parseInt(value, 10) : NaN;
    if (isNaN(n) || n <= 0) return fallback;
    return n;
  }
}