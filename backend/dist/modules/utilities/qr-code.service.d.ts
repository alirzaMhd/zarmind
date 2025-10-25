import { PrismaService } from '../../core/database/prisma.service';
interface QrCodeOptions {
    width?: number;
    margin?: number;
    color?: {
        dark?: string;
        light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}
export declare class QrCodeService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private ensureQrDirectory;
    /**
     * Generate QR code as Base64 data URL
     */
    generateQrCode(data: string, options?: QrCodeOptions): Promise<string>;
    /**
     * Generate QR code and save to file
     */
    generateQrCodeFile(data: string, filename: string, options?: QrCodeOptions): Promise<string>;
    /**
     * Generate QR code for product
     */
    generateProductQrCode(productId: string): Promise<{
        qrCode: string;
        dataUrl: string;
    }>;
    /**
     * Generate batch QR codes for multiple products
     */
    generateBatchQrCodes(productIds: string[]): Promise<Array<{
        productId: string;
        sku: string;
        qrCode: string;
        dataUrl: string;
    }>>;
    /**
     * Generate QR code for sale invoice
     */
    generateSaleQrCode(saleId: string): Promise<{
        qrCode: string;
        dataUrl: string;
    }>;
    /**
     * Decode QR code data (placeholder - requires image processing library)
     */
    decodeQrCode(imagePath: string): Promise<string>;
    /**
     * Get QR code scan history
     */
    /**
     * Get QR code scan history
     */
    getQrCodeHistory(qrCode: string, limit?: number): Promise<{
        qrCode: string;
        totalScans: any;
        scans: any;
    }>;
    /**
     * Generate printable QR labels (returns HTML for printing)
     */
    generatePrintableLabels(qrCodes: Array<{
        sku: string;
        name: string;
        qrCode: string;
        dataUrl: string;
    }>): string;
}
export {};
//# sourceMappingURL=qr-code.service.d.ts.map