import { DocumentType } from '@zarmind/shared-types';
import { PrismaService } from '../../core/database/prisma.service';
import { Response } from 'express';
export declare class MediaController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private ensureDirectories;
    uploadImage(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        file: {
            filename: string;
            originalName: string;
            size: number;
            mimetype: string;
            path: string;
            url: string;
        };
    }>;
    uploadImages(files: Express.Multer.File[]): Promise<{
        success: boolean;
        message: string;
        files: {
            filename: string;
            originalName: string;
            size: number;
            mimetype: string;
            path: string;
            url: string;
        }[];
    }>;
    uploadDocument(file: Express.Multer.File, type?: DocumentType, relatedEntity?: string, relatedEntityId?: string, description?: string): Promise<{
        success: boolean;
        message: string;
        document: {
            id: any;
            filename: any;
            originalName: any;
            size: any;
            mimetype: any;
            type: any;
            url: string;
            uploadedAt: any;
        };
    }>;
    uploadScaleImage(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        file: {
            filename: string;
            originalName: string;
            size: number;
            path: string;
            url: string;
        };
    }>;
    getImage(filename: string, res: Response): Promise<void>;
    getDocument(filename: string, res: Response): Promise<void>;
    listDocuments(type?: DocumentType, relatedEntity?: string, relatedEntityId?: string, page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    deleteDocument(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteImage(filename: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=media.controller.d.ts.map