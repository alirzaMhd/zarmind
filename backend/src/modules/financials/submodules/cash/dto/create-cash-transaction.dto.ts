import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsISO8601,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CashTransactionType } from '@prisma/client';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class CreateCashTransactionDto {
  @IsEnum(CashTransactionType)
  type!: CashTransactionType; // CASH_IN, CASH_OUT, OPENING_BALANCE, CLOSING_BALANCE, PETTY_CASH

  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsISO8601()
  transactionDate?: string;

  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string; // SALE, PURCHASE, EXPENSE, WITHDRAWAL, DEPOSIT

  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string; // Sale, Purchase, Expense

  @IsOptional()
  @IsString()
  referenceId?: string; // ID of related transaction

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  receiptNumber?: string;
}