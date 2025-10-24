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
import { CoinsService } from './coins.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, CoinType, ProductStatus } from '@zarmind/shared-types';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/coins')
export class CoinsController {
  constructor(private readonly service: CoinsService) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Post()
  create(@Body() dto: CreateCoinDto) {
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
    @Query('coinType') coinType?: CoinType,
    @Query('status') status?: ProductStatus,
    @Query('branchId') branchId?: string,
    @Query('coinYear') coinYear?: string,
    @Query('minQuantity') minQuantity?: string,
    @Query('maxQuantity') maxQuantity?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const year = coinYear ? parseInt(coinYear, 10) : undefined;
    const minQty = minQuantity ? parseInt(minQuantity, 10) : undefined;
    const maxQty = maxQuantity ? parseInt(maxQuantity, 10) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      coinType,
      status,
      branchId,
      coinYear: year,
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
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCoinDto) {
    return this.service.update(id, dto);
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