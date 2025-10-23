import { PartialType } from '@nestjs/mapped-types';
import { CreateArDto } from './create-ar.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateArDto extends PartialType(CreateArDto) {
  @IsOptional()
  @IsString()
  status?: string;
}