import {
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsISO8601,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod } from '@zarmind/shared-types';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class RecordPaymentDto {
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsISO8601()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  checkId?: string;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}