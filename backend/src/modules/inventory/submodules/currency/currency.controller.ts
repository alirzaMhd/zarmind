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
import { CurrencyService } from './currency.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, ProductStatus } from '@zarmind/shared-types';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { RecordCurrencyTradeDto } from './dto/record-currency-trade.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/currency')
export class CurrencyController {
  constructor(private readonly service: CurrencyService) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Post()
  create(@Body() dto: CreateCurrencyDto) {
    return this.service.create(dto);
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
    UserRole.VIEWER,
  )
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('currencyCode') currencyCode?: string,
    @Query('status') status?: ProductStatus,
    @Query('branchId') branchId?: string,
    @Query('minQuantity') minQuantity?: string,
    @Query('maxQuantity') maxQuantity?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const minQty = minQuantity ? parseInt(minQuantity, 10) : undefined;
    const maxQty = maxQuantity ? parseInt(maxQuantity, 10) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      currencyCode,
      status,
      branchId,
      minQuantity: minQty,
      maxQuantity: maxQty,
      sortBy,
      sortOrder,
    });
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
    UserRole.VIEWER,
  )
  @Get('summary')
  getSummary(@Query('branchId') branchId?: string) {
    return this.service.getSummary(branchId);
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
    UserRole.VIEWER,
  )
  @Get('exchange-rates')
  getExchangeRates() {
    return this.service.getLatestExchangeRates();
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
    UserRole.VIEWER,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCurrencyDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SALES_STAFF, UserRole.WAREHOUSE_STAFF)
  @Post(':id/trade')
  recordTrade(@Param('id') id: string, @Body() dto: RecordCurrencyTradeDto) {
    return this.service.recordTrade(id, dto);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Patch(':id/adjust-quantity')
  adjustQuantity(
    @Param('id') id: string,
    @Body() body: { adjustment: number; branchId?: string; notes?: string },
  ) {
    return this.service.adjustQuantity(id, body.adjustment, body.branchId, body.notes);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
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