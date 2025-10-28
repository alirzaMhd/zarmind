import { QrCodeService } from './qr-code.service';
export declare class QrCodeController {
    private readonly qrCodeService;
    constructor(qrCodeService: QrCodeService);
    private ensureLogoDirectory;
    generatePreview(body: {
        settings: Record<string, any>;
    }): Promise<{
        dataUrl: string;
    }>;
    getCurrentLogo(): Promise<{
        logoUrl: null;
    } | {
        logoUrl: string;
    }>;
    uploadLogo(file: Express.Multer.File): Promise<{
        success: boolean;
        logoUrl: string;
    }>;
    removeLogo(): Promise<{
        success: boolean;
    }>;
    regenerateAll(): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=qr-code.controller.d.ts.map