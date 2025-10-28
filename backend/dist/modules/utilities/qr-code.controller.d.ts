import { QrCodeService } from './qr-code.service';
export declare class QrCodeController {
    private readonly qr;
    constructor(qr: QrCodeService);
    preview(body: {
        settings: Record<string, any>;
    }): Promise<{
        dataUrl: string;
    }>;
    getLogo(): Promise<{
        logoUrl: null;
        filename?: undefined;
    } | {
        logoUrl: string;
        filename: string;
    }>;
    uploadLogo(file?: Express.Multer.File): Promise<{
        success: boolean;
        logoUrl: string;
    }>;
    deleteLogo(): Promise<{
        success: boolean;
    }>;
    regenerateAll(): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=qr-code.controller.d.ts.map