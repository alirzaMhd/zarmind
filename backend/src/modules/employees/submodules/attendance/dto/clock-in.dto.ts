import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClockInDto {
  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}