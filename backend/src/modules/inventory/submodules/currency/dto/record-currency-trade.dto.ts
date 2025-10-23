import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  MaxLength,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class RecordCurrencyTradeDto {
  @IsEnum(TradeType)
  type!: 'BUY' | 'SELL';

  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0.01)
  quantity!: number; // Amount of currency

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  rate?: number; // Exchange rate (e.g., IRR per USD)

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  toCurrency?: string; // Target currency (default: IRR)

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}