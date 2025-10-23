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
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, PurchaseStatus } from '@prisma/client';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
@Controller('transactions/purchases')
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Post()
  create(@Body() dto: CreatePurchaseDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: PurchaseStatus,
    @Query('supplierId') supplierId?: string,
    @Query('branchId') branchId?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'purchaseDate' | 'totalAmount',
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
      status,
      supplierId,
      branchId,
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/receive')
  receiveItems(
    @Param('id') id: string,
    @Body() body: { itemId: string; receivedQuantity: number; notes?: string }[],
  ) {
    return this.service.receiveItems(id, body);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() body: { notes?: string }) {
    return this.service.completePurchase(id, body.notes);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() body: { reason: string; notes?: string }) {
    return this.service.cancelPurchase(id, body.reason, body.notes);
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