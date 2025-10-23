import { IsNumber, Min, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class RecordPaymentDto {
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0.01)
  paymentAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}