"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const shared_types_1 = require("@zarmind/shared-types");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(category, includePrivate = false) {
        const where = {
            ...(category ? { category } : {}),
            ...(includePrivate ? {} : { isPublic: true }),
        };
        const settings = await this.prisma.systemSetting.findMany({
            where,
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });
        return settings.map((s) => this.mapSetting(s));
    }
    async getPublicSettings(category) {
        const where = {
            isPublic: true,
            ...(category ? { category } : {}),
        };
        const settings = await this.prisma.systemSetting.findMany({
            where,
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });
        return settings.map((s) => this.mapSetting(s));
    }
    async findByKey(key) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key },
        });
        if (!setting)
            throw new common_1.NotFoundException(`Setting with key "${key}" not found`);
        return this.mapSetting(setting);
    }
    async getGroupedSettings() {
        const settings = await this.prisma.systemSetting.findMany({
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });
        const grouped = {};
        settings.forEach((setting) => {
            const category = setting.category;
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(this.mapSetting(setting));
        });
        return grouped;
    }
    async updateByKey(key, value, description) {
        const existing = await this.prisma.systemSetting.findUnique({
            where: { key },
        });
        if (!existing)
            throw new common_1.NotFoundException(`Setting with key "${key}" not found`);
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
    async bulkUpdate(settings) {
        const results = [];
        for (const setting of settings) {
            try {
                // Try update first
                try {
                    const updated = await this.updateByKey(setting.key, setting.value);
                    results.push({ key: setting.key, success: true, data: updated });
                    continue;
                }
                catch (err) {
                    // If not found, create it (bulk upsert behavior)
                    if (String(err?.message || '').includes('not found')) {
                        const valueType = this.inferValueType(setting.key, setting.value);
                        const created = await this.create({
                            category: this.inferCategory(setting.key),
                            key: setting.key,
                            value: setting.value,
                            valueType,
                            description: null,
                            isPublic: false,
                        });
                        results.push({ key: setting.key, success: true, data: created });
                    }
                    else {
                        throw err;
                    }
                }
            }
            catch (error) {
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
    async create(dto) {
        // Check if key already exists
        const existing = await this.prisma.systemSetting.findUnique({
            where: { key: dto.key },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Setting with key "${dto.key}" already exists`);
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
    async remove(key) {
        const existing = await this.prisma.systemSetting.findUnique({
            where: { key },
        });
        if (!existing)
            throw new common_1.NotFoundException(`Setting with key "${key}" not found`);
        await this.prisma.systemSetting.delete({
            where: { key },
        });
        return {
            success: true,
            message: 'Setting deleted successfully',
        };
    }
    async resetToDefaults(category) {
        // This would reset settings to default values
        // For now, just return a message
        return {
            success: true,
            message: 'Reset to defaults - to be implemented',
            category: category ?? 'ALL',
        };
    }
    // Helper methods
    validateValue(value, valueType) {
        if (valueType === 'NUMBER') {
            const num = Number(value);
            if (isNaN(num)) {
                throw new common_1.BadRequestException(`Value "${value}" is not a valid number`);
            }
        }
        else if (valueType === 'BOOLEAN') {
            const lower = value.toLowerCase();
            if (!['true', 'false', '1', '0', 'yes', 'no'].includes(lower)) {
                throw new common_1.BadRequestException(`Value "${value}" is not a valid boolean`);
            }
        }
        else if (valueType === 'JSON') {
            try {
                JSON.parse(value);
            }
            catch {
                throw new common_1.BadRequestException(`Value "${value}" is not valid JSON`);
            }
        }
    }
    mapSetting(s) {
        let parsedValue = s.value;
        // Auto-parse based on type
        if (s.valueType === 'NUMBER') {
            parsedValue = Number(s.value);
        }
        else if (s.valueType === 'BOOLEAN') {
            const lower = s.value.toLowerCase();
            parsedValue = ['true', '1', 'yes', 'on'].includes(lower);
        }
        else if (s.valueType === 'JSON') {
            try {
                parsedValue = JSON.parse(s.value);
            }
            catch {
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
    inferValueType(key, _value) {
        // For QR settings we know types by key names
        if (/(SIZE|MARGIN|LOGO_SIZE)$/i.test(key))
            return 'NUMBER';
        if (/(COLOR|BACKGROUND)$/i.test(key))
            return 'STRING';
        return 'STRING';
    }
    inferCategory(key) {
        // Group QR settings under GENERAL
        if (key.startsWith('QR_'))
            return shared_types_1.SettingCategory.GENERAL;
        return shared_types_1.SettingCategory.GENERAL;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map