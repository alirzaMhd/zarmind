import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkOrderStatus } from '@zarmind/shared-types';

export class UpdateStatusDto {
  @IsEnum(WorkOrderStatus)
  status!: WorkOrderStatus;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  expectedEndDate?: string;

  @IsOptional()
  @IsISO8601()
  completedDate?: string;

  @IsOptional()
  @IsISO8601()
  deliveredDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}