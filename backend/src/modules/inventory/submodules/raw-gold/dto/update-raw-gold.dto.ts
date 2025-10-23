import { PartialType } from '@nestjs/mapped-types';
import { CreateRawGoldDto } from './create-raw-gold.dto';

export class UpdateRawGoldDto extends PartialType(CreateRawGoldDto) {}