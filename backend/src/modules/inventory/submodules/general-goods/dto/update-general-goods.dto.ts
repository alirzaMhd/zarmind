import { PartialType } from '@nestjs/mapped-types';
import { CreateGeneralGoodsDto } from './create-general-goods.dto';

export class UpdateGeneralGoodsDto extends PartialType(CreateGeneralGoodsDto) {}