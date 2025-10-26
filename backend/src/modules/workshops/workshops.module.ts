import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';

// Import controllers
import { WorkOrdersController } from './submodules/work-orders/work-orders.controller';
import { WorkshopsController } from './workshops.controller';

// Import services
import { WorkOrdersService } from './submodules/work-orders/work-orders.service';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [DatabaseModule],
  // WorkOrdersController must be registered BEFORE WorkshopsController
  // to prevent route conflicts (/workshops/work-orders vs /workshops/:id)
  controllers: [WorkOrdersController, WorkshopsController],
  providers: [WorkOrdersService, WorkshopsService],
  exports: [WorkshopsService, WorkOrdersService],
})
export class WorkshopsModule {}