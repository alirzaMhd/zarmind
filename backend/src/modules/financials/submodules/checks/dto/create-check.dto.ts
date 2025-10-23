import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsISO8601,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CheckType, CheckStatus } from '@prisma/client';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class CreateCheckDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  checkNumber!: string;

  @IsEnum(CheckType)
  type!: CheckType; // RECEIVABLE or PAYABLE

  @IsOptional()
  @IsEnum(CheckStatus)
  status?: CheckStatus;

  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsISO8601()
  issueDate!: string;

  @IsISO8601()
  dueDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  branchName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuerName?: string; // Person/company who wrote the check

  @IsOptional()
  @IsString()
  customerId?: string; // For receivable checks

  @IsOptional()
  @IsString()
  supplierId?: string; // For payable checks

  @IsOptional()
  @IsString()
  @MaxLength(200)
  payeeName?: string; // Person/company the check is payable to

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
  checkImages?: string[]; // URLs of check images

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}