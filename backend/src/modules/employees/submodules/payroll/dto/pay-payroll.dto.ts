import { IsISO8601, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { PaymentMethod } from '@zarmind/shared-types';

export class PayPayrollDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}