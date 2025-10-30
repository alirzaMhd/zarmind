"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../core/guards/roles.guard");
const roles_decorator_1 = require("../../core/guards/roles.decorator");
const shared_types_1 = require("@zarmind/shared-types");
const prisma_service_1 = require("../../core/database/prisma.service");
const multer_1 = require("multer");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
// Multer configuration
const imageStorage = (0, multer_1.diskStorage)({
    destination: './uploads/images',
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = (0, path_1.extname)(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const scaleImageStorage = (0, multer_1.diskStorage)({
    destination: './uploads/scale_images',
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = (0, path_1.extname)(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const documentStorage = (0, multer_1.diskStorage)({
    destination: './uploads/documents',
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = (0, path_1.extname)(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return callback(new common_1.BadRequestException('Only image files are allowed!'), false);
    }
    callback(null, true);
};
const documentFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|txt|jpg|jpeg|png)$/i)) {
        return callback(new common_1.BadRequestException('Invalid file type!'), false);
    }
    callback(null, true);
};
let MediaController = class MediaController {
    constructor(prisma) {
        this.prisma = prisma;
        // Ensure upload directories exist
        this.ensureDirectories();
    }
    ensureDirectories() {
        const dirs = ['./uploads', './uploads/images', './uploads/scale_images', './uploads/documents', './uploads/temp'];
        dirs.forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    async uploadImage(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return {
            success: true,
            message: 'Image uploaded successfully',
            file: {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                path: `/uploads/images/${file.filename}`,
                url: `${process.env.APP_URL || 'http://localhost:3000'}/api/utilities/media/images/${file.filename}`,
            },
        };
    }
    async uploadImages(files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files uploaded');
        }
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        return {
            success: true,
            message: `${files.length} images uploaded successfully`,
            files: files.map((file) => ({
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                path: `/uploads/images/${file.filename}`,
                url: `${baseUrl}/api/utilities/media/images/${file.filename}`,
            })),
        };
    }
    async uploadDocument(file, type, relatedEntity, relatedEntityId, description) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        // Create document record in database
        const document = await this.prisma.document.create({
            data: {
                fileName: file.filename,
                originalName: file.originalname,
                filePath: `/uploads/documents/${file.filename}`,
                fileSize: file.size,
                mimeType: file.mimetype,
                type: type ?? shared_types_1.DocumentType.OTHER,
                relatedEntity: relatedEntity ?? null,
                relatedEntityId: relatedEntityId ?? null,
                description: description ?? null,
                uploadedAt: new Date(),
            },
        });
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        return {
            success: true,
            message: 'Document uploaded successfully',
            document: {
                id: document.id,
                filename: document.fileName,
                originalName: document.originalName,
                size: document.fileSize,
                mimetype: document.mimeType,
                type: document.type,
                url: `${baseUrl}/api/utilities/media/documents/${document.fileName}`,
                uploadedAt: document.uploadedAt,
            },
        };
    }
    async uploadScaleImage(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        return {
            success: true,
            message: 'Scale image uploaded successfully',
            file: {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                path: `/uploads/scale_images/${file.filename}`,
                url: `${baseUrl}/api/utilities/media/scale-images/${file.filename}`,
            },
        };
    }
    async getImage(filename, res) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'images', filename);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Image not found');
        }
        return res.sendFile(filePath);
    }
    async getScaleImage(filename, res) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'scale_images', filename);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Image not found');
        }
        return res.sendFile(filePath);
    }
    async getDocument(filename, res) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'documents', filename);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Document not found');
        }
        return res.sendFile(filePath);
    }
    async listDocuments(type, relatedEntity, relatedEntityId, page, limit) {
        const pageNum = parseInt(page ?? '1', 10);
        const limitNum = parseInt(limit ?? '20', 10);
        const where = {
            ...(type ? { type } : {}),
            ...(relatedEntity ? { relatedEntity } : {}),
            ...(relatedEntityId ? { relatedEntityId } : {}),
        };
        const [total, documents] = await Promise.all([
            this.prisma.document.count({ where }),
            this.prisma.document.findMany({
                where,
                orderBy: { uploadedAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
        ]);
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        return {
            items: documents.map((doc) => ({
                id: doc.id,
                filename: doc.fileName,
                originalName: doc.originalName,
                size: doc.fileSize,
                mimetype: doc.mimeType,
                type: doc.type,
                relatedEntity: doc.relatedEntity,
                relatedEntityId: doc.relatedEntityId,
                description: doc.description,
                url: `${baseUrl}/api/utilities/media/documents/${doc.fileName}`,
                uploadedAt: doc.uploadedAt,
            })),
            total,
            page: pageNum,
            limit: limitNum,
        };
    }
    async deleteDocument(id) {
        const document = await this.prisma.document.findUnique({ where: { id } });
        if (!document)
            throw new common_1.NotFoundException('Document not found');
        // Delete file from filesystem
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'documents', document.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        // Delete database record
        await this.prisma.document.delete({ where: { id } });
        return {
            success: true,
            message: 'Document deleted successfully',
        };
    }
    async deleteImage(filename) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'images', filename);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('Image not found');
        }
        fs.unlinkSync(filePath);
        return {
            success: true,
            message: 'Image deleted successfully',
        };
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF),
    (0, common_1.Post)('upload/image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: imageStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadImage", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF),
    (0, common_1.Post)('upload/images'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 10, {
        storage: imageStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadImages", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF, shared_types_1.UserRole.ACCOUNTANT),
    (0, common_1.Post)('upload/document'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document', {
        storage: documentStorage,
        fileFilter: documentFileFilter,
        limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('relatedEntity')),
    __param(3, (0, common_1.Query)('relatedEntityId')),
    __param(4, (0, common_1.Query)('description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadDocument", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.SALES_STAFF, shared_types_1.UserRole.WAREHOUSE_STAFF),
    (0, common_1.Post)('upload/scale-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: scaleImageStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadScaleImage", null);
__decorate([
    (0, common_1.Get)('images/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getImage", null);
__decorate([
    (0, common_1.Get)('scale-images/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getScaleImage", null);
__decorate([
    (0, common_1.Get)('documents/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getDocument", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN, shared_types_1.UserRole.ACCOUNTANT),
    (0, common_1.Get)('documents'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('relatedEntity')),
    __param(2, (0, common_1.Query)('relatedEntityId')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "listDocuments", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Delete)('documents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "deleteDocument", null);
__decorate([
    (0, roles_decorator_1.Roles)(shared_types_1.UserRole.MANAGER, shared_types_1.UserRole.ADMIN, shared_types_1.UserRole.SUPER_ADMIN),
    (0, common_1.Delete)('images/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "deleteImage", null);
exports.MediaController = MediaController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('utilities/media'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MediaController);
//# sourceMappingURL=media.controller.js.map