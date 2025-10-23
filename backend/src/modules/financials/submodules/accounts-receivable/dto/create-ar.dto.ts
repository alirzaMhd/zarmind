import { IsString, IsNotEmpty, IsOptional, IsISO8601, IsNumber, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class CreateArDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber!: string;

  @IsISO8601()
  invoiceDate!: string;

  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}