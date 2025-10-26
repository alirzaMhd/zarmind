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
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole } from '@zarmind/shared-types';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('city') city?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'name' | 'code',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 100);
    const active = isActive ? ['true', '1', 'yes'].includes(isActive.toLowerCase()) : undefined;

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      isActive: active,
      city,
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

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.service.toggleActive(id, true);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.service.toggleActive(id, false);
  }

  @Roles(UserRole.SUPER_ADMIN)
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