import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  IsNumber,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class CreatePerformanceDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  // e.g., "2025-Q1", "2025-01"
  @IsString()
  @IsNotEmpty()
  reviewPeriod!: string;

  @IsOptional()
  @IsISO8601()
  reviewDate?: string;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  totalSales?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  targetSales?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  @Max(100)
  achievementRate?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsInt()
  @Min(0)
  customersServed?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsInt()
  @Min(1)
  @Max(10)
  qualityScore?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsInt()
  @Min(1)
  @Max(10)
  punctualityScore?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsInt()
  @Min(1)
  @Max(10)
  teamworkScore?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  weaknesses?: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;
}