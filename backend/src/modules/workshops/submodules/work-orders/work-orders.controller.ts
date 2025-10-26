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
import { WorkOrdersService } from './work-orders.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, WorkOrderPriority, WorkOrderStatus } from '@zarmind/shared-types';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { TransferWorkOrderDto } from './dto/transfer-work-order.dto';
import { AddImagesDto } from './dto/add-images.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workshops/work-orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  // Create work order
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.service.create(dto);
  }

  // List work orders with filters
  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_STAFF,
    UserRole.ACCOUNTANT,
    UserRole.SALES_STAFF,
    UserRole.VIEWER,
  )
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('workshopId') workshopId?: string,
    @Query('status') status?: WorkOrderStatus,
    @Query('priority') priority?: WorkOrderPriority,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
    @Query('sortBy')
    sortBy?: 'createdAt' | 'updatedAt' | 'orderDate' | 'expectedEndDate' | 'status' | 'priority',
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
      workshopId,
      status,
      priority,
      from,
      to,
      minRating: minRate,
      maxRating: maxRate,
      sortBy,
      sortOrder,
    });
  }

  // Get one work order
  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE_STAFF,
    UserRole.ACCOUNTANT,
    UserRole.SALES_STAFF,
    UserRole.VIEWER,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Update work order (general fields)
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.service.update(id, dto);
  }

  // Update status
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  // Transfer to another workshop
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/transfer')
  transfer(@Param('id') id: string, @Body() dto: TransferWorkOrderDto) {
    return this.service.transfer(id, dto);
  }

  // Add or remove images
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
  @Patch(':id/images')
  updateImages(@Param('id') id: string, @Body() dto: AddImagesDto) {
    return this.service.updateImages(id, dto);
  }

  // Update quality rating/notes
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/quality')
  updateQuality(@Param('id') id: string, @Body() dto: UpdateQualityDto) {
    return this.service.updateQuality(id, dto);
  }

  // Delete (or soft-cancel) work order
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