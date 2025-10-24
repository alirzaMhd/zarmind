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
import { ChecksService } from './checks.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, CheckType, CheckStatus } from '@zarmind/shared-types';
import { CreateCheckDto } from './dto/create-check.dto';
import { UpdateCheckDto } from './dto/update-check.dto';
import { UpdateCheckStatusDto } from './dto/update-check-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
@Controller('financials/checks')
export class ChecksController {
  constructor(private readonly service: ChecksService) {}

  @Post()
  create(@Body() dto: CreateCheckDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: CheckType,
    @Query('status') status?: CheckStatus,
    @Query('fromDueDate') fromDueDate?: string,
    @Query('toDueDate') toDueDate?: string,
    @Query('bankName') bankName?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'dueDate' | 'issueDate' | 'amount',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const minAmt = minAmount ? parseFloat(minAmount) : undefined;
    const maxAmt = maxAmount ? parseFloat(maxAmount) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      type,
      status,
      fromDueDate,
      toDueDate,
      bankName,
      minAmount: minAmt,
      maxAmount: maxAmt,
      sortBy,
      sortOrder,
    });
  }

  @Get('summary')
  getSummary(@Query('type') type?: CheckType) {
    return this.service.getSummary(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCheckDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCheckStatusDto) {
    return this.service.updateStatus(id, dto);
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