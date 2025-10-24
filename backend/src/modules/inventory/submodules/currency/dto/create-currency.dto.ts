import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  IsArray,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus } from '@zarmind/shared-types';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function toInt(v: any) {
  if (v === '' || v == null) return undefined;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? undefined : n;
}

export class CreateCurrencyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  qrCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  purchasePrice?: number; // Purchase rate (e.g., IRR per USD)

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  sellingPrice?: number; // Selling rate (e.g., IRR per USD)

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  currencyCode!: string; // USD, EUR, AED, etc.

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(0)
  quantity?: number; // Amount of currency

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      if (value.trim() === '') return [];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return value.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  // For inventory creation
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(0)
  minimumStock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}