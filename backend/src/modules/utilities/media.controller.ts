import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole, DocumentType } from '@zarmind/shared-types';
import { PrismaService } from '../../core/database/prisma.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Multer configuration
const imageStorage = diskStorage({
  destination: './uploads/images',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = extname(file.originalname);
    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const documentStorage = diskStorage({
  destination: './uploads/documents',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = extname(file.originalname);
    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const imageFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(new BadRequestException('Only image files are allowed!'), false);
  }
  callback(null, true);
};

const documentFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  if (!file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|txt|jpg|jpeg|png)$/i)) {
    return callback(new BadRequestException('Invalid file type!'), false);
  }
  callback(null, true);
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('utilities/media')
export class MediaController {
  constructor(private readonly prisma: PrismaService) {
    // Ensure upload directories exist
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = ['./uploads', './uploads/images', './uploads/documents', './uploads/temp'];
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
  )
  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: imageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
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

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
  )
  @Post('upload/images')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: imageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    }),
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
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

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
    UserRole.ACCOUNTANT,
  )
  @Post('upload/document')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: documentStorage,
      fileFilter: documentFileFilter,
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type?: DocumentType,
    @Query('relatedEntity') relatedEntity?: string,
    @Query('relatedEntityId') relatedEntityId?: string,
    @Query('description') description?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Create document record in database
    const document = await this.prisma.document.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        filePath: `/uploads/documents/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        type: type ?? DocumentType.OTHER,
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

  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
  )
  @Post('upload/scale-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: imageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadScaleImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';

    return {
      success: true,
      message: 'Scale image uploaded successfully',
      file: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: `/uploads/images/${file.filename}`,
        url: `${baseUrl}/api/utilities/media/images/${file.filename}`,
      },
    };
  }

  @Get('images/:filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'images', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Image not found');
    }

    return res.sendFile(filePath);
  }

  @Get('documents/:filename')
  async getDocument(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'documents', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Document not found');
    }

    return res.sendFile(filePath);
  }

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT)
  @Get('documents')
  async listDocuments(
    @Query('type') type?: DocumentType,
    @Query('relatedEntity') relatedEntity?: string,
    @Query('relatedEntityId') relatedEntityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page ?? '1', 10);
    const limitNum = parseInt(limit ?? '20', 10);

    const where: any = {
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
      items: documents.map((doc: any) => ({
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

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('documents/:id')
  async deleteDocument(@Param('id') id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    // Delete file from filesystem
    const filePath = join(process.cwd(), 'uploads', 'documents', document.fileName);
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

  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('images/:filename')
  async deleteImage(@Param('filename') filename: string) {
    const filePath = join(process.cwd(), 'uploads', 'images', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Image not found');
    }

    fs.unlinkSync(filePath);

    return {
      success: true,
      message: 'Image deleted successfully',
    };
  }
}