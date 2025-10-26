import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsISO8601,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { WorkOrderPriority, WorkOrderStatus } from '@zarmind/shared-types';

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

function toStringArray(v: any): string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    // If JSON array string provided
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
      } catch {
        // fallback to comma split
      }
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function toJson(v: any): any | undefined {
  if (v == null || v === '') return undefined;
  if (typeof v === 'object') return v;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      // ignore invalid JSON string
      return undefined;
    }
  }
  return undefined;
}

export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  workshopId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderNumber?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => toJson(value))
  @IsObject()
  specifications?: Record<string, any>;

  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @IsOptional()
  @IsISO8601()
  orderDate?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  expectedEndDate?: string;

  @IsOptional()
  @IsISO8601()
  completedDate?: string;

  @IsOptional()
  @IsISO8601()
  deliveredDate?: string;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  costEstimate?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  goldProvided?: number; // grams

  @IsOptional()
  @IsString()
  @MaxLength(500)
  stonesProvided?: string;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}