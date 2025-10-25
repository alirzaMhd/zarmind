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
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole, SettingCategory } from '@zarmind/shared-types';
import { Public } from '../../core/guards/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  // Get all settings (filtered by category)
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll(
    @Query('category') category?: SettingCategory,
    @Query('includePrivate') includePrivate?: string,
  ) {
    const showPrivate = includePrivate === 'true';
    return this.service.findAll(category, showPrivate);
  }

  // Get public settings (no auth required)
  @Public()
  @Get('public')
  getPublicSettings(@Query('category') category?: SettingCategory) {
    return this.service.getPublicSettings(category);
  }

  // Get setting by key
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.service.findByKey(key);
  }

  // Get settings grouped by category
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('grouped')
  getGrouped() {
    return this.service.getGroupedSettings();
  }

  // Update setting by key
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('key/:key')
  updateByKey(@Param('key') key: string, @Body() body: { value: string; description?: string }) {
    return this.service.updateByKey(key, body.value, body.description);
  }

  // Bulk update settings
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('bulk')
  bulkUpdate(@Body() settings: Array<{ key: string; value: string }>) {
    return this.service.bulkUpdate(settings);
  }

  // Create new setting
  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  create(
    @Body()
    dto: {
      category: SettingCategory;
      key: string;
      value: string;
      valueType?: string;
      description?: string;
      isPublic?: boolean;
    },
  ) {
    return this.service.create(dto);
  }

  // Delete setting
  @Roles(UserRole.SUPER_ADMIN)
  @Delete('key/:key')
  remove(@Param('key') key: string) {
    return this.service.remove(key);
  }

  // Reset to defaults
  @Roles(UserRole.SUPER_ADMIN)
  @Post('reset-defaults')
  resetDefaults(@Body() body: { category?: SettingCategory }) {
    return this.service.resetToDefaults(body.category);
  }
}