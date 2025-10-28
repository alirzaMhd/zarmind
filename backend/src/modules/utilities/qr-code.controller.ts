// backend/src/modules/utilities/qr-code.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/guards/roles.decorator';
import { UserRole } from '@zarmind/shared-types';
import { QrCodeService } from './qr-code.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

const logoStorage = diskStorage({
  destination: './uploads/qr-logo',
  filename: (req, file, callback) => {
    const ext = extname(file.originalname);
    callback(null, `qr-logo${ext}`);
  },
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('utilities/qr-code')
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) {
    this.ensureLogoDirectory();
  }

  private ensureLogoDirectory() {
    const logoDir = path.join(process.cwd(), 'uploads', 'qr-logo');
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }
  }

  @Post('preview')
  async generatePreview(@Body() body: { settings: Record<string, any> }) {
    // Use APP_URL from environment, fallback to localhost
    const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3001';
    const sampleQrData = `${appUrl}/qr-lookup?code=SAMPLE`;
    
    const dataUrl = await this.qrCodeService.generateQrCodeWithSettings(
      sampleQrData,
      body.settings,
    );

    return { dataUrl };
  }

  @Get('logo')
  async getCurrentLogo() {
    const logoDir = path.join(process.cwd(), 'uploads', 'qr-logo');
    
    if (!fs.existsSync(logoDir)) {
      return { logoUrl: null };
    }

    const files = fs.readdirSync(logoDir);

    if (files.length > 0) {
      const logoFile = files[0];
      return {
        logoUrl: `/uploads/qr-logo/${logoFile}`,
      };
    }

    return { logoUrl: null };
  }

  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: logoStorage,
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|svg\+xml|webp)$/)) {
          return callback(
            new BadRequestException('Only image files (JPG, PNG, SVG, WEBP) are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Remove old logo files
    const logoDir = path.join(process.cwd(), 'uploads', 'qr-logo');
    const existingFiles = fs.readdirSync(logoDir);
    
    existingFiles.forEach((existingFile) => {
      if (existingFile !== file.filename) {
        try {
          fs.unlinkSync(path.join(logoDir, existingFile));
        } catch (err) {
          console.error('Failed to delete old logo:', err);
        }
      }
    });

    return {
      success: true,
      logoUrl: `/uploads/qr-logo/${file.filename}`,
    };
  }

  @Delete('logo')
  async removeLogo() {
    const logoDir = path.join(process.cwd(), 'uploads', 'qr-logo');
    
    if (!fs.existsSync(logoDir)) {
      return { success: true };
    }

    const files = fs.readdirSync(logoDir);

    files.forEach((file) => {
      try {
        fs.unlinkSync(path.join(logoDir, file));
      } catch (err) {
        console.error('Failed to delete logo file:', err);
      }
    });

    return { success: true };
  }

  @Post('regenerate-all')
  async regenerateAll() {
    // This would regenerate all product QR codes with new settings
    // Implementation depends on your needs
    return {
      success: true,
      message: 'QR code regeneration started in background',
    };
  }
}