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
import { BankAccountsService } from './bank-accounts.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole } from '@zarmind/shared-types';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { RecordTransactionDto } from './dto/record-transaction.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
@Controller('financials/bank-accounts')
export class BankAccountsController {
  constructor(private readonly service: BankAccountsService) {}

  @Post()
  create(@Body() dto: CreateBankAccountDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('isActive') isActive?: string,
    @Query('accountType') accountType?: string,
    @Query('currency') currency?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'accountName' | 'balance',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const active = isActive ? ['true', '1', 'yes'].includes(isActive.toLowerCase()) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      branchId,
      isActive: active,
      accountType,
      currency,
      sortBy,
      sortOrder,
    });
  }

  @Get('summary')
  getSummary(@Query('branchId') branchId?: string, @Query('currency') currency?: string) {
    return this.service.getSummary(branchId, currency);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/transaction')
  recordTransaction(@Param('id') id: string, @Body() dto: RecordTransactionDto) {
    return this.service.recordTransaction(id, dto);
  }

  @Get(':id/transactions')
  getTransactions(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
    @Query('reconciled') reconciled?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 50);
    const isReconciled = reconciled
      ? ['true', '1', 'yes'].includes(reconciled.toLowerCase())
      : undefined;

    return this.service.getTransactions(id, {
      from,
      to,
      type,
      reconciled: isReconciled,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Post(':id/reconcile')
  reconcile(
    @Param('id') id: string,
    @Body() body: { transactionIds: string[]; reconciledDate?: string },
  ) {
    return this.service.reconcileTransactions(id, body.transactionIds, body.reconciledDate);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.service.toggleActive(id, true);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.service.toggleActive(id, false);
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