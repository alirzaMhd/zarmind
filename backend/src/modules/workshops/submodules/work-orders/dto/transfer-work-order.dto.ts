import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class TransferWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  workshopId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}