import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string; // Name in Persian

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string; // Name in English

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string; // For subcategories
}