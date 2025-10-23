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
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaymentMethod, PurchaseStatus } from '@prisma/client';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

class PurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @Transform(({ value }) => {
    const n = parseInt(String(value), 10);
    return isNaN(n) ? undefined : n;
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  weight?: number;

  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreatePurchaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  purchaseNumber?: string;

  @IsISO8601()
  purchaseDate!: string;

  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsISO8601()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}