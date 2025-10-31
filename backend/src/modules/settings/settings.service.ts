import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { SettingCategory } from '@zarmind/shared-types';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: SettingCategory, includePrivate = false) {
    const where: any = {
      ...(category ? { category } : {}),
      ...(includePrivate ? {} : { isPublic: true }),
    };

    const settings = await this.prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return settings.map((s: any) => this.mapSetting(s));
  }

  async getPublicSettings(category?: SettingCategory) {
    const where: any = {
      isPublic: true,
      ...(category ? { category } : {}),
    };

    const settings = await this.prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return settings.map((s: any) => this.mapSetting(s));
  }

  async findByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) throw new NotFoundException(`Setting with key "${key}" not found`);
    return this.mapSetting(setting);
  }

  async getGroupedSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const grouped: Record<string, any[]> = {};

    settings.forEach((setting: any) => {
      const category = setting.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(this.mapSetting(setting));
    });

    return grouped;
  }

  async updateByKey(key: string, value: string, description?: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) throw new NotFoundException(`Setting with key "${key}" not found`);

    // Validate value based on type
    this.validateValue(value, existing.valueType);

    const updated = await this.prisma.systemSetting.update({
      where: { key },
      data: {
        value,
        description: description ?? undefined,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Setting updated successfully',
      setting: this.mapSetting(updated),
    };
  }

  async bulkUpdate(settings: Array<{ key: string; value: string }>) {
    const results = [];

    for (const setting of settings) {
      try {
        // Try update first
        try {
          const updated = await this.updateByKey(setting.key, setting.value);
          results.push({ key: setting.key, success: true, data: updated });
          continue;
        } catch (err: any) {
          // If not found, create it (bulk upsert behavior)
          if (String(err?.message || '').includes('not found')) {
            const valueType = this.inferValueType(setting.key, setting.value);
            const created = await this.create({
              category: this.inferCategory(setting.key),
              key: setting.key,
              value: setting.value,
              valueType,
              description: null as any,
              isPublic: false,
            });
            results.push({ key: setting.key, success: true, data: created });
          } else {
            throw err;
          }
        }
      } catch (error: any) {
        results.push({ key: setting.key, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      success: failureCount === 0,
      message: `Updated ${successCount} settings, ${failureCount} failed`,
      results,
    };
  }

  async create(dto: {
    category: SettingCategory;
    key: string;
    value: string;
    valueType?: string;
    description?: string;
    isPublic?: boolean;
  }) {
    // Check if key already exists
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new BadRequestException(`Setting with key "${dto.key}" already exists`);
    }

    const valueType = dto.valueType ?? 'STRING';
    this.validateValue(dto.value, valueType);

    const created = await this.prisma.systemSetting.create({
      data: {
        category: dto.category,
        key: dto.key,
        value: dto.value,
        valueType,
        description: dto.description ?? null,
        isPublic: dto.isPublic ?? false,
      },
    });

    return {
      success: true,
      message: 'Setting created successfully',
      setting: this.mapSetting(created),
    };
  }

  async remove(key: string) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) throw new NotFoundException(`Setting with key "${key}" not found`);

    await this.prisma.systemSetting.delete({
      where: { key },
    });

    return {
      success: true,
      message: 'Setting deleted successfully',
    };
  }

  async resetToDefaults(category?: SettingCategory) {
    // This would reset settings to default values
    // For now, just return a message
    return {
      success: true,
      message: 'Reset to defaults - to be implemented',
      category: category ?? 'ALL',
    };
  }

  // Helper methods

  private validateValue(value: string, valueType: string) {
    if (valueType === 'NUMBER') {
      const num = Number(value);
      if (isNaN(num)) {
        throw new BadRequestException(`Value "${value}" is not a valid number`);
      }
    } else if (valueType === 'BOOLEAN') {
      const lower = value.toLowerCase();
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(lower)) {
        throw new BadRequestException(`Value "${value}" is not a valid boolean`);
      }
    } else if (valueType === 'JSON') {
      try {
        JSON.parse(value);
      } catch {
        throw new BadRequestException(`Value "${value}" is not valid JSON`);
      }
    }
  }

  private mapSetting(s: any) {
    let parsedValue: any = s.value;

    // Auto-parse based on type
    if (s.valueType === 'NUMBER') {
      parsedValue = Number(s.value);
    } else if (s.valueType === 'BOOLEAN') {
      const lower = s.value.toLowerCase();
      parsedValue = ['true', '1', 'yes', 'on'].includes(lower);
    } else if (s.valueType === 'JSON') {
      try {
        parsedValue = JSON.parse(s.value);
      } catch {
        parsedValue = s.value;
      }
    }

    return {
      id: s.id,
      category: s.category,
      key: s.key,
      value: s.value, // Raw string value
      parsedValue, // Parsed value based on type
      valueType: s.valueType,
      description: s.description,
      isPublic: s.isPublic,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  private inferValueType(key: string, _value: string): string {
    // For QR settings we know types by key names
    if (/(SIZE|MARGIN|LOGO_SIZE)$/i.test(key)) return 'NUMBER';
    if (/(COLOR|BACKGROUND)$/i.test(key)) return 'STRING';
    return 'STRING';
  }

  private inferCategory(key: string): SettingCategory {
    // Group QR settings under GENERAL
    if (key.startsWith('QR_')) return SettingCategory.GENERAL;
    return SettingCategory.GENERAL;
  }
}