import { PrismaService } from '../../core/database/prisma.service';
import { SettingCategory } from '@zarmind/shared-types';
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(category?: SettingCategory, includePrivate?: boolean): Promise<any>;
    getPublicSettings(category?: SettingCategory): Promise<any>;
    findByKey(key: string): Promise<{
        id: any;
        category: any;
        key: any;
        value: any;
        parsedValue: any;
        valueType: any;
        description: any;
        isPublic: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getGroupedSettings(): Promise<Record<string, any[]>>;
    updateByKey(key: string, value: string, description?: string): Promise<{
        success: boolean;
        message: string;
        setting: {
            id: any;
            category: any;
            key: any;
            value: any;
            parsedValue: any;
            valueType: any;
            description: any;
            isPublic: any;
            createdAt: any;
            updatedAt: any;
        };
    }>;
    bulkUpdate(settings: Array<{
        key: string;
        value: string;
    }>): Promise<{
        success: boolean;
        message: string;
        results: ({
            key: string;
            success: boolean;
            data: {
                success: boolean;
                message: string;
                setting: {
                    id: any;
                    category: any;
                    key: any;
                    value: any;
                    parsedValue: any;
                    valueType: any;
                    description: any;
                    isPublic: any;
                    createdAt: any;
                    updatedAt: any;
                };
            };
            error?: undefined;
        } | {
            key: string;
            success: boolean;
            error: any;
            data?: undefined;
        })[];
    }>;
    create(dto: {
        category: SettingCategory;
        key: string;
        value: string;
        valueType?: string;
        description?: string;
        isPublic?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        setting: {
            id: any;
            category: any;
            key: any;
            value: any;
            parsedValue: any;
            valueType: any;
            description: any;
            isPublic: any;
            createdAt: any;
            updatedAt: any;
        };
    }>;
    remove(key: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetToDefaults(category?: SettingCategory): Promise<{
        success: boolean;
        message: string;
        category: string;
    }>;
    private validateValue;
    private mapSetting;
    private inferValueType;
    private inferCategory;
}
//# sourceMappingURL=settings.service.d.ts.map