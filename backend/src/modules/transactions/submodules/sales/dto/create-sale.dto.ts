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
import { PaymentMethod, SaleStatus } from '@zarmind/shared-types';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

class SaleItemDto {
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

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  goldPrice?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  stonePrice?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  craftsmanshipFee?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsOptional()
  @IsISO8601()
  saleDate?: string;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}