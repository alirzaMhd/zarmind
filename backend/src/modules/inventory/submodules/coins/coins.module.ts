import { Module } from '@nestjs/common';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';
import { DatabaseModule } from '../../../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}