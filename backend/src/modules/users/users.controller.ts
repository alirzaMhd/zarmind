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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole, UserStatus } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role?: UserRole;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('branchId') branchId?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = this.toPosInt(page, 1);
    const limitNum = this.toPosInt(limit, 20);

    return this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      role,
      status,
      branchId,
      sortBy,
      sortOrder,
    });
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.service.findOne(req.user.userId);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('profile')
  updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateUserDto) {
    return this.service.update(req.user.userId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Post('change-password')
  changePassword(@Req() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(req.user.userId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.service.resetPassword(id, body.newPassword);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: UserStatus }) {
    return this.service.updateStatus(id, body.status);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    return this.service.updateRole(id, body.role);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id/activity')
  getActivity(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = this.toPosInt(limit, 50);
    return this.service.getActivity(id, from, to, limitNum);
  }

  private toPosInt(value: string | undefined, fallback: number): number {
    const n = value ? parseInt(value, 10) : NaN;
    if (isNaN(n) || n <= 0) return fallback;
    return n;
  }
}