import { IsEnum, IsOptional, IsString, MaxLength, IsISO8601 } from 'class-validator';
import { CheckStatus } from '@zarmind/shared-types';

export class UpdateCheckStatusDto {
  @IsEnum(CheckStatus)
  status!: CheckStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string; // Required for BOUNCED or CANCELLED

  @IsOptional()
  @IsISO8601()
  date?: string; // Optional date for the status change
}