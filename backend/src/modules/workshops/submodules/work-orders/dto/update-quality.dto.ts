import { IsOptional, IsInt, Min, Max, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

function toInt(v: any) {
  if (v === '' || v == null) return undefined;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? undefined : n;
}

export class UpdateQualityDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  qualityNotes?: string;
}