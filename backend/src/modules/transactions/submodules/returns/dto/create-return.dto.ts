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
import { ReturnType, ReturnStatus, ReturnReason, PaymentMethod } from '@zarmind/shared-types';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class CreateReturnDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  returnNumber?: string;

  @IsISO8601()
  returnDate!: string;

  @IsEnum(ReturnType)
  type!: ReturnType; // CUSTOMER_RETURN or SUPPLIER_RETURN

  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @IsOptional()
  @IsEnum(ReturnReason)
  reason?: ReturnReason;

  @IsOptional()
  @IsString()
  originalSaleId?: string; // Required if type = CUSTOMER_RETURN

  @IsOptional()
  @IsString()
  originalPurchaseId?: string; // Required if type = SUPPLIER_RETURN

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonDetails?: string;

  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  refundAmount!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  refundMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}