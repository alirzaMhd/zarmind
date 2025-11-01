import {
  IsString,
  IsOptional,
  ValidateIf,
  IsEmail,
  MinLength,
  MaxLength,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  // Either email or username must be provided
  @ValidateIf((o) => !o.username)
  @IsEmail({}, { message: 'ایمیل باید یک آدرس ایمیل معتبر باشد' })
  @IsOptional()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'نام کاربری فقط می‌تواند شامل حروف، اعداد، نقطه، زیرخط و خط تیره باشد',
  })
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  // Optional 2FA (one-time password) if enabled
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'کد یک‌بار مصرف باید یک کد 6 رقمی باشد' })
  otp?: string;

  // Optional remember-me toggle; coerces common truthy strings/numbers to boolean
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string')
      return ['true', '1', 'on', 'yes'].includes(value.toLowerCase());
    if (typeof value === 'number') return value === 1;
    return false;
  })
  @IsBoolean()
  rememberMe?: boolean;

  // Optional client/device info for audit logs
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceInfo?: string;
}