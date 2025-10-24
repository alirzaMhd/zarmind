import {
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  MaxLength,
  IsISO8601,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BankTransactionType } from '@zarmind/shared-types';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class RecordTransactionDto {
  @IsEnum(BankTransactionType)
  type!: BankTransactionType;

  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsISO8601()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string; // SALE, PURCHASE, EXPENSE, etc.

  @IsOptional()
  @IsBoolean()
  allowNegative?: boolean; // Allow overdraft
}