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
import { GeneralGoodsService } from './general-goods.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, ProductStatus } from '@zarmind/shared-types';
import { CreateGeneralGoodsDto } from './dto/create-general-goods.dto';
import { UpdateGeneralGoodsDto } from './dto/update-general-goods.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/general-goods')
export class GeneralGoodsController {
  constructor(private readonly service: GeneralGoodsService) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Post()
  create(@Body() dto: CreateGeneralGoodsDto) {
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
    @Query('brand') brand?: string,
    @Query('status') status?: ProductStatus,
    @Query('branchId') branchId?: string,
    @Query('minQuantity') minQuantity?: string,
    @Query('maxQuantity') maxQuantity?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy')
    sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'quantity' | 'name',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const minQty = minQuantity ? parseInt(minQuantity, 10) : undefined;
    const maxQty = maxQuantity ? parseInt(maxQuantity, 10) : undefined;
    const minPr = minPrice ? parseFloat(minPrice) : undefined;
    const maxPr = maxPrice ? parseFloat(maxPrice) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      brand,
      status,
      branchId,
      minQuantity: minQty,
      maxQuantity: maxQty,
      minPrice: minPr,
      maxPrice: maxPr,
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
  @Get('brands')
  getBrands() {
    return this.service.getBrands();
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
  update(@Param('id') id: string, @Body() dto: UpdateGeneralGoodsDto) {
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