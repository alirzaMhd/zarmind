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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var QrCodeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrCodeService = void 0;
const common_1 = require("@nestjs/common");
const QRCode = __importStar(require("qrcode"));
const prisma_service_1 = require("../../core/database/prisma.service");
const fs = __importStar(require("fs"));
const path_1 = require("path");
const sharp_1 = __importDefault(require("sharp"));
let QrCodeService = QrCodeService_1 = class QrCodeService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(QrCodeService_1.name);
        // Ensure directories exist
        this.ensureQrDirectory();
        this.ensureImagesDir();
    }
    ensureQrDirectory() {
        const qrDir = (0, path_1.join)(process.cwd(), 'uploads', 'qr-codes');
        if (!fs.existsSync(qrDir)) {
            fs.mkdirSync(qrDir, { recursive: true });
        }
    }
    ensureImagesDir() {
        const imagesDir = (0, path_1.join)(process.cwd(), 'uploads', 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
    }
    getCurrentLogoPath() {
        const dir = (0, path_1.join)(process.cwd(), 'uploads', 'images');
        if (!fs.existsSync(dir))
            return null;
        const file = fs.readdirSync(dir).find((f) => f.startsWith('qr-logo.'));
        return file ? (0, path_1.join)(dir, file) : null;
    }
    /**
     * Generate QR code as Base64 data URL (simple)
     */
    async generateQrCode(data, options) {
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
        }
        catch (error) {
            this.logger.error(`Failed to generate QR code: ${error?.message}`);
            throw new Error(`QR code generation failed: ${error?.message}`);
        }
    }
    /**
     * Generate QR code and save to file
     */
    async generateQrCodeFile(data, filename, options) {
        try {
            const qrDir = (0, path_1.join)(process.cwd(), 'uploads', 'qr-codes');
            const filePath = (0, path_1.join)(qrDir, filename);
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
        }
        catch (error) {
            this.logger.error(`Failed to save QR code file: ${error?.message}`);
            throw new Error(`QR code file generation failed: ${error?.message}`);
        }
    }
    /**
     * Generate QR code using settings (with optional center logo)
     */
    async generateQrCodeWithSettings(data, settings) {
        const width = parseInt(settings?.QR_CODE_SIZE ?? '300', 10) || 300;
        const margin = parseInt(settings?.QR_CODE_MARGIN ?? '2', 10) || 2;
        const errorLevel = settings?.QR_CODE_ERROR_CORRECTION ?? 'M';
        const options = {
            width,
            margin,
            errorCorrectionLevel: errorLevel,
            color: {
                dark: settings?.QR_CODE_COLOR ?? '#000000',
                light: settings?.QR_CODE_BACKGROUND ?? '#FFFFFF',
            },
        };
        // Base PNG buffer
        const qrPng = await QRCode.toBuffer(data, options);
        // Logo overlay?
        const includeLogo = String(settings?.QR_INCLUDE_LOGO ?? 'false').toLowerCase() === 'true';
        const logoPath = this.getCurrentLogoPath();
        if (!includeLogo || !logoPath) {
            return `data:image/png;base64,${qrPng.toString('base64')}`;
        }
        const logoPercent = Math.min(30, Math.max(10, parseInt(settings?.QR_LOGO_SIZE ?? '20', 10))); // 10..30
        const logoSize = Math.round((width * logoPercent) / 100);
        const logoBuf = await (0, sharp_1.default)(logoPath)
            .resize(logoSize, logoSize, { fit: 'contain' })
            .png()
            .toBuffer();
        const composed = await (0, sharp_1.default)(qrPng)
            .composite([{ input: logoBuf, gravity: 'center' }])
            .png()
            .toBuffer();
        return `data:image/png;base64,${composed.toString('base64')}`;
    }
    /**
     * Generate QR code for product
     */
    async generateProductQrCode(productId) {
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
    async generateBatchQrCodes(productIds) {
        const results = [];
        for (const productId of productIds) {
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                    select: { id: true, sku: true, qrCode: true },
                });
                if (!product)
                    continue;
                const { qrCode, dataUrl } = await this.generateProductQrCode(productId);
                results.push({
                    productId: product.id,
                    sku: product.sku,
                    qrCode,
                    dataUrl,
                });
            }
            catch (error) {
                this.logger.error(`Failed to generate QR for product ${productId}: ${error?.message}`);
            }
        }
        return results;
    }
    /**
     * Generate QR code for sale invoice
     */
    async generateSaleQrCode(saleId) {
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
    async decodeQrCode(_imagePath) {
        // Not implemented
        throw new Error('QR code decoding not implemented yet');
    }
    /**
     * Get QR code scan history
     */
    async getQrCodeHistory(qrCode, limit = 50) {
        const scans = await this.prisma.qRCodeScan.findMany({
            where: { qrCode },
            orderBy: { scannedAt: 'desc' },
            take: limit,
        });
        const productIds = scans
            .map((scan) => scan.productId)
            .filter((id) => id !== null);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                sku: true,
                name: true,
                category: true,
            },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        return {
            qrCode,
            totalScans: scans.length,
            scans: scans.map((scan) => ({
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
    generatePrintableLabels(qrCodes) {
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
            .map((item) => `
            <div class="label">
              <img src="${item.dataUrl}" alt="${item.qrCode}">
              <div class="sku">${item.sku}</div>
              <div class="name">${item.name}</div>
              <div class="qr-code">${item.qrCode}</div>
            </div>
          `)
            .join('')}
        </div>
      </body>
      </html>
    `;
        return html;
    }
};
exports.QrCodeService = QrCodeService;
exports.QrCodeService = QrCodeService = QrCodeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QrCodeService);
//# sourceMappingURL=qr-code.service.js.map