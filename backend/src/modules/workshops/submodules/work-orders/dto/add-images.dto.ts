import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

function toStringArray(v: any): string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    // If JSON array string provided
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
      } catch {
        // fall through to comma-split
      }
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export class AddImagesDto {
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  imagesToAdd?: string[];

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  imagesToRemove?: string[];
}