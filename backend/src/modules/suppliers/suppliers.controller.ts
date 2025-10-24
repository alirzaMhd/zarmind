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
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole, SupplierStatus } from '@zarmind/shared-types';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Post()
  create(@Body() dto: CreateSupplierDto) {
    return this.service.create(dto);
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_STAFF,
    UserRole.ACCOUNTANT,
    UserRole.VIEWER,
  )
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: SupplierStatus,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'rating' | 'code',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);
    const minRate = minRating ? parseInt(minRating, 10) : undefined;
    const maxRate = maxRating ? parseInt(maxRating, 10) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      status,
      category,
      city,
      minRating: minRate,
      maxRating: maxRate,
      sortBy,
      sortOrder,
    });
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_STAFF,
    UserRole.ACCOUNTANT,
    UserRole.VIEWER,
  )
  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_STAFF,
    UserRole.ACCOUNTANT,
    UserRole.VIEWER,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Patch(':id/rating')
  updateRating(@Param('id') id: string, @Body() body: { rating: number; notes?: string }) {
    return this.service.updateRating(id, body.rating, body.notes);
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_STAFF,
    UserRole.ACCOUNTANT,
  )
  @Get(':id/purchases')
  getPurchases(@Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.getPurchases(id, from, to);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
  @Get(':id/payables')
  getPayables(@Param('id') id: string) {
    return this.service.getPayables(id);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Get(':id/performance')
  getPerformance(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getPerformance(id, from, to);
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