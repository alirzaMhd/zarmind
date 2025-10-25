import { SettingsService } from './settings.service';
import { SettingCategory } from '@zarmind/shared-types';
export declare class SettingsController {
    private readonly service;
    constructor(service: SettingsService);
    findAll(category?: SettingCategory, includePrivate?: string): Promise<any>;
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
    getGrouped(): Promise<Record<string, any[]>>;
    updateByKey(key: string, body: {
        value: string;
        description?: string;
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
    resetDefaults(body: {
        category?: SettingCategory;
    }): Promise<{
        success: boolean;
        message: string;
        category: string;
    }>;
}
//# sourceMappingURL=settings.controller.d.ts.map