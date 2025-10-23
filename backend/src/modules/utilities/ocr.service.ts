import { Injectable, Logger } from '@nestjs/common';
import { createWorker, Worker } from 'tesseract.js';
import * as sharp from 'sharp';
import * as fs from 'fs';

interface OcrResult {
  text: string;
  confidence: number;
  weight?: number;
  rawText: string;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private worker: Worker | null = null;

  async onModuleInit() {
    // Initialize Tesseract worker
    try {
      this.worker = await createWorker('eng');
      this.logger.log('Tesseract OCR worker initialized');
    } catch (error: any) {
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
  async extractText(imagePath: string): Promise<OcrResult> {
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      // Preprocess image for better OCR results
      const processedImagePath = await this.preprocessImage(imagePath);

      // Perform OCR
      const {
        data: { text, confidence },
      } = await this.worker.recognize(processedImagePath);

      // Clean up processed image if it's different from original
      if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
        fs.unlinkSync(processedImagePath);
      }

      return {
        text: text.trim(),
        confidence,
        rawText: text,
      };
    } catch (error: any) {
      this.logger.error(`OCR extraction failed: ${error?.message}`);
      throw new Error(`Failed to extract text from image: ${error?.message}`);
    }
  }

  /**
   * Extract weight from digital scale image
   */
  async extractWeightFromScale(imagePath: string): Promise<OcrResult> {
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
  private parseWeight(text: string): number | undefined {
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
        } else if (pattern.source.includes('oz')) {
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
  private async preprocessImage(imagePath: string): Promise<string> {
    try {
      const outputPath = imagePath.replace(/(\.\w+)$/, '-processed$1');

      await sharp(imagePath)
        .grayscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen image
        .threshold(128) // Apply threshold for better text recognition
        .toFile(outputPath);

      return outputPath;
    } catch (error: any) {
      this.logger.warn(`Image preprocessing failed, using original: ${error?.message}`);
      return imagePath;
    }
  }

  /**
   * Extract text from check/receipt image
   */
  async extractCheckDetails(imagePath: string): Promise<{
    checkNumber?: string;
    amount?: number;
    date?: string;
    bank?: string;
    rawText: string;
  }> {
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

  private extractCheckNumber(text: string): string | undefined {
    const patterns = [
      /check\s*#?\s*(\d+)/i,
      /cheque\s*#?\s*(\d+)/i,
      /no\.?\s*(\d{6,})/i,
      /(\d{8,})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  private extractAmount(text: string): number | undefined {
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
        if (amount > 0) return amount;
      }
    }

    return undefined;
  }

  private extractDate(text: string): string | undefined {
    const patterns = [
      /(\d{4}[-/]\d{2}[-/]\d{2})/,
      /(\d{2}[-/]\d{2}[-/]\d{4})/,
      /date[:\s]+(\d{2}[-/]\d{2}[-/]\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  private extractBankName(text: string): string | undefined {
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
}