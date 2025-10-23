import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseCategoryDto } from './create-expense-category.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateExpenseCategoryDto extends PartialType(CreateExpenseCategoryDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}