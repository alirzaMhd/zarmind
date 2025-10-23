import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, CashTransactionType } from '@prisma/client';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role?: UserRole;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.ACCOUNTANT,
  UserRole.SALES_STAFF,
)
@Controller('financials/cash')
export class CashController {
  constructor(private readonly service: CashService) {}

  @Post()
  create(@Body() dto: CreateCashTransactionDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('type') type?: CashTransactionType,
    @Query('category') category?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'transactionDate' | 'amount',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 50);
    const minAmt = minAmount ? parseFloat(minAmount) : undefined;
    const maxAmt = maxAmount ? parseFloat(maxAmount) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      branchId,
      type,
      category,
      userId,
      from,
      to,
      minAmount: minAmt,
      maxAmount: maxAmt,
      sortBy,
      sortOrder,
    });
  }

  @Get('summary')
  getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.service.getSummary(from, to, branchId);
  }

  @Get('balance')
  getCurrentBalance(@Query('branchId') branchId?: string) {
    return this.service.getCurrentBalance(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCashTransactionDto) {
    return this.service.update(id, dto);
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