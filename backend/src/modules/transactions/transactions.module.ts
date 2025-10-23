import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { PurchasesModule } from './submodules/purchases/purchases.module';
import { ReturnsModule } from './submodules/returns/returns.module';
import { SalesModule } from './submodules/sales/sales.module';

@Module({
  imports: [
    DatabaseModule,
    PurchasesModule,
    ReturnsModule,
    SalesModule,
  ],
  exports: [
    PurchasesModule,
    ReturnsModule,
    SalesModule,
  ],
})
export class TransactionsModule {}