import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, AttendanceStatus } from '@prisma/client';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.SALES_STAFF,
  UserRole.WAREHOUSE_STAFF,
)
@Controller('employees/attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Body() dto: ClockInDto, @Req() req: Request) {
    const ip =
      (req.ip as string) ||
      (Array.isArray(req.ips) && req.ips[0]) ||
      undefined;
    const ua = (req.headers['user-agent'] as string) || undefined;
    return this.service.clockIn(dto, ip, ua);
  }

  @Post('clock-out')
  clockOut(@Body() dto: ClockOutDto, @Req() req: Request) {
    const ip =
      (req.ip as string) ||
      (Array.isArray(req.ips) && req.ips[0]) ||
      undefined;
    const ua = (req.headers['user-agent'] as string) || undefined;
    return this.service.clockOut(dto, ip, ua);
  }

  @Get()
  list(
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: AttendanceStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = this.toPosInt(page, 1);
    const l = this.toPosInt(limit, 20);
    return this.service.findAll({ employeeId, from, to, status, page: p, limit: l });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.service.update(id, dto);
  }

  private toPosInt(value: string | undefined, fallback: number): number {
    const n = value ? parseInt(value, 10) : NaN;
    if (isNaN(n) || n <= 0) return fallback;
    return n;
  }
}