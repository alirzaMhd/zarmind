"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../core/database/database.module");
const coins_module_1 = require("./submodules/coins/coins.module");
const currency_module_1 = require("./submodules/currency/currency.module");
const general_goods_module_1 = require("./submodules/general-goods/general-goods.module");
const products_module_1 = require("./submodules/products/products.module");
const raw_gold_module_1 = require("./submodules/raw-gold/raw-gold.module");
const stones_module_1 = require("./submodules/stones/stones.module");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            coins_module_1.CoinsModule,
            currency_module_1.CurrencyModule,
            general_goods_module_1.GeneralGoodsModule,
            products_module_1.ProductsModule,
            raw_gold_module_1.RawGoldModule,
            stones_module_1.StonesModule,
        ],
        exports: [
            coins_module_1.CoinsModule,
            currency_module_1.CurrencyModule,
            general_goods_module_1.GeneralGoodsModule,
            products_module_1.ProductsModule,
            raw_gold_module_1.RawGoldModule,
            stones_module_1.StonesModule,
        ],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map