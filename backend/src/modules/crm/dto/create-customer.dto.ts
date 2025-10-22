import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  IsEnum,
  IsPhoneNumber,
  IsNumber,
  Min,
  IsInt,
  IsArray,
  IsISO8601,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CustomerStatus, CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  // Individual
  @ValidateIf((o) => o.type !== 'BUSINESS')
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ValidateIf((o) => o.type !== 'BUSINESS')
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  // Business
  @ValidateIf((o) => !o.firstName && !o.lastName)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessName?: string;

  // Contact
  @IsString()
  @MaxLength(20)
  phone!: string; // use simple string to support local formats; swap to @IsPhoneNumber if using E.164

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  // Financial
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  // CRM
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @IsOptional()
  @IsISO8601()
  anniversary?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      if (value.trim() === '') return [];
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  loyaltyPoints?: number;
}