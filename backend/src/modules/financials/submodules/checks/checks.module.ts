import { Module } from '@nestjs/common';
import { ChecksController } from './checks.controller';
import { ChecksService } from './checks.service';
import { DatabaseModule } from '../../../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ChecksController],
  providers: [ChecksService],
  exports: [ChecksService],
})
export class ChecksModule {}