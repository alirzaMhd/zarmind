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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const tesseract_js_1 = require("tesseract.js");
const sharp_1 = __importDefault(require("sharp"));
const fs = __importStar(require("fs"));
let OcrService = OcrService_1 = class OcrService {
    constructor() {
        this.logger = new common_1.Logger(OcrService_1.name);
        this.worker = null;
    }
    async onModuleInit() {
        // Initialize Tesseract worker
        try {
            this.worker = await (0, tesseract_js_1.createWorker)('eng');
            this.logger.log('Tesseract OCR worker initialized');
        }
        catch (error) {
            this.logger.error(`Failed to initialize OCR worker: ${error?.message}`);
        }
    }
    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.terminate();
            this.logger.log('Tesseract OCR worker terminated');
        }
    }
    /**
     * Extract text from image using OCR
     */
    async extractText(imagePath) {
        if (!this.worker) {
            throw new Error('OCR worker not initialized');
        }
        try {
            // Preprocess image for better OCR results
            const processedImagePath = await this.preprocessImage(imagePath);
            // Perform OCR
            const { data: { text, confidence }, } = await this.worker.recognize(processedImagePath);
            // Clean up processed image if it's different from original
            if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
                fs.unlinkSync(processedImagePath);
            }
            return {
                text: text.trim(),
                confidence,
                rawText: text,
            };
        }
        catch (error) {
            this.logger.error(`OCR extraction failed: ${error?.message}`);
            throw new Error(`Failed to extract text from image: ${error?.message}`);
        }
    }
    /**
     * Extract weight from digital scale image
     */
    async extractWeightFromScale(imagePath) {
        const result = await this.extractText(imagePath);
        // Try to extract weight from text using various patterns
        const weight = this.parseWeight(result.text);
        return {
            ...result,
            weight,
        };
    }
    /**
     * Parse weight from OCR text
     */
    parseWeight(text) {
        // Remove extra whitespace
        const cleanText = text.replace(/\s+/g, ' ').trim();
        // Patterns to match weight readings
        const patterns = [
            /(\d+\.?\d*)\s*g/i, // 123.45 g or 123g
            /(\d+\.?\d*)\s*gr/i, // 123.45 gr
            /(\d+\.?\d*)\s*gram/i, // 123.45 gram
            /(\d+\.?\d*)\s*kg/i, // 1.234 kg (convert to grams)
            /(\d+\.?\d*)\s*oz/i, // 4.32 oz (convert to grams)
            /weight[:\s]+(\d+\.?\d*)/i, // weight: 123.45
            /(\d+\.?\d*)$/i, // Just numbers at the end
        ];
        for (const pattern of patterns) {
            const match = cleanText.match(pattern);
            if (match) {
                let weight = parseFloat(match[1]);
                // Convert to grams if needed
                if (pattern.source.includes('kg')) {
                    weight *= 1000;
                }
                else if (pattern.source.includes('oz')) {
                    weight *= 28.3495;
                }
                // Validate weight is reasonable (between 0.01g and 10000g)
                if (weight >= 0.01 && weight <= 10000) {
                    return parseFloat(weight.toFixed(3));
                }
            }
        }
        return undefined;
    }
    /**
     * Preprocess image for better OCR results
     */
    async preprocessImage(imagePath) {
        try {
            const outputPath = imagePath.replace(/(\.\w+)$/, '-processed$1');
            await (0, sharp_1.default)(imagePath)
                .grayscale() // Convert to grayscale
                .normalize() // Normalize contrast
                .sharpen() // Sharpen image
                .threshold(128) // Apply threshold for better text recognition
                .toFile(outputPath);
            return outputPath;
        }
        catch (error) {
            this.logger.warn(`Image preprocessing failed, using original: ${error?.message}`);
            return imagePath;
        }
    }
    /**
     * Extract text from check/receipt image
     */
    async extractCheckDetails(imagePath) {
        const result = await this.extractText(imagePath);
        const text = result.text;
        return {
            checkNumber: this.extractCheckNumber(text),
            amount: this.extractAmount(text),
            date: this.extractDate(text),
            bank: this.extractBankName(text),
            rawText: text,
        };
    }
    extractCheckNumber(text) {
        const patterns = [
            /check\s*#?\s*(\d+)/i,
            /cheque\s*#?\s*(\d+)/i,
            /no\.?\s*(\d{6,})/i,
            /(\d{8,})/,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match)
                return match[1];
        }
        return undefined;
    }
    extractAmount(text) {
        const patterns = [
            /amount[:\s]+(\d+[,.]?\d*)/i,
            /(\d+[,.]?\d*)\s*(rial|IRR|toman)/i,
            /\$\s*(\d+[,.]?\d*)/,
            /(\d+[,.]?\d*)\s*\$/,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                if (amount > 0)
                    return amount;
            }
        }
        return undefined;
    }
    extractDate(text) {
        const patterns = [
            /(\d{4}[-/]\d{2}[-/]\d{2})/,
            /(\d{2}[-/]\d{2}[-/]\d{4})/,
            /date[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})/i,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match)
                return match[1];
        }
        return undefined;
    }
    extractBankName(text) {
        const bankKeywords = [
            'mellat',
            'melli',
            'saderat',
            'sepah',
            'tejarat',
            'parsian',
            'pasargad',
            'bank',
        ];
        const words = text.toLowerCase().split(/\s+/);
        for (const word of words) {
            for (const keyword of bankKeywords) {
                if (word.includes(keyword)) {
                    return word;
                }
            }
        }
        return undefined;
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = OcrService_1 = __decorate([
    (0, common_1.Injectable)()
], OcrService);
//# sourceMappingURL=ocr.service.js.map