import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// Omit password from update DTO - use separate change password endpoint
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {}