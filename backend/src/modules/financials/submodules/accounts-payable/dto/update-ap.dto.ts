import { PartialType } from '@nestjs/mapped-types';
import { CreateApDto } from './create-ap.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApDto extends PartialType(CreateApDto) {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string; // PENDING, PARTIAL, PAID, OVERDUE
}