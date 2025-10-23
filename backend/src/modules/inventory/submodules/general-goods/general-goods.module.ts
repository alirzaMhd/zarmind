import { Module } from '@nestjs/common';
import { GeneralGoodsController } from './general-goods.controller';
import { GeneralGoodsService } from './general-goods.service';
import { DatabaseModule } from '../../../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GeneralGoodsController],
  providers: [GeneralGoodsService],
  exports: [GeneralGoodsService],
})
export class GeneralGoodsModule {}