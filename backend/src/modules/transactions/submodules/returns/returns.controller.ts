import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/guards/roles.decorator';
import { UserRole, ReturnStatus, ReturnType } from '@zarmind/shared-types';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role?: UserRole;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions/returns')
export class ReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
  )
  @Post()
  create(@Body() dto: CreateReturnDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(dto, req.user.userId);
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
    @Query('type') type?: ReturnType,
    @Query('status') status?: ReturnStatus,
    @Query('customerId') customerId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'returnDate' | 'refundAmount',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      type,
      status,
      customerId,
      supplierId,
      from,
      to,
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
  getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: ReturnType,
  ) {
    return this.service.getSummary(from, to, type);
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
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SALES_STAFF)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReturnDto) {
    return this.service.update(id, dto);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: { notes?: string }, @Req() req: AuthenticatedRequest) {
    return this.service.approve(id, req.user.userId, body.notes);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { reason: string; notes?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.reject(id, req.user.userId, body.reason, body.notes);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() body: { notes?: string }) {
    return this.service.complete(id, body.notes);
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