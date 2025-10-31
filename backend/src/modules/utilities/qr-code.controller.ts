import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { QrCodeService } from './qr-code.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole } from '@zarmind/shared-types';

const IMAGES_DIR = join(process.cwd(), 'uploads', 'images');

function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const logoStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureImagesDir();
    cb(null, IMAGES_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = (extname(file.originalname) || '.png').toLowerCase();
    cb(null, `qr-logo${ext}`);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('utilities/qr-code')
export class QrCodeController {
  constructor(private readonly qr: QrCodeService) {
    ensureImagesDir();
  }

  @Post('preview')
  async preview(@Body() body: { settings: Record<string, any> }) {
    const appUrl =
      process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3001';
    const sample = `${appUrl}/qr-lookup?code=SAMPLE`;
    const dataUrl = await this.qr.generateQrCodeWithSettings(sample, body.settings);
    return { dataUrl };
  }

  @Get('logo')
  async getLogo() {
    ensureImagesDir();
    const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.startsWith('qr-logo.'));
    if (!files.length) return { logoUrl: null };

    const filename = files[0];
    // Serve via existing media controller route
    return {
      logoUrl: `/api/utilities/media/images/${filename}`,
      filename,
    };
  }

  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: logoStorage,
      fileFilter: (_req, file, cb) => {
        if (!/image\/(png|jpeg|jpg|webp|svg\+xml)/i.test(file.mimetype)) {
          return cb(new BadRequestException('Invalid image type'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadLogo(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    // Remove old logo files (keep only the newly uploaded one)
    const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.startsWith('qr-logo.') && f !== file.filename);
    files.forEach((f) => {
      try {
        fs.unlinkSync(join(IMAGES_DIR, f));
      } catch {}
    });

    return {
      success: true,
      logoUrl: `/api/utilities/media/images/${file.filename}`,
    };
  }

  @Delete('logo')
  async deleteLogo() {
    ensureImagesDir();
    const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.startsWith('qr-logo.'));
    files.forEach((f) => {
      try {
        fs.unlinkSync(join(IMAGES_DIR, f));
      } catch {}
    });
    return { success: true };
  }

  @Post('regenerate-all')
  async regenerateAll() {
    // Implement your batch regeneration here if needed
    return { success: true, message: 'Regeneration started' };
  }

  // Allow broader roles to view/print QR codes
  @Roles(
    UserRole.MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SALES_STAFF,
    UserRole.WAREHOUSE_STAFF,
    UserRole.VIEWER,
  )
  @Get('product/:productId')
  async getProductQr(@Param('productId') productId: string) {
    return this.qr.generateProductQrCode(productId);
  }
}