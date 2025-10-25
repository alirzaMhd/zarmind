interface OcrResult {
    text: string;
    confidence: number;
    weight?: number;
    rawText: string;
}
export declare class OcrService {
    private readonly logger;
    private worker;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Extract text from image using OCR
     */
    extractText(imagePath: string): Promise<OcrResult>;
    /**
     * Extract weight from digital scale image
     */
    extractWeightFromScale(imagePath: string): Promise<OcrResult>;
    /**
     * Parse weight from OCR text
     */
    private parseWeight;
    /**
     * Preprocess image for better OCR results
     */
    private preprocessImage;
    /**
     * Extract text from check/receipt image
     */
    extractCheckDetails(imagePath: string): Promise<{
        checkNumber?: string;
        amount?: number;
        date?: string;
        bank?: string;
        rawText: string;
    }>;
    private extractCheckNumber;
    private extractAmount;
    private extractDate;
    private extractBankName;
}
export {};
//# sourceMappingURL=ocr.service.d.ts.map