import { Module } from '@nestjs/common';
import { RawGoldController } from './raw-gold.controller';
import { RawGoldService } from './raw-gold.service';
import { DatabaseModule } from '../../../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RawGoldController],
  providers: [RawGoldService],
  exports: [RawGoldService],
})
export class RawGoldModule {}