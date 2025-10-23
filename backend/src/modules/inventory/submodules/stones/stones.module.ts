import { Module } from '@nestjs/common';
import { StonesController } from './stones.controller';
import { StonesService } from './stones.service';
import { DatabaseModule } from '../../../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StonesController],
  providers: [StonesService],
  exports: [StonesService],
})
export class StonesModule {}