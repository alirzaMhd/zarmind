import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../core/database/prisma.service';
import * as fs from 'fs';
import { join } from 'path';
import sharp from 'sharp';

interface QrCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  constructor(private readonly prisma: PrismaService) {
    // Ensure directories exist
    this.ensureQrDirectory();
    this.ensureImagesDir();
  }

  private ensureQrDirectory() {
    const qrDir = join(process.cwd(), 'uploads', 'qr-codes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
  }

  private ensureImagesDir() {
    const imagesDir = join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
  }

  private getCurrentLogoPath(): string | null {
    const dir = join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(dir)) return null;
    const file = fs.readdirSync(dir).find((f) => f.startsWith('qr-logo.'));
    return file ? join(dir, file) : null;
  }

  /**
   * Generate QR code as Base64 data URL (simple)
   */
  async generateQrCode(data: string, options?: QrCodeOptions): Promise<string> {
    try {
      const qrOptions = {
        width: options?.width ?? 300,
        margin: options?.margin ?? 2,
        color: {
          dark: options?.color?.dark ?? '#000000',
          light: options?.color?.light ?? '#FFFFFF',
        },
        errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M',
      };

      return await QRCode.toDataURL(data, qrOptions);
    } catch (error: any) {
      this.logger.error(`Failed to generate QR code: ${error?.message}`);
      throw new Error(`QR code generation failed: ${error?.message}`);
    }
  }

  /**
   * Generate QR code and save to file
   */
  async generateQrCodeFile(
    data: string,
    filename: string,
    options?: QrCodeOptions,
  ): Promise<string> {
    try {
      const qrDir = join(process.cwd(), 'uploads', 'qr-codes');
      const filePath = join(qrDir, filename);

      const qrOptions = {
        width: options?.width ?? 300,
        margin: options?.margin ?? 2,
        color: {
          dark: options?.color?.dark ?? '#000000',
          light: options?.color?.light ?? '#FFFFFF',
        },
        errorCorrectionLevel: options?.errorCorrectionLevel ?? 'M',
      };

      await QRCode.toFile(filePath, data, qrOptions);

      return `/uploads/qr-codes/${filename}`;
    } catch (error: any) {
      this.logger.error(`Failed to save QR code file: ${error?.message}`);
      throw new Error(`QR code file generation failed: ${error?.message}`);
    }
  }

  /**
   * Generate QR code using settings (with optional center logo)
   */
  async generateQrCodeWithSettings(
    data: string,
    settings: Record<string, any>,
  ): Promise<string> {
    const width = parseInt(settings?.QR_CODE_SIZE ?? '300', 10) || 300;
    const margin = parseInt(settings?.QR_CODE_MARGIN ?? '2', 10) || 2;
    const errorLevel: 'L' | 'M' | 'Q' | 'H' =
      (settings?.QR_CODE_ERROR_CORRECTION as any) ?? 'M';

    const options: QrCodeOptions = {
      width,
      margin,
      errorCorrectionLevel: errorLevel,
      color: {
        dark: settings?.QR_CODE_COLOR ?? '#000000',
        light: settings?.QR_CODE_BACKGROUND ?? '#FFFFFF',
      },
    };

    // Base PNG buffer
    const qrPng: Buffer = await (QRCode as any).toBuffer(data, options);

    // Logo overlay?
    const includeLogo =
      String(settings?.QR_INCLUDE_LOGO ?? 'false').toLowerCase() === 'true';
    const logoPath = this.getCurrentLogoPath();

    if (!includeLogo || !logoPath) {
      return `data:image/png;base64,${qrPng.toString('base64')}`;
    }

    const logoPercent = Math.min(
      50,
      Math.max(10, parseInt(settings?.QR_LOGO_SIZE ?? '20', 10)),
    ); // 10..50
    const logoSize = Math.round((width * logoPercent) / 100);

    const logoBuf = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: 'contain' })
      .png()
      .toBuffer();

    const composed = await sharp(qrPng)
      .composite([{ input: logoBuf, gravity: 'center' }])
      .png()
      .toBuffer();

    return `data:image/png;base64,${composed.toString('base64')}`;
  }

  /**
   * Generate QR code for product
   */
  async generateProductQrCode(productId: string): Promise<{
    qrCode: string;
    dataUrl: string;
  }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sku: true, name: true, qrCode: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Generate unique QR code if not exists
    let qrCode = product.qrCode;
    if (!qrCode) {
      qrCode = `QR-${product.sku}-${Date.now().toString(36).toUpperCase()}`;

      await this.prisma.product.update({
        where: { id: productId },
        data: { qrCode },
      });
    }

    // Generate QR code image with product lookup URL
    const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3001';
    const qrData = `${baseUrl}/qr-lookup?code=${qrCode}`;

    // Use a high error correction if logo is included later (future-proof)
    const dataUrl = await this.generateQrCode(qrData, {
      width: 400,
      errorCorrectionLevel: 'H',
    });

    return {
      qrCode,
      dataUrl,
    };
  }

  /**
   * Generate batch QR codes for multiple products
   */
  async generateBatchQrCodes(productIds: string[]): Promise<
    Array<{
      productId: string;
      sku: string;
      qrCode: string;
      dataUrl: string;
    }>
  > {
    const results: Array<{
      productId: string;
      sku: string;
      qrCode: string;
      dataUrl: string;
    }> = [];

    for (const productId of productIds) {
      try {
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
          select: { id: true, sku: true, qrCode: true },
        });

        if (!product) continue;

        const { qrCode, dataUrl } = await this.generateProductQrCode(productId);

        results.push({
          productId: product.id,
          sku: product.sku,
          qrCode,
          dataUrl,
        });
      } catch (error: any) {
        this.logger.error(`Failed to generate QR for product ${productId}: ${error?.message}`);
      }
    }

    return results;
  }

  /**
   * Generate QR code for sale invoice
   */
  async generateSaleQrCode(saleId: string): Promise<{
    qrCode: string;
    dataUrl: string;
  }> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      select: { id: true, invoiceNumber: true },
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3001';
    const qrData = `${baseUrl}/sales/${sale.id}?invoice=${sale.invoiceNumber}`;

    const dataUrl = await this.generateQrCode(qrData, {
      width: 300,
      errorCorrectionLevel: 'M',
    });

    return {
      qrCode: sale.invoiceNumber,
      dataUrl,
    };
  }

  /**
   * Decode QR code data (placeholder)
   */
  async decodeQrCode(_imagePath: string): Promise<string> {
    // Not implemented
    throw new Error('QR code decoding not implemented yet');
  }

  /**
   * Get QR code scan history
   */
  async getQrCodeHistory(qrCode: string, limit: number = 50) {
    const scans = await this.prisma.qRCodeScan.findMany({
      where: { qrCode },
      orderBy: { scannedAt: 'desc' },
      take: limit,
    });

    const productIds = scans
      .map((scan: any) => scan.productId)
      .filter((id: any): id is string => id !== null);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
      },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    return {
      qrCode,
      totalScans: scans.length,
      scans: scans.map((scan: any) => ({
        id: scan.id,
        product: scan.productId ? productMap.get(scan.productId) ?? null : null,
        scannedBy: scan.scannedBy,
        scannedAt: scan.scannedAt,
        purpose: scan.purpose,
        location: scan.location,
        ipAddress: scan.ipAddress,
      })),
    };
  }

  /**
   * Generate printable QR labels (returns HTML for printing)
   */
  generatePrintableLabels(
    qrCodes: Array<{ sku: string; name: string; qrCode: string; dataUrl: string }>,
  ): string {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>QR Code Labels</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
          .label { 
            border: 1px solid #ccc; 
            padding: 5mm; 
            text-align: center; 
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .label img { width: 50mm; height: 50mm; }
          .label .sku { font-weight: bold; font-size: 10pt; margin-top: 2mm; }
          .label .name { font-size: 8pt; margin-top: 1mm; color: #666; }
          .label .qr-code { font-size: 7pt; margin-top: 1mm; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="label-grid">
          ${qrCodes
            .map(
              (item) => `
            <div class="label">
              <img src="${item.dataUrl}" alt="${item.qrCode}">
              <div class="sku">${item.sku}</div>
              <div class="name">${item.name}</div>
              <div class="qr-code">${item.qrCode}</div>
            </div>
          `,
            )
            .join('')}
        </div>
      </body>
      </html>
    `;

    return html;
  }
}