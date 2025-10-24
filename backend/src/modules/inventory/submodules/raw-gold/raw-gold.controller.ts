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
import { RawGoldService } from './raw-gold.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, ProductStatus, GoldPurity } from '@zarmind/shared-types';
import { CreateRawGoldDto } from './dto/create-raw-gold.dto';
import { UpdateRawGoldDto } from './dto/update-raw-gold.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/raw-gold')
export class RawGoldController {
  constructor(private readonly service: RawGoldService) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Post()
  create(@Body() dto: CreateRawGoldDto) {
    return this.service.create(dto);
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
    UserRole.ACCOUNTANT,
    UserRole.VIEWER,
  )
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('goldPurity') goldPurity?: GoldPurity,
    @Query('status') status?: ProductStatus,
    @Query('branchId') branchId?: string,
    @Query('minWeight') minWeight?: string,
    @Query('maxWeight') maxWeight?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy')
    sortBy?: 'createdAt' | 'updatedAt' | 'purchasePrice' | 'sellingPrice' | 'weight',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const minWt = minWeight ? parseFloat(minWeight) : undefined;
    const maxWt = maxWeight ? parseFloat(maxWeight) : undefined;
    const minPr = minPrice ? parseFloat(minPrice) : undefined;
    const maxPr = maxPrice ? parseFloat(maxPrice) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      goldPurity,
      status,
      branchId,
      minWeight: minWt,
      maxWeight: maxWt,
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
    UserRole.ACCOUNTANT,
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
    UserRole.ACCOUNTANT,
    UserRole.VIEWER,
  )
  @Get('valuation')
  getValuation(@Query('branchId') branchId?: string) {
    return this.service.getValuation(branchId);
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
  update(@Param('id') id: string, @Body() dto: UpdateRawGoldDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Patch(':id/adjust-weight')
  adjustWeight(
    @Param('id') id: string,
    @Body() body: { adjustment: number; branchId?: string; notes?: string },
  ) {
    return this.service.adjustWeight(id, body.adjustment, body.branchId, body.notes);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Post(':id/transfer')
  transferToWorkshop(
    @Param('id') id: string,
    @Body() body: { workshopId: string; weight: number; notes?: string },
  ) {
    return this.service.transferToWorkshop(id, body.workshopId, body.weight, body.notes);
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