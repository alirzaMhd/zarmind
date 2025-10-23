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
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus, StoneType } from '@prisma/client';

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

export class CreateStoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  qrCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

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
  purchasePrice?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @IsEnum(StoneType)
  stoneType!: StoneType; // DIAMOND, RUBY, EMERALD, SAPPHIRE, etc.

  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0.01)
  caratWeight!: number; // Required for stones

  @IsOptional()
  @IsString()
  @MaxLength(50)
  stoneQuality?: string; // IF, VVS, VS, SI, I, AAA, AA, A, etc.

  @IsOptional()
  @IsString()
  @MaxLength(100)
  certificateNumber?: string; // GIA, IGI, etc. certificate number

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  quantity?: number; // Number of stones

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
  location?: string; // Safe, vault location
}