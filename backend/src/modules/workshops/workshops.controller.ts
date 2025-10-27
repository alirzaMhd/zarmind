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
import { WorkshopsService } from './workshops.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole, WorkshopStatus } from '@zarmind/shared-types';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_STAFF)
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly service: WorkshopsService) { }

  @Post()
  create(@Body() dto: CreateWorkshopDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: WorkshopStatus,
    @Query('city') city?: string,
    @Query('specialization') specialization?: string,
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
      city,
      specialization,
      minRating: minRate,
      maxRating: maxRate,
      sortBy,
      sortOrder,
    });
  }

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkshopDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/rating')
  updateRating(@Param('id') id: string, @Body() body: { rating: number; notes?: string }) {
    return this.service.updateRating(id, body.rating, body.notes);
  }

  @Get(':id/work-orders')
  getWorkOrders(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getWorkOrders(id, status, from, to);
  }

  @Post(':id/performance')
  addPerformanceReview(
    @Param('id') id: string,
    @Body() body: {
      qualityRating?: number;
      timelinessRating?: number;
      costRating?: number;
      communicationRating?: number;
      notes?: string;
      reviewDate?: string;
    }
  ) {
    return this.service.addPerformanceReview(id, body);
  }

  @Patch(':id/performance/:index')
  updatePerformanceReview(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() body: {
      qualityRating?: number;
      timelinessRating?: number;
      costRating?: number;
      communicationRating?: number;
      notes?: string;
      reviewDate?: string;
    }
  ) {
    return this.service.updatePerformanceReview(id, parseInt(index, 10), body);
  }

  @Delete(':id/performance/:index')
  deletePerformanceReview(
    @Param('id') id: string,
    @Param('index') index: string,
  ) {
    return this.service.deletePerformanceReview(id, parseInt(index, 10));
  }

  @Get(':id/performance-history')
  getPerformanceHistory(@Param('id') id: string) {
    return this.service.getPerformanceHistory(id);
  }

  @Get(':id/performance')
  getPerformance(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getPerformance(id, from, to);
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