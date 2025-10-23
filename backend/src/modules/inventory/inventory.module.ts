import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { CoinsModule } from './submodules/coins/coins.module';
import { CurrencyModule } from './submodules/currency/currency.module';
import { GeneralGoodsModule } from './submodules/general-goods/general-goods.module';
import { ProductsModule } from './submodules/products/products.module';
import { RawGoldModule } from './submodules/raw-gold/raw-gold.module';
import { StonesModule } from './submodules/stones/stones.module';

@Module({
  imports: [
    DatabaseModule,
    CoinsModule,
    CurrencyModule,
    GeneralGoodsModule,
    ProductsModule,
    RawGoldModule,
    StonesModule,
  ],
  exports: [
    CoinsModule,
    CurrencyModule,
    GeneralGoodsModule,
    ProductsModule,
    RawGoldModule,
    StonesModule,
  ],
})
export class InventoryModule {}