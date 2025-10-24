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
import { StonesService } from './stones.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, ProductStatus, StoneType } from '@zarmind/shared-types';
import { CreateStoneDto } from './dto/create-stone.dto';
import { UpdateStoneDto } from './dto/update-stone.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/stones')
export class StonesController {
  constructor(private readonly service: StonesService) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Post()
  create(@Body() dto: CreateStoneDto) {
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
    @Query('stoneType') stoneType?: StoneType,
    @Query('status') status?: ProductStatus,
    @Query('branchId') branchId?: string,
    @Query('minCaratWeight') minCaratWeight?: string,
    @Query('maxCaratWeight') maxCaratWeight?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('quality') quality?: string,
    @Query('hasCertificate') hasCertificate?: string,
    @Query('sortBy')
    sortBy?:
      | 'createdAt'
      | 'updatedAt'
      | 'purchasePrice'
      | 'sellingPrice'
      | 'caratWeight'
      | 'quantity',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const minCarat = minCaratWeight ? parseFloat(minCaratWeight) : undefined;
    const maxCarat = maxCaratWeight ? parseFloat(maxCaratWeight) : undefined;
    const minPr = minPrice ? parseFloat(minPrice) : undefined;
    const maxPr = maxPrice ? parseFloat(maxPrice) : undefined;
    const hasCert =
      hasCertificate !== undefined
        ? ['true', '1', 'yes'].includes(hasCertificate.toLowerCase())
        : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      stoneType,
      status,
      branchId,
      minCaratWeight: minCarat,
      maxCaratWeight: maxCarat,
      minPrice: minPr,
      maxPrice: maxPr,
      quality,
      hasCertificate: hasCert,
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
  @Get('by-certificate/:certificateNumber')
  findByCertificate(@Param('certificateNumber') certificateNumber: string) {
    return this.service.findByCertificate(certificateNumber);
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
  update(@Param('id') id: string, @Body() dto: UpdateStoneDto) {
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