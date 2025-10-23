import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

function toNum(v: any) {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  accountName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber!: string;

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
  iban?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  swiftCode?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @Transform(({ value }) => toNum(value))
  @IsNumber()
  @Min(0)
  initialBalance?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string; // IRR, USD, EUR, etc.

  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountType?: string; // CHECKING, SAVINGS, etc.

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}